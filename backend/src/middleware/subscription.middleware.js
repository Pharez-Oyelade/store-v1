import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import CustomRequest from "../models/customRequestModel.js";
import { PLAN_LIMITS } from "../models/subscriptionModel.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Middleware: check if vendor can create more products based on their plan.
 * Used on POST /api/products.
 */
export const checkProductLimit = async (req, res, next) => {
  const plan = req.vendor.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.products ?? 5;

  if (limit === Infinity) return next();

  const count = await Product.countDocuments({
    vendor: req.vendor._id,
    status: { $ne: "archived" },
  });

  if (count >= limit) {
    return sendError(
      res,
      `Your ${plan.toUpperCase()} plan allows up to ${limit} active products. Upgrade to add more.`,
      403,
    );
  }

  next();
};

/**
 * Middleware: check if vendor can create more orders or bespoke demands this month.
 * Used on POST /api/orders and POST /api/custom-requests.
 */
export const checkOrderLimit = async (req, res, next) => {
  const plan = req.vendor.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.ordersPerMonth ?? 5;

  if (limit === Infinity) return next();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [orderCount, customReqCount] = await Promise.all([
    Order.countDocuments({
      vendor: req.vendor._id,
      createdAt: { $gte: startOfMonth },
    }),
    CustomRequest.countDocuments({
      vendor: req.vendor._id,
      createdAt: { $gte: startOfMonth },
    }),
  ]);

  const totalCount = orderCount + customReqCount;

  if (totalCount >= limit) {
    return sendError(
      res,
      `Your ${plan.toUpperCase()} plan allows up to ${limit} orders/demands per month (Used: ${totalCount}). Upgrade to record more.`,
      403,
    );
  }

  next();
};

