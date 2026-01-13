declare global {
  interface Window {
    electron?: {
      savePdf: (
        org: string,
        fileName: string,
        arrayBuffer: ArrayBuffer,
      ) => Promise<{ fullPath: string }>;
      readFile: (fullPath: string) => Promise<{ base64: string }>;
      isElectron?: () => boolean;
      getAppInfo?: () => Promise<any>;
    };
  }
}

export const isElectron = () => {
  try {
    const hasElectron = typeof window !== "undefined" && !!window.electron;
    if (typeof window !== "undefined") {
      const debugInfo = {
        windowExists: !!window,
        electronExists: !!window.electron,
        electronType: typeof window.electron,
        electronIsElectron: window.electron?.isElectron?.(),
        hasElectron,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      console.log("[nativeBridge] Electron bridge check:", debugInfo);

      // Log to window for easier debugging
      (window as any).__electronDebug = debugInfo;
    }
    return hasElectron;
  } catch (error) {
    console.error("[nativeBridge] Error checking Electron:", error);
    return false;
  }
};

export async function savePdfToAppFolder(
  org: string,
  file: File,
  fileName: string,
): Promise<string | null> {
  const electron = isElectron();
  console.log("[nativeBridge] savePdfToAppFolder called", {
    isElectron: electron,
    org,
    fileName,
    fileSize: file.size,
    fileType: file.type,
  });

  if (!electron) {
    console.warn("[nativeBridge] Not running in Electron app - PDF will be downloaded instead");
    return null;
  }

  if (!window.electron?.savePdf) {
    const errorMsg = "window.electron.savePdf is not available";
    console.error("[nativeBridge] " + errorMsg, {
      hasElectron: !!window.electron,
      electronKeys: Object.keys(window.electron || {}),
    });
    throw new Error("Electron bridge not initialized");
  }

  try {
    const buf = await file.arrayBuffer();
    console.log(`[nativeBridge] Attempting to save PDF: ${fileName} to org: ${org} (${buf.byteLength} bytes)`);
    const res = await window.electron.savePdf(org, fileName, buf);
    console.log(`[nativeBridge] PDF saved successfully at: ${res.fullPath}`);
    return res.fullPath;
  } catch (error) {
    console.error("[nativeBridge] Failed to save PDF:", error);
    throw error;
  }
}

export async function readFileFromPath(fullPath: string): Promise<Blob | null> {
  if (!isElectron() || !window.electron?.readFile) return null;
  const { base64 } = await window.electron.readFile(fullPath);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "application/pdf" });
}
