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
  // Storage functionality has been removed - this is a no-op
  return 0;
}

export function onOnlineRetry() {
  window.addEventListener("online", () => {
    retryQueuedUploads();
  });
}
