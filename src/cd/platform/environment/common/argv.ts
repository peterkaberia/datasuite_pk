/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * A list of command line arguments we support natively.
 */
export interface NativeParsedArgs {

	// arguments
	_: string[];
	'folder-uri'?: string[]; // undefined or array of 1 or more
	'file-uri'?: string[]; // undefined or array of 1 or more
	_urls?: string[];
	help?: boolean;
	version?: boolean;
	status?: boolean;
	wait?: boolean;
	waitMarkerFilePath?: string;
	'new-window'?: boolean;
	'reuse-window'?: boolean;
	locale?: string;
	'user-data-dir'?: string;
	'no-cached-data'?: boolean;
	verbose?: boolean;
	trace?: boolean;
	'trace-memory-infra'?: boolean;
	'trace-category-filter'?: string;
	'trace-options'?: string;
	'open-devtools'?: boolean;
	log?: string[];
	'open-url'?: boolean;
	'skip-release-notes'?: boolean;
	'skip-welcome'?: boolean;
	'disable-updates'?: boolean;
	'transient'?: boolean;
	'remote'?: string;
	'force'?: boolean;
	'do-not-sync'?: boolean;
	'preserve-env'?: boolean;
	'force-user-env'?: boolean;
	'force-disable-user-env'?: boolean;
	'logsPath'?: string;
	'disable-chromium-sandbox'?: boolean;
	sandbox?: boolean;
	'enable-coi'?: boolean;
	'unresponsive-sample-interval'?: string;
	'unresponsive-sample-period'?: string;
	'enable-rdp-display-tracking'?: boolean;
	'disable-layout-restore'?: boolean;
	'disable-experiments'?: boolean;

	// chromium command line args: https://electronjs.org/docs/all#supported-chrome-command-line-switches
	'no-proxy-server'?: boolean;
	'no-sandbox'?: boolean;
	'proxy-server'?: string;
	'proxy-bypass-list'?: string;
	'proxy-pac-url'?: string;
	'inspect'?: string;
	'inspect-brk'?: string;
	'js-flags'?: string;
	'disable-lcd-text'?: boolean;
	'disable-gpu'?: boolean;
	'disable-gpu-sandbox'?: boolean;
	'nolazy'?: boolean;
	'force-device-scale-factor'?: string;
	'force-renderer-accessibility'?: boolean;
	'ignore-certificate-errors'?: boolean;
	'allow-insecure-localhost'?: boolean;
	'log-net-log'?: string;
	'vmodule'?: string;
	'disable-dev-shm-usage'?: boolean;
	'ozone-platform'?: string;
	'enable-tracing'?: string;
	'trace-startup-format'?: string;
	'trace-startup-file'?: string;
	'trace-startup-duration'?: string;
	'xdg-portal-required-version'?: string;
}
