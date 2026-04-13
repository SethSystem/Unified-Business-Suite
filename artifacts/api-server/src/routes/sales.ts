import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, salesTable } from "@workspace/db";
import {
  CreateSaleBody,
  CreateSaleParams,
  GetSaleParams,
  DeleteSaleParams,
  ListSalesParams,
  ListSalesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapSale(sale: typeof salesTable.$inferSelect) {
  return {
    ...sale,
    totalAmount: Number(sale.totalAmount),
  };
}

router.get("/tenants/:tenantId/sales", async (req, res): Promise<void> => {
  const params = ListSalesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = ListSalesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(salesTable.tenantId, params.data.tenantId)];

  if (query.data.date) {
    const start = new Date(query.data.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(query.data.date);
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(salesTable.createdAt, start));
    conditions.push(lte(salesTable.createdAt, end));
  }

  let salesQuery = db
    .select()
    .from(salesTable)
    .where(and(...conditions))
    .orderBy(desc(salesTable.createdAt));

  if (query.data.limit) {
    salesQuery = salesQuery.limit(query.data.limit) as typeof salesQuery;
  }

  const sales = await salesQuery;
  res.json(sales.map(mapSale));
});

router.post("/tenants/:tenantId/sales", async (req, res): Promise<void> => {
  const params = CreateSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sale] = await db.insert(salesTable).values({
    tenantId: params.data.tenantId,
    customerName: parsed.data.customerName ?? null,
    items: parsed.data.items as typeof salesTable.$inferInsert["items"],
    totalAmount: String(parsed.data.totalAmount),
    paymentMethod: parsed.data.paymentMethod,
    notes: parsed.data.notes ?? null,
    synced: true,
  }).returning();

  res.status(201).json(mapSale(sale));
});

router.get("/tenants/:tenantId/sales/:id", async (req, res): Promise<void> => {
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sale] = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.id, params.data.id), eq(salesTable.tenantId, params.data.tenantId)));

  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  res.json(mapSale(sale));
});

router.delete("/tenants/:tenantId/sales/:id", async (req, res): Promise<void> => {
  const params = DeleteSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sale] = await db
    .delete(salesTable)
    .where(and(eq(salesTable.id, params.data.id), eq(salesTable.tenantId, params.data.tenantId)))
    .returning();
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
