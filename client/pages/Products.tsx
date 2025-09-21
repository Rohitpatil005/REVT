import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocalAdapter } from "@/lib/data/local";
import type { Org, Product } from "@/lib/data/types";

function useOrg(): Org {
  const [params] = useSearchParams();
  const org = (params.get("org") as Org) || "rohit";
  return org;
}

export default function Products() {
  const org = useOrg();
  const nav = useNavigate();
  const [list, setList] = useState<Product[]>([]);

  const [name, setName] = useState("");
  const [hsn, setHsn] = useState("");
  const [unit, setUnit] = useState("");
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    LocalAdapter.listProducts(org).then(setList);
  }, [org]);

  async function saveProduct() {
    if (!name) return;
    const created = await LocalAdapter.saveProduct({ org, name, hsn, unit, rate, id: undefined });
    setList((p)=>[created, ...p]);
    setName(""); setHsn(""); setUnit(""); setRate(0);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
          <CardDescription>Products are used to quickly fill invoice items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <label className="text-sm">Business</label>
              <div className="flex gap-2">
                <Button variant={org==="rohit"?"default":"outline"} onClick={()=>nav("/products?org=rohit")}>Rohit</Button>
                <Button variant={org==="vighneshwar"?"default":"outline"} onClick={()=>nav("/products?org=vighneshwar")}>Vighneshwar</Button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label className="text-sm">Product name</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. PVC Film 0.10mm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Rate</label>
              <Input type="number" value={rate} onChange={(e)=>setRate(parseFloat(e.target.value||"0"))} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">HSN/SAC</label>
              <Input value={hsn} onChange={(e)=>setHsn(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Unit</label>
              <Input value={unit} onChange={(e)=>setUnit(e.target.value)} placeholder="Sq. Mtr / Roll / BDL" />
            </div>
          </div>

          <div>
            <Button onClick={saveProduct}>Save product</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved products</CardTitle>
          <CardDescription>Latest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length===0 && <div className="text-sm text-muted-foreground">No products yet.</div>}
          {list.map((p, i)=> (
            <div key={`${p.id}-${p.createdAt}-${i}`} className="rounded-md border p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground">{p.unit || "Unit"}{p.unit?" · ":""}{p.hsn || "HSN"}</div>
              </div>
              <div className="text-sm font-medium">₹{p.rate.toFixed(2)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
