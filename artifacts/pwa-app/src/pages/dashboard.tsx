import { useTenant } from "@/lib/tenant-context";
import { Layout, BusinessIcon } from "@/components/layout";
import { useGetDashboard, getGetDashboardQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetTopProducts, getGetTopProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp, ShoppingBag, CreditCard, AlertTriangle, Play, Calendar, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { tenant } = useTenant();
  
  const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboard(tenant!.id, {
    query: {
      enabled: !!tenant,
      queryKey: getGetDashboardQueryKey(tenant!.id)
    }
  });

  const { data: recentActivity, isLoading: isActivityLoading } = useGetRecentActivity(tenant!.id, {
    query: {
      enabled: !!tenant,
      queryKey: getGetRecentActivityQueryKey(tenant!.id)
    }
  });

  const { data: topProducts, isLoading: isTopProductsLoading } = useGetTopProducts(tenant!.id, { query: { limit: 5 } }, {
    query: {
      enabled: !!tenant,
      queryKey: getGetTopProductsQueryKey(tenant!.id, { limit: 5 })
    }
  });

  const handleSpeakReport = () => {
    if (!dashboard) return;
    const text = `Relatório de hoje. Total de vendas: ${formatCurrency(dashboard.todayTotal)}. Número de vendas: ${dashboard.todaySalesCount}. Ticket médio: ${formatCurrency(dashboard.averageTicket)}. Principal forma de pagamento: ${dashboard.topPaymentMethod}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    window.speechSynthesis.speak(utterance);
  };

  const isLoading = isDashboardLoading || isActivityLoading || isTopProductsLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
            <p className="text-muted-foreground">Bem-vindo(a) ao painel do(a) {tenant?.name}</p>
          </div>
          <Button onClick={handleSpeakReport} variant="outline" className="gap-2 shrink-0 self-start md:self-auto">
            <Play className="w-4 h-4" />
            Relatório de Voz
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : dashboard && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboard.todayTotal)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.todaySalesCount} pedido(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboard.averageTicket)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por venda hoje
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas no Mês</CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboard.monthTotal)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acumulado no mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Forma Pagto.</CardTitle>
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{dashboard.topPaymentMethod || "N/A"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mais utilizado
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Top Produtos</CardTitle>
                  <CardDescription>Os produtos mais vendidos recentemente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts && topProducts.length > 0 ? topProducts.map((p, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                          #{i + 1}
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{p.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.totalSold} unidades
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          {formatCurrency(p.totalRevenue)}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-muted-foreground">Nenhum dado disponível</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Últimas vendas realizadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity: any, i: number) => (
                      <div key={i} className="flex items-center">
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.customerName || "Cliente Padrão"}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {activity.paymentMethod}
                          </p>
                        </div>
                        <div className="font-medium">
                          +{formatCurrency(activity.totalAmount)}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-muted-foreground">Nenhuma atividade recente</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
