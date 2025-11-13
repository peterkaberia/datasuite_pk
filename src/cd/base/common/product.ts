/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface IProductWalkthrough {
	id: string;
	steps: IProductWalkthroughStep[];
}

export interface IProductWalkthroughStep {
	id: string;
	title: string;
	when: string;
	description: string;
	media:
	| { type: 'image'; path: string | { hc: string; hcLight?: string; light: string; dark: string }; altText: string }
	| { type: 'svg'; path: string; altText: string }
	| { type: 'markdown'; path: string };
}

export interface IProductConfiguration {
	readonly version: string;
	readonly date?: string;
	readonly quality?: string;
	readonly commit?: string;

	readonly nameShort: string;
	readonly nameLong: string;

	readonly win32AppUserModelId?: string;
	readonly win32MutexName?: string;
	readonly win32RegValueName?: string;
	readonly applicationName: string;
	readonly embedderIdentifier?: string;

	readonly urlProtocol: string;
	readonly dataFolderName: string; // location for extensions (e.g. ~/.cdsuite-insiders)

	readonly walkthroughMetadata?: IProductWalkthrough[];

	readonly downloadUrl?: string;
	readonly updateUrl?: string;
	readonly webUrl?: string;
	readonly webEndpointUrlTemplate?: string;
	readonly webviewContentExternalBaseUrlTemplate?: string;
	readonly target?: string;
	readonly nlsCoreBaseUrl?: string;

	readonly settingsSearchBuildId?: number;
	readonly settingsSearchUrl?: string;

	readonly commandPaletteSuggestedCommandIds?: string[];

	readonly openToWelcomeMainPage?: boolean;

	readonly documentationUrl?: string;
	readonly serverDocumentationUrl?: string;
	readonly releaseNotesUrl?: string;
	readonly keyboardShortcutsUrlMac?: string;
	readonly keyboardShortcutsUrlLinux?: string;
	readonly keyboardShortcutsUrlWin?: string;
	readonly introductoryVideosUrl?: string;
	readonly tipsAndTricksUrl?: string;
	readonly newsletterSignupUrl?: string;
	readonly youTubeUrl?: string;
	readonly requestFeatureUrl?: string;
	readonly reportIssueUrl?: string;
	readonly reportMarketplaceIssueUrl?: string;
	readonly licenseUrl?: string;
	readonly serverLicenseUrl?: string;
	readonly privacyStatementUrl?: string;
	readonly showTelemetryOptOut?: boolean;

	readonly npsSurveyUrl?: string;
	readonly surveys?: readonly ISurveyData[];

	readonly checksums?: { [path: string]: string };
	readonly checksumFailMoreInfoUrl?: string;

	readonly appCenter?: IAppCenterConfiguration;

	readonly portable?: string;

	readonly msftInternalDomains?: string[];
	readonly linkProtectionTrustedDomains?: readonly string[];

	readonly darwinUniversalAssetId?: string;
	readonly darwinBundleIdentifier?: string;
	readonly profileTemplatesUrl?: string;

	readonly commonlyUsedSettings?: string[];
}

export interface IAppCenterConfiguration {
	readonly 'win32-x64': string;
	readonly 'win32-arm64': string;
	readonly 'linux-x64': string;
	readonly 'darwin': string;
	readonly 'darwin-universal': string;
	readonly 'darwin-arm64': string;
}

export interface ISurveyData {
	surveyId: string;
	surveyUrl: string;
	languageId: string;
	editCount: number;
	userProbability: number;
}
