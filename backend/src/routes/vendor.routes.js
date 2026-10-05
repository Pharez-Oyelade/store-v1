import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateLogo,
  getBanksList,
  resolveBankDetails,
  getPayoutSettings,
  updatePayoutSettings,
  updateStorefrontSettings,
  updateStorefrontBanner,
  getDiscounts,
  createDiscount,
  deleteDiscount,
} from "../controllers/vendor.controller.js";
import { getBadgeCountsHandler } from "../controllers/badge.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const vendorRouter = Router();

vendorRouter.use(protect);

vendorRouter.get("/badge-counts", getBadgeCountsHandler);
vendorRouter.get("/profile", getProfile);
vendorRouter.put("/profile", requireRole("owner", "manager"), updateProfile);
vendorRouter.put(
  "/logo",
  requireRole("owner", "manager"),
  uploadSingle,
  updateLogo,
);

/* ── Storefront Settings & Customization Routes ─────────────────── */
vendorRouter.put(
  "/storefront-settings",
  requireRole("owner", "manager"),
  updateStorefrontSettings,
);
vendorRouter.put(
  "/storefront-banner",
  requireRole("owner", "manager"),
  uploadSingle,
  updateStorefrontBanner,
);

/* ── Promotional Discounts & Campaigns ──────────────────────────── */
vendorRouter.get("/discounts", getDiscounts);
vendorRouter.post(
  "/discounts",
  requireRole("owner", "manager"),
  createDiscount,
);
vendorRouter.delete(
  "/discounts/:discountId",
  requireRole("owner", "manager"),
  deleteDiscount,
);

/* ── Payout & Bank Settlement Routes ────────────────────────────── */
vendorRouter.get("/payout", getPayoutSettings);
vendorRouter.get("/payout/banks", getBanksList);
vendorRouter.post("/payout/resolve", resolveBankDetails);
vendorRouter.put(
  "/payout",
  requireRole("owner", "manager"),
  updatePayoutSettings,
);

export default vendorRouter;
