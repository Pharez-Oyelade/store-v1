import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  getRevenueOverview,
  getRevenueSeries,
  getTopProducts,
  getSlowMovers,
  getTopCustomers,
} from "../services/analytics.service.js";

/* ── GET /api/analytics/overview ────────────────────────────────── */
export const getOverview = asyncHandler(async (req, res) => {
  const data = await getRevenueOverview(req.vendor._id);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/revenue?period=daily|weekly|monthly ──────── */
export const getRevenue = asyncHandler(async (req, res) => {
  const { period = "daily" } = req.query;
  const data = await getRevenueSeries(req.vendor._id, period);
  return sendSuccess(res, data);
});

/* ── GET /api/analytics/products/top ────────────────────────────── */
export const getTopProductsHandler = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const data = await getTopProducts(req.vendor._id, Number(limit));
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
