/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IProductConfiguration } from '../../../base/common/product.js';
import { ISandboxConfiguration } from '../../../base/parts/sandbox/common/sandboxTypes.js';

/**
 * @deprecated It is preferred that you use `IProductService` if you can. This
 * allows web embedders to override our defaults. But for things like `product.quality`,
 * the use is fine because that property is not overridable.
 */
let product: IProductConfiguration;

// Native sandbox environment
const cdsuiteGlobal = (globalThis as { cdsuite?: { context?: { configuration(): ISandboxConfiguration | undefined } } }).cdsuite;
if (typeof cdsuiteGlobal !== 'undefined' && typeof cdsuiteGlobal.context !== 'undefined') {
	const configuration: ISandboxConfiguration | undefined = cdsuiteGlobal.context.configuration();
	if (configuration) {
		product = configuration.product;
	} else {
		throw new Error('Sandbox: unable to resolve product configuration from preload script.');
	}
}

// Web environment or unknown
else {

	// Built time configuration (do NOT modify)
	// eslint-disable-next-line local/code-no-dangerous-type-assertions
	product = { /*BUILD->INSERT_PRODUCT_CONFIGURATION*/ } as unknown as IProductConfiguration;

	// Running out of sources
	if (Object.keys(product).length === 0) {
		Object.assign(product, {
			version: '1.0.0-dev',
			nameShort: 'DataSuite Dev',
			nameLong: 'Countdown DataSuite Dev',
			applicationName: 'cd2030-datasuite',
			dataFolderName: '.cdsuite-oss',
			urlProtocol: 'suite',
			reportIssueUrl: 'https://github.com/microsoft/vscode/issues/new',
			licenseName: 'MIT',
			licenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt'
		});
	}
}

export default product;
