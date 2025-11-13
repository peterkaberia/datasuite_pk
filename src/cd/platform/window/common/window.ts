/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VSBuffer } from '../../../base/common/buffer.js';
import { URI, UriComponents, UriDto } from '../../../base/common/uri.js';
import { ISandboxConfiguration } from '../../../base/parts/sandbox/common/sandboxTypes.js';
import { NativeParsedArgs } from '../../environment/common/argv.js';
import { ILoggerResource, LogLevel } from '../../log/common/log.js';

export const WindowMinimumSize = {
	WIDTH: 400,
	WIDTH_WITH_VERTICAL_PANEL: 600,
	HEIGHT: 270
};

export interface IPoint {
	readonly x: number;
	readonly y: number;
}

export interface IRectangle extends IPoint {
	readonly width: number;
	readonly height: number;
}

export interface IBaseOpenWindowsOptions {

	/**
	 * Whether to reuse the window or open a new one.
	 */
	readonly forceReuseWindow?: boolean;

	/**
	 * The remote authority to use when windows are opened with either
	 * - no workspace (empty window)
	 * - a workspace that is neither `file://` nor `cdsuite-remote://`
	 * Use 'null' for a local window.
	 * If not set, defaults to the remote authority of the current window.
	 */
	readonly remoteAuthority?: string | null;

	readonly forceProfile?: string;
	readonly forceTempProfile?: boolean;
}

export interface IOpenWindowOptions extends IBaseOpenWindowsOptions {
	readonly forceNewWindow?: boolean;
	readonly preferNewWindow?: boolean;

	readonly noRecentEntry?: boolean;

	readonly addMode?: boolean;
	readonly removeMode?: boolean;

	readonly diffMode?: boolean;
	readonly mergeMode?: boolean;
	readonly gotoLineMode?: boolean;

	readonly waitMarkerFileURI?: URI;
}

export interface IAddRemoveFoldersRequest {
	readonly foldersToAdd: UriComponents[];
	readonly foldersToRemove: UriComponents[];
}

interface IOpenedWindow {
	readonly id: number;
	readonly title: string;
	readonly filename?: string;
}

export interface IOpenedMainWindow extends IOpenedWindow {
	readonly dirty: boolean;
}

export interface IOpenedAuxiliaryWindow extends IOpenedWindow {
	readonly parentId: number;
}

export function isOpenedAuxiliaryWindow(candidate: IOpenedMainWindow | IOpenedAuxiliaryWindow): candidate is IOpenedAuxiliaryWindow {
	return typeof (candidate as IOpenedAuxiliaryWindow).parentId === 'number';
}

export interface IOpenEmptyWindowOptions extends IBaseOpenWindowsOptions { }

export type IWindowOpenable = IWorkspaceToOpen | IFolderToOpen | IFileToOpen;

export interface IBaseWindowOpenable {
	label?: string;
}

export interface IWorkspaceToOpen extends IBaseWindowOpenable {
	readonly workspaceUri: URI;
}

export interface IFolderToOpen extends IBaseWindowOpenable {
	readonly folderUri: URI;
}

export interface IFileToOpen extends IBaseWindowOpenable {
	readonly fileUri: URI;
}

export function isFolderToOpen(uriToOpen: IWindowOpenable): uriToOpen is IFolderToOpen {
	return !!(uriToOpen as IFolderToOpen).folderUri;
}

export function isFileToOpen(uriToOpen: IWindowOpenable): uriToOpen is IFileToOpen {
	return !!(uriToOpen as IFileToOpen).fileUri;
}

export const enum MenuSettings {
	MenuStyle = 'window.menuStyle',
	MenuBarVisibility = 'window.menuBarVisibility'
}

export const enum MenuStyleConfiguration {
	CUSTOM = 'custom',
	NATIVE = 'native',
	INHERIT = 'inherit',
}

export interface INativeWindowConfiguration extends NativeParsedArgs, ISandboxConfiguration {
	mainPid: number;
	handle?: VSBuffer;

	machineId: string;
	sqmId: string;
	devDeviceId: string;

	execPath: string;
	backupPath?: string;

	profiles: {
		home: UriComponents;
	};

	homeDir: string;
	tmpDir: string;
	userDataDir: string;

	//partsSplash?: IPartsSplash;

	isInitialStartup?: boolean;
	logLevel: LogLevel;
	loggers: UriDto<ILoggerResource>[];

	fullscreen?: boolean;
	maximized?: boolean;
	accessibilitySupport?: boolean;
	//colorScheme: IColorScheme;
	autoDetectHighContrast?: boolean;
	autoDetectColorScheme?: boolean;
	isCustomZoomLevel?: boolean;

	perfMarks: PerformanceMark[];

	//filesToWait?: IPathsToWaitFor;

	//os: IOSConfiguration;
}

/**
 * According to Electron docs: `scale := 1.2 ^ level`.
 * https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentssetzoomlevellevel
 */
export function zoomLevelToZoomFactor(zoomLevel = 0): number {
	return 1.2 ** zoomLevel;
}

export const DEFAULT_EMPTY_WINDOW_SIZE = { width: 1200, height: 800 } as const;
export const DEFAULT_WORKSPACE_WINDOW_SIZE = { width: 1440, height: 900 } as const;
export const DEFAULT_AUX_WINDOW_SIZE = { width: 1024, height: 768 } as const;
