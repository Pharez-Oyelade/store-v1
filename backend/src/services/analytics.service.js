import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";

const { Types } = mongoose;

/**
 * Revenue overview for the dashboard metric cards.
 * Returns: today / this week / this month revenue + order counts + debt + low stock
 */
export async function getRevenueOverview(vendorId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const vid = new Types.ObjectId(vendorId);

  const [revenueData, debtData, lowStockData] = await Promise.all([
    /*
     * Revenue aggregation: group completed orders by time window.
     * Using $facet to compute all three date ranges in a single query.
     */
    Order.aggregate([
      {
        $match: {
          vendor: vid,
          status: "completed",
        },
      },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
          ],
        },
      },
    ]),

    /* Total debt: sum of balanceOwed on non-completed/cancelled orders */
    Order.aggregate([
      {
        $match: {
          vendor: vid,
          status: { $nin: ["completed", "cancelled"] },
          balanceOwed: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: "$balanceOwed" },
          debtOrderCount: { $sum: 1 },
        },
      },
    ]),

    /* Low stock: count of variants at or below lowStockThreshold */
    Product.aggregate([
      { $match: { vendor: vid, status: "active" } },
      { $unwind: "$variants" },
      {
        $match: {
          $expr: { $lte: ["$variants.quantity", "$lowStockThreshold"] },
        },
      },
      { $count: "lowStockCount" },
    ]),
  ]);

  const r = revenueData[0] ?? { today: [], week: [], month: [] };
  const today = r.today[0] ?? { revenue: 0, count: 0 };
  const week = r.week[0] ?? { revenue: 0, count: 0 };
  const month = r.month[0] ?? { revenue: 0, count: 0 };

  return {
    revenueToday: today.revenue,
    ordersToday: today.count,
    revenueThisWeek: week.revenue,
    ordersThisWeek: week.count,
    revenueThisMonth: month.revenue,
    ordersThisMonth: month.count,
    totalDebt: debtData[0]?.totalDebt ?? 0,
    debtOrderCount: debtData[0]?.debtOrderCount ?? 0,
    lowStockCount: lowStockData[0]?.lowStockCount ?? 0,
  };
}

/**
 * Revenue time series for the chart.
 * @param {string} period - "daily" (last 14 days) | "weekly" (last 8 weeks) | "monthly" (last 6 months)
 */
export async function getRevenueSeries(vendorId, period = "daily") {
  const vid = new Types.ObjectId(vendorId);
  const now = new Date();
  let startDate;
  let groupByFormat;

  if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 56); // 8 weeks
    groupByFormat = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
  } else if (period === "monthly") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6);
    groupByFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
  } else {
    // daily — last 14 days
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 14);
    groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  }

  const data = await Order.aggregate([
    {
      $match: {
        vendor: vid,
        status: "completed",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: groupByFormat,
        revenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return data.map(({ _id, revenue, orderCount }) => ({
    date: _id,
    revenue,
    orderCount,
  }));
}

/**
 * Top products by units sold and revenue.
 */
export async function getTopProducts(vendorId, limit = 5) {
  const vid = new Types.ObjectId(vendorId);

  return Order.aggregate([
    { $match: { vendor: vid, status: "completed" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    {
      $project: {
        productId: "$_id",
        productName: 1,
        totalSold: 1,
        totalRevenue: 1,
        image: { $arrayElemAt: ["$productDoc.images.url", 0] },
      },
    },
  ]);
}

/**
 * Slow-moving inventory: products with no completed orders in the last 30 days.
 */
export async function getSlowMovers(vendorId) {
  const vid = new Types.ObjectId(vendorId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get product IDs that had at least one sale in the last 30 days
  const recentlySoldIds = await Order.distinct("items.product", {
    vendor: vid,
    status: "completed",
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Return active products NOT in that list
  return Product.find({
    vendor: vid,
    status: "active",
    _id: { $nin: recentlySoldIds },
  })
    .select("name images basePrice createdAt")
    .limit(10)
    .lean();
}

/**
 * Top customers by lifetime value.
 */
export async function getTopCustomers(vendorId, limit = 5) {
  return Customer.find({ vendor: vendorId })
    .sort({ ltv: -1 })
    .limit(limit)
    .select("name phone ltv orderCount lastOrderDate")
    .lean();
}
