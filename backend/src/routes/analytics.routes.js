import { Router } from "express";
import {
  getOverview,
  getRevenue,
  getTopProductsHandler,
  getSlowMoversHandler,
  getTopCustomersHandler,
} from "../controllers/analytics.controller.js";
import { protect } from "../middleware/protect.js";

const analyticsRouter = Router();

analyticsRouter.use(protect);

analyticsRouter.get("/overview", getOverview);
analyticsRouter.get("/revenue", getRevenue);
analyticsRouter.get("/products/top", getTopProductsHandler);
analyticsRouter.get("/products/slow", getSlowMoversHandler);
analyticsRouter.get("/customers/top", getTopCustomersHandler);

export default analyticsRouter;
