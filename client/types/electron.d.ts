declare global {
  interface Window {
    electronAPI?: {
      saveInvoicePDF: (org: string, fileName: string, data: Uint8Array) => Promise<string>;
      openInvoicesFolder?: (org: string) => Promise<void>;
    };
  }
}
export {};
