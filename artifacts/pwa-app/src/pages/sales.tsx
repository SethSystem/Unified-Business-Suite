import { Layout } from "@/components/layout";
import { useTenant } from "@/lib/tenant-context";
import { useListSales, getListSalesQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Sales() {
  const { tenant } = useTenant();
  const { data: sales, isLoading } = useListSales(tenant!.id, undefined, {
    query: {
      enabled: !!tenant,
      queryKey: getListSalesQueryKey(tenant!.id)
    }
  });

  const getPaymentBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'pix': return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800';
      case 'card': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'cash': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
            <p className="text-muted-foreground">Histórico de todas as vendas realizadas.</p>
          </div>
          <Link href="/sales/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Venda
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : sales && sales.length > 0 ? (
          <div className="grid gap-4">
            {sales.map((sale) => (
              <Card key={sale.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center p-4 md:p-6 gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        <Badge variant="outline" className={getPaymentBadgeColor(sale.paymentMethod)}>
                          {sale.paymentMethod.toUpperCase()}
                        </Badge>
                        {!sale.synced && (
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                            Pendente Sincronização
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{sale.customerName || "Cliente Padrão"}</span>
                        <span>•</span>
                        <span>{formatDateTime(sale.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground flex items-center gap-2 md:w-1/3">
                      <Receipt className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border rounded-xl border-dashed bg-muted/20">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhuma venda encontrada</h3>
            <p className="text-muted-foreground mt-1 mb-4">Comece a registrar suas vendas agora mesmo.</p>
            <Link href="/sales/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar a Primeira Venda
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
