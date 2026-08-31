import { Router } from "express";
import {
  getVendorStorefront,
  getStorefrontProducts,
  getStorefrontProduct,
  createStorefrontOrder,
  createStorefrontCustomRequest,
} from "../controllers/storefront.controller.js";
import { createStorefrontOrderValidators } from "../validators/storefront.validators.js";
import { validate } from "../validators/auth.validators.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";

const storefrontRouter = Router();

// Public — no auth required (rate-limited at server level)
storefrontRouter.get("/:handle", getVendorStorefront);
storefrontRouter.get("/:handle/products", getStorefrontProducts);
storefrontRouter.get("/:handle/products/:productId", getStorefrontProduct);
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


