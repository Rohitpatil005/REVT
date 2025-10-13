import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  savePdf: async (org, fileName, arrayBuffer) => {
    return await ipcRenderer.invoke('save-pdf', { org, fileName, arrayBuffer });
  },
  readFile: async (fullPath) => {
    return await ipcRenderer.invoke('read-file', { fullPath });
  }
});
