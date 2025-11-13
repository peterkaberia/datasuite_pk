(function () {

    const { ipcRenderer, contextBridge } = require('electron');

    //type ISandboxConfiguration = import('../common/sandboxTypes.js').ISandboxConfiguration;

    //const IPC_CHANNELS = require('./ui-utils.js');
    type IUiApi = import('./global.js').IUiApi;
    type PickFileOptions = import('./global.js').PickFileOptions;

    const uiApi: IUiApi = {
        retry: async () => await ipcRenderer.invoke(/*IPC_CHANNELS.RETRY_START_SHINY*/'cdsuite:retry-start-shiny'),
        pickFile: async (opts?: PickFileOptions) => await ipcRenderer.invoke(/*IPC_CHANNELS.PICK_FILE*/'cdsuite:pick-file', opts ?? {})
    };

    try {
        // Expose the API to the renderer process
        contextBridge.exposeInMainWorld('uiApi', uiApi);
    } catch (error) {
        console.error(error);
    }

}());

