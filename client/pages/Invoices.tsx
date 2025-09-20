import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocalAdapter } from "@/lib/data/local";
import { Customer, Invoice, InvoiceItem, Org, TaxType, computeTotals, INR } from "@/lib/data/types";
import InvoicePrint from "@/components/invoice/InvoicePrint";

function useOrg(): Org {
  const [params] = useSearchParams();
  const org = (params.get("org") as Org) || "rohit";
  return org;
}

export default function Invoices() {
  const org = useOrg();
  const nav = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [list, setList] = useState<Invoice[]>([]);

  useEffect(() => {
    LocalAdapter.listCustomers(org).then(setCustomers);
    LocalAdapter.listInvoices(org).then(setList);
  }, [org]);

  // form state
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
  const [taxType, setTaxType] = useState<TaxType>("intra");
  const [taxRate, setTaxRate] = useState(18);
  const [customer, setCustomer] = useState<Partial<Customer>>({ org, name: "" });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), productName: "", qty: 1, rate: 0 },
  ]);

  const totals = useMemo(() => computeTotals(items, taxType, taxRate), [items, taxType, taxRate]);
  const [freight, setFreight] = useState<number>(0);
  const [meta, setMeta] = useState({ transportMode: "By Road", vehicleNo: "", poNo: "", poDate: "", dateOfSupply: date, lrNo: "", paymentTermDays: 15, dueDate: "" });
  const grand = useMemo(()=>{
    const base = totals.total + (freight||0);
    const round = Math.round(base) - base;
    return { base, round, final: base + round };
  },[totals, freight]);

  function setItem(idx: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addRow() {
    setItems((p)=>[...p, { id: crypto.randomUUID(), productName: "", qty: 1, rate: 0 }]);
  }
  function removeRow(id: string) {
    setItems((p)=>p.filter(x=>x.id!==id));
  }

  function onPickCustomer(id: string) {
    const c = customers.find((x)=>x.id===id);
    if (c) setCustomer({ name: c.name, address: c.address, gstin: c.gstin, state: c.state, org });
  }

  async function saveInvoice() {
    if (!customer?.name || items.length===0) return;
    const inv = await LocalAdapter.saveInvoice({
      org,
      number: undefined,
      date,
      customer: { name: customer.name!, address: customer.address, gstin: customer.gstin, state: customer.state },
      items,
      taxType,
      taxRate,
      totals,
      freight,
      meta,
    });
    setList((l)=>[inv, ...l]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function quickAddCustomer() {
    if (!customer?.name) return;
    const created = await LocalAdapter.saveCustomer({ org, name: customer.name!, address: customer.address, gstin: customer.gstin, state: customer.state, id: undefined });
    setCustomers((c)=>[created, ...c]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create invoice</CardTitle>
          <CardDescription>GST-ready totals with {taxType === "intra" ? "CGST/SGST" : "IGST"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <label className="text-sm">Business</label>
              <div className="flex gap-2">
                <Button variant={org==="rohit"?"default":"outline"} onClick={()=>nav("/invoices?org=rohit")}>Rohit</Button>
                <Button variant={org==="vighneshwar"?"default":"outline"} onClick={()=>nav("/invoices?org=vighneshwar")}>Vighneshwar</Button>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Date</label>
              <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Tax</label>
              <div className="flex gap-2">
                <Button variant={taxType==="intra"?"secondary":"outline"} onClick={()=>setTaxType("intra")}>Intra (CGST+SGST)</Button>
                <Button variant={taxType==="inter"?"secondary":"outline"} onClick={()=>setTaxType("inter")}>Inter (IGST)</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rate %</span>
                <Input className="w-24" type="number" value={taxRate} onChange={(e)=>setTaxRate(parseFloat(e.target.value||"0"))} />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Customer</label>
            <div className="grid sm:grid-cols-3 gap-2">
              <Input list="custs" placeholder="Select or type" value={customer.name ?? ""} onChange={(e)=>setCustomer({...customer, name: e.target.value})} />
              <datalist id="custs">
                {customers.map((c)=> (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <Input placeholder="GSTIN" value={customer.gstin ?? ""} onChange={(e)=>setCustomer({...customer, gstin: e.target.value})} />
              <Input placeholder="State" value={customer.state ?? ""} onChange={(e)=>setCustomer({...customer, state: e.target.value})} />
              <Input className="sm:col-span-3" placeholder="Address" value={customer.address ?? ""} onChange={(e)=>setCustomer({...customer, address: e.target.value})} />
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <Input placeholder="Transport Mode" value={meta.transportMode} onChange={(e)=>setMeta({...meta, transportMode: e.target.value})} />
              <Input placeholder="Vehicle No." value={meta.vehicleNo} onChange={(e)=>setMeta({...meta, vehicleNo: e.target.value})} />
              <Input placeholder="L. R. No." value={meta.lrNo} onChange={(e)=>setMeta({...meta, lrNo: e.target.value})} />
              <Input placeholder="P. O. No." value={meta.poNo} onChange={(e)=>setMeta({...meta, poNo: e.target.value})} />
              <Input type="date" placeholder="P. O. Date" value={meta.poDate} onChange={(e)=>setMeta({...meta, poDate: e.target.value})} />
              <Input type="date" placeholder="Date Of Supply" value={meta.dateOfSupply} onChange={(e)=>setMeta({...meta, dateOfSupply: e.target.value})} />
            </div>
            <div>
              <Button variant="ghost" onClick={quickAddCustomer}>Save to memory</Button>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Items</label>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2">HSN/SAC</th>
                    <th className="p-2">Packages</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Rate</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx)=> (
                    <tr key={it.id} className="border-t">
                      <td className="p-2"><Input value={it.productName} onChange={(e)=>setItem(idx,{productName:e.target.value})}/></td>
                      <td className="p-2"><Input value={it.hsn ?? ""} onChange={(e)=>setItem(idx,{hsn:e.target.value})}/></td>
                      <td className="p-2 w-24"><Input type="number" value={it.packages ?? 0} onChange={(e)=>setItem(idx,{packages:parseFloat(e.target.value||"0")})}/></td>
                      <td className="p-2 w-28"><Input value={it.unit ?? ""} onChange={(e)=>setItem(idx,{unit:e.target.value})}/></td>
                      <td className="p-2 w-24"><Input type="number" value={it.qty} onChange={(e)=>setItem(idx,{qty:parseFloat(e.target.value||"0")})}/></td>
                      <td className="p-2 w-32"><Input type="number" value={it.rate} onChange={(e)=>setItem(idx,{rate:parseFloat(e.target.value||"0")})}/></td>
                      <td className="p-2 text-right">{INR(it.qty*it.rate)}</td>
                      <td className="p-2 text-right"><Button variant="ghost" onClick={()=>removeRow(it.id)}>Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={addRow}>Add item</Button>
              <div className="text-sm text-muted-foreground">Subtotal: {INR(totals.subtotal)}</div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Card className="sm:col-span-2">
              <CardContent className="p-4 grid gap-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{INR(totals.subtotal)}</span></div>
                {taxType==="intra" && (
                  <>
                    <div className="flex justify-between"><span>CGST ({(taxRate/2).toFixed(1)}%)</span><span>{INR(totals.cgst)}</span></div>
                    <div className="flex justify-between"><span>SGST ({(taxRate/2).toFixed(1)}%)</span><span>{INR(totals.sgst)}</span></div>
                  </>
                )}
                {taxType==="inter" && (
                  <div className="flex justify-between"><span>IGST ({taxRate}%)</span><span>{INR(totals.igst)}</span></div>
                )}
                <div className="flex justify-between"><span>Freight</span><span>{INR(freight||0)}</span></div>
                <div className="flex justify-between"><span>Round Off</span><span>{grand.round.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{INR(grand.final)}</span></div>
              </CardContent>
            </Card>
            <div className="grid gap-2 content-start">
              <div className="grid gap-1">
                <label className="text-sm">Freight</label>
                <Input type="number" value={freight} onChange={(e)=>setFreight(parseFloat(e.target.value||"0"))} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Payment Term (days)</label>
                <Input type="number" value={meta.paymentTermDays} onChange={(e)=>setMeta({...meta, paymentTermDays: parseInt(e.target.value||"0")})} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Due Date</label>
                <Input type="date" value={meta.dueDate} onChange={(e)=>setMeta({...meta, dueDate: e.target.value})} />
              </div>
              <Button onClick={saveInvoice}>Save invoice</Button>
              <Button variant="outline" onClick={()=>window.print()}>Print / Save PDF</Button>
            </div>
          </div>

          <div className="print-only">
            <InvoicePrint invoice={{ id: "preview", org, number: "PREVIEW", date, customer: { name: customer.name||"", address: customer.address, gstin: customer.gstin, state: customer.state }, items, taxType, taxRate, totals, freight, meta, createdAt: Date.now() } as unknown as Invoice} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved invoices</CardTitle>
          <CardDescription>Latest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length===0 && <div className="text-sm text-muted-foreground">No invoices yet.</div>}
          {list.map((inv)=> (
            <div key={inv.id} className="rounded-md border p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{inv.number}</div>
                <div className="text-muted-foreground">{new Date(inv.date).toLocaleDateString()} · {inv.customer.name}</div>
              </div>
              <div className="text-sm font-medium">{INR(inv.totals.total + (inv.freight||0))}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
