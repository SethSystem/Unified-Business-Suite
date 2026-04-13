import { Layout } from "@/components/layout";
import { useTenant } from "@/lib/tenant-context";
import { useListProducts, getListProductsQueryKey, useCreateProduct, useUpdateProduct } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Edit2, Package, Tag, Search, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: products, isLoading } = useListProducts(tenant!.id, undefined, {
    query: {
      enabled: !!tenant,
      queryKey: getListProductsQueryKey(tenant!.id)
    }
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    barcode: "",
    category: "",
    stock: "0"
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  ) || [];

  const handleOpenDialog = (product: any = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        barcode: product.barcode || "",
        category: product.category || "",
        stock: product.stock?.toString() || "0"
      });
    } else {
      setFormData({ name: "", price: "", barcode: "", category: "", stock: "0" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price.replace(',', '.')),
        barcode: formData.barcode || null,
        category: formData.category || null,
        stock: parseInt(formData.stock) || 0
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({ tenantId: tenant!.id, id: editingProduct.id, data: payload });
        toast({ title: "Produto atualizado com sucesso" });
      } else {
        await createProduct.mutateAsync({ tenantId: tenant!.id, data: payload });
        toast({ title: "Produto criado com sucesso" });
      }
      
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(tenant!.id) });
      setIsDialogOpen(false);
    } catch (err) {
      toast({ title: "Erro ao salvar produto", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo</h1>
            <p className="text-muted-foreground">Gerencie seus produtos e serviços.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Item
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou código..." 
            className="pl-9 bg-card"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => handleOpenDialog(p)}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Tag className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(p.price)}</span>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2">{p.name}</h3>
                  <div className="mt-auto pt-4 space-y-2 text-sm text-muted-foreground">
                    {p.category && (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 shrink-0" />
                        <span className="truncate">{p.category}</span>
                      </div>
                    )}
                    {p.barcode && (
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 shrink-0" />
                        <span className="font-mono text-xs">{p.barcode}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
           <div className="text-center py-20 border rounded-xl border-dashed bg-muted/20">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
            <p className="text-muted-foreground mt-1 mb-4">Adicione produtos ou serviços ao seu catálogo.</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <div className="flex gap-2">
                  <Input id="barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  <Button type="button" variant="outline" size="icon" title="Gerar aleatório" onClick={() => setFormData({...formData, barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString()})}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
