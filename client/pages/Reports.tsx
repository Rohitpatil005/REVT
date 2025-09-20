import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalAdapter } from "@/lib/data/local";
import { Invoice, Org, INR } from "@/lib/data/types";

function useOrg(): Org { const [p]=useSearchParams(); return (p.get("org") as Org) || "rohit"; }

export default function Reports() {
  const org = useOrg();
  const nav = useNavigate();
  const [list, setList] = useState<Invoice[]>([]);
  useEffect(()=>{ LocalAdapter.listInvoices(org).then(setList); },[org]);

  const byMonth = useMemo(()=>{
    const map: Record<string, {total:number; count:number}> = {};
    for (const inv of list) {
      const d = new Date(inv.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      map[k] = map[k] || { total:0, count:0 };
      map[k].total += inv.totals.total;
      map[k].count += 1;
    }
    const entries = Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
    return entries;
  },[list]);

  return (
    <div className="grid gap-6">
      <div className="flex gap-2">
        <Button variant={org==="rohit"?"default":"outline"} onClick={()=>nav("/reports?org=rohit")}>Rohit</Button>
        <Button variant={org==="vighneshwar"?"default":"outline"} onClick={()=>nav("/reports?org=vighneshwar")}>Vighneshwar</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sales by month</CardTitle>
          <CardDescription>Totals per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-right">Invoices</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.length===0 && (
                  <tr><td className="p-3 text-muted-foreground" colSpan={3}>No data</td></tr>
                )}
                {byMonth.map(([m, v])=> (
                  <tr key={m} className="border-t">
                    <td className="p-2">{m}</td>
                    <td className="p-2 text-right">{v.count}</td>
                    <td className="p-2 text-right">{INR(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
