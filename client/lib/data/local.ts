import {
  Customer,
  DataAdapter,
  Invoice,
  NumberingSettings,
  Org,
  Product,
  computeTotals,
} from "./types";

const NS = "rbs"; // namespace

function key(path: string) {
  return `${NS}:${path}`;
}

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
}

function now() {
  return Date.now();
}

function fyStartYear(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0=Jan
  return m >= 3 ? y : y - 1; // FY starts in April (month 3)
}
function two(n: number): string {
  return String(n % 100).padStart(2, "0");
}
function defaultNumbering(org: Org): NumberingSettings {
  const year = fyStartYear(new Date());
  return {
    org,
    series: org === "rohit" ? "RE" : "VT",
    pad: 3,
    year,
    next: 1,
  };
}

function withFyPrefix(n: NumberingSettings): string {
  return `${n.series}/${two(n.year)}-${two(n.year + 1)}/`;
}

export const LocalAdapter: DataAdapter = {
  async listCustomers(org) {
    const all = read<Customer[]>(key(`${org}:customers`), []);
    // Ensure all customers have IDs (migration for customers without IDs)
    const withIds = all.map((c) => ({
      ...c,
      id: c.id || crypto.randomUUID(),
    }));
    // If any were missing IDs, save the fixed list back
    if (withIds.some((c, i) => c.id !== all[i].id)) {
      write(key(`${org}:customers`), withIds);
    }
    return withIds.sort((a, b) => b.createdAt - a.createdAt);
  },
  async saveCustomer(c) {
    const id = c.id ?? crypto.randomUUID();
    const item: Customer = { id, createdAt: now(), ...c } as Customer;
    const k = key(`${item.org}:customers`);
    const all = read<Customer[]>(k, []);
    const idx = all.findIndex((x) => x.id === id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    write(k, all);
    return item;
  },

  async listProducts(org) {
    const all = read<Product[]>(key(`${org}:products`), []);
    // Ensure all products have IDs (migration for products without IDs)
    const withIds = all.map((p) => ({
      ...p,
      id: p.id || crypto.randomUUID(),
    }));
    // If any were missing IDs, save the fixed list back
    if (withIds.some((p, i) => p.id !== all[i].id)) {
      write(key(`${org}:products`), withIds);
    }
    return withIds.sort((a, b) => b.createdAt - a.createdAt);
  },
  async saveProduct(p) {
    const id = p.id ?? crypto.randomUUID();
    const item: Product = { id, createdAt: now(), ...p } as Product;
    const k = key(`${item.org}:products`);
    const all = read<Product[]>(k, []);
    const idx = all.findIndex((x) => x.id === id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    write(k, all);
    return item;
  },

  async listInvoices(org) {
    const all = read<Invoice[]>(key(`${org}:invoices`), []);
    // Deduplicate by ID, keeping the latest version of each invoice
    const seen = new Set<string>();
    const deduped = all
      .sort((a, b) => b.createdAt - a.createdAt) // Sort by newest first
      .filter((inv) => {
        if (seen.has(inv.id)) return false; // Skip if we've already seen this ID
        seen.add(inv.id);
        return true;
      });
    // If deduplication removed items, save the cleaned list back
    if (deduped.length !== all.length) {
      write(key(`${org}:invoices`), deduped);
    }
    return deduped;
  },
  async saveInvoice(i) {
    const k = key(`${i.org}:invoices`);
    const all = read<Invoice[]>(k, []);

    // numbering
    let num = i.number;
    let numbering = read<NumberingSettings>(
      key(`${i.org}:numbering`),
      defaultNumbering(i.org),
    );
    if (!num) {
      const d = i.date ? new Date(i.date + "T00:00:00") : new Date();
      const fy = fyStartYear(d);
      if (numbering.year !== fy) {
        numbering.year = fy;
        numbering.next = 1;
      }
      const prefix = withFyPrefix(numbering);
      num = `${prefix}${String(numbering.next).padStart(numbering.pad, "0")}`;
      numbering.next += 1;
      write(key(`${i.org}:numbering`), numbering);
    }

    const totals =
      i.totals ?? computeTotals(i.items, i.taxType, i.taxRate, i.freight ?? 0);
    const id = i.id ?? crypto.randomUUID();
    const inv: Invoice = {
      id,
      number: num!,
      totals,
      createdAt: now(),
      freight: i.freight ?? 0,
      meta: i.meta,
      ...i,
    } as Invoice;

    const idx = all.findIndex((x) => x.id === id);
    if (idx >= 0) all[idx] = inv;
    else all.unshift(inv);
    write(k, all);
    return inv;
  },

  async getNumbering(org) {
    const existing = read<NumberingSettings>(
      key(`${org}:numbering`),
      defaultNumbering(org),
    );
    // Ensure fiscal-year alignment for suggestions
    const fy = fyStartYear(new Date());
    if (existing.year !== fy) {
      existing.year = fy;
      existing.next = 1;
      write(key(`${org}:numbering`), existing);
    }
    return existing;
  },
  async incrementNumber(org) {
    const cur = await this.getNumbering(org);
    const fy = fyStartYear(new Date());
    if (cur.year !== fy) {
      cur.year = fy;
      cur.next = 1;
    }
    cur.next += 1;
    write(key(`${org}:numbering`), cur);
    return cur;
  },

  async deleteInvoice(org, id) {
    const k = key(`${org}:invoices`);
    const all = read<Invoice[]>(k, []);
    const next = all.filter((x) => x.id !== id);
    write(k, next);
  },

  async deleteCustomer(org, id) {
    const k = key(`${org}:customers`);
    const all = read<Customer[]>(k, []);
    const filtered = all.filter((x) => x.id !== id);
    write(k, filtered);
  },

  async deleteProduct(org, id) {
    const k = key(`${org}:products`);
    const all = read<Product[]>(k, []);
    const filtered = all.filter((x) => x.id !== id);
    write(k, filtered);
  },
};
