import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import CustomRequest from "../models/customRequestModel.js";

const { Types } = mongoose;

/**
 * Revenue overview for the dashboard metric cards.
 * Returns: today / this week / this month revenue + order counts + debt + low stock + bespoke metrics
 */
export async function getRevenueOverview(vendorId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const vid = new Types.ObjectId(vendorId);

  const [revenueData, bespokeRevenueData, debtData, lowStockData, bespokeData] = await Promise.all([
    /*
     * Revenue aggregation: group completed orders by time window.
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

    /*
     * Bespoke completed requests revenue aggregation
     */
    CustomRequest.aggregate([
      {
        $match: {
          vendor: vid,
          status: "completed",
        },
      },
      {
        $facet: {
          today: [
            { $match: { updatedAt: { $gte: startOfDay } } },
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: {
                    $cond: [
                      { $gt: ["$agreedPrice", 0] },
                      "$agreedPrice",
                      { $ifNull: ["$estimatedPrice", 0] },
                    ],
                  },
                },
                count: { $sum: 1 },
              },
            },
          ],
          week: [
            { $match: { updatedAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: {
                    $cond: [
                      { $gt: ["$agreedPrice", 0] },
                      "$agreedPrice",
                      { $ifNull: ["$estimatedPrice", 0] },
                    ],
                  },
                },
                count: { $sum: 1 },
              },
            },
          ],
          month: [
            { $match: { updatedAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: {
                    $cond: [
                      { $gt: ["$agreedPrice", 0] },
                      "$agreedPrice",
                      { $ifNull: ["$estimatedPrice", 0] },
                    ],
                  },
                },
                count: { $sum: 1 },
              },
            },
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

    /* Bespoke / Custom requests metrics */
    Promise.all([
      CustomRequest.countDocuments({
        vendor: vid,
        status: { $nin: ["completed", "cancelled"] },
      }),
      CustomRequest.countDocuments({
        vendor: vid,
        status: { $nin: ["completed", "cancelled"] },
        deadline: { $lt: now, $ne: null },
      }),
      CustomRequest.aggregate([
        {
          $match: {
            vendor: vid,
            status: { $ne: "cancelled" },
            balanceOwed: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalBespokeDebt: { $sum: "$balanceOwed" },
            bespokeDebtCount: { $sum: 1 },
          },
        },
      ]),
    ]),
  ]);

  const r = revenueData[0] ?? { today: [], week: [], month: [] };
  const br = bespokeRevenueData[0] ?? { today: [], week: [], month: [] };

  const today = r.today[0] ?? { revenue: 0, count: 0 };
  const bToday = br.today[0] ?? { revenue: 0, count: 0 };

  const week = r.week[0] ?? { revenue: 0, count: 0 };
  const bWeek = br.week[0] ?? { revenue: 0, count: 0 };

  const month = r.month[0] ?? { revenue: 0, count: 0 };
  const bMonth = br.month[0] ?? { revenue: 0, count: 0 };

  const [activeDemands, overdueDemands, bespokeDebtAgg] = bespokeData || [0, 0, []];
  const totalBespokeDebt = bespokeDebtAgg[0]?.totalBespokeDebt ?? 0;
  const bespokeDebtCount = bespokeDebtAgg[0]?.bespokeDebtCount ?? 0;

  return {
    revenueToday: today.revenue + bToday.revenue,
    ordersToday: today.count + bToday.count,
    revenueThisWeek: week.revenue + bWeek.revenue,
    ordersThisWeek: week.count + bWeek.count,
    revenueThisMonth: month.revenue + bMonth.revenue,
    ordersThisMonth: month.count + bMonth.count,
    totalDebt: (debtData[0]?.totalDebt ?? 0) + totalBespokeDebt,
    debtOrderCount: (debtData[0]?.debtOrderCount ?? 0) + bespokeDebtCount,
    lowStockCount: lowStockData[0]?.lowStockCount ?? 0,
    activeDemandsCount: activeDemands,
    overdueDemandsCount: overdueDemands,
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

  const [ordersData, bespokeData] = await Promise.all([
    Order.aggregate([
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
    ]),
    CustomRequest.aggregate([
      {
        $match: {
          vendor: vid,
          status: "completed",
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupByFormat,
          revenue: {
            $sum: {
              $cond: [
                { $gt: ["$agreedPrice", 0] },
                "$agreedPrice",
                { $ifNull: ["$estimatedPrice", 0] },
              ],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Merge map by date key
  const seriesMap = new Map();

  ordersData.forEach(({ _id, revenue, orderCount }) => {
    seriesMap.set(_id, { date: _id, revenue, orderCount });
  });

  bespokeData.forEach(({ _id, revenue, orderCount }) => {
    if (seriesMap.has(_id)) {
      const existing = seriesMap.get(_id);
      existing.revenue += revenue;
      existing.orderCount += orderCount;
    } else {
      seriesMap.set(_id, { date: _id, revenue, orderCount });
    }
  });

  return Array.from(seriesMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
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
