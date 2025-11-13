/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { app } from 'electron';
import { bootstrapESM } from './bootstrap-esm.js';


app.once('ready', onReady);

async function onReady() {
    //perf.mark('code/mainAppReady');

    try {
        /*
        const [, nlsConfig] = await Promise.all([
            mkdirpIgnoreError(codeCachePath),
            resolveNlsConfiguration()
        ]);
        */
        await startup(/*codeCachePath, nlsConfig*/);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Main startup routine
 */
async function startup(/*codeCachePath: string | undefined, nlsConfig: INLSConfiguration*/): Promise<void> {
    //process.env['CDSUITE_NLS_CONFIG'] = JSON.stringify(nlsConfig);
    //process.env['CDSUITE_CODE_CACHE_PATH'] = codeCachePath || '';

    // Bootstrap ESM
    await bootstrapESM();

    // Load Main
    await import('./cd/suite/electron-main/main.js');
    //perf.mark('code/didRunMainBundle');
}
