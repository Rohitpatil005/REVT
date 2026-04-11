import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocalAdapter } from "@/lib/data/local";
import { Customer, Org, Invoice, INR } from "@/lib/data/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

function useOrg(): Org {
  const [p] = useSearchParams();
  return (p.get("org") as Org) || "rohit";
}

export default function Customers() {
  const org = useOrg();
  const nav = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<Customer[]>([]);
  const [form, setForm] = useState<Partial<Customer>>({ org, name: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  useEffect(() => {
    LocalAdapter.listCustomers(org).then(setList);
  }, [org]);

  async function save() {
    if (!form.name) return;
    const c = await LocalAdapter.saveCustomer({
      org,
      name: form.name!,
      address: form.address,
      gstin: form.gstin,
      state: form.state,
      id: editing || undefined,
    });
    setList((l) => {
      if (editing) {
        return l.map((x) => (x.id === editing ? c : x));
      }
      if (l.find((x) => x.name === c.name)) return l;
      return [c, ...l];
    });
    setForm({ org, name: "" });
    setEditing(null);
  }

  function startEdit(c: Customer) {
    setEditing(c.id || null);
    setForm(c);
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Delete this customer?")) return;
    try {
      await LocalAdapter.deleteCustomer(org, id);
      setList((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      alert("Failed to delete");
    }
  }

  async function viewBills(c: Customer) {
    setSelectedCustomer(c);
    setIsLoadingInvoices(true);
    try {
      const allInvoices = await LocalAdapter.listInvoices(org);
      const custInvoices = allInvoices.filter((inv) => inv.customer.name === c.name);
      setCustomerInvoices(custInvoices);
    } catch (error) {
      console.error("Failed to load bills:", error);
      toast({
        title: "Error",
        description: "Failed to load customer bills.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  }

  function normalizeColumnName(name: string): string {
    return name?.toLowerCase().trim().replace(/\s+/g, '') || '';
  }

  function findColumn(row: Record<string, any>, possibleNames: string[]): string | undefined {
    const normalizedNames = possibleNames.map(normalizeColumnName);
    const rowKeys = Object.keys(row);

    for (const key of rowKeys) {
      if (normalizedNames.includes(normalizeColumnName(key))) {
        return key;
      }
    }
    return undefined;
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        toast({
          title: "No customers found",
          description: "The Excel file doesn't contain any valid customers.",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Find column names by matching variations
      const firstRow = rows[0];
      const nameCol = findColumn(firstRow, ['name', 'customername', 'customer name']);
      const gstinCol = findColumn(firstRow, ['gstin', 'gst', 'gstno']);
      const stateCol = findColumn(firstRow, ['state', 'statecode']);
      const addressCol = findColumn(firstRow, ['address', 'location', 'city']);

      if (!nameCol) {
        toast({
          title: "Import failed",
          description: "Excel must have a 'Name' column",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      for (const row of rows) {
        const customerName = row[nameCol]?.toString().trim();
        if (!customerName) continue;

        await LocalAdapter.saveCustomer({
          org,
          name: customerName,
          gstin: gstinCol && row[gstinCol] ? String(row[gstinCol]).trim() : undefined,
          state: stateCol && row[stateCol] ? String(row[stateCol]).trim() : undefined,
          address: addressCol && row[addressCol] ? String(row[addressCol]).trim() : undefined,
        });
        successCount++;
      }

      setList(await LocalAdapter.listCustomers(org));
      toast({
        title: "Import successful",
        description: `Imported ${successCount} customer(s) successfully.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import customers",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Shared memory used by invoices</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="mb-4"
            >
              {isImporting ? "Importing..." : "📥 Import from Excel"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={org === "rohit" ? "default" : "outline"}
              onClick={() => nav("/customers?org=rohit")}
            >
              Rohit
            </Button>
            <Button
              variant={org === "vighneshwar" ? "default" : "outline"}
              onClick={() => nav("/customers?org=vighneshwar")}
            >
              Vighneshwar
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input
              placeholder="Name"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="GSTIN"
              value={form.gstin ?? ""}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            />
            <Input
              placeholder="State"
              value={form.state ?? ""}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Address"
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Button onClick={save}>{editing ? "Update customer" : "Add customer"}</Button>
            {editing && (
              <Button variant="ghost" onClick={() => { setEditing(null); setForm({ org, name: "" }); }} className="ml-2">
                Cancel
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {list.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No customers yet.
              </div>
            )}
            {list.map((c, i) => (
              <div
                key={c.id ?? `cust-${c.org}-${c.name}-${i}`}
                className="rounded-md border p-3 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.gstin || "GSTIN N/A"} · {c.state || "State N/A"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => viewBills(c)}>
                    View Bills
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCustomer(c.id!)}>
                    Delete
                  </Button>
                </div>
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
          Series defaults: RE-YYYY-001 and VT-YYYY-001. Will reset each year and
          increment automatically.
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name} - Bills</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            {isLoadingInvoices ? (
              <div className="text-center py-8 text-muted-foreground">Loading bills...</div>
            ) : customerInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bills found for this customer.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium">Total Billed Amount</div>
                  <div className="text-xl font-bold text-primary">
                    {INR(customerInvoices.reduce((sum, inv) => sum + inv.totals.total, 0))}
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.number}</TableCell>
                          <TableCell>{inv.date}</TableCell>
                          <TableCell className="text-right">{INR(inv.totals.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}