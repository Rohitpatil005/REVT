import { readFileFromPath, isElectron } from "./nativeBridge";
import { uploadInvoicePdf } from "../../utils/supabaseStorage";

export type QueuedUpload = {
  org: string;
  fileName: string;
  localPath: string | null;
  createdAt: number;
};

const KEY = "rbs:upload-queue";

function read(): QueuedUpload[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(list: QueuedUpload[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function queueUpload(item: Omit<QueuedUpload, "createdAt">) {
  const list = read();
  list.push({ ...item, createdAt: Date.now() });
  write(list);
}

export async function retryQueuedUploads(): Promise<number> {
  let list = read();
  let success = 0;
  const next: QueuedUpload[] = [];
  for (const it of list) {
    try {
      let blob: Blob | null = null;
      if (it.localPath && isElectron())
        blob = await readFileFromPath(it.localPath);
      if (!blob) throw new Error("Cannot read local file");
      const file = new File([blob], it.fileName, { type: "application/pdf" });
      await uploadInvoicePdf(it.org, it.fileName, file);
      success += 1;
    } catch {
      next.push(it); // keep in queue
    }
  }
  write(next);
  return success;
}

export function onOnlineRetry() {
  window.addEventListener("online", () => {
    retryQueuedUploads();
  });
}
