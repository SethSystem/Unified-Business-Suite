import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTenant } from "@/lib/tenant-context";
import { 
  Scissors, 
  UtensilsCrossed, 
  ShoppingBag, 
  Sparkles, 
  LayoutDashboard, 
  Tags, 
  ReceiptText, 
  Settings, 
  LogOut,
  Menu,
  Download
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";

export const BusinessIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case "barbershop": return <Scissors className={className} />;
    case "restaurant": return <UtensilsCrossed className={className} />;
    case "store": return <ShoppingBag className={className} />;
    case "salon": return <Sparkles className={className} />;
    default: return <ShoppingBag className={className} />;
  }
};

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/sales", label: "Vendas", icon: ReceiptText },
  { href: "/products", label: "Catálogo", icon: Tags },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { tenant, setTenant } = useTenant();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!tenant && location !== "/") {
      setLocation("/");
    }
  }, [tenant, location, setLocation]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLogout = () => {
    setTenant(null);
    setLocation("/");
  };

  if (!tenant) return <>{children}</>;

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
              isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}>
              <Icon className="w-5 h-5" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <BusinessIcon type={tenant.businessType} className="w-5 h-5" />
            </div>
          )}
          <span className="font-semibold">{tenant.name}</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                {tenant.logo ? (
                  <img src={tenant.logo} alt={tenant.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-primary-foreground">
                    <BusinessIcon type={tenant.businessType} className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg leading-tight">{tenant.name}</h2>
                  <p className="text-xs text-muted-foreground capitalize">{tenant.businessType}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              <NavLinks />
            </nav>
            <div className="p-4 border-t space-y-2">
              {deferredPrompt && (
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleInstall}>
                  <Download className="w-4 h-4" />
                  Instalar App
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card sticky top-0 h-[100dvh]">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.name} className="w-12 h-12 rounded object-cover" />
            ) : (
              <div className="w-12 h-12 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <BusinessIcon type={tenant.businessType} className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-lg leading-tight truncate max-w-[140px]">{tenant.name}</h2>
              <p className="text-xs text-muted-foreground capitalize">{tenant.businessType}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t space-y-2">
          {deferredPrompt && (
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleInstall}>
              <Download className="w-4 h-4" />
              Instalar App
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
