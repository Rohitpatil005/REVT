export type Org = "rohit" | "vighneshwar";

export interface Customer {
  id: string;
  org: Org;
  name: string;
  address?: string;
  gstin?: string;
  state?: string;
  createdAt: number;
}

export interface Product {
  id: string;
  org: Org;
  name: string;
  hsn?: string;
  unit?: string; // e.g. Sq. Mtr, Roll, BDL
  rate: number; // per unit
  createdAt: number;
}

export type TaxType = "intra" | "inter"; // intra-state (CGST/SGST) vs inter-state (IGST)

export interface InvoiceItem {
  id: string;
  productName: string;
  hsn?: string;
  packages?: number; // No. of packages
  packageType?: string; // e.g. Roll, BDL, Nos
  unit?: string; // e.g. Sq. Mtr
  quantityPer?: number; // quantity per package
  qty: number; // total quantity (packages * quantityPer)
  rate: number; // rate per unit
}

export interface InvoiceTotals {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoiceMeta {
  transportMode?: string;
  vehicleNo?: string;
  poNo?: string;
  poDate?: string;
  dateOfSupply?: string;
  lrNo?: string;
  paymentTerm?: string; // e.g. "15", "advance", "immediate"
  dueDate?: string; // ISO YYYY-MM-DD
  stamped?: boolean; // whether to overlay company stamp on print
}

export interface Invoice {
  id: string;
  org: Org;
  number: string; // e.g. RE-2025-001
  date: string; // ISO
  customer: Pick<Customer, "name" | "address" | "gstin" | "state">;
  shipping?: Pick<Customer, "name" | "address" | "gstin" | "state">;
  items: InvoiceItem[];
  taxType: TaxType;
  taxRate: number; // e.g. 18 for 18%
  totals: InvoiceTotals;
  freight?: number;
  meta?: InvoiceMeta;
  createdAt: number;
}

export interface NumberingSettings {
  org: Org;
  series: string; // prefix without year, e.g. RE-
  pad: number; // digits
  year: number; // current year for reset
  next: number; // next sequence
}

export interface DataAdapter {
  listCustomers(org: Org): Promise<Customer[]>;
  saveCustomer(
    c: Omit<Customer, "id" | "createdAt"> & Partial<Pick<Customer, "id">>,
  ): Promise<Customer>;

  listProducts(org: Org): Promise<Product[]>;
  saveProduct(
    p: Omit<Product, "id" | "createdAt"> & Partial<Pick<Product, "id">>,
  ): Promise<Product>;

  listInvoices(org: Org): Promise<Invoice[]>;
  saveInvoice(
    i: Omit<Invoice, "id" | "createdAt" | "number" | "totals"> &
      Partial<Pick<Invoice, "id" | "number" | "totals">>,
  ): Promise<Invoice>;

  getNumbering(org: Org): Promise<NumberingSettings>;
  incrementNumber(org: Org): Promise<NumberingSettings>;
  deleteInvoice(org: Org, id: string): Promise<void>;
}

export function computeTotals(
  items: InvoiceItem[],
  taxType: TaxType,
  taxRate: number,
  freight: number = 0,
): InvoiceTotals {
  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const taxable = subtotal + (freight || 0);
  const tax = (taxable * taxRate) / 100;
  const half = tax / 2;
  const cgst = taxType === "intra" ? half : 0;
  const sgst = taxType === "intra" ? half : 0;
  const igst = taxType === "inter" ? tax : 0;
  const total = taxable + cgst + sgst + igst;
  return { subtotal, cgst, sgst, igst, total };
}

export const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n,
  );
