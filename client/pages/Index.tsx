import AutoFillDemo from "@/components/AutoFillDemo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/10 to-transparent p-8 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Windows-ready · Free-tier cloud
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Unified invoicing for Rohit Enterprises and Vighneshwar Traders
            </h1>
            <p className="text-muted-foreground">
              Generate invoices, store them in the cloud, and get separate dashboards and reports for each business. Auto-fill customer data to save time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth?org=rohit">
                <Button size="lg">Sign in — Rohit Enterprises</Button>
              </Link>
              <Link to="/auth?org=vighneshwar">
                <Button size="lg" variant="outline">Sign in — Vighneshwar Traders</Button>
              </Link>
            </div>
            <div className="text-xs text-muted-foreground">Plan: start with free tiers (Supabase/Netlify/Vercel). Package as a Windows app later with Electron.</div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 opacity-30 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.4),transparent_60%)]" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cloud storage</CardTitle>
                  <CardDescription>Invoices saved safely</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Use object storage buckets to keep invoice PDFs with audit-friendly naming.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Separate workspaces</CardTitle>
                  <CardDescription>Two businesses, two dashboards</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Distinct logins, data, and reports for each brand.
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Auto data fill</CardTitle>
                  <CardDescription>Customer memory and address suggestions</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Reduce repetitive typing by remembering prior addresses, GSTIN, and contact details.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <AutoFillDemo />
        <Card>
          <CardHeader>
            <CardTitle>How this ships on Windows</CardTitle>
            <CardDescription>Electron or Tauri with the same codebase</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>This UI is production-ready for the web. Wrap it as a desktop app without rewriting the frontend.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Persistent login per business</li>
              <li>Offline-first invoice drafts</li>
              <li>Sync to cloud when online</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
