import { Layout } from "@/components/layout";
import { useTenant } from "@/lib/tenant-context";
import { useUpdateTenant, getGetTenantBySlugQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { tenant, setTenant } = useTenant();
  const { toast } = useToast();
  const updateTenant = useUpdateTenant();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    primaryColor: "",
    secondaryColor: "",
    logo: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        primaryColor: tenant.primaryColor || "#3b82f6",
        secondaryColor: tenant.secondaryColor || "#1d4ed8",
        logo: tenant.logo || "",
        phone: tenant.phone || "",
        address: tenant.address || ""
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const updated = await updateTenant.mutateAsync({
        id: tenant.id,
        data: {
          name: formData.name,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logo: formData.logo || null,
          phone: formData.phone || null,
          address: formData.address || null,
        }
      });
      setTenant(updated);
      queryClient.setQueryData(getGetTenantBySlugQueryKey(updated.slug), updated);
      toast({ title: "Configurações atualizadas" });
    } catch (err) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl space-y-6 mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Personalize a identidade e informações do seu negócio.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Cores e logo aplicados em todo o sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Estabelecimento</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-3 items-center">
                    <Input type="color" id="primaryColor" className="w-14 h-14 p-1 cursor-pointer" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} />
                    <Input type="text" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="font-mono uppercase" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-3 items-center">
                    <Input type="color" id="secondaryColor" className="w-14 h-14 p-1 cursor-pointer" value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} />
                    <Input type="text" value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} className="font-mono uppercase" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">URL da Logo</Label>
                <Input id="logo" type="url" placeholder="https://..." value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} />
                {formData.logo && (
                  <div className="mt-4 p-4 border rounded-lg bg-card inline-block">
                    <img src={formData.logo} alt="Preview" className="h-16 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button type="submit" disabled={updateTenant.isPending} className="ml-auto">
                {updateTenant.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </form>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Preview do Tema</h3>
              <p className="text-sm text-muted-foreground mb-4">Veja como as cores ficam aplicadas em elementos de interface.</p>
              <div className="flex flex-wrap gap-2">
                <Button>Botão Primário</Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Botão Contorno</Button>
                <div className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium">Badge Colorida</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
