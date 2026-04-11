/**
 * Electron IPC API utilities
 * Provides a bridge to call IPC handlers when running in Electron
 * Falls back to fetch when running in browser
 */

export interface ElectronApi {
  savePdf: (data: { org: string; fileName: string; arrayBuffer: ArrayBuffer }) => Promise<{ fullPath: string }>;
  readFile: (data: { fullPath: string }) => Promise<{ base64: string }>;
}

// Check if we're running in Electron
export const isElectron = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).electron;
};

// Get the Electron API (set by preload script)
export const getElectronApi = (): ElectronApi | null => {
  if (!isElectron()) return null;
  return (window as any).electron;
};

/**
 * Save PDF using Electron IPC (or fallback to fetch)
 */
export const savePdfViaIpc = async (
  org: string,
  fileName: string,
  base64String: string
): Promise<{ fullPath: string }> => {
  const electronApi = getElectronApi();
  
  if (!electronApi) {
    // Fallback to fetch if not in Electron
    const response = await fetch('/api/save-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org,
        fileName,
        pdfData: base64String,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to save PDF: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Use IPC in Electron (pass as ArrayBuffer instead of base64)
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const result = await electronApi.savePdf({
      org,
      fileName,
      arrayBuffer: bytes.buffer,
    });
    
    console.log('[electronApi] PDF saved via IPC:', result.fullPath);
    return result;
  } catch (error) {
    console.error('[electronApi] Failed to save PDF via IPC:', error);
    throw error;
  }
};
