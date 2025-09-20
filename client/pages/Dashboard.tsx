import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const orgDisplay = (org: string | null) =>
  org === "vighneshwar"
    ? "Vighneshwar Traders"
    : org === "rohit"
    ? "Rohit Enterprises"
    : "Your Business";

export default function Dashboard() {
  const [params] = useSearchParams();
  const org = useMemo(() => params.get("org"), [params]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Welcome, {orgDisplay(org)}</CardTitle>
          <CardDescription>
            Your workspace is ready. Invoices, customers, and reports will live here with strict separation per business.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Button className="justify-start" variant="secondary">Invoices</Button>
          <Button className="justify-start" variant="secondary">Customers</Button>
          <Button className="justify-start" variant="secondary">Reports</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>Connect storage & enable PDF generation</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Configure cloud storage (Supabase or Netlify/Vercel) to save generated invoices.</p>
          <p>Add customer memory to auto-suggest addresses and GSTIN from past entries.</p>
        </CardContent>
      </Card>
    </div>
  );
}
