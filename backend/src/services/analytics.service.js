import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import CustomRequest from "../models/customRequestModel.js";
import Supplier from "../models/supplierModel.js";
import TeamMember from "../models/teamMemberModel.js";

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
            {
              $match: {
                $expr: {
                  $gte: [{ $ifNull: ["$completedAt", "$updatedAt"] }, startOfDay],
                },
              },
            },
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
            {
              $match: {
                $expr: {
                  $gte: [{ $ifNull: ["$completedAt", "$updatedAt"] }, startOfWeek],
                },
              },
            },
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
            {
              $match: {
                $expr: {
                  $gte: [{ $ifNull: ["$completedAt", "$updatedAt"] }, startOfMonth],
                },
              },
            },
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
 * @param {string} period - "daily" (last 14 days) | "weekly" (last 8 weeks) | "monthly" (last 6 months) | "yearly" (last 12 months)
 * @param {string} plan - Vendor's subscription plan (Stitch is locked to 7-day daily)
 */
export async function getRevenueSeries(vendorId, period = "daily", plan = "stitch") {
  const vid = new Types.ObjectId(vendorId);
  const now = new Date();
  let startDate;
  let dateFormat = "%Y-%m-%d";

  if (plan === "stitch") {
    // Stitch is strictly capped to the last 7 days daily snapshot
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    dateFormat = "%Y-%m-%d";
  } else if (period === "yearly") {
    // 12 months retention for Drape / Atelier
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
    dateFormat = "%Y-%m";
  } else if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 56); // 8 weeks
    dateFormat = "%Y-W%V";
  } else if (period === "monthly") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6);
    dateFormat = "%Y-%m";
  } else {
    // daily — last 14 days
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 14);
    dateFormat = "%Y-%m-%d";
  }

  const groupByFormat = { $dateToString: { format: dateFormat, date: "$createdAt" } };
  const bespokeGroupByFormat = {
    $dateToString: {
      format: dateFormat,
      date: { $ifNull: ["$completedAt", "$updatedAt"] },
    },
  };

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
          $expr: {
            $gte: [{ $ifNull: ["$completedAt", "$updatedAt"] }, startDate],
          },
        },
      },
      {
        $group: {
          _id: bespokeGroupByFormat,
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

/**
 * Atelier: Bespoke Demand vs Ready-to-Wear (RTW) Revenue and Order breakdown.
 */
export async function getBespokeVsRtwBreakdown(vendorId) {
  const vid = new Types.ObjectId(vendorId);

  const [rtwData, bespokeData] = await Promise.all([
    Order.aggregate([
      { $match: { vendor: vid, status: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    CustomRequest.aggregate([
      { $match: { vendor: vid, status: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $gt: ["$agreedPrice", 0] },
                "$agreedPrice",
                { $ifNull: ["$estimatedPrice", 0] },
              ],
            },
          },
          demandCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const rtwRev = rtwData[0]?.totalRevenue || 0;
  const rtwCount = rtwData[0]?.orderCount || 0;
  const bespokeRev = bespokeData[0]?.totalRevenue || 0;
  const bespokeCount = bespokeData[0]?.demandCount || 0;
  const combinedTotal = rtwRev + bespokeRev;

  const rtwPercent = combinedTotal > 0 ? Math.round((rtwRev / combinedTotal) * 100) : 0;
  const bespokePercent = combinedTotal > 0 ? Math.round((bespokeRev / combinedTotal) * 100) : 0;

  const rtwAov = rtwCount > 0 ? Math.round(rtwRev / rtwCount) : 0;
  const bespokeAov = bespokeCount > 0 ? Math.round(bespokeRev / bespokeCount) : 0;

  return {
    rtw: {
      revenue: rtwRev,
      count: rtwCount,
      percent: rtwPercent,
      aov: rtwAov,
    },
    bespoke: {
      revenue: bespokeRev,
      count: bespokeCount,
      percent: bespokePercent,
      aov: bespokeAov,
    },
    combinedTotal,
    totalVolume: rtwCount + bespokeCount,
  };
}

/**
 * Atelier: Workshop & Tailor Productivity Analytics.
 */
export async function getWorkshopProductivity(vendorId) {
  const vid = new Types.ObjectId(vendorId);

  const [tailors, demands] = await Promise.all([
    TeamMember.find({ vendor: vid, role: "tailor", isActive: true })
      .select("name email phone")
      .lean(),
    CustomRequest.find({
      vendor: vid,
      status: { $in: ["in_progress", "fitting", "completed"] },
    })
      .select("title assignedTailor status createdAt completedAt updatedAt agreedPrice estimatedPrice")
      .lean(),
  ]);

  // Aggregate stats per tailor
  const tailorMap = new Map();
  tailors.forEach((t) => {
    tailorMap.set(t._id.toString(), {
      tailorId: t._id,
      name: t.name,
      activeCount: 0,
      completedCount: 0,
      totalTurnaroundDays: 0,
      avgTurnaroundDays: 0,
    });
  });

  const unassigned = {
    tailorId: "unassigned",
    name: "Unassigned Workshop Pool",
    activeCount: 0,
    completedCount: 0,
    totalTurnaroundDays: 0,
    avgTurnaroundDays: 0,
  };

  demands.forEach((d) => {
    const key = d.assignedTailor ? d.assignedTailor.toString() : "unassigned";
    const target = key === "unassigned" ? unassigned : tailorMap.get(key);

    if (target) {
      if (d.status === "completed") {
        target.completedCount += 1;
        const start = new Date(d.createdAt).getTime();
        const end = d.completedAt ? new Date(d.completedAt).getTime() : new Date(d.updatedAt).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        target.totalTurnaroundDays += days;
      } else {
        target.activeCount += 1;
      }
    }
  });

  const tailorStats = Array.from(tailorMap.values()).map((t) => ({
    ...t,
    avgTurnaroundDays: t.completedCount > 0 ? Math.round(t.totalTurnaroundDays / t.completedCount) : 0,
  }));

  if (unassigned.activeCount > 0 || unassigned.completedCount > 0) {
    unassigned.avgTurnaroundDays =
      unassigned.completedCount > 0 ? Math.round(unassigned.totalTurnaroundDays / unassigned.completedCount) : 0;
    tailorStats.push(unassigned);
  }

  const totalCompleted = tailorStats.reduce((acc, t) => acc + t.completedCount, 0);
  const totalActive = tailorStats.reduce((acc, t) => acc + t.activeCount, 0);
  const avgOverallTurnaround =
    totalCompleted > 0
      ? Math.round(tailorStats.reduce((acc, t) => acc + t.totalTurnaroundDays, 0) / totalCompleted)
      : 0;

  return {
    tailorStats,
    summary: {
      totalTailors: tailors.length,
      totalActiveDemands: totalActive,
      totalCompletedDemands: totalCompleted,
      avgOverallTurnaroundDays: avgOverallTurnaround,
    },
  };
}

/**
 * Atelier: Gross Margin Estimator & Unit Economics.
 */
export async function getMarginEstimator(vendorId) {
  const vid = new Types.ObjectId(vendorId);

  const [orderRev, bespokeRev, suppliersData, customerStats] = await Promise.all([
    Order.aggregate([
      { $match: { vendor: vid, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]),
    CustomRequest.aggregate([
      { $match: { vendor: vid, status: "completed" } },
      {
        $group: {
          _id: null,
          total: {
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
    ]),
    Supplier.aggregate([
      { $match: { vendor: vid } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$totalPurchaseAmount" },
          outstandingDebt: { $sum: "$outstandingBalance" },
          supplierCount: { $sum: 1 },
        },
      },
    ]),
    Customer.aggregate([
      { $match: { vendor: vid } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const grossRevenue = (orderRev[0]?.total || 0) + (bespokeRev[0]?.total || 0);
  const totalOrders = (orderRev[0]?.count || 0) + (bespokeRev[0]?.count || 0);
  const supplierExpenses = suppliersData[0]?.totalPurchases || 0;
  const supplierDebt = suppliersData[0]?.outstandingDebt || 0;

  const estimatedGrossProfit = Math.max(0, grossRevenue - supplierExpenses);
  const profitMarginPercent =
    grossRevenue > 0 ? Math.round((estimatedGrossProfit / grossRevenue) * 100) : 0;
  const aov = totalOrders > 0 ? Math.round(grossRevenue / totalOrders) : 0;

  const totalCust = customerStats[0]?.totalCustomers || 0;
  const repeatCust = customerStats[0]?.repeatCustomers || 0;
  const repeatRate = totalCust > 0 ? Math.round((repeatCust / totalCust) * 100) : 0;

  return {
    grossRevenue,
    supplierExpenses,
    supplierDebt,
    estimatedGrossProfit,
    profitMarginPercent,
    aov,
    totalCompletedOrders: totalOrders,
    totalCustomers: totalCust,
    repeatCustomers: repeatCust,
    repeatRatePercent: repeatRate,
  };
}

/**
 * Drape (orders only) and Atelier/Maison (all types): CSV Export.
 */
export async function generateVendorCsvExport(vendorId, type, plan) {
  const vid = new Types.ObjectId(vendorId);

  // Authorization check: Drape can only export "orders"
  if (plan === "drape" && type !== "orders") {
    const err = new Error(
      "Your Drape plan includes Orders CSV export. Upgrade to The Atelier for Full Financial, Customer, and Inventory CSV exports."
    );
    err.statusCode = 403;
    throw err;
  }

  if (type === "orders") {
    const orders = await Order.find({ vendor: vid })
      .sort({ createdAt: -1 })
      .select("orderNumber customerSnapshot totalAmount depositPaid balanceOwed status createdAt items channel")
      .lean();

    const headers = [
      "Order Date",
      "Customer Name",
      "Customer Phone",
      "Customer Email",
      "Channel",
      "Items Count",
      "Total Amount (NGN)",
      "Deposit Paid (NGN)",
      "Balance Owed (NGN)",
      "Status",
    ];

    const rows = orders.map((o) => [
      new Date(o.createdAt).toISOString().split("T")[0],
      o.customerSnapshot?.name || "",
      o.customerSnapshot?.phone || "",
      o.customerSnapshot?.email || "",
      o.channel || "direct",
      o.items?.length || 0,
      o.totalAmount || 0,
      o.depositPaid || 0,
      o.balanceOwed || 0,
      o.status,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  if (type === "customers") {
    const customers = await Customer.find({ vendor: vid })
      .sort({ ltv: -1 })
      .select("name phone email ltv orderCount lastOrderDate tags notes createdAt")
      .lean();

    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Lifetime Value (NGN)",
      "Completed Orders",
      "Last Order Date",
      "Tags",
      "Notes",
      "Customer Since",
    ];

    const rows = customers.map((c) => [
      c.name || "",
      c.phone || "",
      c.email || "",
      c.ltv || 0,
      c.orderCount || 0,
      c.lastOrderDate ? new Date(c.lastOrderDate).toISOString().split("T")[0] : "",
      (c.tags || []).join("; "),
      c.notes || "",
      new Date(c.createdAt).toISOString().split("T")[0],
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  if (type === "inventory") {
    const products = await Product.find({ vendor: vid })
      .sort({ createdAt: -1 })
      .select("name category basePrice status variants lowStockThreshold createdAt")
      .lean();

    const headers = [
      "Product Name",
      "Category",
      "Base Price (NGN)",
      "Status",
      "Low Stock Threshold",
      "Variants / Sizes",
      "Total Quantity In Stock",
      "Created Date",
    ];

    const rows = products.map((p) => {
      const totalQty = (p.variants || []).reduce((acc, v) => acc + (v.quantity || 0), 0);
      const variantsSummary = (p.variants || [])
        .map((v) => `${v.size || v.color || "Variant"}: ${v.quantity}`)
        .join("; ");

      return [
        p.name,
        p.category || "RTW",
        p.basePrice || 0,
        p.status,
        p.lowStockThreshold || 0,
        variantsSummary,
        totalQty,
        new Date(p.createdAt).toISOString().split("T")[0],
      ];
    });

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  if (type === "financials") {
    const [orders, customReqs, suppliers] = await Promise.all([
      Order.find({ vendor: vid, status: "completed" })
        .select("createdAt totalAmount channel items")
        .lean(),
      CustomRequest.find({ vendor: vid, status: "completed" })
        .select("updatedAt agreedPrice estimatedPrice title")
        .lean(),
      Supplier.find({ vendor: vid })
        .select("name totalPurchaseAmount outstandingBalance purchases")
        .lean(),
    ]);

    const headers = [
      "Record Type",
      "Date",
      "Description / Reference",
      "Credit Revenue (NGN)",
      "Debit Expense (NGN)",
      "Balance Owed (NGN)",
    ];
    const rows = [];

    orders.forEach((o) => {
      rows.push([
        "RTW Order",
        new Date(o.createdAt).toISOString().split("T")[0],
        `Order (${o.items?.length || 1} items)`,
        o.totalAmount || 0,
        0,
        0,
      ]);
    });

    customReqs.forEach((c) => {
      const amount = c.agreedPrice || c.estimatedPrice || 0;
      rows.push([
        "Bespoke Demand",
        new Date(c.updatedAt).toISOString().split("T")[0],
        `Bespoke: ${c.title || "Custom garment"}`,
        amount,
        0,
        0,
      ]);
    });

    suppliers.forEach((s) => {
      (s.purchases || []).forEach((p) => {
        rows.push([
          "Supplier Material",
          new Date(p.date).toISOString().split("T")[0],
          `${s.name}: ${p.description || "Fabric/Trims"}`,
          0,
          p.amount || 0,
          (p.amount || 0) - (p.paidAmount || 0),
        ]);
      });
    });

    rows.sort((a, b) => (a[1] < b[1] ? 1 : -1));

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  throw new Error(`Unknown export type: ${type}`);
}

