import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseAuthProvider, useAuthContext } from './hooks/SupabaseAuthProvider'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import StorageTest from './pages/StorageTest'






const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to={`/auth${location.search || ''}`} replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
              <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
              <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
              <Route path="/storage-test" element={<RequireAuth><StorageTest /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
)

createRoot(document.getElementById("root")!).render(<App />);
