import { Router } from "express";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierSummary,
} from "../controllers/supplier.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";

import {
  requireMinPlan,
  checkSupplierLimit,
} from "../middleware/subscriptionGating.middleware.js";

const supplierRouter = Router();

supplierRouter.use(
  protect,
  requireRole("owner", "manager"),
  requireMinPlan("stitch", "Supplier & Material Debt Management")
);

supplierRouter.get("/summary", getSupplierSummary);
supplierRouter.get("/", getSuppliers);
supplierRouter.post("/", checkSupplierLimit, createSupplier);
supplierRouter.get("/:id", getSupplier);
supplierRouter.put("/:id", updateSupplier);
supplierRouter.delete("/:id", deleteSupplier);

export default supplierRouter;

