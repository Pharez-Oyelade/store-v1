import { Router } from "express";
import {
  getVendorStorefront,
  getStorefrontProducts,
  getStorefrontProduct,
} from "../controllers/storefront.controller.js";

const storefrontRouter = Router();

// Public — no auth required
storefrontRouter.get("/:handle", getVendorStorefront);
storefrontRouter.get("/:handle/products", getStorefrontProducts);
storefrontRouter.get("/:handle/products/:productId", getStorefrontProduct);

export default storefrontRouter;
