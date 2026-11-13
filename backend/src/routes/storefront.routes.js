import { Router } from "express";
import {
  resolveStorefrontDomain,
  getVendorStorefront,
  getStorefrontProducts,
  getStorefrontProduct,
  createStorefrontOrder,
  createStorefrontCustomRequest,
  validateCoupon,
  initializeStorefrontPaystack,
} from "../controllers/storefront.controller.js";
import { createStorefrontOrderValidators } from "../validators/storefront.validators.js";
import { validate } from "../validators/auth.validators.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";

const storefrontRouter = Router();

// Public — no auth required (rate-limited at server level)
storefrontRouter.get("/resolve-domain", resolveStorefrontDomain);
storefrontRouter.get("/:handle", getVendorStorefront);
storefrontRouter.get("/:handle/products", getStorefrontProducts);
storefrontRouter.get("/:handle/products/:productId", getStorefrontProduct);
storefrontRouter.post("/:handle/validate-coupon", validateCoupon);
storefrontRouter.post("/:handle/initialize-paystack", initializeStorefrontPaystack);
storefrontRouter.post(
  "/:handle/orders",
  createStorefrontOrderValidators,
  validate,
  createStorefrontOrder,
);
storefrontRouter.post(
  "/:handle/custom-requests",
  uploadMultiple,
  createStorefrontCustomRequest,
);

export default storefrontRouter;


