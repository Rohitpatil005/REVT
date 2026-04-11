import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { LocalAdapter } from "@/lib/data/local";
import {
  Customer,
  Invoice,
  InvoiceItem,
  Org,
  Product,
  TaxType,
  computeTotals,
  INR,
} from "@/lib/data/types";
import { Orgs } from "@/lib/orgs";
import InvoicePrint from "@/components/invoice/InvoicePrint";
import { useAuthContext } from "@/hooks/FirebaseAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { saveInvoiceMetadata } from "../../utils/firestore";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { invoicePdfFileName } from "@/lib/fileName";
import { savePdfViaIpc } from "@/lib/electronApi";
import { savePdfToAppFolder } from "@/utils/nativeBridge";


function useOrg(): Org {
  const [params] = useSearchParams();
  const org = (params.get("org") as Org) || "rohit";
  return org;
}

export default function Invoices() {
  const org = useOrg();
  const nav = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [list, setList] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [pdfTargetInv, setPdfTargetInv] = useState<Invoice | null>(null);

  useEffect(() => {
    LocalAdapter.listCustomers(org).then(setCustomers);
    LocalAdapter.listInvoices(org).then(setList);
    LocalAdapter.listProducts(org).then(setProducts);
    LocalAdapter.getNumbering(org).then((n) => {
      const yy1 = String(n.year % 100).padStart(2, "0");
      const yy2 = String((n.year + 1) % 100).padStart(2, "0");
      const suggested = `${n.series}/${yy1}-${yy2}/${String(n.next).padStart(n.pad, "0")}`;
      setInvoiceNumber(suggested);
    });
  }, [org]);

  const [sp] = useSearchParams();
  const editParam = sp.get("edit");
  useEffect(() => {
    if (!editParam) return;
    const inv = list.find((x) => x.id === editParam);
    if (inv) loadForEdit(inv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, list]);

  // form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxType, setTaxType] = useState<TaxType>("intra");
  const [taxRate, setTaxRate] = useState(18);
  const [customer, setCustomer] = useState<Partial<Customer>>({
    org,
    name: "",
  });
  const [shipTo, setShipTo] = useState<Partial<Customer>>({ org, name: "" });
  const [shipCode, setShipCode] = useState<string>("");
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      productName: "",
      packages: 1,
      quantityPer: 1,
      qty: 1,
      rate: 0,
    },
  ]);

  const [freight, setFreight] = useState<number>(0);
  const totals = useMemo(
    () => computeTotals(items, taxType, taxRate, freight || 0),
    [items, taxType, taxRate, freight],
  );
  const [meta, setMeta] = useState({
    transportMode: "By Road",
    vehicleNo: "",
    poNo: "",
    poDate: "",
    dateOfSupply: date,
    lrNo: "",
    paymentTerm: "15",
    dueDate: "",
    stamped: false,
  });
  const [editing, setEditing] = useState<Invoice | null>(null);
  const shipAddressMemory = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.address) set.add(c.address);
    });
    list.forEach((inv) => {
      if (inv.customer?.address) set.add(inv.customer.address);
      if (inv.shipping?.address) set.add(inv.shipping.address);
    });
    return Array.from(set);
  }, [customers, list]);
  const shipNameMemory = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    list.forEach((inv) => {
      if (inv.shipping?.name) set.add(inv.shipping.name);
      if (inv.customer?.name) set.add(inv.customer.name);
    });
    return Array.from(set);
  }, [customers, list]);
  const grand = useMemo(() => {
    const base = totals.total;
    const round = Math.round(base) - base;
    return { base, round, final: base + round };
  }, [totals]);

  useEffect(() => {
    function addDaysISO(iso: string, days: number) {
      const d = new Date(iso + "T00:00:00");
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    }
    const raw = (meta.paymentTerm ?? "").trim().toLowerCase();
    const isNumeric = /^\d+$/.test(raw);
    let nextDue = date;
    if (isNumeric) {
      nextDue = addDaysISO(date, parseInt(raw, 10));
    } else if (
      raw === "advance" ||
      raw === "immediate" ||
      raw === "immediately"
    ) {
      nextDue = date;
    }
    if (meta.dueDate !== nextDue) setMeta({ ...meta, dueDate: nextDue });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, meta.paymentTerm]);

  useEffect(() => {
    const my = Orgs[org]?.gstin?.match(/^(\d{2})/);
    const their = (customer.gstin || "").match(/^(\d{2})/);
    if (my && their) {
      const next: TaxType = my[1] === their[1] ? "intra" : "inter";
      if (next !== taxType) setTaxType(next);
    }
    // only respond to org or customer's gst changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, customer.gstin]);

  function setItem(idx: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addRow() {
    setItems((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        productName: "",
        packages: 1,
        quantityPer: 1,
        qty: 1,
        rate: 0,
      },
    ]);
  }
  function removeRow(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
  }

  function onPickCustomer(id: string) {
    const c = customers.find((x) => x.id === id);
    if (c)
      setCustomer({
        name: c.name,
        address: c.address,
        gstin: c.gstin,
        state: c.state,
        org,
      });
  }
  function autofillCustomerByName(name: string) {
    const c = customers.find((x) => x.name === name);
    if (c) {
      setCustomer({
        org,
        name: c.name,
        address: c.address,
        gstin: c.gstin,
        state: c.state,
      });
      return true;
    }
    return false;
  }
  function autofillShipToByName(name: string) {
    if (!name) return false;
    for (const inv of list) {
      if (inv.shipping?.name === name) {
        let scode = "";
        let sstate = inv.shipping.state || "";
        const m = sstate.match(/^(.*?)(?:\s*-\s*(\d{1,2}))?$/);
        if (m) {
          sstate = m[1].trim();
          scode = m[2] || "";
        }
        setShipTo({
          org,
          name: inv.shipping.name,
          address: inv.shipping.address,
          gstin: inv.shipping.gstin,
          state: sstate,
        });
        setShipCode(scode);
        return true;
      }
    }
    const c = customers.find((x) => x.name === name);
    if (c) {
      let scode = "";
      let sstate = c.state || "";
      const m = sstate.match(/^(.*?)(?:\s*-\s*(\d{1,2}))?$/);
      if (m) {
        sstate = m[1].trim();
        scode = m[2] || "";
      }
      setShipTo({
        org,
        name: c.name,
        address: c.address,
        gstin: c.gstin,
        state: sstate,
      });
      setShipCode(scode);
      return true;
    }
    return false;
  }


  async function generateAndSavePdfLocally(inv: Invoice): Promise<{ saved: boolean; type: 'local' | 'download' }> {
    console.log("[Invoices] ========== generateAndSavePdfLocally STARTED ==========");
    setPdfTargetInv(inv);
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    // Wait a bit for rendering to complete
    await new Promise((r) => setTimeout(r, 100));

    const node = pdfRef.current;
    if (!node) throw new Error("PDF container not ready");
    console.log("[Invoices] PDF container is ready, generating canvas...");

    // Professional print quality (3.0 = 300 DPI)
    const canvas = await html2canvas(node, {
      scale: 3,
      backgroundColor: "#ffffff",
      allowTaint: true,
      useCORS: true,
      logging: false,
      imageTimeout: 0,
    });

    const pdf = new jsPDF("p", "pt", "a4");
    const margin = 24;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - margin * 2;

    const pxPerPt = canvas.width / imgWidth;
    const pageHeightPx = Math.floor((pageHeight - margin * 2) * pxPerPt);

    let offsetPx = 0;
    let pageIndex = 0;
    while (offsetPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetPx);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        offsetPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        sliceCanvas.width,
        sliceHeightPx,
      );
      // Use PNG for lossless quality - no compression artifacts
      const imgData = sliceCanvas.toDataURL("image/png");
      if (pageIndex > 0) pdf.addPage();
      const sliceHeightPt = sliceHeightPx / pxPerPt;
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, sliceHeightPt);
      offsetPx += sliceHeightPx;
      pageIndex += 1;
    }

    const blob = pdf.output("blob");
    const safeName = invoicePdfFileName(inv);

    try {
      console.log("[Invoices] Starting base64 conversion...");
      // Convert blob to base64 for sending to server
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 from data URL
          const base64 = result.split(",")[1];
          console.log("[Invoices] Base64 conversion complete");
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Send to server API to save to Documents/Invoice RE
      console.log(`[Invoices] ✅ About to send PDF to server for saving: ${safeName}`);
      console.log(`[Invoices] Base64 size: ${base64String.length} bytes`);
      console.log(`[Invoices] Org: ${inv.org}`);

      let result;
      try {
        console.log("[Invoices] Saving PDF via IPC/API...");
        result = await savePdfViaIpc(inv.org, safeName, base64String);
        console.log(`[Invoices] ✅ PDF saved successfully:`, result.fullPath);
      } catch (error) {
        console.error("[Invoices] ❌ Failed to save PDF:", error);
        throw error;
      }

      return { saved: true, type: "local" };
    } catch (error) {
      console.error("[Invoices] Server PDF save failed, trying Electron fallback:", error);

      // Fallback: Try Electron native save
      try {
        const file = new File([blob], safeName, { type: "application/pdf" });
        const result = await savePdfToAppFolder(inv.org, file, safeName);
        if (result) {
          console.log(`[Invoices] ✅ PDF saved via Electron:`, result);
          return { saved: true, type: "local" };
        }
      } catch (e) {
        console.error("[Invoices] Electron save also failed:", e);
      }

      // Final fallback: Download via browser if both server and Electron fail
      console.warn("[Invoices] Falling back to browser download");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { saved: true, type: "download" };
    } finally {
      setPdfTargetInv(null);
    }
  }

  async function saveInvoice(saveAsNew: boolean = false): Promise<Invoice | undefined> {
    if (!customer?.name || items.length === 0) return undefined;
    const shipStateCombined = shipCode
      ? `${shipTo.state ?? ""} - ${shipCode}`
      : (shipTo.state ?? "");
    const shipping =
      shipTo.name || shipTo.address || shipTo.gstin || shipTo.state || shipCode
        ? {
            name: shipTo.name || "",
            address: shipTo.address,
            gstin: shipTo.gstin,
            state: shipStateCombined,
          }
        : undefined;
    const inv = await LocalAdapter.saveInvoice({
      org,
      id: saveAsNew ? undefined : editing?.id,
      number: invoiceNumber?.trim() ? invoiceNumber.trim() : undefined,
      date,
      customer: {
        name: customer.name!,
        address: customer.address,
        gstin: customer.gstin,
        state: customer.state,
      },
      shipping,
      items,
      taxType,
      taxRate,
      totals,
      freight,
      meta,
    });

    try {
      const result = await generateAndSavePdfLocally(inv);
      if (result.saved) {
        if (result.type === 'local') {
          toast({
            title: "Success",
            description: "Invoice saved locally to Invoice " + (inv.org === "rohit" ? "RE" : "VT"),
          });
        } else {
          toast({
            title: "Success",
            description: "Invoice PDF downloaded successfully",
          });
        }
      }
    } catch (e: any) {
      console.error("PDF generation/save failed", e);
      toast({
        title: "Error",
        description: "Failed to generate PDF: " + e.message,
        variant: "destructive",
      });
    }

    setList((l) => {
      const idx = l.findIndex((x) => x.id === inv.id);
      if (idx >= 0) {
        const copy = [...l];
        copy[idx] = inv;
        return copy.sort((a, b) => b.createdAt - a.createdAt);
      }
      return [inv, ...l];
    });
    handleNewInvoice();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return inv;
  }

  function handleNewInvoice() {
    setEditing(null);
    setCustomer({ org, name: "", address: "", gstin: "", state: "" });
    setShipTo({ org, name: "", address: "", gstin: "", state: "" });
    setShipCode("");
    setFreight(0);
    setItems([{
      id: crypto.randomUUID(),
      productName: "",
      packages: 1,
      quantityPer: 1,
      qty: 1,
      rate: 0,
    }]);
    LocalAdapter.getNumbering(org).then((n) => {
      const yy1 = String(n.year % 100).padStart(2, "0");
      const yy2 = String((n.year + 1) % 100).padStart(2, "0");
      const suggested = `${n.series}/${yy1}-${yy2}/${String(n.next).padStart(n.pad, "0")}`;
      setInvoiceNumber(suggested);
    });
  }

  async function quickAddCustomer() {
    if (!customer?.name) return;
    const created = await LocalAdapter.saveCustomer({
      org,
      name: customer.name!,
      address: customer.address,
      gstin: customer.gstin,
      state: customer.state,
      id: undefined,
    });
    setCustomers((c) => [created, ...c]);
  }

  function loadForEdit(inv: Invoice) {
    setEditing(inv);
    setInvoiceNumber(inv.number || "");
    setDate(inv.date);
    setTaxType(inv.taxType);
    setTaxRate(inv.taxRate);
    setCustomer({
      org: inv.org,
      name: inv.customer.name,
      address: inv.customer.address,
      gstin: inv.customer.gstin,
      state: inv.customer.state,
    });
    const m = inv.shipping?.state?.match(/^(.*?)(?:\s*-\s*(\d{1,2}))?$/);
    setShipTo({
      org: inv.org,
      name: inv.shipping?.name || "",
      address: inv.shipping?.address || "",
      gstin: inv.shipping?.gstin || "",
      state: m?.[1] ? m![1].trim() : inv.shipping?.state || "",
    });
    setShipCode(m?.[2] || "");
    setItems(
      inv.items.map((x) => ({
        ...x,
        quantityPer:
          x.quantityPer ??
          ((x.packages ?? 0) ? x.qty / (x.packages ?? 1) : undefined),
      })),
    );
    setFreight(inv.freight ?? 0);
    setMeta({
      ...inv.meta,
      paymentTerm: inv?.meta?.paymentTerm ?? "",
      dueDate: inv?.meta?.dueDate ?? "",
      transportMode: inv?.meta?.transportMode ?? "",
      vehicleNo: inv?.meta?.vehicleNo ?? "",
      poNo: inv?.meta?.poNo ?? "",
      poDate: inv?.meta?.poDate ?? "",
      dateOfSupply: inv?.meta?.dateOfSupply ?? inv.date,
      lrNo: inv?.meta?.lrNo ?? "",
      stamped: inv?.meta?.stamped ?? false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-6">
      <Card className="print:border-0 print:shadow-none print:bg-transparent">
        <CardHeader className="screen-only">
          <CardTitle>Create invoice</CardTitle>
          <CardDescription>
            GST-ready totals with {taxType === "intra" ? "CGST/SGST" : "IGST"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 print:p-0">
          <div className="screen-only space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <label className="text-sm">Business</label>
                <div className="flex gap-2">
                  <Button
                    variant={org === "rohit" ? "default" : "outline"}
                    onClick={() => nav("/invoices?org=rohit")}
                  >
                    Rohit
                  </Button>
                  <Button
                    variant={org === "vighneshwar" ? "default" : "outline"}
                    onClick={() => nav("/invoices?org=vighneshwar")}
                  >
                    Vighneshwar
                  </Button>
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Tax</label>
                <div className="flex gap-2">
                  <Button
                    variant={taxType === "intra" ? "secondary" : "outline"}
                    onClick={() => setTaxType("intra")}
                  >
                    Intra (CGST+SGST)
                  </Button>
                  <Button
                    variant={taxType === "inter" ? "secondary" : "outline"}
                    onClick={() => setTaxType("inter")}
                  >
                    Inter (IGST)
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rate %</span>
                  <Input
                    className="w-24"
                    type="number"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value || "0"))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <label className="text-sm">Invoice No.</label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  Auto-suggested; editable.
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm">Customer</label>
              <div className="grid sm:grid-cols-3 gap-2">
                <Input
                  list="custs"
                  placeholder="Select or type"
                  value={customer.name ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!autofillCustomerByName(v))
                      setCustomer({ ...customer, name: v });
                  }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (!autofillCustomerByName(v))
                      setCustomer({ ...customer, name: v });
                  }}
                />
                <datalist id="custs">
                  {customers.map((c, i) => (
                    <option
                      key={c.id ?? `cust-${c.org}-${c.name}-${i}`}
                      value={c.name}
                    />
                  ))}
                </datalist>
                <Input
                  placeholder="GSTIN"
                  value={customer.gstin ?? ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, gstin: e.target.value })
                  }
                />
                <Input
                  placeholder="State"
                  value={customer.state ?? ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, state: e.target.value })
                  }
                />
                <Input
                  className="sm:col-span-3"
                  placeholder="Address"
                  value={customer.address ?? ""}
                  onChange={(e) =>
                    setCustomer({ ...customer, address: e.target.value })
                  }
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Transport Mode"
                  value={meta.transportMode}
                  onChange={(e) =>
                    setMeta({ ...meta, transportMode: e.target.value })
                  }
                />
                <Input
                  placeholder="Vehicle No."
                  value={meta.vehicleNo}
                  onChange={(e) =>
                    setMeta({ ...meta, vehicleNo: e.target.value })
                  }
                />
                <Input
                  placeholder="L. R. No."
                  value={meta.lrNo}
                  onChange={(e) => setMeta({ ...meta, lrNo: e.target.value })}
                />
                <Input
                  placeholder="P. O. No."
                  value={meta.poNo}
                  onChange={(e) => setMeta({ ...meta, poNo: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="P. O. Date"
                  value={meta.poDate}
                  onChange={(e) => setMeta({ ...meta, poDate: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Date Of Supply"
                  value={meta.dateOfSupply}
                  onChange={(e) =>
                    setMeta({ ...meta, dateOfSupply: e.target.value })
                  }
                />
              </div>
              <div>
                <Button variant="ghost" onClick={quickAddCustomer}>
                  Save to memory
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm">Ship to</label>
              <div className="grid sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  list="shipNames"
                  value={shipTo.name ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!autofillShipToByName(v))
                      setShipTo({ ...shipTo, name: v });
                  }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (!autofillShipToByName(v))
                      setShipTo({ ...shipTo, name: v });
                  }}
                />
                <datalist id="shipNames">
                  {shipNameMemory.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <Input
                  placeholder="GSTIN"
                  value={shipTo.gstin ?? ""}
                  onChange={(e) =>
                    setShipTo({ ...shipTo, gstin: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="State"
                    value={shipTo.state ?? ""}
                    onChange={(e) =>
                      setShipTo({ ...shipTo, state: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Code"
                    value={shipCode}
                    onChange={(e) => setShipCode(e.target.value)}
                  />
                </div>
                <Input
                  className="sm:col-span-3"
                  placeholder="Address"
                  list="shipAddrs"
                  value={shipTo.address ?? ""}
                  onChange={(e) =>
                    setShipTo({ ...shipTo, address: e.target.value })
                  }
                />
                <datalist id="shipAddrs">
                  {shipAddressMemory.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm">Items</label>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-base">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3">HSN/SAC</th>
                      <th className="p-3">Packages</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Quantity Per</th>
                      <th className="p-3">Total Qty</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={it.id} className="border-t">
                        <td className="p-3 min-w-[340px]">
                          <Input
                            className="h-12 text-base"
                            list="prods"
                            value={it.productName}
                            onChange={(e) => {
                              const name = e.target.value;
                              const p = products.find((x) => x.name === name);
                              if (p) {
                                const pkgs = items[idx]?.packages ?? 0;
                                const per = items[idx]?.quantityPer ?? 1;
                                setItem(idx, {
                                  productName: p.name,
                                  hsn: p.hsn,
                                  unit: p.unit,
                                  rate: p.rate,
                                  qty: pkgs * per,
                                });
                              } else setItem(idx, { productName: name });
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            className="h-12 text-base"
                            value={it.hsn ?? ""}
                            onChange={(e) =>
                              setItem(idx, { hsn: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-3 w-40">
                          <div className="grid gap-1">
                            <Input
                              className="h-12 text-base"
                              type="number"
                              value={it.packages ?? 0}
                              onChange={(e) => {
                                const pkgs = parseFloat(e.target.value || "0");
                                const per = it.quantityPer ?? 0;
                                setItem(idx, {
                                  packages: pkgs,
                                  qty: pkgs * per,
                                });
                              }}
                            />
                            <Input
                              className="h-10 text-sm"
                              placeholder="Type (e.g., Roll)"
                              value={it.packageType ?? ""}
                              onChange={(e) =>
                                setItem(idx, { packageType: e.target.value })
                              }
                              list="packageTypes"
                            />
                          </div>
                        </td>
                        <td className="p-3 w-56">
                          <Input
                            className="h-12 text-base"
                            value={it.unit ?? ""}
                            onChange={(e) =>
                              setItem(idx, { unit: e.target.value })
                            }
                            list="unitTypes"
                          />
                        </td>
                        <td className="p-3 w-56">
                          <Input
                            className="h-12 text-base"
                            type="number"
                            value={it.quantityPer ?? 0}
                            onChange={(e) => {
                              const per = parseFloat(e.target.value || "0");
                              const pkgs = it.packages ?? 0;
                              setItem(idx, {
                                quantityPer: per,
                                qty: per * pkgs,
                              });
                            }}
                          />
                        </td>
                        <td className="p-3 w-56">
                          <Input
                            className="h-12 text-base"
                            type="number"
                            value={it.qty}
                            disabled
                          />
                        </td>
                        <td className="p-3 w-56">
                          <Input
                            className="h-12 text-base"
                            type="number"
                            value={it.rate}
                            onChange={(e) =>
                              setItem(idx, {
                                rate: parseFloat(e.target.value || "0"),
                              })
                            }
                          />
                        </td>
                        <td className="p-3 text-right">
                          {INR(it.qty * it.rate)}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => removeRow(it.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <datalist id="prods">
                {products.map((p, i) => (
                  <option
                    key={p.id ?? `prod-${p.org}-${p.name}-${i}`}
                    value={p.name}
                  />
                ))}
              </datalist>
              <datalist id="unitTypes">
                <option value="Sq. Mtr" />
                <option value="Sq. Ft." />
                <option value="Ltr." />
                <option value="KG." />
                <option value="RMtr." />
                <option value="Nos." />
                <option value="Sheets" />
              </datalist>
              <datalist id="packageTypes">
                <option value="Roll" />
                <option value="Sheets" />
                <option value="Drum" />
                <option value="Box" />
                <option value="BDL" />
                <option value="Nos." />
              </datalist>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={addRow}>
                  Add item
                </Button>
                <div className="text-sm text-muted-foreground">
                  Subtotal: {INR(totals.subtotal)}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Card className="sm:col-span-2">
                <CardContent className="p-4 grid gap-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{INR(totals.subtotal)}</span>
                  </div>
                  {taxType === "intra" && (
                    <>
                      <div className="flex justify-between">
                        <span>CGST ({(taxRate / 2).toFixed(1)}%)</span>
                        <span>{INR(totals.cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({(taxRate / 2).toFixed(1)}%)</span>
                        <span>{INR(totals.sgst)}</span>
                      </div>
                    </>
                  )}
                  {taxType === "inter" && (
                    <div className="flex justify-between">
                      <span>IGST ({taxRate}%)</span>
                      <span>{INR(totals.igst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Freight</span>
                    <span>{INR(freight || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Round Off</span>
                    <span>{grand.round.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{INR(grand.final)}</span>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-2 content-start">
                <div className="grid gap-1">
                  <label className="text-sm">Freight</label>
                  <Input
                    type="number"
                    value={freight}
                    onChange={(e) =>
                      setFreight(parseFloat(e.target.value || "0"))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Payment Term</label>
                  <Input
                    placeholder="e.g. 15, advance, immediate"
                    value={meta.paymentTerm ?? ""}
                    onChange={(e) =>
                      setMeta({ ...meta, paymentTerm: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Due Date</label>
                  <Input type="date" value={meta.dueDate} disabled />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm flex items-center justify-between">
                    Stamped invoice
                    <Switch
                      checked={!!meta.stamped}
                      onCheckedChange={(v) =>
                        setMeta({ ...meta, stamped: !!v })
                      }
                    />
                  </label>
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => saveInvoice(false)}>
                      Update Current
                    </Button>
                    <Button className="flex-1" variant="secondary" onClick={() => saveInvoice(true)}>
                      Save as New
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => saveInvoice(false)}>
                    Save Invoice
                  </Button>
                )}
                {editing && (
                  <Button variant="ghost" onClick={handleNewInvoice}>
                    Clear Form (New)
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!customer.name) {
                      alert("Please fill in customer name before printing");
                      return;
                    }
                    setPdfTargetInv(null);
                    setTimeout(() => window.print(), 1500);
                  }}
                >
                  Print
                </Button>
              </div>
            </div>
          </div>

          {/* Offscreen render for PDF capture */}
          <div
            className="screen-only"
            style={{
              position: "absolute",
              left: -10000,
              top: 0,
              width: 794,
              background: "#fff",
            }}
          >
            <div ref={pdfRef}>
              {pdfTargetInv && <InvoicePrint invoice={pdfTargetInv} />}
            </div>
          </div>

          <div className="print-only" style={{ padding: 0, margin: 0, background: "white" }}>
            {pdfTargetInv ? (
              <InvoicePrint invoice={pdfTargetInv} />
            ) : editing ? (
              <InvoicePrint invoice={editing} />
            ) : (
              <InvoicePrint
                invoice={
                  {
                    id: "preview",
                    org,
                    number: invoiceNumber?.trim() || "PREVIEW",
                    date,
                    customer: {
                      name: customer.name || "",
                      address: customer.address,
                      gstin: customer.gstin,
                      state: customer.state,
                    },
                    shipping:
                      shipTo.name ||
                      shipTo.address ||
                      shipTo.gstin ||
                      shipTo.state ||
                      shipCode
                        ? {
                            name: shipTo.name || customer.name || "",
                            address: shipTo.address ?? customer.address,
                            gstin: shipTo.gstin ?? customer.gstin,
                            state: shipCode
                              ? `${shipTo.state ?? ""} - ${shipCode}`
                              : (shipTo.state ?? customer.state),
                          }
                        : undefined,
                    items,
                    taxType,
                    taxRate,
                    totals,
                    freight,
                    meta,
                    createdAt: Date.now(),
                  } as unknown as Invoice
                }
              />
            )}
          </div>

          <div className="screen-only">
            <div className="grid gap-2 mt-6">
              <label className="text-sm">Recent invoices</label>
              <div className="grid gap-2">
                {list.slice(0, 10).map((inv, i) => {
                  const key = `${inv.id || `inv-${inv.org}-${inv.number}-${i}`}-${inv.createdAt || i}`;

                  async function handleRemove() {
                    if (!confirm(`Delete invoice ${inv.number}?`)) return;
                    try {
                      await LocalAdapter.deleteInvoice(inv.org, inv.id);
                      setList((l) => l.filter((x) => x.id !== inv.id));
                    } catch (e: any) {
                      alert(e?.message || "Failed to delete");
                    }
                  }
                  return (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md p-2"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{inv.number}</div>
                        <div className="text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString()} •{" "}
                          {inv.customer.name} • {INR(inv.totals.total)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => loadForEdit(inv)}
                        >
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={handleRemove}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
