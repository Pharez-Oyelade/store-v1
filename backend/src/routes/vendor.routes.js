import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateLogo,
} from "../controllers/vendor.controller.js";
import { protect } from "../middleware/protect.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const vendorRouter = Router();

vendorRouter.use(protect);

vendorRouter.get("/profile", getProfile);
vendorRouter.put("/profile", updateProfile);
vendorRouter.put("/logo", uploadSingle, updateLogo);

export default vendorRouter;
