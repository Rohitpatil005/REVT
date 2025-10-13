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
  if (isElectron() && window.electron?.savePdf) {
    const buf = await file.arrayBuffer();
    const res = await window.electron.savePdf(org, fileName, buf);
    return res.fullPath;
  }
  // Fallback: trigger browser download
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return null;
}

export async function readFileFromPath(fullPath: string): Promise<Blob | null> {
  if (!isElectron() || !window.electron?.readFile) return null;
  const { base64 } = await window.electron.readFile(fullPath);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "application/pdf" });
}
