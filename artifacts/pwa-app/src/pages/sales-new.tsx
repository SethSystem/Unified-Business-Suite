import { Layout } from "@/components/layout";
import { useTenant } from "@/lib/tenant-context";
import { useState, useRef, useEffect } from "react";
import { useListProducts, getListProductsQueryKey, useCreateSale, getListSalesQueryKey, SaleItem } from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Minus, Trash2, Search, QrCode, ScanBarcode, Share2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useOffline } from "@/hooks/use-offline";

export default function SalesNew() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOffline = useOffline();
  const createSale = useCreateSale();
  
  const { data: products, isLoading: isLoadingProducts } = useListProducts(tenant!.id, undefined, {
    query: { enabled: !!tenant, queryKey: getListProductsQueryKey(tenant!.id) }
  });

  const [cart, setCart] = useState<(SaleItem & { id: number })[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [successSaleId, setSuccessSaleId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock barcode scanner logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let timeout: NodeJS.Timeout;

    if (isScanning) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          // Simulate scanning success after 2.5s
          timeout = setTimeout(() => {
            setIsScanning(false);
            if (products && products.length > 0) {
              // pick random product to simulate scan
              const p = products[Math.floor(Math.random() * products.length)];
              addToCart(p);
              toast({ title: "Código de barras lido", description: `${p.name} adicionado.` });
            }
          }, 2500);
        })
        .catch(err => {
          console.error(err);
          toast({ title: "Erro na câmera", description: "Não foi possível acessar a câmera", variant: "destructive" });
          setIsScanning(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      clearTimeout(timeout);
    };
  }, [isScanning, products]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ, total: newQ * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  ) || [];

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    const payload = {
      customerName: customerName || null,
      paymentMethod,
      totalAmount,
      items: cart.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total
      }))
    };

    try {
      if (isOffline) {
        await db.pendingSales.add({
          tenantId: tenant!.id,
          payload,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Venda salva offline", description: "Será sincronizada quando houver conexão." });
        setSuccessSaleId(Date.now()); // fake id for UI
      } else {
        const result = await createSale.mutateAsync({ data: payload });
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey(tenant!.id) });
        setSuccessSaleId(result.id);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao registrar venda", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareReceipt = async () => {
    const text = `Comprovante de Venda - ${tenant?.name}\nTotal: ${formatCurrency(totalAmount)}\nObrigado pela preferência!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comprovante - ${tenant?.name}`,
          text: text
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copiado para a área de transferência" });
    }
  };

  const resetForm = () => {
    setCart([]);
    setCustomerName("");
    setSuccessSaleId(null);
    setPaymentMethod("pix");
  };

  return (
    <Layout>
      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
        {/* Left: Products & Scanner */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle>Adicionar Produtos</CardTitle>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou código..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsScanning(!isScanning)} className={isScanning ? "bg-primary/10 border-primary text-primary" : ""}>
                <ScanBarcode className="h-4 w-4" />
              </Button>
            </div>
            
            {isScanning && (
              <div className="mt-4 relative bg-black rounded-md overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-primary/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="w-full h-0.5 bg-primary absolute top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                  Lendo código de barras...
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6">
              {isLoadingProducts ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 pb-6">
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="p-3 border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group active:scale-[0.98]">
                      <div className="font-medium group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(p.price)}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Cart & Checkout */}
        <Card className="flex flex-col h-full bg-muted/10 border-primary/10">
          <CardHeader className="pb-3 shrink-0 border-b">
            <CardTitle>Carrinho Atual</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 opacity-50">
                  <ShoppingBag className="w-12 h-12 mb-4" />
                  <p>O carrinho está vazio</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted rounded-md border">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:text-primary disabled:opacity-50" disabled={item.quantity <= 1}><Minus className="w-3 h-3" /></button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:text-primary"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="w-20 text-right font-medium">
                          {formatCurrency(item.total)}
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col gap-4 shrink-0 border-t p-6 bg-card">
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente (Opcional)</Label>
                  <Input placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="pix">PIX</option>
                    <option value="card">Cartão</option>
                    <option value="cash">Dinheiro</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-medium text-muted-foreground">Total</span>
                <span className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
              </div>

              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleCheckout}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                Finalizar Venda
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={!!successSaleId} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Venda Finalizada!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
            
            <div className="p-4 bg-white rounded-xl shadow-sm border mt-4">
              <QRCodeSVG value={`receipt:${successSaleId}`} size={160} level="Q" />
            </div>
            <p className="text-sm text-muted-foreground">Escaneie para ver o comprovante</p>
          </div>
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleShareReceipt} className="gap-2">
              <Share2 className="w-4 h-4" />
              Enviar Comprovante
            </Button>
            <Button onClick={resetForm}>
              Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
