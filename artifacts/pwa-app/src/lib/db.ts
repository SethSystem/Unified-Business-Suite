import Dexie, { Table } from "dexie";
import { CreateSaleBody, Sale } from "@workspace/api-client-react";

export interface PendingSale {
  id?: number;
  tenantId: number;
  payload: CreateSaleBody;
  createdAt: string;
}

class PwaDatabase extends Dexie {
  pendingSales!: Table<PendingSale>;

  constructor() {
    super("PwaDatabase");
    this.version(1).stores({
      pendingSales: "++id, tenantId, createdAt"
    });
  }
}

export const db = new PwaDatabase();
