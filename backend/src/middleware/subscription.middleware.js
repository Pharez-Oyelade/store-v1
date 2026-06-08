import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import { PLAN_LIMITS } from "../models/subscriptionModel.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Middleware: check if vendor can create more products based on their plan.
 * Used on POST /api/products.
 */
export const checkProductLimit = async (req, res, next) => {
  const plan = req.vendor.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.products ?? 10;

  if (limit === Infinity) return next();

  const count = await Product.countDocuments({
    vendor: req.vendor._id,
    status: { $ne: "archived" },
  });

  if (count >= limit) {
    return sendError(
      res,
      `Your ${plan} plan allows up to ${limit} products. Upgrade to add more.`,
      403,
    );
  }

  next();
};

/**
 * Middleware: check if vendor can create more orders this month.
 * Used on POST /api/orders.
 */
export const checkOrderLimit = async (req, res, next) => {
  const plan = req.vendor.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.ordersPerMonth ?? 50;

  if (limit === Infinity) return next();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await Order.countDocuments({
    vendor: req.vendor._id,
    createdAt: { $gte: startOfMonth },
  });

  if (count >= limit) {
    return sendError(
      res,
      `Your ${plan} plan allows up to ${limit} orders per month. Upgrade to continue.`,
      403,
    );
  }

  next();
};
