const { contextBridge, ipcRenderer } = require("electron");

console.log("[Preload] Script loading...");

try {
  // Expose Electron APIs to renderer process with error handling
  contextBridge.exposeInMainWorld("electron", {
    savePdf: async ({ org, fileName, arrayBuffer }) => {
      try {
        console.log("[Preload] savePdf called:", { org, fileName, arrayBufferSize: arrayBuffer?.byteLength });
        const result = await ipcRenderer.invoke("save-pdf", { org, fileName, arrayBuffer });
        console.log("[Preload] savePdf success:", result);
        return result;
      } catch (error) {
        console.error("[Preload] savePdf failed:", error);
        throw error;
      }
    },
    readFile: async ({ fullPath }) => {
      try {
        console.log("[Preload] readFile called:", { fullPath });
        const result = await ipcRenderer.invoke("read-file", { fullPath });
        console.log("[Preload] readFile success");
        return result;
      } catch (error) {
        console.error("[Preload] readFile failed:", error);
        throw error;
      }
    },
    // Add utility to check if running in Electron
    isElectron: () => true,
    // Add app info
    getAppInfo: async () => {
      return {
        isElectron: true,
        hasPreload: true,
        timestamp: new Date().toISOString(),
      };
    },
  });

  console.log("[Preload] Script loaded successfully");
} catch (error) {
  console.error("[Preload] Failed to expose Electron API:", error);
}
