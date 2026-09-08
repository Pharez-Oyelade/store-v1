import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  getRevenueOverview,
  getRevenueSeries,
  getTopProducts,
  getSlowMovers,
  getTopCustomers,
  getBespokeVsRtwBreakdown,
  getWorkshopProductivity,
  getMarginEstimator,
  generateVendorCsvExport,
} from "../services/analytics.service.js";

/* ── GET /api/analytics/overview ────────────────────────────────── */
export const getOverview = asyncHandler(async (req, res) => {
  const data = await getRevenueOverview(req.vendor._id);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/revenue?period=daily|weekly|monthly|yearly ─ */
export const getRevenue = asyncHandler(async (req, res) => {
  const { period = "daily" } = req.query;
  const plan = req.vendor.subscriptionPlan || "free";
  const data = await getRevenueSeries(req.vendor._id, period, plan);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/products/top ────────────────────────────── */
export const getTopProductsHandler = asyncHandler(async (req, res) => {
  const plan = req.vendor.subscriptionPlan || "free";
  let limit = Number(req.query.limit || 5);

  // Stitch is limited to top 3 products
  if (plan === "stitch") {
    limit = Math.min(3, limit);
  }

  const data = await getTopProducts(req.vendor._id, limit);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/products/slow ───────────────────────────── */
export const getSlowMoversHandler = asyncHandler(async (req, res) => {
  const data = await getSlowMovers(req.vendor._id);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/customers/top ───────────────────────────── */
export const getTopCustomersHandler = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const data = await getTopCustomers(req.vendor._id, Number(limit));
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/bespoke-vs-rtw (Atelier+) ────────────────── */
export const getBespokeVsRtwHandler = asyncHandler(async (req, res) => {
  const data = await getBespokeVsRtwBreakdown(req.vendor._id);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/workshop (Atelier+) ─────────────────────── */
export const getWorkshopProductivityHandler = asyncHandler(async (req, res) => {
  const data = await getWorkshopProductivity(req.vendor._id);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/margins (Atelier+) ──────────────────────── */
export const getMarginEstimatorHandler = asyncHandler(async (req, res) => {
  const data = await getMarginEstimator(req.vendor._id);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/export?type=orders|customers|inventory|financials */
export const exportVendorCsvHandler = asyncHandler(async (req, res) => {
  const { type = "orders" } = req.query;
  const plan = req.vendor.subscriptionPlan || "free";

  try {
    const csv = await generateVendorCsvExport(req.vendor._id, type, plan);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${req.vendor.handle || "vendra"}-${type}-${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(res, err.message, statusCode);
  }
});

