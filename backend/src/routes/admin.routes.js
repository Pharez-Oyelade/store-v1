import { Router } from "express";
import { protect, restrictTo } from "../middleware/protect.js";
import {
  getDashboardKpis,
  listVendors,
  getVendorProfile,
  toggleVendorStatus,
  overrideVendorSubscription,
  getVendorAuditLog,
  getSubscriptionTiers,
  getSubscriptionHealth,
  getPlatformRevenue,
  getVendorCohortsHandler,
  getTopPerformersHandler,
  exportData,
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncementsForVendor,
} from "../controllers/admin.controller.js";
import {
  validateVendorStatusToggle,
  validateSubscriptionOverride,
  validateAnnouncement,
  validateVendorListQuery,
} from "../validators/admin.validator.js";

const router = Router();

/*
 * Vendor-facing: active announcements for the dashboard banner.
 * Uses `protect` (any authenticated user) but NOT restrictTo("admin").
 * Must be defined BEFORE the admin-only middleware below.
 */
router.get("/announcements/active", protect, getActiveAnnouncementsForVendor);

/*
 * All routes below this line are admin-only.
 * protect → verifies JWT and attaches req.vendor
 * restrictTo("admin") → confirms req.vendor.role === "admin"
 */
router.use(protect, restrictTo("admin"));

/* ── Dashboard ──────────────────────────────────────────── */
router.get("/dashboard/kpis", getDashboardKpis);

/* ── Vendor Management ──────────────────────────────────── */
router.get("/vendors", validateVendorListQuery, listVendors);
router.get("/vendors/:id", getVendorProfile);
router.get("/vendors/:id/audit-log", getVendorAuditLog);
router.put("/vendors/:id/status", validateVendorStatusToggle, toggleVendorStatus);
router.put("/vendors/:id/subscription", validateSubscriptionOverride, overrideVendorSubscription);

/* ── Subscription Tiers & Billing ───────────────────────── */
router.get("/subscriptions/tiers", getSubscriptionTiers);
router.get("/subscriptions/health", getSubscriptionHealth);

/* ── Platform Analytics ─────────────────────────────────── */
router.get("/analytics/revenue", getPlatformRevenue);
router.get("/analytics/cohorts", getVendorCohortsHandler);
router.get("/analytics/top-performers", getTopPerformersHandler);
router.get("/analytics/export", exportData);

/* ── Announcements ──────────────────────────────────────── */
router.post("/announcements", validateAnnouncement, createAnnouncement);
router.get("/announcements", listAnnouncements);
router.put("/announcements/:id", validateAnnouncement, updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
