import { Router } from "express";
import {
  getOverview,
  getRevenue,
  getTopProductsHandler,
  getSlowMoversHandler,
  getTopCustomersHandler,
  getBespokeVsRtwHandler,
  getWorkshopProductivityHandler,
  getMarginEstimatorHandler,
  exportVendorCsvHandler,
} from "../controllers/analytics.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { requireMinPlan } from "../middleware/subscriptionGating.middleware.js";

const analyticsRouter = Router();

// Base requirement: Owner or Manager role, and at least Stitch plan (Free gets locked paywall)
analyticsRouter.use(
  protect,
  requireRole("owner", "manager"),
  requireMinPlan("stitch", "Store Analytics & Metrics")
);

/* ── Stitch+ Endpoints (Basic 7-day Sales Snapshot) ─── */
analyticsRouter.get("/overview", getOverview);
analyticsRouter.get("/revenue", getRevenue);
analyticsRouter.get("/products/top", getTopProductsHandler);

/* ── Drape+ Endpoints (Core Revenue & Inventory Reports) */
analyticsRouter.get(
  "/products/slow",
  requireMinPlan("drape", "Slow-Moving Inventory Analytics"),
  getSlowMoversHandler
);
analyticsRouter.get(
  "/customers/top",
  requireMinPlan("drape", "Top Customers by Lifetime Value"),
  getTopCustomersHandler
);
analyticsRouter.get(
  "/export",
  requireMinPlan("drape", "Data Export"),
  exportVendorCsvHandler
);

/* ── Atelier+ Endpoints (Command Center & Business Intelligence) */
analyticsRouter.get(
  "/bespoke-vs-rtw",
  requireMinPlan("atelier", "Bespoke vs. RTW Revenue Split"),
  getBespokeVsRtwHandler
);
analyticsRouter.get(
  "/workshop",
  requireMinPlan("atelier", "Workshop & Tailor Productivity Analytics"),
  getWorkshopProductivityHandler
);
analyticsRouter.get(
  "/margins",
  requireMinPlan("atelier", "Gross Margin & Unit Economics Estimator"),
  getMarginEstimatorHandler
);

export default analyticsRouter;

