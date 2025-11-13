import * as electron from 'electron';
import { isWindows } from './cd/base/common/platform.js';
import { Emitter, Event } from './cd/base/common/event.js';
import { Disposable } from './cd/base/common/lifecycle.js';

export class BaseWindow extends Disposable {

	//#region Events

	private readonly _onDidClose = this._register(new Emitter<void>());
	readonly onDidClose = this._onDidClose.event;

	private readonly _onDidMaximize = this._register(new Emitter<void>());
	readonly onDidMaximize = this._onDidMaximize.event;

	private readonly _onDidUnmaximize = this._register(new Emitter<void>());
	readonly onDidUnmaximize = this._onDidUnmaximize.event;

	private readonly _onDidChangeAlwaysOnTop = this._register(new Emitter<boolean>());
	readonly onDidChangeAlwaysOnTop = this._onDidChangeAlwaysOnTop.event;

	//#endregion

	protected _win: electron.BrowserWindow | null = null;
	get win() { return this._win; }
	protected setWin(win: electron.BrowserWindow, options?: electron.BrowserWindowConstructorOptions): void {
		this._win = win;

		// Window Events
		this._register(Event.fromNodeEventEmitter(win, 'maximize')(() => {
			if (isWindows && this._win) {
				//const [x, y] = this._win.getPosition();
				//const [width, height] = this._win.getSize();
			}

			this._onDidMaximize.fire();
		}));

		this._register(Event.fromNodeEventEmitter(win, 'closed')(() => {
			this._onDidClose.fire();
			this._win = null;
		}));

		this._register(Event.fromNodeEventEmitter(win, 'maximize')(() => {
			this._onDidMaximize.fire();
		}));
	}

	constructor() {
		super();
	}
}
