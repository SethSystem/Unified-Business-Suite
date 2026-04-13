import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tenantsRouter from "./tenants";
import productsRouter from "./products";
import salesRouter from "./sales";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tenantsRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(dashboardRouter);

export default router;
