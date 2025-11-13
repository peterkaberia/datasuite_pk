/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { app, BrowserWindow, dialog, IpcMainInvokeEvent, Menu, MenuItemConstructorOptions, shell } from 'electron';
import { Event } from '../../base/common/event.js';
import { Disposable } from '../../base/common/lifecycle.js';
import { IEnvironmentMainService } from '../../platform/environment/electron-main/environmentMainService.js';
import { ILifecycleMainService, LifecycleMainPhase } from '../../platform/lifecycle/electron-main/lifecycleMainService.js';
import { ILoggerService, ILogService } from '../../platform/log/common/log.js';
import { validatedIpcMain } from '../../base/parts/ipc/electron-main/ipcMain.js';
import { PickFileOptions } from '../../base/parts/sandbox/electron-browser/global.js';
import { IPC_CHANNELS } from '../../../ui-utils.js';
import { rShinyManager } from '../../../rshiny.js';
import { RunOnceScheduler, runWhenGlobalIdle } from '../../base/common/async.js';
import { IProcessEnvironment } from '../../base/common/platform.js';
import { FileAccess } from '../../base/common/network.js';

/**
 * The main Datasuite application. There will only ever be one instance,
 * even if the user starts many instances (e.g. from the command line).
 */
export class SuiteApplication extends Disposable {

	private mainWindow: BrowserWindow | null = null;

	constructor(
		//private readonly mainProcessNodeIpcServer: NodeIPCServer,
		readonly userEnv: IProcessEnvironment,
		@ILogService private readonly logService: ILogService,
		@ILoggerService readonly loggerService: ILoggerService,
		@IEnvironmentMainService private readonly environmentMainService: IEnvironmentMainService,
		@ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService,
	) {
		super();

		this.registerListeners();
	}

	private registerListeners(): void {
		// Dispose on shutdown
		Event.once(this.lifecycleMainService.onWillShutdown)(() => this.dispose());

		app.on('activate', async () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				await this.createWindow();
			}
		});

		validatedIpcMain.handle(IPC_CHANNELS.RETRY_START_SHINY, async (event: IpcMainInvokeEvent) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			if (window) {
				console.log('IPC: Retrying Shiny startup...');
				await rShinyManager.startAndServe(window);
			}
		});

		validatedIpcMain.handle(IPC_CHANNELS.PICK_FILE, async (event: IpcMainInvokeEvent, opts?: PickFileOptions) => {
			const window = BrowserWindow.fromWebContents(event.sender) || this.mainWindow;
			if (!window) {
				return null;
			}

			const filters = Array.isArray(opts?.accept) && opts.accept.length
				? [{ name: 'Allowed', extensions: opts.accept }]
				: [{ name: 'All Files', extensions: ['*'] }];

			const properties: ('multiSelections' | 'openFile' | 'openDirectory')[] = [];
			if (opts?.multiple) {
				properties.push('multiSelections');
			}
			properties.push('openFile');

			const { canceled, filePaths } = await dialog.showOpenDialog(window, { properties, filters });
			if (canceled) {
				return null;
			}

			return opts?.multiple ? filePaths : filePaths[0];
		});
	}

	async startup(): Promise<void> {
		this.logService.debug('Starting VS Code');
		this.logService.debug(`from: ${this.environmentMainService.appRoot}`);
		this.logService.debug('args:', this.environmentMainService.args);

		this.buildMenu();

		// Signal phase: ready - before opening first window
		this.lifecycleMainService.phase = LifecycleMainPhase.Ready;

		// Open Windows
		await this.createWindow();
		//await appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor, initialProtocolUrls));

		// Signal phase: after window open
		this.lifecycleMainService.phase = LifecycleMainPhase.AfterWindowOpen;

		// Post Open Windows Tasks
		//this.afterWindowOpen();

		// Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
		const eventuallyPhaseScheduler = this._register(new RunOnceScheduler(() => {
			this._register(runWhenGlobalIdle(() => {

				// Signal phase: eventually
				this.lifecycleMainService.phase = LifecycleMainPhase.Eventually;

				// Eventually Post Open Window Tasks
				//this.eventuallyAfterWindowOpen();
			}, 2500));
		}, 2500));
		eventuallyPhaseScheduler.schedule();
	}

	private buildMenu(): void {
		const template: MenuItemConstructorOptions[] = [
			{
				label: 'File',
				submenu: [
					{ label: 'New Window', accelerator: 'CmdOrCtrl+Shift+N', click: async () => { await this.createWindow(); } },
					{ type: 'separator' },
					{
						label: 'Open File…',
						accelerator: 'CmdOrCtrl+O',
						click: async () => {
							if (!this.mainWindow) {
								return;
							}
							await dialog.showOpenDialog(this.mainWindow, {});
						}
					},
					{ type: 'separator' },
					{ label: 'Exit', accelerator: 'CmdOrCtrl+Q', role: 'quit' as const }
				]
			},
			{
				label: 'Help',
				submenu: [
					{ label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => this.mainWindow?.webContents.reload() },
					{ label: 'Toggle Full Screen', role: 'togglefullscreen' },
					{ type: 'separator' },
					{ label: 'GitHub Repository', click: async () => shell.openExternal('https://github.com/aphrcwaro/datasuite') },
					{ label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', click: () => this.mainWindow?.webContents.toggleDevTools() },
					{ type: 'separator' },
					{
						label: `${app.getName()} About`,
						click: () => dialog.showMessageBox({ title: 'About', message: `${app.getName()} v${app.getVersion()}` })
					}
				]
			}
		];

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	};

	private async createWindow(): Promise<void> {
		if (this.mainWindow && !this.mainWindow.isDestroyed()) {
			this.mainWindow.focus();
			return;
		}

		this.mainWindow = new BrowserWindow({
			width: 800,
			height: 600,
			titleBarOverlay: true,
			webPreferences: {
				preload: FileAccess.asFileUri('cd/base/parts/sandbox/electron-browser/preload.js').fsPath,
				sandbox: true,
			}
		});

		this.mainWindow.webContents.on('did-start-loading', async () => {
			if (this.mainWindow && this.mainWindow.webContents.getURL() !== 'about:blank') {
				console.log('Window content change detected. Ensuring R process is running...');
				await rShinyManager.startAndServe(this.mainWindow);
			}
		});

		rShinyManager.bindPowerEvents(this.mainWindow);
		await rShinyManager.startAndServe(this.mainWindow);

		this.mainWindow.on('closed', () => {
			this.mainWindow = null;
		});
	};
}
