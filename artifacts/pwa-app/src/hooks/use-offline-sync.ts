import { useEffect } from "react";
import { useOffline } from "./use-offline";
import { db } from "@/lib/db";
import { useCreateSale, getListSalesQueryKey, getGetDashboardQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export function useOfflineSync() {
  const isOffline = useOffline();
  const createSale = useCreateSale();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOffline) {
      syncPendingSales();
    }
  }, [isOffline]);

  const syncPendingSales = async () => {
    try {
      const pending = await db.pendingSales.toArray();
      if (pending.length === 0) return;

      toast({
        title: "Sincronizando...",
        description: `Sincronizando ${pending.length} venda(s) offline.`,
      });

      for (const sale of pending) {
        try {
          await createSale.mutateAsync({
            data: sale.payload,
          });
          if (sale.id) {
            await db.pendingSales.delete(sale.id);
          }
          queryClient.invalidateQueries({ queryKey: getListSalesQueryKey(sale.tenantId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey(sale.tenantId) });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey(sale.tenantId) });
        } catch (error) {
          console.error("Failed to sync sale", sale, error);
        }
      }

      toast({
        title: "Sincronização concluída",
        description: "Todas as vendas offline foram sincronizadas.",
      });
    } catch (error) {
      console.error("Error during sync", error);
    }
  };

  return { syncPendingSales };
}
