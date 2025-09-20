import { Customer, DataAdapter, Invoice, NumberingSettings, Org, computeTotals } from "./types";

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

function now() { return Date.now(); }

function defaultNumbering(org: Org): NumberingSettings {
  const year = new Date().getFullYear();
  return {
    org,
    series: org === "rohit" ? "RE-" : "VT-",
    pad: 3,
    year,
    next: 1,
  };
}

function withYearPrefix(n: NumberingSettings): string {
  return `${n.series}${n.year}-`;
}

export const LocalAdapter: DataAdapter = {
  async listCustomers(org) {
    return read<Customer[]>(key(`${org}:customers`), []).sort((a,b)=>b.createdAt-a.createdAt);
  },
  async saveCustomer(c) {
    const id = c.id ?? crypto.randomUUID();
    const item: Customer = { id, createdAt: now(), ...c } as Customer;
    const k = key(`${item.org}:customers`);
    const all = read<Customer[]>(k, []);
    const idx = all.findIndex((x)=>x.id===id);
    if (idx>=0) all[idx]=item; else all.unshift(item);
    write(k, all);
    return item;
  },

  async listInvoices(org) {
    return read<Invoice[]>(key(`${org}:invoices`), []).sort((a,b)=>b.createdAt-a.createdAt);
  },
  async saveInvoice(i) {
    const k = key(`${i.org}:invoices`);
    const all = read<Invoice[]>(k, []);

    // numbering
    let num = i.number;
    let numbering = read<NumberingSettings>(key(`${i.org}:numbering`), defaultNumbering(i.org));
    const prefix = withYearPrefix(numbering);
    if (!num) {
      if (numbering.year !== new Date().getFullYear()) {
        numbering.year = new Date().getFullYear();
        numbering.next = 1;
      }
      num = `${prefix}${String(numbering.next).padStart(numbering.pad, "0")}`;
      numbering.next += 1;
      write(key(`${i.org}:numbering`), numbering);
    }

    const totals = i.totals ?? computeTotals(i.items, i.taxType, i.taxRate);
    const id = i.id ?? crypto.randomUUID();
    const inv: Invoice = { id, number: num!, totals, createdAt: now(), ...i } as Invoice;

    const idx = all.findIndex((x)=>x.id===id);
    if (idx>=0) all[idx]=inv; else all.unshift(inv);
    write(k, all);
    return inv;
  },

  async getNumbering(org) {
    return read<NumberingSettings>(key(`${org}:numbering`), defaultNumbering(org));
  },
  async incrementNumber(org) {
    const cur = await this.getNumbering(org);
    const year = new Date().getFullYear();
    if (cur.year !== year) { cur.year = year; cur.next = 1; }
    cur.next += 1;
    write(key(`${org}:numbering`), cur);
    return cur;
  },
};
