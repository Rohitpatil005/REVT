import AutoFillDemo from "@/components/AutoFillDemo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/10 to-transparent p-8 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-6">

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Unified invoicing for Rohit Enterprises and Vighneshwar Traders
            </h1>
            <p className="text-muted-foreground">
              Generate invoices, store them in the cloud, and get separate
              dashboards and reports for each business. Auto-fill customer data
              to save time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth?org=rohit">
                <Button size="lg">Sign in — Rohit Enterprises</Button>
              </Link>
              <Link to="/auth?org=vighneshwar">
                <Button size="lg" variant="outline">
                  Sign in — Vighneshwar Traders
                </Button>
              </Link>
            </div>

          </div>

        </div>
      </section>


    </div>
  );
}
