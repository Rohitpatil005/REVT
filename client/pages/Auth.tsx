import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const orgDisplay = (org: string | null) =>
  org === "vighneshwar"
    ? "Vighneshwar Traders"
    : org === "rohit"
    ? "Rohit Enterprises"
    : "Your Business";

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const org = useMemo(() => params.get("org"), [params]);

  const go = () => navigate(`/dashboard?org=${org ?? "rohit"}`);

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Choose your business and sign in to manage invoices and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Business</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={org === "rohit" || !org ? "default" : "outline"}
                onClick={() => navigate("/auth?org=rohit")}
              >
                Rohit Enterprises
              </Button>
              <Button
                variant={org === "vighneshwar" ? "default" : "outline"}
                onClick={() => navigate("/auth?org=vighneshwar")}
              >
                Vighneshwar Traders
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Email</label>
            <Input placeholder="you@example.com" type="email" />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Password</label>
            <Input placeholder="••••••••" type="password" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={go}>
              Continue as {orgDisplay(org)}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Free-tier cloud</CardTitle>
          <CardDescription>Supabase, Netlify, or Vercel for storage & APIs</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Start on free tiers and scale later. Object storage for PDFs, simple auth, and serverless functions.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Invoice PDFs in storage buckets</li>
            <li>Row-level security per business</li>
            <li>Serverless for generation & email</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Separation of data</CardTitle>
          <CardDescription>Distinct workspaces per business</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Separate logins, dashboards, and reports for Rohit Enterprises and Vighneshwar Traders.
        </CardContent>
      </Card>
    </div>
  );
}
