import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider, useTenant } from "@/lib/tenant-context";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Products from "./pages/products";
import Sales from "./pages/sales";
import SalesNew from "./pages/sales-new";
import Settings from "./pages/settings";
import { OfflineBanner } from "@/components/offline-banner";
import { useOfflineSync } from "@/hooks/use-offline-sync";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { tenant, isLoading } = useTenant();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !tenant) {
      navigate("/");
    }
  }, [isLoading, tenant, navigate]);

  if (isLoading) return null;
  if (!tenant) return null;
  return <Component />;
}

function Router() {
  useOfflineSync();
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/products">{() => <ProtectedRoute component={Products} />}</Route>
      <Route path="/sales/new">{() => <ProtectedRoute component={SalesNew} />}</Route>
      <Route path="/sales">{() => <ProtectedRoute component={Sales} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <OfflineBanner />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}

export default App;
