import { useOffline } from "@/hooks/use-offline";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50 sticky top-0 w-full">
      <WifiOff className="w-4 h-4" />
      <span>Você está offline. O aplicativo está funcionando em modo limitado.</span>
    </div>
  );
}
