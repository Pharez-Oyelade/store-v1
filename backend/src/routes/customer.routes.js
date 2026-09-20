import { Router } from "express";
import {
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { checkIdempotency } from "../middleware/idempotency.middleware.js";

const customerRouter = Router();

// All customer routes require authentication and role check (sales, manager, owner)
customerRouter.use(protect, requireRole("owner", "manager", "sales"), checkIdempotency);

customerRouter.get("/", getCustomers);
customerRouter.get("/:id", getCustomer);
customerRouter.put("/:id", updateCustomer);
customerRouter.delete("/:id", requireRole("owner", "manager"), deleteCustomer);

export default customerRouter;
