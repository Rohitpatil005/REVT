import { PropsWithChildren } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/FirebaseAuthProvider";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/invoices", label: "Invoices" },
  { to: "/products", label: "Products" },
  { to: "/customers", label: "Customers" },
  { to: "/reports", label: "Reports" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function MainLayout({ children }: PropsWithChildren) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/40">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="REVT Logo" className="h-8 w-8" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-muted-foreground">Rohit Billing Suite</span>
              <span className="text-base font-semibold">Invoices & Reports</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {(user ? navItems : [{ to: "/", label: "Home" }]).map((n) => (
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
            {!user && (
              <>
                <Link to="/auth?org=rohit">
                  <Button size="sm" className="hidden sm:inline-flex">Rohit Enterprises</Button>
                </Link>
                <Link to="/auth?org=vighneshwar">
                  <Button size="sm" variant="outline" className="hidden sm:inline-flex">Vighneshwar Traders</Button>
                </Link>
                <Link to="/auth" className="sm:hidden">
                  <Button size="sm">Sign in</Button>
                </Link>
              </>
            )}
            {user && (
              <>
                <Link to={{ pathname: "/dashboard", search }}>
                  <Button size="sm" variant="secondary">Dashboard</Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await signOut();
                    } finally {
                      navigate(`/auth${search || ""}`, { replace: true });
                    }
                  }}
                >
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto flex-1 py-8">{children}</main>

    </div>
  );
}
