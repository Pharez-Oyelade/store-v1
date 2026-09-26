import { validationResult } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import Vendor from "../models/vendorModel.js";
import Announcement from "../models/announcementModel.js";
import AuditLog from "../models/auditLogModel.js";
import Subscription, { PLAN_LIMITS } from "../models/subscriptionModel.js";
import { invalidateVendorSyncCache } from "../services/subscription.service.js";
import { sendEmail } from "../services/email.service.js";
import {
  getPlatformKPIs,
  getVendorList,
  getVendorById,
  getPlatformRevenueSeries,
  getTopPerformers,
  getVendorCohorts,
  getBillingHealth,
  generateCsvExport,
  streamCsvExport,
} from "../services/admin.service.js";

/* ═══════════════════════════════════════════════════════════════
 *  DASHBOARD
 * ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/dashboard/kpis
 * Returns all platform KPIs for the admin overview page.
 */
export const getDashboardKpis = asyncHandler(async (req, res) => {
  const kpis = await getPlatformKPIs();
  sendSuccess(res, kpis, "Platform KPIs retrieved");
});

/* ═══════════════════════════════════════════════════════════════
 *  VENDOR MANAGEMENT
 * ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/vendors
 * Paginated, filterable, searchable vendor list.
 */
export const listVendors = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const {
    page = 1,
    limit = 20,
    status = "all",
    plan = "all",
    search = "",
    sort = "newest",
  } = req.query;

  const result = await getVendorList({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    plan,
    search,
    sort,
  });

  res.status(200).json({ success: true, ...result });
});

/**
 * GET /api/admin/vendors/:id
 * Full vendor profile with aggregated performance stats.
 */
export const getVendorProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await getVendorById(id);

  if (!vendor) return sendError(res, "Vendor not found", 404);

  sendSuccess(res, vendor, "Vendor profile retrieved");
});

/**
 * PUT /api/admin/vendors/:id/status
 * Suspend or activate a vendor. Requires reason when suspending.
 */
export const toggleVendorStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const { id } = req.params;
  const { isActive, reason } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) return sendError(res, "Vendor not found", 404);
  if (vendor.role === "admin") return sendError(res, "Cannot modify admin accounts", 403);

  const previousStatus = vendor.isActive;
  vendor.isActive = isActive;
  await vendor.save();

  /* Create audit log entry */
  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: isActive ? "vendor_activated" : "vendor_suspended",
    targetType: "vendor",
    targetId: vendor._id,
    targetName: vendor.businessName,
    details: {
      reason: reason || null,
      previousStatus,
      newStatus: isActive,
    },
    ipAddress: req.ip,
  });

  const message = isActive
    ? `${vendor.businessName} has been activated`
    : `${vendor.businessName} has been suspended`;

  sendSuccess(res, { vendorId: vendor._id, isActive: vendor.isActive }, message);
});

/**
 * PUT /api/admin/vendors/:id/subscription
 * Manually override a vendor's subscription plan.
 */
export const overrideVendorSubscription = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const { id } = req.params;
  const { plan, reason } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) return sendError(res, "Vendor not found", 404);

  const previousPlan = vendor.subscriptionPlan;
  vendor.subscriptionPlan = plan;
  vendor.subscriptionStatus = "active";
  await vendor.save();

  // 30 days period expiration window for non-free tiers
  const now = new Date();
  const periodEnd = plan === "free" ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Subscription.findOneAndUpdate(
    { vendor: vendor._id },
    {
      plan,
      status: "active",
      isTrial: false,
      expiryNoticeSent: false,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    { upsert: true, new: true },
  );

  invalidateVendorSyncCache(vendor._id);

  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: "vendor_subscription_changed",
    targetType: "vendor",
    targetId: vendor._id,
    targetName: vendor.businessName,
    details: { previousPlan, newPlan: plan, reason: reason || null, expiresAt: periodEnd },
    ipAddress: req.ip,
  });

  sendSuccess(
    res,
    { vendorId: vendor._id, subscriptionPlan: vendor.subscriptionPlan, periodEnd },
    `Subscription changed to ${plan} (expires in 30 days)`,
  );
});

/**
 * GET /api/admin/vendors/:id/audit-log
 * Returns all admin actions taken on a specific vendor.
 */
export const getVendorAuditLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const logs = await AuditLog.find({ targetId: id, targetType: "vendor" })
    .sort({ createdAt: -1 })
    .limit(50);

  sendSuccess(res, logs, "Audit log retrieved");
});

/* ═══════════════════════════════════════════════════════════════
 *  SUBSCRIPTION TIERS
 * ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/subscriptions/tiers
 * Returns current plan limits and pricing config.
 */
export const getSubscriptionTiers = asyncHandler(async (_req, res) => {
  const { PLAN_PRICES } = await import("../models/subscriptionModel.js");
  const plans = ["free", "stitch", "drape", "atelier", "maison"];

  const tiers = plans.map((plan) => ({
    plan,
    price: PLAN_PRICES[plan],
    limits: PLAN_LIMITS[plan],
  }));

  sendSuccess(res, tiers, "Subscription tiers retrieved");
});

/**
 * GET /api/admin/subscriptions/health
 * Billing health: MRR breakdown, past-due accounts, churn data.
 */
export const getSubscriptionHealth = asyncHandler(async (_req, res) => {
  const health = await getBillingHealth();
  sendSuccess(res, health, "Billing health retrieved");
});

/* ═══════════════════════════════════════════════════════════════
 *  PLATFORM ANALYTICS
 * ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/analytics/revenue?period=monthly&months=6
 */
export const getPlatformRevenue = asyncHandler(async (req, res) => {
  const { period = "monthly", months = 6 } = req.query;
  const series = await getPlatformRevenueSeries(period, parseInt(months));
  sendSuccess(res, series, "Revenue series retrieved");
});

/**
 * GET /api/admin/analytics/cohorts?months=6
 */
export const getVendorCohortsHandler = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  const cohorts = await getVendorCohorts(parseInt(months));
  sendSuccess(res, cohorts, "Vendor cohorts retrieved");
});

/**
 * GET /api/admin/analytics/top-performers?metric=revenue&limit=10
 */
export const getTopPerformersHandler = asyncHandler(async (req, res) => {
  const { metric = "revenue", limit = 10 } = req.query;
  const performers = await getTopPerformers(metric, parseInt(limit));
  sendSuccess(res, performers, "Top performers retrieved");
});

/**
 * GET /api/admin/analytics/export?type=vendors
 * Streams a CSV download for the requested data type.
 */
export const exportData = asyncHandler(async (req, res) => {
  const { type = "vendors" } = req.query;

  if (!["vendors", "subscriptions"].includes(type)) {
    return sendError(res, "Invalid export type. Use: vendors, subscriptions", 400);
  }

  await streamCsvExport(type, res);
});

/* ═══════════════════════════════════════════════════════════════
 *  ANNOUNCEMENTS
 * ═══════════════════════════════════════════════════════════════ */

/**
 * POST /api/admin/announcements
 */
export const createAnnouncement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const { title, message, type, targetTier, expiresAt } = req.body;

  const announcement = await Announcement.create({
    title,
    message,
    type,
    targetTier: targetTier || null,
    expiresAt: expiresAt || null,
    createdBy: req.vendor._id,
    isActive: true,
  });

  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: "announcement_created",
    targetType: "announcement",
    targetId: announcement._id,
    targetName: title,
    details: { type, targetTier },
    ipAddress: req.ip,
  });

  sendSuccess(res, announcement, "Announcement created", 201);
});

/**
 * GET /api/admin/announcements
 * All announcements (active + expired).
 */
export const listAnnouncements = asyncHandler(async (_req, res) => {
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "businessName");

  sendSuccess(res, announcements, "Announcements retrieved");
});

/**
 * PUT /api/admin/announcements/:id
 */
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const { id } = req.params;
  const { title, message, type, targetTier, expiresAt, isActive } = req.body;

  const announcement = await Announcement.findByIdAndUpdate(
    id,
    { title, message, type, targetTier: targetTier || null, expiresAt: expiresAt || null, isActive },
    { new: true, runValidators: true },
  );

  if (!announcement) return sendError(res, "Announcement not found", 404);

  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: "announcement_updated",
    targetType: "announcement",
    targetId: announcement._id,
    targetName: announcement.title,
    details: {},
    ipAddress: req.ip,
  });

  sendSuccess(res, announcement, "Announcement updated");
});

/**
 * DELETE /api/admin/announcements/:id
 */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) return sendError(res, "Announcement not found", 404);

  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: "announcement_deleted",
    targetType: "announcement",
    targetId: announcement._id,
    targetName: announcement.title,
    details: {},
    ipAddress: req.ip,
  });

  sendSuccess(res, null, "Announcement deleted");
});

/* ═══════════════════════════════════════════════════════════════
 *  VENDOR-FACING: Active Announcements
 * ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/announcements/active
 * Returns active announcements relevant to the authenticated vendor's tier.
 * Called from the vendor dashboard — NOT admin-only.
 */
export const getActiveAnnouncementsForVendor = asyncHandler(async (req, res) => {
  const vendorPlan = req.vendor?.subscriptionPlan || "free";
  const now = new Date();

  const announcements = await Announcement.find({
    isActive: true,
    $and: [
      { $or: [{ targetTier: null }, { targetTier: vendorPlan }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  })
    .sort({ createdAt: -1 })
    .select("title message type expiresAt createdAt");


  sendSuccess(res, announcements, "Active announcements retrieved");
});

/* ═══════════════════════════════════════════════════════════════
 *  ADMIN EMAIL MESSAGING
 * ═══════════════════════════════════════════════════════════════ */

/**
 * POST /api/admin/vendors/:id/email
 * Send a direct email to a specific vendor.
 */
export const sendDirectVendorEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const { id } = req.params;
  const { subject, message } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) return sendError(res, "Vendor not found", 404);
  if (!vendor.email) return sendError(res, "Vendor does not have a registered email address", 400);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0D6B31; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0D6B31; margin: 0; font-size: 20px;">Vendra Admin Team</h2>
      </div>
      <p style="font-size: 15px; color: #111827;">Hello <strong>${vendor.businessName}</strong>,</p>
      <div style="font-size: 14px; color: #374151; line-height: 1.6; margin: 16px 0;">
        ${message.replace(/\n/g, "<br/>")}
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        This email was sent by the Vendra Platform Administrators.
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: vendor.email,
    subject,
    html,
    text: message,
  });

  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: "vendor_email_sent",
    targetType: "vendor",
    targetId: vendor._id,
    targetName: vendor.businessName,
    details: { subject, recipient: vendor.email },
    ipAddress: req.ip,
  });

  sendSuccess(res, result, `Email sent to ${vendor.businessName}`);
});

/**
 * POST /api/admin/vendors/email-segment
 * Send an email to a group of vendors (active, inactive, suspended, or plan).
 */
export const sendSegmentVendorEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, "Validation failed", 422, errors.mapped());

  const { segment = "all", plan = "all", subject, message } = req.body;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filter = { role: "vendor", email: { $exists: true, $ne: "" } };

  if (segment === "active") {
    filter.isActive = true;
    filter.lastLogin = { $gte: thirtyDaysAgo };
  } else if (segment === "inactive") {
    filter.isActive = true;
    filter.$or = [
      { lastLogin: { $exists: false } },
      { lastLogin: null },
      { lastLogin: { $lt: thirtyDaysAgo } },
    ];
  } else if (segment === "suspended") {
    filter.isActive = false;
  }

  if (plan && plan !== "all") {
    filter.subscriptionPlan = plan;
  }

  const vendors = await Vendor.find(filter).select("businessName email");
  if (vendors.length === 0) {
    return sendSuccess(res, { recipientCount: 0 }, "No vendors match the specified criteria.");
  }

  let sentCount = 0;
  for (const v of vendors) {
    if (v.email) {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #0D6B31; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0D6B31; margin: 0; font-size: 20px;">Vendra Announcement</h2>
          </div>
          <p style="font-size: 15px; color: #111827;">Hello <strong>${v.businessName}</strong>,</p>
          <div style="font-size: 14px; color: #374151; line-height: 1.6; margin: 16px 0;">
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            Sent to your registered store address on Vendra.
          </p>
        </div>
      `;
      await sendEmail({ to: v.email, subject, html, text: message });
      sentCount++;
    }
  }

  await AuditLog.log({
    adminId: req.vendor._id,
    adminName: req.vendor.businessName,
    action: "segment_email_broadcast",
    targetType: "announcement",
    targetId: req.vendor._id,
    targetName: `Broadcast to ${segment} vendors`,
    details: { segment, plan, subject, count: sentCount },
    ipAddress: req.ip,
  });

  sendSuccess(res, { recipientCount: sentCount }, `Email dispatched to ${sentCount} vendor(s) in segment "${segment}"`);
});
