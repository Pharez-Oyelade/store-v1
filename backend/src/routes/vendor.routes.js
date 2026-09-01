import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateLogo,
} from "../controllers/vendor.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const vendorRouter = Router();

vendorRouter.use(protect);

vendorRouter.get("/profile", getProfile);
vendorRouter.put("/profile", requireRole("owner", "manager"), updateProfile);
vendorRouter.put("/logo", requireRole("owner", "manager"), uploadSingle, updateLogo);

export default vendorRouter;

