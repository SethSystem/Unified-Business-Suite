import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTenant } from "@/lib/tenant-context";
import { useGetTenantBySlug, useListTenants } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, Briefcase } from "lucide-react";
import { BusinessIcon } from "@/components/layout";

export default function Login() {
  const { tenant, setTenant, isLoading } = useTenant();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tenants, isLoading: isLoadingTenants } = useListTenants();

  useEffect(() => {
    if (!isLoading && tenant) {
      setLocation("/dashboard");
    }
  }, [tenant, isLoading, setLocation]);

  const { refetch } = useGetTenantBySlug(slug, {
    query: {
      enabled: false,
      retry: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, isError } = await refetch();
      if (isError || !data) {
        toast({
          title: "Estabelecimento não encontrado",
          description: "Verifique o código e tente novamente.",
          variant: "destructive"
        });
      } else {
        setTenant(data);
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTenant = (t: any) => {
    setTenant(t);
    setLocation("/dashboard");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (tenant) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PWA Universal</h1>
          <p className="text-muted-foreground">Sistema de gestão para o seu negócio</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Acessar</CardTitle>
            <CardDescription>
              Insira o código do seu estabelecimento para entrar.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Código do Estabelecimento</Label>
                <Input 
                  id="slug" 
                  placeholder="ex: barbearia-do-ze" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || !slug.trim()}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Entrar
              </Button>
            </CardFooter>
          </form>
        </Card>

        {tenants && tenants.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ou escolha para testar</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tenants.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTenant(t)}
                  className="flex items-center gap-3 p-3 text-left rounded-lg border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: t.primaryColor || 'var(--primary)', color: '#fff' }}>
                    {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover rounded-md" /> : <BusinessIcon type={t.businessType} className="w-5 h-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate group-hover:text-accent-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.slug}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
