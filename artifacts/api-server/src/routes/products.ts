import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  CreateProductParams,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/:tenantId/products", async (req, res): Promise<void> => {
  const params = ListProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(productsTable.tenantId, params.data.tenantId)];
  if (query.data.category) {
    conditions.push(eq(productsTable.category, query.data.category));
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(productsTable.name);

  res.json(products.map(p => ({ ...p, price: Number(p.price) })));
});

router.post("/tenants/:tenantId/products", async (req, res): Promise<void> => {
  const params = CreateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    tenantId: params.data.tenantId,
    price: String(parsed.data.price),
  }).returning();
  res.status(201).json({ ...product, price: Number(product.price) });
});

router.patch("/tenants/:tenantId/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.barcode !== undefined) updateData.barcode = parsed.data.barcode;
  if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock;
  if (parsed.data.active != null) updateData.active = parsed.data.active;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.tenantId, params.data.tenantId)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ ...product, price: Number(product.price) });
});

router.delete("/tenants/:tenantId/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db
    .delete(productsTable)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
