/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { app } from 'electron';
import { promises } from 'fs';
import { ExpectedError, setUnexpectedErrorHandler } from '../../base/common/errors.js';
import { Event } from '../../base/common/event.js';
import { rShinyManager } from '../../../rshiny.js';
import { Promises } from '../../base/common/async.js';
import { Promises as FSPromises } from '../../base/node/pfs.js';
import { DisposableStore } from '../../base/common/lifecycle.js';
import { Schemas } from '../../base/common/network.js';
import { IProcessEnvironment } from '../../base/common/platform.js';
import { localize } from '../../nls.js';
import { IEnvironmentMainService, EnvironmentMainService } from '../../platform/environment/electron-main/environmentMainService.js';
import { IFileService } from '../../platform/files/common/files.js';
import { FileService } from '../../platform/files/common/fileService.js';
import { DiskFileSystemProvider } from '../../platform/files/node/diskFileSystemProvider.js';
import { SyncDescriptor } from '../../platform/instantiation/common/descriptors.js';
import { IInstantiationService, ServicesAccessor } from '../../platform/instantiation/common/instantiation.js';
import { InstantiationService } from '../../platform/instantiation/common/instantiationService.js';
import { ServiceCollection } from '../../platform/instantiation/common/serviceCollection.js';
import { ILifecycleMainService, LifecycleMainService } from '../../platform/lifecycle/electron-main/lifecycleMainService.js';
import { BufferLogger } from '../../platform/log/common/bufferLog.js';
import { ILogService, ILoggerService, getLogLevel, ConsoleMainLogger } from '../../platform/log/common/log.js';
import { LogService } from '../../platform/log/common/logService.js';
import { LoggerMainService, ILoggerMainService } from '../../platform/log/electron-main/loggerService.js';
import product from '../../platform/product/common/product.js';
import { IProductService } from '../../platform/product/common/productService.js';
import { IStateReadService, IStateService } from '../../platform/state/node/state.js';
import { StateService, SaveStrategy } from '../../platform/state/node/stateService.js';
import { SuiteApplication } from './app.js';
import { NativeParsedArgs } from '../../platform/environment/common/argv.js';
import { addArg, parseMainProcessArgv } from '../../platform/environment/node/argvHelper.js';
import { createWaitMarkerFileSync } from '../../platform/environment/node/wait.js';

/**
 * The main DataSuite entry point.
 *
 * Note: This class can exist more than once for example when DataSuite is already
 * running and a second instance is started from the command line. It will always
 * try to communicate with an existing instance to prevent that 2 DataSuite instances
 * are running at the same time.
 */
class SuiteMain {

	main(): void {
		try {
			this.startup();
		} catch (error) {
			console.error(error.message);
			app.exit(1);
		}
	}

	private async startup(): Promise<void> {

		// Set the error handler early enough so that we are not getting the
		// default electron error dialog popping up
		setUnexpectedErrorHandler(err => console.error(err));

		// Create services
		const [instantiationService, instanceEnvironment, environmentMainService, stateMainService, bufferLogger, productService] = this.createServices();

		try {

			// Init services
			try {
				await this.initServices(environmentMainService, stateMainService, productService);
			} catch (error) {

				// Show a dialog for errors that can be resolved by the user
				//handleStartupDataDirError(environmentMainService, productService, error);

				throw error;
			}

			// Startup
			await instantiationService.invokeFunction(async accessor => {
				const logService = accessor.get(ILogService);
				const lifecycleMainService = accessor.get(ILifecycleMainService);
				const fileService = accessor.get(IFileService);
				const loggerService = accessor.get(ILoggerService);

				// Create the main IPC server by trying to be the server
				// If this throws an error it means we are not the first
				// instance of VS Code running and so we would quit.
				//const mainProcessNodeIpcServer = await claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, true);

				// Write a lockfile to indicate an instance is running
				// (https://github.com/microsoft/vscode/issues/127861#issuecomment-877417451)
				FSPromises.writeFile(environmentMainService.mainLockfile, String(process.pid)).catch(err => {
					logService.warn(`app#startup(): Error writing main lockfile: ${err.stack}`);
				});

				// Delay creation of spdlog for perf reasons (https://github.com/microsoft/vscode/issues/72906)
				bufferLogger.logger = loggerService.createLogger('main', { name: localize('mainLog', "Main") });

				// Lifecycle
				Event.once(lifecycleMainService.onWillShutdown)(evt => {
					fileService.dispose();
					//configurationService.dispose();
					evt.join('rshiny-teardown', (async () => {
						try {
							await rShinyManager.teardown();
						} catch (error) {
							console.error('Failed to teardown R Shiny during shutdown:', error);
						}
					})());
					evt.join('instanceLockfile', promises.unlink(environmentMainService.mainLockfile).catch(() => { /* ignored */ }));
				});

				return instantiationService.createInstance(SuiteApplication/*, mainProcessNodeIpcServer*/, instanceEnvironment).startup();
			});
		} catch (error) {
			instantiationService.invokeFunction(this.quit, error);
		}
	}


	private createServices(): [IInstantiationService, IProcessEnvironment, IEnvironmentMainService, StateService, BufferLogger, IProductService] {
		const services = new ServiceCollection();
		const disposables = new DisposableStore();
		process.once('exit', () => disposables.dispose());

		// Product
		const productService = { _serviceBrand: undefined, ...product };
		services.set(IProductService, productService);

		// Environment
		const environmentMainService = new EnvironmentMainService(this.resolveArgs(), productService);
		const instanceEnvironment = this.patchEnvironment(environmentMainService); // Patch `process.env` with the instance's environment
		services.set(IEnvironmentMainService, environmentMainService);

		// Logger
		const loggerService = new LoggerMainService(getLogLevel(environmentMainService), environmentMainService.logsHome);
		services.set(ILoggerMainService, loggerService);

		// Log: We need to buffer the spdlog logs until we are sure
		// we are the only instance running, otherwise we'll have concurrent
		// log file access on Windows (https://github.com/microsoft/vscode/issues/41218)
		const bufferLogger = new BufferLogger(loggerService.getLogLevel());
		const logService = disposables.add(new LogService(bufferLogger, [new ConsoleMainLogger(loggerService.getLogLevel())]));
		services.set(ILogService, logService);

		// Files
		const fileService = new FileService(logService);
		services.set(IFileService, fileService);
		const diskFileSystemProvider = new DiskFileSystemProvider(logService);
		fileService.registerProvider(Schemas.file, diskFileSystemProvider);

		// URI Identity
		//const uriIdentityService = new UriIdentityService(fileService);
		//services.set(IUriIdentityService, uriIdentityService);

		// State
		const stateService = new StateService(SaveStrategy.DELAYED, environmentMainService, logService, fileService);
		services.set(IStateReadService, stateService);
		services.set(IStateService, stateService);

		// Lifecycle
		services.set(ILifecycleMainService, new SyncDescriptor(LifecycleMainService, undefined, false));

		return [new InstantiationService(services, true), instanceEnvironment, environmentMainService, stateService, bufferLogger, productService];
	}

	private patchEnvironment(environmentMainService: IEnvironmentMainService): IProcessEnvironment {
		const instanceEnvironment: IProcessEnvironment = {
			CDSUITE_IPC_HOOK: environmentMainService.mainIPCHandle
		};

		['CDSUITE_NLS_CONFIG', 'CDSUITE_PORTABLE'].forEach(key => {
			const value = process.env[key];
			if (typeof value === 'string') {
				instanceEnvironment[key] = value;
			}
		});

		Object.assign(process.env, instanceEnvironment);

		return instanceEnvironment;
	}

	private async initServices(environmentMainService: IEnvironmentMainService, stateService: StateService, productService: IProductService): Promise<void> {
		await Promises.settled<unknown>([

			// Environment service (paths)
			Promise.all<string | undefined>([
				environmentMainService.codeCachePath,							 // ...other user-data-derived paths should already be enlisted from `main.js`
				environmentMainService.logsHome.with({ scheme: Schemas.file }).fsPath,
				environmentMainService.backupHome
			].map(path => path ? promises.mkdir(path, { recursive: true }) : undefined)),

			// State service
			stateService.init(),

			// Configuration service
			// configurationService.initialize()
		]);

		// Initialize user data profiles after initializing the state
		// userDataProfilesMainService.init();
	}
	/*
	async function claimInstance(logService: ILogService, environmentMainService: IEnvironmentMainService, lifecycleMainService: ILifecycleMainService, instantiationService: IInstantiationService, productService: IProductService, retry: boolean): Promise<NodeIPCServer> {

		// Try to setup a server for running. If that succeeds it means
		// we are the first instance to startup. Otherwise it is likely
		// that another instance is already running.
		let mainProcessNodeIpcServer: NodeIPCServer;
		try {
			mark('code/willStartMainServer');
			mainProcessNodeIpcServer = await nodeIPCServe(environmentMainService.mainIPCHandle);
			mark('code/didStartMainServer');
			Event.once(lifecycleMainService.onWillShutdown)(() => mainProcessNodeIpcServer.dispose());
		} catch (error) {

			// Handle unexpected errors (the only expected error is EADDRINUSE that
			// indicates another instance of VS Code is running)
			if (error.code !== 'EADDRINUSE') {

				// Show a dialog for errors that can be resolved by the user
				handleStartupDataDirError(environmentMainService, productService, error);

				// Any other runtime error is just printed to the console
				throw error;
			}

			// Since we are the second instance, we do not want to show the dock
			if (isMacintosh) {
				app.dock?.hide();
			}

			// there's a running instance, let's connect to it
			let client: NodeIPCClient<string>;
			try {
				client = await nodeIPCConnect(environmentMainService.mainIPCHandle, 'main');
			} catch (error) {

				// Handle unexpected connection errors by showing a dialog to the user
				if (!retry || isWindows || error.code !== 'ECONNREFUSED') {
					if (error.code === 'EPERM') {
						showStartupWarningDialog(
							localize('secondInstanceAdmin', "Another instance of {0} is already running as administrator.", productService.nameShort),
							localize('secondInstanceAdminDetail', "Please close the other instance and try again."),
							productService
						);
					}

					throw error;
				}

				// it happens on Linux and OS X that the pipe is left behind
				// let's delete it, since we can't connect to it and then
				// retry the whole thing
				try {
					unlinkSync(environmentMainService.mainIPCHandle);
				} catch (error) {
					logService.warn('Could not delete obsolete instance handle', error);

					throw error;
				}

				return claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, false);
			}

			// Show a warning dialog after some timeout if it takes long to talk to the other instance
			// Skip this if we are running with --wait where it is expected that we wait for a while.
			// Also skip when gathering diagnostics (--status) which can take a longer time.
			let startupWarningDialogHandle: Timeout | undefined = undefined;
			if (!environmentMainService.args.wait && !environmentMainService.args.status) {
				startupWarningDialogHandle = setTimeout(() => {
					showStartupWarningDialog(
						localize('secondInstanceNoResponse', "Another instance of {0} is running but not responding", productService.nameShort),
						localize('secondInstanceNoResponseDetail', "Please close all other instances and try again."),
						productService
					);
				}, 10000);
			}

			const otherInstanceLaunchMainService = ProxyChannel.toService<ILaunchMainService>(client.getChannel('launch'), { disableMarshalling: true });
			const otherInstanceDiagnosticsMainService = ProxyChannel.toService<IDiagnosticsMainService>(client.getChannel('diagnostics'), { disableMarshalling: true });

			// Process Info
			if (environmentMainService.args.status) {
				return instantiationService.invokeFunction(async () => {
					const diagnosticsService = new DiagnosticsService(NullTelemetryService, productService);
					const mainDiagnostics = await otherInstanceDiagnosticsMainService.getMainDiagnostics();
					const remoteDiagnostics = await otherInstanceDiagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true });
					const diagnostics = await diagnosticsService.getDiagnostics(mainDiagnostics, remoteDiagnostics);
					console.log(diagnostics);

					throw new ExpectedError();
				});
			}

			// Windows: allow to set foreground
			if (isWindows) {
				await windowsAllowSetForegroundWindow(otherInstanceLaunchMainService, logService);
			}

			// Send environment over...
			logService.trace('Sending env to running instance...');
			await otherInstanceLaunchMainService.start(environmentMainService.args, process.env as IProcessEnvironment);

			// Cleanup
			client.dispose();

			// Now that we started, make sure the warning dialog is prevented
			if (startupWarningDialogHandle) {
				clearTimeout(startupWarningDialogHandle);
			}

			throw new ExpectedError('Sent env to running instance. Terminating...');
		}

		// Print --status usage info
		if (environmentMainService.args.status) {
			console.log(localize('statusWarning', "Warning: The --status argument can only be used if {0} is already running. Please run it again after {0} has started.", productService.nameShort));

			throw new ExpectedError('Terminating...');
		}

		// dock might be hidden at this case due to a retry
		if (isMacintosh) {
			app.dock?.show();
		}

		// Set the CDSUITE_PID variable here when we are sure we are the first
		// instance to startup. Otherwise we would wrongly overwrite the PID
		process.env['CDSUITE_PID'] = String(process.pid);

		return mainProcessNodeIpcServer;
	}

	function handleStartupDataDirError(environmentMainService: IEnvironmentMainService, productService: IProductService, error: NodeJS.ErrnoException): void {
		if (error.code === 'EACCES' || error.code === 'EPERM') {
			const directories = coalesce([environmentMainService.userDataPath, XDG_RUNTIME_DIR]).map(folder => getPathLabel(URI.file(folder), { os: OS, tildify: environmentMainService }));

			showStartupWarningDialog(
				localize('startupDataDirError', "Unable to write program user data."),
				localize('startupUserDataAndExtensionsDirErrorDetail', "{0}\n\nPlease make sure the following directories are writeable:\n\n{1}", toErrorMessage(error), directories.join('\n')),
				productService
			);
		}
	}

	function showStartupWarningDialog(message: string, detail: string, productService: IProductService): void {

		// use sync variant here because we likely exit after this method
		// due to startup issues and otherwise the dialog seems to disappear
		// https://github.com/microsoft/vscode/issues/104493

		dialog.showMessageBoxSync(massageMessageBoxOptions({
			type: 'warning',
			buttons: [localize({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close")],
			message,
			detail
		}, productService).options);
	}

	async function windowsAllowSetForegroundWindow(launchMainService: ILaunchMainService, logService: ILogService): Promise<void> {
		if (isWindows) {
			const processId = await launchMainService.getMainProcessId();

			logService.trace('Sending some foreground love to the running instance:', processId);

			try {
				(await import('windows-foreground-love')).allowSetForegroundWindow(processId);
			} catch (error) {
				logService.error(error);
			}
		}
	}
	*/
	private quit(accessor: ServicesAccessor, reason?: ExpectedError | Error): void {
		const logService = accessor.get(ILogService);
		const lifecycleMainService = accessor.get(ILifecycleMainService);

		let exitCode = 0;

		if (reason) {
			if ((reason as ExpectedError).isExpected) {
				if (reason.message) {
					logService.trace(reason.message);
				}
			} else {
				exitCode = 1; // signal error to the outside

				if (reason.stack) {
					logService.error(reason.stack);
				} else {
					logService.error(`Startup error: ${reason.toString()}`);
				}
			}
		}

		lifecycleMainService.kill(exitCode);
	}

	//#region Command line arguments utilities

	private resolveArgs(): NativeParsedArgs {

		// Parse arguments
		const args = parseMainProcessArgv(process.argv);

		if (args.wait && !args.waitMarkerFilePath) {
			// If we are started with --wait create a random temporary file
			// and pass it over to the starting instance. We can use this file
			// to wait for it to be deleted to monitor that the edited file
			// is closed and then exit the waiting process.
			//
			// Note: we are not doing this if the wait marker has been already
			// added as argument. This can happen if VS Code was started from CLI.
			const waitMarkerFilePath = createWaitMarkerFileSync(args.verbose);
			if (waitMarkerFilePath) {
				addArg(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
				args.waitMarkerFilePath = waitMarkerFilePath;
			}
		}

		return args;
	}
}

// Main Startup
const suite = new SuiteMain();
suite.main();
