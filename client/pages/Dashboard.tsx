import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  const org = useMemo(() => params.get("org") || "rohit", [params]);
  const nav = useNavigate();

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
          <Button className="justify-start" variant="secondary" onClick={() => nav(`/invoices?org=${org}`)}>Invoices</Button>
          <Button className="justify-start" variant="secondary" onClick={() => nav(`/customers?org=${org}`)}>Customers</Button>
          <Button className="justify-start" variant="secondary" onClick={() => nav(`/reports?org=${org}`)}>Reports</Button>
        </CardContent>
      </Card>
    </div>
  );
}
