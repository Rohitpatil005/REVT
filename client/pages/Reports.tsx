import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocalAdapter } from "@/lib/data/local";
import { Invoice, Org, INR } from "@/lib/data/types";
import { Orgs } from "@/lib/orgs";
import { removeFile } from "../../utils/supabaseStorage";
import { invoicePdfFileName } from "@/lib/fileName";

function useOrg(): Org {
  const [p] = useSearchParams();
  return (p.get("org") as Org) || "rohit";
}

export default function Reports() {
  const org = useOrg();
  const nav = useNavigate();
  const [list, setList] = useState<Invoice[]>([]);
  useEffect(() => {
    LocalAdapter.listInvoices(org).then(setList);
  }, [org]);

  const byMonth = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const inv of list) {
      const d = new Date(inv.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[k] = map[k] || { total: 0, count: 0 };
      map[k].total += inv.totals.total;
      map[k].count += 1;
    }
    const entries = Object.entries(map).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    return entries;
  }, [list]);

  return (
    <div className="grid gap-6">
      <div className="flex gap-2">
        <Button
          variant={org === "rohit" ? "default" : "outline"}
          onClick={() => nav("/reports?org=rohit")}
        >
          Rohit
        </Button>
        <Button
          variant={org === "vighneshwar" ? "default" : "outline"}
          onClick={() => nav("/reports?org=vighneshwar")}
        >
          Vighneshwar
        </Button>
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
                {byMonth.length === 0 && (
                  <tr key="empty-month">
                    <td className="p-3 text-muted-foreground" colSpan={3}>
                      No data
                    </td>
                  </tr>
                )}
                {byMonth.map(([m, v]) => (
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
      <Card>
        <CardHeader>
          <CardTitle>Saved invoices</CardTitle>
          <CardDescription>Latest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No invoices yet.
            </div>
          )}
          {list.map((inv, i) => {
            const msg = `Invoice ${inv.number}\nDate: ${new Date(inv.date).toLocaleDateString()}\nTo: ${inv.customer.name}\nTotal: ${INR(inv.totals.total)}\nFrom: ${Orgs[inv.org].name}`;
            const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            const mail = `mailto:?subject=${encodeURIComponent(`Invoice ${inv.number} from ${Orgs[inv.org].name}`)}&body=${encodeURIComponent(msg)}`;
            const key = `${inv.id || `${inv.org}-${inv.number}-${inv.date}`}-${inv.createdAt || i}`;
            async function handleRemove() {
              if (!confirm(`Delete invoice ${inv.number}?`)) return;
              try {
                await LocalAdapter.deleteInvoice(inv.org, inv.id);
                const fileName = invoicePdfFileName(inv);
                try { await removeFile(inv.org, fileName); } catch {}
                setList((l) => l.filter((x) => x.id !== inv.id));
              } catch (e: any) {
                alert(e?.message || "Failed to delete");
              }
            }
            return (
              <div
                key={key}
                className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="text-sm">
                  <div className="font-medium">{inv.number}</div>
                  <div className="text-muted-foreground">
                    {new Date(inv.date).toLocaleDateString()} · {inv.customer.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium min-w-24 text-right">
                    {INR(inv.totals.total)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        nav(`/invoices?org=${inv.org}&edit=${inv.id}`)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(wa, "_blank")}
                    >
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = mail)}
                    >
                      Email
                    </Button>
                    <Button variant="destructive" onClick={handleRemove}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
