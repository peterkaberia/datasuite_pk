/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const enum FocusMode {

	/**
	 * (Default) Transfer focus to the target window
	 * when the editor is focused.
	 */
	Transfer,

	/**
	 * Transfer focus to the target window when the
	 * editor is focused, otherwise notify the user that
	 * the app has activity (macOS/Windows only).
	 */
	Notify,

	/**
	 * Force the window to be focused, even if the editor
	 * is not currently focused.
	 */
	Force,
}
