import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTenant } from "@/lib/tenant-context";
import { useGetTenantBySlug, useListTenants, useCreateTenant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, Plus, LogIn, Scissors, UtensilsCrossed, ShoppingBag, Sparkles } from "lucide-react";
import { BusinessIcon } from "@/components/layout";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BUSINESS_TYPES = [
  { value: "barbershop", label: "Barbearia", icon: Scissors },
  { value: "restaurant", label: "Restaurante / Lanchonete", icon: UtensilsCrossed },
  { value: "store", label: "Loja / Comércio", icon: ShoppingBag },
  { value: "salon", label: "Salão de Beleza", icon: Sparkles },
];

const PRESET_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#e94560", "#f5a623", "#27ae60", "#2980b9",
  "#8e44ad", "#c0392b", "#d35400", "#16a085",
];

export default function Login() {
  const { tenant, setTenant, isLoading } = useTenant();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regSlug, setRegSlug] = useState("");
  const [regSlugEdited, setRegSlugEdited] = useState(false);
  const [regType, setRegType] = useState("barbershop");
  const [regColor, setRegColor] = useState("#1a1a2e");
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: tenants } = useListTenants();

  const { refetch } = useGetTenantBySlug(slug, {
    query: { enabled: false, retry: false }
  });

  const createTenantMutation = useCreateTenant();

  useEffect(() => {
    if (!isLoading && tenant) {
      setLocation("/dashboard");
    }
  }, [tenant, isLoading, setLocation]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!regSlugEdited && regName) {
      setRegSlug(slugify(regName));
    }
  }, [regName, regSlugEdited]);

  const handleLogin = async (e: React.FormEvent) => {
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
    } catch {
      toast({ title: "Erro ao conectar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regSlug.trim()) return;
    setIsRegistering(true);
    try {
      const newTenant = await createTenantMutation.mutateAsync({
        name: regName.trim(),
        slug: regSlug.trim(),
        businessType: regType,
        primaryColor: regColor,
      });
      setTenant(newTenant);
      toast({ title: "Estabelecimento criado!", description: `Bem-vindo(a) ao ${newTenant.name}!` });
      setLocation("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Erro ao criar estabelecimento.";
      const isDuplicate = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("slug");
      toast({
        title: isDuplicate ? "Código já em uso" : "Erro ao criar",
        description: isDuplicate ? "Escolha outro código para seu estabelecimento." : msg,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSelectTenant = (t: any) => {
    setTenant(t);
    setLocation("/dashboard");
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (tenant) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PWA Universal</h1>
          <p className="text-muted-foreground">Sistema de gestão para o seu negócio</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg border bg-muted/50 p-1 gap-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LogIn className="w-4 h-4" /> Já tenho conta
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Plus className="w-4 h-4" /> Criar negócio
          </button>
        </div>

        {mode === "login" ? (
          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle>Acessar</CardTitle>
              <CardDescription>Insira o código do seu estabelecimento para entrar.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Código do Estabelecimento</Label>
                  <Input
                    id="slug"
                    placeholder="ex: minha-barbearia"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
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
        ) : (
          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle>Criar Estabelecimento</CardTitle>
              <CardDescription>Cadastre seu negócio e comece a usar agora.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regName">Nome do Estabelecimento</Label>
                  <Input
                    id="regName"
                    placeholder="Ex: Barbearia do Zé"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regSlug">
                    Código único <span className="text-xs text-muted-foreground">(usado para entrar)</span>
                  </Label>
                  <Input
                    id="regSlug"
                    placeholder="barbearia-do-ze"
                    value={regSlug}
                    onChange={(e) => { setRegSlug(slugify(e.target.value) || e.target.value.toLowerCase()); setRegSlugEdited(true); }}
                    autoComplete="off"
                    autoCapitalize="none"
                  />
                  {regSlug && (
                    <p className="text-xs text-muted-foreground">Você vai entrar com: <span className="font-medium text-foreground">{regSlug}</span></p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Negócio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRegType(value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all text-left ${regType === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor principal</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setRegColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${regColor === color ? "border-white scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-border cursor-pointer flex items-center justify-center overflow-hidden" title="Personalizar">
                      <input type="color" value={regColor} onChange={(e) => setRegColor(e.target.value)} className="opacity-0 absolute w-8 h-8 cursor-pointer" />
                      <span className="text-xs">+</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: regColor }} />
                    <span className="text-xs text-muted-foreground">{regColor}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRegistering || !regName.trim() || !regSlug.trim()}
                  style={{ backgroundColor: regColor }}
                >
                  {isRegistering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar e Entrar
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {mode === "login" && tenants && tenants.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ou escolha para testar</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tenants.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTenant(t)}
                  className="flex items-center gap-3 p-3 text-left rounded-lg border bg-card hover:bg-accent transition-all group"
                >
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: t.primaryColor || "#1a1a2e", color: "#fff" }}>
                    {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover rounded-md" /> : <BusinessIcon type={t.businessType} className="w-5 h-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
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
