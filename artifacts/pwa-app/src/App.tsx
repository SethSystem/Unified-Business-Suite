import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "@/lib/tenant-context";
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

function Router() {
  useOfflineSync();
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/products" component={Products} />
      <Route path="/sales" component={Sales} />
      <Route path="/sales/new" component={SalesNew} />
      <Route path="/settings" component={Settings} />
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
