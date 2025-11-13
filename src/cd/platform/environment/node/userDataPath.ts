import { homedir } from 'os';
import { resolve, isAbsolute, join } from 'path';

const cwd = process.env['CDSUITE_CWD'] || process.cwd();

export function getUserDataPath(productName: string): string {
	const userDataPath = doGetUserDataPath(productName);
	const pathsToResolve = [userDataPath];

	// Make sure to resolve it against the passed in
	// current working directory. We cannot use the
	// node.js `path.resolve()` logic because it will
	// not pick up our `CDSUITE_CWD` environment variable
	// (https://github.com/microsoft/vscode/issues/120269)
	if (!isAbsolute(userDataPath)) {
		pathsToResolve.unshift(cwd);
	}

	return resolve(...pathsToResolve);
}

function doGetUserDataPath(productName: string): string {

	// 0. Running out of sources has a fixed product name
	if (process.env['CDSUITE_DEV']) {
		productName = 'suite-dev';
	}

	// 1. Support portable mode
	const portablePath = process.env['CDSUITE_PORTABLE'];
	if (portablePath) {
		return join(portablePath, 'user-data');
	}

	// 2. Support global CDSUITE_APPDATA environment variable
	let appDataPath = process.env['CDSUITE_APPDATA'];
	if (appDataPath) {
		return join(appDataPath, productName);
	}

	// 3. Otherwise check per platform
	switch (process.platform) {
		case 'win32':
			appDataPath = process.env['APPDATA'];
			if (!appDataPath) {
				const userProfile = process.env['USERPROFILE'];
				if (typeof userProfile !== 'string') {
					throw new Error('Windows: Unexpected undefined %USERPROFILE% environment variable');
				}

				appDataPath = join(userProfile, 'AppData', 'Roaming');
			}
			break;
		case 'linux':
			appDataPath = process.env['XDG_CONFIG_HOME'] || join(homedir(), '.config');
			break;
		default:
			throw new Error('Platform not supported');
	}

	return join(appDataPath, productName);
}
