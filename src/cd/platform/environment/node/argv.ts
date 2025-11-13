/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import minimist from 'minimist';
import { isWindows } from '../../../base/common/platform.js';
import { localize } from '../../../nls.js';
import { NativeParsedArgs } from '../common/argv.js';

/**
 * This code is also used by standalone cli's. Avoid adding any other dependencies.
 */
const helpCategories = {
	o: localize('optionsUpperCase', "Options"),
	e: localize('extensionsManagement', "Extensions Management"),
	t: localize('troubleshooting', "Troubleshooting"),
	m: localize('mcp', "Model Context Protocol")
};

export interface Option<OptionType> {
	type: OptionType;
	alias?: string;
	deprecates?: string[]; // old deprecated ids
	args?: string | string[];
	description?: string;
	deprecationMessage?: string;
	allowEmptyValue?: boolean;
	cat?: keyof typeof helpCategories;
	global?: boolean;
}

export interface Subcommand<T> {
	type: 'subcommand';
	description?: string;
	deprecationMessage?: string;
	options: OptionDescriptions<Required<T>>;
}

export type OptionDescriptions<T> = {
	[P in keyof T]:
	T[P] extends boolean | undefined ? Option<'boolean'> :
	T[P] extends string | undefined ? Option<'string'> :
	T[P] extends string[] | undefined ? Option<'string[]'> :
	Subcommand<T[P]>
};

export const NATIVE_CLI_COMMANDS = ['tunnel', 'serve-web'] as const;

export const OPTIONS: OptionDescriptions<Required<NativeParsedArgs>> = {
	'new-window': { type: 'boolean', cat: 'o', alias: 'n', description: localize('newWindow', "Force to open a new window.") },
	'reuse-window': { type: 'boolean', cat: 'o', alias: 'r', description: localize('reuseWindow', "Force to open a file or folder in an already opened window.") },
	'wait': { type: 'boolean', cat: 'o', alias: 'w', description: localize('wait', "Wait for the files to be closed before returning.") },
	'waitMarkerFilePath': { type: 'string' },
	'locale': { type: 'string', cat: 'o', args: 'locale', description: localize('locale', "The locale to use (e.g. en-US or zh-TW).") },
	'user-data-dir': { type: 'string', cat: 'o', args: 'dir', description: localize('userDataDir', "Specifies the directory that user data is kept in. Can be used to open multiple distinct instances of Code.") },
	'help': { type: 'boolean', cat: 'o', alias: 'h', description: localize('help', "Print usage.") },

	'version': { type: 'boolean', cat: 't', alias: 'v', description: localize('version', "Print version.") },
	'verbose': { type: 'boolean', cat: 't', global: true, description: localize('verbose', "Print verbose output (implies --wait).") },
	'log': { type: 'string[]', cat: 't', args: 'level', global: true, description: localize('log', "Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'. You can also configure the log level of an extension by passing extension id and log level in the following format: '${publisher}.${name}:${logLevel}'. For example: 'cdsuite.csharp:trace'. Can receive one or more such entries.") },
	'status': { type: 'boolean', alias: 's', cat: 't', description: localize('status', "Print process usage and diagnostics information.") },
	'no-cached-data': { type: 'boolean' },

	'disable-lcd-text': { type: 'boolean', cat: 't', description: localize('disableLCDText', "Disable LCD font rendering.") },
	'disable-gpu': { type: 'boolean', cat: 't', description: localize('disableGPU', "Disable GPU hardware acceleration.") },
	'disable-chromium-sandbox': { type: 'boolean', cat: 't', description: localize('disableChromiumSandbox', "Use this option only when there is requirement to launch the application as sudo user on Linux or when running as an elevated user in an applocker environment on Windows.") },
	'sandbox': { type: 'boolean' },

	'remote': { type: 'string', allowEmptyValue: true },
	'folder-uri': { type: 'string[]', cat: 'o', args: 'uri' },
	'file-uri': { type: 'string[]', cat: 'o', args: 'uri' },

	'skip-release-notes': { type: 'boolean' },
	'skip-welcome': { type: 'boolean' },
	'disable-updates': { type: 'boolean' },
	'transient': { type: 'boolean', cat: 't', description: localize('transient', "Run with temporary data and extension directories, as if launched for the first time.") },

	'open-url': { type: 'boolean' },
	'force': { type: 'boolean' },
	'do-not-sync': { type: 'boolean' },
	'trace': { type: 'boolean' },
	'trace-memory-infra': { type: 'boolean' },
	'trace-category-filter': { type: 'string' },
	'trace-options': { type: 'string' },
	'preserve-env': { type: 'boolean' },
	'force-user-env': { type: 'boolean' },
	'force-disable-user-env': { type: 'boolean' },
	'open-devtools': { type: 'boolean' },
	'disable-gpu-sandbox': { type: 'boolean' },
	'logsPath': { type: 'string' },
	'enable-coi': { type: 'boolean' },
	'unresponsive-sample-interval': { type: 'string' },
	'unresponsive-sample-period': { type: 'string' },
	'enable-rdp-display-tracking': { type: 'boolean' },
	'disable-layout-restore': { type: 'boolean' },
	'disable-experiments': { type: 'boolean' },

	// chromium flags
	'no-proxy-server': { type: 'boolean' },
	// Minimist incorrectly parses keys that start with `--no`
	// https://github.com/substack/minimist/blob/aeb3e27dae0412de5c0494e9563a5f10c82cc7a9/index.js#L118-L121
	// If --no-sandbox is passed via cli wrapper it will be treated as --sandbox which is incorrect, we use
	// the alias here to make sure --no-sandbox is always respected.
	// For https://github.com/microsoft/vscode/issues/128279
	'no-sandbox': { type: 'boolean', alias: 'sandbox' },
	'proxy-server': { type: 'string' },
	'proxy-bypass-list': { type: 'string' },
	'proxy-pac-url': { type: 'string' },
	'js-flags': { type: 'string' }, // chrome js flags
	'inspect': { type: 'string', allowEmptyValue: true },
	'inspect-brk': { type: 'string', allowEmptyValue: true },
	'nolazy': { type: 'boolean' }, // node inspect
	'force-device-scale-factor': { type: 'string' },
	'force-renderer-accessibility': { type: 'boolean' },
	'ignore-certificate-errors': { type: 'boolean' },
	'allow-insecure-localhost': { type: 'boolean' },
	'log-net-log': { type: 'string' },
	'vmodule': { type: 'string' },
	'_urls': { type: 'string[]' },
	'disable-dev-shm-usage': { type: 'boolean' },
	'ozone-platform': { type: 'string' },
	'enable-tracing': { type: 'string' },
	'trace-startup-format': { type: 'string' },
	'trace-startup-file': { type: 'string' },
	'trace-startup-duration': { type: 'string' },
	'xdg-portal-required-version': { type: 'string' },

	_: { type: 'string[]' } // main arguments
};

export interface ErrorReporter {
	onUnknownOption(id: string): void;
	onMultipleValues(id: string, usedValue: string): void;
	onEmptyValue(id: string): void;
	onDeprecatedOption(deprecatedId: string, message: string): void;

	getSubcommandReporter?(command: string): ErrorReporter;
}

const ignoringReporter = {
	onUnknownOption: () => { },
	onMultipleValues: () => { },
	onEmptyValue: () => { },
	onDeprecatedOption: () => { }
};

export function parseArgs<T>(args: string[], options: OptionDescriptions<T>, errorReporter: ErrorReporter = ignoringReporter): T {
	// Find the first non-option arg, which also isn't the value for a previous `--flag`
	const firstPossibleCommand = args.find((a, i) => a.length > 0 && a[0] !== '-' && options.hasOwnProperty(a) && options[a as T].type === 'subcommand');

	const alias: { [key: string]: string } = {};
	const stringOptions: string[] = ['_'];
	const booleanOptions: string[] = [];
	const globalOptions: Record<string, Option<'boolean'> | Option<'string'> | Option<'string[]'>> = {};
	let command: Subcommand<Record<string, unknown>> | undefined = undefined;
	for (const optionId in options) {
		const o = options[optionId];
		if (o.type === 'subcommand') {
			if (optionId === firstPossibleCommand) {
				command = o;
			}
		} else {
			if (o.alias) {
				alias[optionId] = o.alias;
			}

			if (o.type === 'string' || o.type === 'string[]') {
				stringOptions.push(optionId);
				if (o.deprecates) {
					stringOptions.push(...o.deprecates);
				}
			} else if (o.type === 'boolean') {
				booleanOptions.push(optionId);
				if (o.deprecates) {
					booleanOptions.push(...o.deprecates);
				}
			}
			if (o.global) {
				globalOptions[optionId] = o;
			}
		}
	}
	if (command && firstPossibleCommand) {
		const options: Record<string, Option<'boolean'> | Option<'string'> | Option<'string[]'> | Subcommand<Record<string, unknown>>> = globalOptions;
		for (const optionId in command.options) {
			options[optionId] = command.options[optionId];
		}
		const newArgs = args.filter(a => a !== firstPossibleCommand);
		const reporter = errorReporter.getSubcommandReporter ? errorReporter.getSubcommandReporter(firstPossibleCommand) : undefined;
		const subcommandOptions = parseArgs(newArgs, options as OptionDescriptions<Record<string, unknown>>, reporter);
		// eslint-disable-next-line local/code-no-dangerous-type-assertions
		return <T>{
			[firstPossibleCommand]: subcommandOptions,
			_: []
		};
	}


	// remove aliases to avoid confusion
	const parsedArgs = minimist(args, { string: stringOptions, boolean: booleanOptions, alias });

	const cleanedArgs: Record<string, unknown> = {};
	const remainingArgs: Record<string, unknown> = parsedArgs;

	// https://github.com/microsoft/vscode/issues/58177, https://github.com/microsoft/vscode/issues/106617
	cleanedArgs._ = parsedArgs._.map(arg => String(arg)).filter(arg => arg.length > 0);

	delete remainingArgs._;

	for (const optionId in options) {
		const o = options[optionId];
		if (o.type === 'subcommand') {
			continue;
		}
		if (o.alias) {
			delete remainingArgs[o.alias];
		}

		let val = remainingArgs[optionId];
		if (o.deprecates) {
			for (const deprecatedId of o.deprecates) {
				if (remainingArgs.hasOwnProperty(deprecatedId)) {
					if (!val) {
						val = remainingArgs[deprecatedId];
						if (val) {
							errorReporter.onDeprecatedOption(deprecatedId, o.deprecationMessage || localize('deprecated.useInstead', 'Use {0} instead.', optionId));
						}
					}
					delete remainingArgs[deprecatedId];
				}
			}
		}

		if (typeof val !== 'undefined') {
			if (o.type === 'string[]') {
				if (!Array.isArray(val)) {
					val = [val];
				}
				if (!o.allowEmptyValue) {
					const sanitized = (val as string[]).filter((v: string) => v.length > 0);
					if (sanitized.length !== (val as string[]).length) {
						errorReporter.onEmptyValue(optionId);
						val = sanitized.length > 0 ? sanitized : undefined;
					}
				}
			} else if (o.type === 'string') {
				if (Array.isArray(val)) {
					val = val.pop(); // take the last
					errorReporter.onMultipleValues(optionId, val as string);
				} else if (!val && !o.allowEmptyValue) {
					errorReporter.onEmptyValue(optionId);
					val = undefined;
				}
			}
			cleanedArgs[optionId] = val;

			if (o.deprecationMessage) {
				errorReporter.onDeprecatedOption(optionId, o.deprecationMessage);
			}
		}
		delete remainingArgs[optionId];
	}

	for (const key in remainingArgs) {
		errorReporter.onUnknownOption(key);
	}

	return cleanedArgs as T;
}

function formatUsage(optionId: string, option: Option<'boolean'> | Option<'string'> | Option<'string[]'>) {
	let args = '';
	if (option.args) {
		if (Array.isArray(option.args)) {
			args = ` <${option.args.join('> <')}>`;
		} else {
			args = ` <${option.args}>`;
		}
	}
	if (option.alias) {
		return `-${option.alias} --${optionId}${args}`;
	}
	return `--${optionId}${args}`;
}

// exported only for testing
export function formatOptions(options: OptionDescriptions<unknown> | Record<string, Option<'boolean'> | Option<'string'> | Option<'string[]'>>, columns: number): string[] {
	const usageTexts: [string, string][] = [];
	for (const optionId in options) {
		const o = options[optionId as keyof typeof options] as Option<'boolean'> | Option<'string'> | Option<'string[]'>;
		const usageText = formatUsage(optionId, o);
		usageTexts.push([usageText, o.description!]);
	}
	return formatUsageTexts(usageTexts, columns);
}

function formatUsageTexts(usageTexts: [string, string][], columns: number) {
	const maxLength = usageTexts.reduce((previous, e) => Math.max(previous, e[0].length), 12);
	const argLength = maxLength + 2/*left padding*/ + 1/*right padding*/;
	if (columns - argLength < 25) {
		// Use a condensed version on narrow terminals
		return usageTexts.reduce<string[]>((r, ut) => r.concat([`  ${ut[0]}`, `      ${ut[1]}`]), []);
	}
	const descriptionColumns = columns - argLength - 1;
	const result: string[] = [];
	for (const ut of usageTexts) {
		const usage = ut[0];
		const wrappedDescription = wrapText(ut[1], descriptionColumns);
		const keyPadding = indent(argLength - usage.length - 2/*left padding*/);
		result.push('  ' + usage + keyPadding + wrappedDescription[0]);
		for (let i = 1; i < wrappedDescription.length; i++) {
			result.push(indent(argLength) + wrappedDescription[i]);
		}
	}
	return result;
}

function indent(count: number): string {
	return ' '.repeat(count);
}

function wrapText(text: string, columns: number): string[] {
	const lines: string[] = [];
	while (text.length) {
		let index = text.length < columns ? text.length : text.lastIndexOf(' ', columns);
		if (index === 0) {
			index = columns;
		}
		const line = text.slice(0, index).trim();
		text = text.slice(index).trimStart();
		lines.push(line);
	}
	return lines;
}

export function buildHelpMessage(productName: string, executableName: string, version: string, options: OptionDescriptions<unknown> | Record<string, Option<'boolean'> | Option<'string'> | Option<'string[]'> | Subcommand<Record<string, unknown>>>, capabilities?: { noPipe?: boolean; noInputFiles?: boolean; isChat?: boolean }): string {
	const columns = (process.stdout).isTTY && (process.stdout).columns || 80;
	const inputFiles = capabilities?.noInputFiles ? '' : capabilities?.isChat ? ` [${localize('cliPrompt', 'prompt')}]` : ` [${localize('paths', 'paths')}...]`;
	const subcommand = capabilities?.isChat ? ' chat' : '';

	const help = [`${productName} ${version}`];
	help.push('');
	help.push(`${localize('usage', "Usage")}: ${executableName}${subcommand} [${localize('options', "options")}]${inputFiles}`);
	help.push('');
	if (capabilities?.noPipe !== true) {
		help.push(buildStdinMessage(executableName, capabilities?.isChat));
		help.push('');
	}
	const optionsByCategory: { [P in keyof typeof helpCategories]?: Record<string, Option<'boolean'> | Option<'string'> | Option<'string[]'>> } = {};
	const subcommands: { command: string; description: string }[] = [];
	for (const optionId in options) {
		const o = options[optionId as keyof typeof options] as Option<'boolean'> | Option<'string'> | Option<'string[]'> | Subcommand<Record<string, unknown>>;
		if (o.type === 'subcommand') {
			if (o.description) {
				subcommands.push({ command: optionId, description: o.description });
			}
		} else if (o.description && o.cat) {
			const cat = o.cat as keyof typeof helpCategories;
			let optionsByCat = optionsByCategory[cat];
			if (!optionsByCat) {
				optionsByCategory[cat] = optionsByCat = {};
			}
			optionsByCat[optionId] = o;
		}
	}

	for (const helpCategoryKey in optionsByCategory) {
		const key = <keyof typeof helpCategories>helpCategoryKey;

		const categoryOptions = optionsByCategory[key];
		if (categoryOptions) {
			help.push(helpCategories[key]);
			help.push(...formatOptions(categoryOptions, columns));
			help.push('');
		}
	}

	if (subcommands.length) {
		help.push(localize('subcommands', "Subcommands"));
		help.push(...formatUsageTexts(subcommands.map(s => [s.command, s.description]), columns));
		help.push('');
	}

	return help.join('\n');
}

export function buildStdinMessage(executableName: string, isChat?: boolean): string {
	let example: string;
	if (isWindows) {
		if (isChat) {
			example = `echo Hello World | ${executableName} chat <prompt> -`;
		} else {
			example = `echo Hello World | ${executableName} -`;
		}
	} else {
		if (isChat) {
			example = `ps aux | grep code | ${executableName} chat <prompt> -`;
		} else {
			example = `ps aux | grep code | ${executableName} -`;
		}
	}

	return localize('stdinUsage', "To read from stdin, append '-' (e.g. '{0}')", example);
}

export function buildVersionMessage(version: string | undefined, commit: string | undefined): string {
	return `${version || localize('unknownVersion', "Unknown version")}\n${commit || localize('unknownCommit', "Unknown commit")}\n${process.arch}`;
}
