import { PLAN_LIMITS } from "../models/subscriptionModel.js";
import Supplier from "../models/supplierModel.js";
import Invoice from "../models/invoiceModel.js";
import Customer from "../models/customerModel.js";
import { sendError } from "../utils/apiResponse.js";

export const PLAN_WEIGHTS = {
  free: 0,
  stitch: 1,
  drape: 2,
  atelier: 3,
  maison: 4,
};

/**
 * Checks if a current plan meets or exceeds the required minimum plan tier.
 */
export const hasMinPlan = (currentPlan, requiredPlan) => {
  const currentWeight = PLAN_WEIGHTS[currentPlan?.toLowerCase()] ?? 0;
  const requiredWeight = PLAN_WEIGHTS[requiredPlan?.toLowerCase()] ?? 0;
  return currentWeight >= requiredWeight;
};

/**
 * Middleware: Enforce minimum subscription plan for a route.
 * Admin users automatically bypass plan restrictions.
 */
export const requireMinPlan = (requiredPlan, featureName = "this feature") => {
  return (req, res, next) => {
    // Platform admins or internal superusers bypass plan restrictions
    if (req.vendor?.role === "admin" || req.user?.role === "admin") {
      return next();
    }

    const currentPlan = req.vendor?.subscriptionPlan || "free";

    if (hasMinPlan(currentPlan, requiredPlan)) {
      return next();
    }

    return sendError(
      res,
      `Your ${currentPlan.toUpperCase()} plan does not include ${featureName}. Upgrade to ${requiredPlan.toUpperCase()} or higher to access it.`,
      403,
      {
        requiredPlan,
        currentPlan,
        code: "PLAN_UPGRADE_REQUIRED",
      }
    );
  };
};

/**
 * Middleware: Check if vendor can create another supplier based on plan limit.
 * Free: 0 (locked)
 * Stitch: 3 suppliers
 * Drape+: Unlimited
 */
export const checkSupplierLimit = async (req, res, next) => {
  if (req.vendor?.role === "admin" || req.user?.role === "admin") {
    return next();
  }

  const plan = req.vendor?.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.suppliers ?? 0;

  if (limit === Infinity) return next();

  if (limit === 0) {
    return sendError(
      res,
      `Your ${plan.toUpperCase()} plan does not include supplier management. Upgrade to The Stitch (up to 3 suppliers) or The Drape (unlimited) to record suppliers and track fabric debt.`,
      403,
      { requiredPlan: "stitch", currentPlan: plan, code: "PLAN_UPGRADE_REQUIRED" }
    );
  }

  const count = await Supplier.countDocuments({
    vendor: req.vendor._id,
  });

  if (count >= limit) {
    return sendError(
      res,
      `Your ${plan.toUpperCase()} plan allows up to ${limit} suppliers (Used: ${count}). Upgrade to The Drape for unlimited supplier and material debt tracking.`,
      403,
      { requiredPlan: "drape", currentPlan: plan, code: "PLAN_LIMIT_REACHED" }
    );
  }

  next();
};

/**
 * Middleware: Check if vendor can create an invoice this month.
 * Free: 5/month
 * Stitch: 50/month
 * Drape: 500/month
 * Atelier+: Unlimited
 */
export const checkInvoiceLimit = async (req, res, next) => {
  if (req.vendor?.role === "admin" || req.user?.role === "admin") {
    return next();
  }

  const plan = req.vendor?.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.invoicesPerMonth ?? 5;

  if (limit === Infinity) return next();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await Invoice.countDocuments({
    vendor: req.vendor._id,
    createdAt: { $gte: startOfMonth },
  });

  if (count >= limit) {
    return sendError(
      res,
      `Your ${plan.toUpperCase()} plan allows up to ${limit} invoices per month (Used: ${count}). Upgrade to create more invoices.`,
      403,
      { limit, count, currentPlan: plan, code: "PLAN_LIMIT_REACHED" }
    );
  }

  next();
};

/**
 * Middleware: Check if vendor can add another customer.
 * Free: 10
 * Stitch: 100
 * Drape+: Unlimited
 */
export const checkCustomerLimit = async (req, res, next) => {
  if (req.vendor?.role === "admin" || req.user?.role === "admin") {
    return next();
  }

  const plan = req.vendor?.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan]?.customers ?? 10;

  if (limit === Infinity) return next();

  const count = await Customer.countDocuments({
    vendor: req.vendor._id,
  });

  if (count >= limit) {
    return sendError(
      res,
      `Your ${plan.toUpperCase()} plan allows up to ${limit} customer profiles (Used: ${count}). Upgrade your plan to manage more customer measurements and orders.`,
      403,
      { limit, count, currentPlan: plan, code: "PLAN_LIMIT_REACHED" }
    );
  }

  next();
};
