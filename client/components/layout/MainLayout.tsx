import { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/invoices", label: "Invoices" },
  { to: "/customers", label: "Customers" },
  { to: "/reports", label: "Reports" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function MainLayout({ children }: PropsWithChildren) {
  const { pathname, search } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/40">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent shadow" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-muted-foreground">Rohit Billing Suite</span>
              <span className="text-base font-semibold">Invoices & Reports</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((n) => (
              <Link key={n.to} to={{ pathname: n.to, search }}>
                <Button
                  variant={pathname === n.to ? "secondary" : "ghost"}
                  className={cn("px-3")}
                >
                  {n.label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth?org=rohit">
              <Button size="sm" className="hidden sm:inline-flex">Rohit Enterprises</Button>
            </Link>
            <Link to="/auth?org=vighneshwar">
              <Button size="sm" variant="outline" className="hidden sm:inline-flex">Vighneshwar Traders</Button>
            </Link>
            <Link to="/auth" className="sm:hidden">
              <Button size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto flex-1 py-8">{children}</main>
      <footer className="border-t bg-background/80">
        <div className="container mx-auto py-6 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} Rohit Enterprises · Dual-business invoicing for Rohit Enterprises & Vighneshwar Traders
          </p>
          <p className="flex items-center gap-3">
            <span>Free-tier ready:</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent"/>Supabase</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent"/>Netlify</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent"/>Vercel</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
