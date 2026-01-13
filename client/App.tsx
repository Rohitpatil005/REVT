import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  FirebaseAuthProvider,
  useAuthContext,
} from "./hooks/FirebaseAuthProvider";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Component, ReactNode } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import StorageTest from "./pages/StorageTest";

// Log Electron info and environment
(() => {
  try {
    const isElectron = typeof window !== "undefined" && !!window.electron;
    console.log("[App] Environment info:", {
      isElectron,
      url: window?.location?.href,
      userAgent: window?.navigator?.userAgent,
      timestamp: new Date().toISOString(),
    });
    (window as any).__appDebug = {
      isElectron,
      url: window?.location?.href,
      initialized: true,
    };
  } catch (e) {
    console.error("[App] Error logging environment:", e);
  }
})();

const queryClient = new QueryClient();

// Error boundary for better error handling
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("[ErrorBoundary] Caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[ErrorBoundary] Error details:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", fontFamily: "system-ui" }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
            <summary>Error details</summary>
            <code>{this.state.error?.stack}</code>
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: "10px" }}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) {
    // Show a loading indicator instead of blank screen
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to={`/auth${location.search || ""}`} replace />;
  return children;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <FirebaseAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <RequireAuth>
                      <Invoices />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <RequireAuth>
                      <Customers />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <RequireAuth>
                      <Products />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/storage-test"
                  element={
                    <RequireAuth>
                      <StorageTest />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RequireAuth>
                      <Reports />
                    </RequireAuth>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </TooltipProvider>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

try {
  console.log("[App] Mounting React app...");
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  createRoot(root).render(<App />);
  console.log("[App] React app mounted successfully");
} catch (error) {
  console.error("[App] Failed to mount React app:", error);
  // Display error directly in DOM
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: system-ui; background: #fee; color: #c00;">
        <h1>Failed to initialize application</h1>
        <p>${error instanceof Error ? error.message : String(error)}</p>
        <pre style="background: #fdd; padding: 10px; overflow: auto;">${
          error instanceof Error ? error.stack : ""
        }</pre>
        <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px;">
          Retry
        </button>
      </div>
    `;
  }
}
