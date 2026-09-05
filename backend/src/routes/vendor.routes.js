import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateLogo,
  getBanksList,
  resolveBankDetails,
  getPayoutSettings,
  updatePayoutSettings,
} from "../controllers/vendor.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const vendorRouter = Router();

vendorRouter.use(protect);

vendorRouter.get("/profile", getProfile);
vendorRouter.put("/profile", requireRole("owner", "manager"), updateProfile);
vendorRouter.put(
  "/logo",
  requireRole("owner", "manager"),
  uploadSingle,
  updateLogo,
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
