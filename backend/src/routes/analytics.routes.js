import { Router } from "express";
import {
  getOverview,
  getRevenue,
  getTopProductsHandler,
  getSlowMoversHandler,
  getTopCustomersHandler,
} from "../controllers/analytics.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const analyticsRouter = Router();

analyticsRouter.use(protect, requireRole("owner", "manager"));

analyticsRouter.get("/overview", getOverview);
analyticsRouter.get("/revenue", getRevenue);
analyticsRouter.get("/products/top", getTopProductsHandler);
analyticsRouter.get("/products/slow", getSlowMoversHandler);
analyticsRouter.get("/customers/top", getTopCustomersHandler);

export default analyticsRouter;

