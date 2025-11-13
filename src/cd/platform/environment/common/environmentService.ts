/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { toLocalISOString } from '../../../base/common/date.js';
import { dirname } from 'path';
import { memoize } from '../../../base/common/decorators.js';
import { INativeEnvironmentService } from './environment.js';
import { FileAccess, Schemas } from '../../../base/common/network.js';
import { URI } from '../../../base/common/uri.js';
import { NativeParsedArgs } from './argv.js';
import { joinPath } from '../../../base/common/resources.js';
import { join } from '../../../base/common/path.js';
import { env } from '../../../base/common/process.js';
import { IProductService } from '../../product/common/productService.js';

export interface INativeEnvironmentPaths {
	/**
	 * The user data directory to use for anything that should be
	 * persisted except for the content that is meant for the `homeDir`.
	 *
	 * Only one instance of DataSuite can use the same `userDataDir`.
	 */
	userDataDir: string;

	/**
	 * The user home directory mainly used for persisting extensions
	 * and global configuration that should be shared across all
	 * versions.
	 */
	homeDir: string;

	/**
	 * OS tmp dir.
	 */
	tmpDir: string;
}

export abstract class AbstractNativeEnvironmentService implements INativeEnvironmentService {

	declare readonly _serviceBrand: undefined;

	@memoize
	get appRoot(): string { return dirname(FileAccess.asFileUri('').fsPath); }

	@memoize
	get userHome(): URI { return URI.file(this.paths.homeDir); }

	@memoize
	get userDataPath(): string { return this.paths.userDataDir; }

	@memoize
	get appSettingsHome(): URI { return URI.file(join(this.userDataPath, 'User')); }

	@memoize
	get tmpDir(): URI { return URI.file(this.paths.tmpDir); }

	@memoize
	get cacheHome(): URI { return URI.file(this.userDataPath); }

	@memoize
	get stateResource(): URI { return joinPath(this.appSettingsHome, 'globalStorage', 'storage.json'); }

	@memoize
	get userRoamingDataHome(): URI { return this.appSettingsHome.with({ scheme: Schemas.cdsuiteUserData }); }

	@memoize
	get userDataSyncHome(): URI { return joinPath(this.appSettingsHome, 'sync'); }

	get logsHome(): URI {
		if (!this.args.logsPath) {
			const key = toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '');
			this.args.logsPath = join(this.userDataPath, 'logs', key);
		}

		return URI.file(this.args.logsPath);
	}

	get isBuilt(): boolean { return !env['CDSUITE_DEV']; }
	get verbose(): boolean { return !!this.args.verbose; }

	@memoize
	get logLevel(): string | undefined { return 'trace'; }

	@memoize
	get serviceMachineIdResource(): URI { return joinPath(URI.file(this.userDataPath), 'machineid'); }

	get args(): NativeParsedArgs { return this._args; }

	constructor(
		private readonly _args: NativeParsedArgs,
		private readonly paths: INativeEnvironmentPaths,
		protected readonly productService: IProductService
	) { }
}
