import { Invoice } from "@/lib/data/types";

export function sanitizeFileName(raw: string) {
  return raw
    .replace(/[^a-zA-Z0-9\-_. ]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function invoicePdfFileName(inv: Invoice) {
  const baseName = `${inv.number || inv.id} - ${inv.customer?.name || "Customer"}`;
  return `${sanitizeFileName(baseName)}.pdf`;
}
