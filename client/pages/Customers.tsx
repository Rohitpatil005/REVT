import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocalAdapter } from "@/lib/data/local";
import { Customer, Org } from "@/lib/data/types";

function useOrg(): Org { const [p]=useSearchParams(); return (p.get("org") as Org) || "rohit"; }

export default function Customers() {
  const org = useOrg();
  const nav = useNavigate();
  const [list, setList] = useState<Customer[]>([]);
  const [form, setForm] = useState<Partial<Customer>>({ org, name: "" });

  useEffect(()=>{ LocalAdapter.listCustomers(org).then(setList); },[org]);

  async function save() {
    if (!form.name) return;
    const c = await LocalAdapter.saveCustomer({ org, name: form.name!, address: form.address, gstin: form.gstin, state: form.state, id: undefined });
    setList((l)=>[c,...l]);
    setForm({ org, name: "" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Shared memory used by invoices</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex gap-2">
            <Button variant={org==="rohit"?"default":"outline"} onClick={()=>nav("/customers?org=rohit")}>Rohit</Button>
            <Button variant={org==="vighneshwar"?"default":"outline"} onClick={()=>nav("/customers?org=vighneshwar")}>Vighneshwar</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input placeholder="Name" value={form.name ?? ""} onChange={(e)=>setForm({...form, name: e.target.value})}/>
            <Input placeholder="GSTIN" value={form.gstin ?? ""} onChange={(e)=>setForm({...form, gstin: e.target.value})}/>
            <Input placeholder="State" value={form.state ?? ""} onChange={(e)=>setForm({...form, state: e.target.value})}/>
            <Input className="sm:col-span-2" placeholder="Address" value={form.address ?? ""} onChange={(e)=>setForm({...form, address: e.target.value})}/>
          </div>
          <div>
            <Button onClick={save}>Add customer</Button>
          </div>
          <div className="space-y-2">
            {list.length===0 && <div className="text-sm text-muted-foreground">No customers yet.</div>}
            {list.map((c)=> (
              <div key={c.id} className="rounded-md border p-3">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.gstin || "GSTIN N/A"} · {c.state || "State N/A"}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Numbering</CardTitle>
          <CardDescription>Auto series per business</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Series defaults: RE-YYYY-001 and VT-YYYY-001. Will reset each year and increment automatically.
        </CardContent>
      </Card>
    </div>
  );
}
