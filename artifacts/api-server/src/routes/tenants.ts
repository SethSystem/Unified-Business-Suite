import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, tenantsTable } from "@workspace/db";
import {
  CreateTenantBody,
  UpdateTenantBody,
  GetTenantParams,
  UpdateTenantParams,
  GetTenantBySlugParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants", async (_req: Request, res: Response): Promise<void> => {
  const tenants = await db.select().from(tenantsTable).orderBy(tenantsTable.name);
  res.json(tenants);
});

router.post("/tenants", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [tenant] = await db.insert(tenantsTable).values(parsed.data).returning();
    res.status(201).json(tenant);
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      res.status(409).json({ error: "Este código já está em uso. Escolha outro." });
    } else {
      throw err;
    }
  }
});

router.get("/tenants/slug/:slug", async (req: Request, res: Response): Promise<void> => {
  const params = GetTenantBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, params.data.slug));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

router.get("/tenants/:id", async (req: Request, res: Response): Promise<void> => {
  const params = GetTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, params.data.id));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

router.patch("/tenants/:id", async (req: Request, res: Response): Promise<void> => {
  const params = UpdateTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.primaryColor != null) updateData.primaryColor = parsed.data.primaryColor;
  if (parsed.data.secondaryColor != null) updateData.secondaryColor = parsed.data.secondaryColor;
  if (parsed.data.logo !== undefined) updateData.logo = parsed.data.logo;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.active != null) updateData.active = parsed.data.active;

  const [tenant] = await db.update(tenantsTable).set(updateData).where(eq(tenantsTable.id, params.data.id)).returning();
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

export default router;
