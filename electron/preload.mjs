import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  saveInvoicePDF: async (org, fileName, data) => {
    return await ipcRenderer.invoke("save-invoice-pdf", { org, fileName, data });
  },
  openInvoicesFolder: async (org) => {
    return await ipcRenderer.invoke("open-invoices-folder", { org });
  },
});
