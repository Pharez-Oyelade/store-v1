import { Router } from "express";
import {
  getCustomRequests,
  getCustomRequestSummary,
  getCustomRequest,
  createCustomRequest,
  updateCustomRequest,
  deleteCustomRequest,
  toggleMaterialAcquired,
} from "../controllers/customRequest.controller.js";
import { protect } from "../middleware/protect.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import {
  createCustomRequestValidators,
  updateCustomRequestValidators,
} from "../validators/customRequest.validators.js";
import { validate } from "../validators/auth.validators.js";
import { checkOrderLimit } from "../middleware/subscription.middleware.js";

const customRequestRouter = Router();

customRequestRouter.use(protect);

customRequestRouter.get("/summary", getCustomRequestSummary);
customRequestRouter.get("/", getCustomRequests);
customRequestRouter.post(
  "/",
  checkOrderLimit,
  uploadMultiple,
  createCustomRequestValidators,
  validate,
  createCustomRequest,
);
customRequestRouter.get("/:id", getCustomRequest);
customRequestRouter.put(
  "/:id",
  uploadMultiple,
  updateCustomRequestValidators,
  validate,
  updateCustomRequest,
);
customRequestRouter.delete("/:id", deleteCustomRequest);
customRequestRouter.patch(
  "/:id/materials/:materialIndex/toggle",
  toggleMaterialAcquired,
);

export default customRequestRouter;
