import mongoose from "mongoose";
import Vendor from "../models/vendorModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Subscription, { PLAN_LIMITS, PLAN_PRICES } from "../models/subscriptionModel.js";
import Announcement from "../models/announcementModel.js";

/* ═══════════════════════════════════════════════════════════════
 *  PLATFORM KPIs
 * ═══════════════════════════════════════════════════════════════ */

/**
 * Aggregates all top-level platform KPIs in a single pass.
 * Combines vendor counts, revenue, and order statistics.
 */
export async function getPlatformKPIs() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    vendorStats,
    orderStats,
    newVendorsToday,
    newVendorsThisMonth,
    newVendorsLastMonth,
    subscriptionStats,
  ] = await Promise.all([
    /* Vendor counts by status and plan */
    Vendor.aggregate([
      { $match: { role: "vendor" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          suspended: { $sum: { $cond: ["$isActive", 0, 1] } },
        },
      },
    ]),

    /* GMV and order counts */
    Order.aggregate([
      {
        $group: {
          _id: null,
          gmv: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),

    /* New vendors today */
    Vendor.countDocuments({
      role: "vendor",
      createdAt: { $gte: startOfToday },
    }),

    /* New vendors this month */
    Vendor.countDocuments({
      role: "vendor",
      createdAt: { $gte: startOfMonth },
    }),

    /* New vendors last month (for comparison) */
    Vendor.countDocuments({
      role: "vendor",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),

    /* Subscription MRR breakdown */
    Vendor.aggregate([
      { $match: { role: "vendor", isActive: true } },
      {
        $group: {
          _id: "$subscriptionPlan",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  /* Calculate MRR from subscription tier × vendor count */
  let mrr = 0;
  const tierBreakdown = {};
  for (const tier of subscriptionStats) {
    const plan = tier._id;
    const price = PLAN_PRICES[plan] || 0;
    const revenue = price * tier.count;
    mrr += revenue;
    tierBreakdown[plan] = { count: tier.count, revenue };
  }

  const vendors = vendorStats[0] || { total: 0, active: 0, suspended: 0 };
  const orders = orderStats[0] || { gmv: 0, totalOrders: 0, pendingOrders: 0, completedOrders: 0 };

  const avgOrderValue = orders.totalOrders > 0
    ? Math.round(orders.gmv / orders.totalOrders)
    : 0;

  const fulfillmentRate = orders.totalOrders > 0
    ? Math.round((orders.completedOrders / orders.totalOrders) * 100)
    : 0;

  const signupGrowth = newVendorsLastMonth > 0
    ? Math.round(((newVendorsThisMonth - newVendorsLastMonth) / newVendorsLastMonth) * 100)
    : null;

  return {
    vendors: {
      total: vendors.total,
      active: vendors.active,
      suspended: vendors.suspended,
    },
    signups: {
      today: newVendorsToday,
      thisMonth: newVendorsThisMonth,
      lastMonth: newVendorsLastMonth,
      growthPct: signupGrowth,
    },
    revenue: {
      mrr,
      tierBreakdown,
    },
    orders: {
      gmv: orders.gmv,
      total: orders.totalOrders,
      pending: orders.pendingOrders,
      avgOrderValue,
      fulfillmentRate,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
 *  VENDOR MANAGEMENT
 * ═══════════════════════════════════════════════════════════════ */

/**
 * Returns a paginated, filtered, and searchable list of vendors.
 */
export async function getVendorList({ page = 1, limit = 20, status, plan, search, sort }) {
  const skip = (page - 1) * limit;

  const filter = { role: "vendor" };

  if (status === "active") filter.isActive = true;
  if (status === "suspended") filter.isActive = false;

  if (plan && plan !== "all") filter.subscriptionPlan = plan;

  if (search) {
    filter.$or = [
      { businessName: { $regex: search, $options: "i" } },
      { handle: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { businessName: 1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select("-password -passwordResetToken -passwordResetExpires -socialMessaging -storefrontSettings"),
    Vendor.countDocuments(filter),
  ]);

  /* Attach product/order counts per vendor */
  const vendorIds = vendors.map((v) => v._id);
  const [productCounts, orderCounts] = await Promise.all([
    Product.aggregate([
      { $match: { vendor: { $in: vendorIds } } },
      { $group: { _id: "$vendor", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { vendor: { $in: vendorIds } } },
      {
        $group: {
          _id: "$vendor",
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
        },
      },
    ]),
  ]);

  const productMap = Object.fromEntries(productCounts.map((p) => [p._id.toString(), p.count]));
  const orderMap = Object.fromEntries(orderCounts.map((o) => [o._id.toString(), { count: o.count, revenue: o.revenue }]));

  const enriched = vendors.map((v) => {
    const id = v._id.toString();
    return {
      ...v.toJSON(),
      productCount: productMap[id] || 0,
      orderCount: orderMap[id]?.count || 0,
      totalRevenue: orderMap[id]?.revenue || 0,
    };
  });

  return {
    vendors: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Returns full vendor profile with aggregated stats.
 */
export async function getVendorById(vendorId) {
  const [vendor, productCount, orderStats, subscription] = await Promise.all([
    Vendor.findById(vendorId).select("-password -passwordResetToken -passwordResetExpires"),
    Product.countDocuments({ vendor: vendorId }),
    Order.aggregate([
      { $match: { vendor: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
          avgOrderValue: {
            $avg: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", null],
            },
          },
        },
      },
    ]),
    Subscription.findOne({ vendor: vendorId }),
  ]);

  if (!vendor) return null;

  const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };

  return {
    ...vendor.toJSON(),
    productCount,
    orderStats: stats,
    subscription,
  };
}

/* ═══════════════════════════════════════════════════════════════
 *  PLATFORM ANALYTICS
 * ═══════════════════════════════════════════════════════════════ */

/**
 * Revenue over time broken down by period.
 * @param {"daily"|"weekly"|"monthly"} period
 * @param {number} months — how many months back to query
 */
export async function getPlatformRevenueSeries(period = "monthly", months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  let groupId;
  if (period === "daily") {
    groupId = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    };
  } else if (period === "weekly") {
    groupId = {
      year: { $year: "$createdAt" },
      week: { $week: "$createdAt" },
    };
  } else {
    groupId = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    };
  }

  const series = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: groupId,
        revenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return series;
}

/**
 * Top performing vendors by GMV, order count, or product count.
 */
export async function getTopPerformers(metric = "revenue", limit = 10) {
  const sortField = metric === "orders" ? "orderCount" : "revenue";

  const results = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: "$vendor",
        revenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { [sortField]: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "vendors",
        localField: "_id",
        foreignField: "_id",
        as: "vendor",
        pipeline: [
          { $project: { businessName: 1, handle: 1, logo: 1, subscriptionPlan: 1, isActive: 1 } },
        ],
      },
    },
    { $unwind: "$vendor" },
    {
      $project: {
        vendor: 1,
        revenue: 1,
        orderCount: 1,
      },
    },
  ]);

  return results;
}

/**
 * Vendor cohort retention analysis.
 * Groups vendors by sign-up month and tracks how many are still active
 * in subsequent months.
 */
export async function getVendorCohorts(months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const cohorts = await Vendor.aggregate([
    { $match: { role: "vendor", createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: 1 },
        active: { $sum: { $cond: ["$isActive", 1, 0] } },
        paidSubscribers: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$subscriptionPlan", ["stitch", "drape", "atelier", "maison"]] },
                  { $eq: ["$isActive", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return cohorts.map((c) => ({
    year: c._id.year,
    month: c._id.month,
    total: c.total,
    active: c.active,
    retentionRate: c.total > 0 ? Math.round((c.active / c.total) * 100) : 0,
    paidSubscribers: c.paidSubscribers,
    conversionRate: c.total > 0 ? Math.round((c.paidSubscribers / c.total) * 100) : 0,
  }));
}

/* ═══════════════════════════════════════════════════════════════
 *  BILLING HEALTH
 * ═══════════════════════════════════════════════════════════════ */

export async function getBillingHealth() {
  const [planBreakdown, pastDue, inactive] = await Promise.all([
    Vendor.aggregate([
      { $match: { role: "vendor" } },
      {
        $group: {
          _id: { plan: "$subscriptionPlan", status: "$subscriptionStatus" },
          count: { $sum: 1 },
        },
      },
    ]),
    Vendor.find({ role: "vendor", subscriptionStatus: "past_due" })
      .select("businessName handle phone subscriptionPlan createdAt")
      .limit(50),
    Vendor.countDocuments({ role: "vendor", subscriptionStatus: "inactive" }),
  ]);

  /* Build MRR and tier counts */
  const tiers = {};
  let totalMrr = 0;

  for (const row of planBreakdown) {
    const plan = row._id.plan;
    const status = row._id.status;
    if (!tiers[plan]) tiers[plan] = { active: 0, pastDue: 0, inactive: 0, mrr: 0 };
    tiers[plan][status === "past_due" ? "pastDue" : status] += row.count;
    if (status === "active") {
      const planRevenue = (PLAN_PRICES[plan] || 0) * row.count;
      tiers[plan].mrr += planRevenue;
      totalMrr += planRevenue;
    }
  }

  return {
    totalMrr,
    tiers,
    pastDueVendors: pastDue,
    inactiveCount: inactive,
  };
}

/* ═══════════════════════════════════════════════════════════════
 *  CSV EXPORT
 * ═══════════════════════════════════════════════════════════════ */

/**
 * Generates a CSV string for the requested data type.
 * @param {"vendors"|"subscriptions"} type
 */
export async function generateCsvExport(type) {
  if (type === "vendors") {
    const vendors = await Vendor.find({ role: "vendor" })
      .select("businessName handle phone email isActive subscriptionPlan subscriptionStatus createdAt location")
      .lean();

    const headers = ["Business Name", "Handle", "Phone", "Email", "Active", "Plan", "Sub Status", "State", "City", "Joined"];
    const rows = vendors.map((v) => [
      v.businessName,
      v.handle,
      v.phone,
      v.email || "",
      v.isActive ? "Yes" : "No",
      v.subscriptionPlan,
      v.subscriptionStatus,
      v.location?.state || "",
      v.location?.city || "",
      new Date(v.createdAt).toISOString().split("T")[0],
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  if (type === "subscriptions") {
    const subs = await Subscription.find()
      .populate("vendor", "businessName handle phone")
      .lean();

    const headers = ["Business Name", "Handle", "Phone", "Plan", "Status", "Period Start", "Period End", "Cancel At End"];
    const rows = subs.map((s) => [
      s.vendor?.businessName || "",
      s.vendor?.handle || "",
      s.vendor?.phone || "",
      s.plan,
      s.status,
      s.currentPeriodStart ? new Date(s.currentPeriodStart).toISOString().split("T")[0] : "",
      s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toISOString().split("T")[0] : "",
      s.cancelAtPeriodEnd ? "Yes" : "No",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  throw new Error(`Unknown export type: ${type}`);
}
