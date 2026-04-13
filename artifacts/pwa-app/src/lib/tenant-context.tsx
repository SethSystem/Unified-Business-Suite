import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Tenant } from "@workspace/api-client-react";

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("currentTenant");
    if (saved) {
      try {
        setTenantState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tenant from local storage", e);
      }
    }
    setIsLoading(false);
  }, []);

  const setTenant = (newTenant: Tenant | null) => {
    setTenantState(newTenant);
    if (newTenant) {
      localStorage.setItem("currentTenant", JSON.stringify(newTenant));
      applyTenantColors(newTenant);
    } else {
      localStorage.removeItem("currentTenant");
      removeTenantColors();
    }
  };

  useEffect(() => {
    if (tenant) {
      applyTenantColors(tenant);
    }
  }, [tenant]);

  return (
    <TenantContext.Provider value={{ tenant, setTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

function hexToHsl(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTenantColors(tenant: Tenant) {
  const root = document.documentElement;
  if (tenant.primaryColor) {
    root.style.setProperty("--tenant-primary", `hsl(${hexToHsl(tenant.primaryColor)})`);
  }
  if (tenant.secondaryColor) {
    root.style.setProperty("--tenant-secondary", `hsl(${hexToHsl(tenant.secondaryColor)})`);
  }
}

function removeTenantColors() {
  const root = document.documentElement;
  root.style.removeProperty("--tenant-primary");
  root.style.removeProperty("--tenant-secondary");
}
