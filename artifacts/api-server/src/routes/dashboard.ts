import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db, salesTable, productsTable } from "@workspace/db";
import {
  GetDashboardParams,
  GetRecentActivityParams,
  GetTopProductsParams,
  GetTopProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/:tenantId/dashboard", async (req, res): Promise<void> => {
  const params = GetDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { tenantId } = params.data;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todaySales, weekSales, monthSales, allProducts] = await Promise.all([
    db.select().from(salesTable).where(
      and(eq(salesTable.tenantId, tenantId), gte(salesTable.createdAt, todayStart), lte(salesTable.createdAt, todayEnd))
    ),
    db.select().from(salesTable).where(
      and(eq(salesTable.tenantId, tenantId), gte(salesTable.createdAt, weekStart))
    ),
    db.select().from(salesTable).where(
      and(eq(salesTable.tenantId, tenantId), gte(salesTable.createdAt, monthStart))
    ),
    db.select().from(productsTable).where(eq(productsTable.tenantId, tenantId)),
  ]);

  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const weekTotal = weekSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const monthTotal = monthSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const todaySalesCount = todaySales.length;

  const avgTicket = todaySalesCount > 0 ? todayTotal / todaySalesCount : 0;

  const paymentCounts: Record<string, number> = {};
  for (const s of todaySales) {
    paymentCounts[s.paymentMethod] = (paymentCounts[s.paymentMethod] || 0) + 1;
  }
  const topPaymentMethod = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "cash";

  const productsCount = allProducts.length;
  const lowStockCount = allProducts.filter(p => p.stock != null && p.stock <= 5).length;

  res.json({
    todayTotal,
    todaySalesCount,
    weekTotal,
    monthTotal,
    averageTicket: avgTicket,
    topPaymentMethod,
    productsCount,
    lowStockCount,
  });
});

router.get("/tenants/:tenantId/dashboard/recent", async (req, res): Promise<void> => {
  const params = GetRecentActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sales = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.tenantId, params.data.tenantId))
    .orderBy(desc(salesTable.createdAt))
    .limit(10);

  res.json(sales.map(s => ({ ...s, totalAmount: Number(s.totalAmount) })));
});

router.get("/tenants/:tenantId/dashboard/top-products", async (req, res): Promise<void> => {
  const params = GetTopProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = GetTopProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 5;

  const sales = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.tenantId, params.data.tenantId));

  const productMap = new Map<string, { productId: number | null; productName: string; totalSold: number; totalRevenue: number }>();

  for (const sale of sales) {
    const items = sale.items as Array<{ productId: number | null; productName: string; quantity: number; unitPrice: number; total: number }>;
    for (const item of items) {
      const key = item.productName;
      if (!productMap.has(key)) {
        productMap.set(key, { productId: item.productId, productName: item.productName, totalSold: 0, totalRevenue: 0 });
      }
      const entry = productMap.get(key)!;
      entry.totalSold += item.quantity;
      entry.totalRevenue += item.total;
    }
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);

  res.json(topProducts);
});

export default router;
