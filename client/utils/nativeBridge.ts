declare global {
  interface Window {
    electron?: {
      savePdf: (
        org: string,
        fileName: string,
        arrayBuffer: ArrayBuffer,
      ) => Promise<{ fullPath: string }>;
      readFile: (fullPath: string) => Promise<{ base64: string }>;
    };
  }
}

export const isElectron = () =>
  typeof window !== "undefined" && !!window.electron;

export async function savePdfToAppFolder(
  org: string,
  file: File,
  fileName: string,
): Promise<string | null> {
  if (!isElectron()) {
    console.warn("Not running in Electron app - PDF cannot be saved to local folder");
    return null;
  }

  if (!window.electron?.savePdf) {
    console.error("window.electron.savePdf is not available");
    throw new Error("Electron bridge not initialized");
  }

  try {
    const buf = await file.arrayBuffer();
    console.log(`Attempting to save PDF: ${fileName} to org: ${org}`);
    const res = await window.electron.savePdf(org, fileName, buf);
    console.log(`PDF saved successfully at: ${res.fullPath}`);
    return res.fullPath;
  } catch (error) {
    console.error("Failed to save PDF:", error);
    throw error;
  }
}

export async function readFileFromPath(fullPath: string): Promise<Blob | null> {
  if (!isElectron() || !window.electron?.readFile) return null;
  const { base64 } = await window.electron.readFile(fullPath);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "application/pdf" });
}
