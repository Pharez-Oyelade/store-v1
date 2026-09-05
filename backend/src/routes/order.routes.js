import { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getDebtSummary,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import {
  createOrderValidators,
  updateOrderValidators,
} from "../validators/order.validators.js";
import { validate } from "../validators/auth.validators.js";
import { checkOrderLimit } from "../middleware/subscription.middleware.js";

const orderRouter = Router();

orderRouter.use(protect, requireRole("owner", "manager", "sales"));

// Specific sub-routes BEFORE /:id to prevent route conflicts
orderRouter.get("/summary/debt", getDebtSummary);

orderRouter.get("/", getOrders);
orderRouter.post("/", checkOrderLimit, createOrderValidators, validate, createOrder);
orderRouter.get("/:id", getOrder);
orderRouter.put("/:id", updateOrderValidators, validate, updateOrder);
orderRouter.delete("/:id", deleteOrder);

export default orderRouter;
