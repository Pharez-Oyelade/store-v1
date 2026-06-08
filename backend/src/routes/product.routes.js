import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkAction,
} from "../controllers/product.controller.js";
import { protect } from "../middleware/protect.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import {
  createProductValidators,
  updateProductValidators,
} from "../validators/product.validators.js";
import { validate } from "../validators/auth.validators.js";
import { checkProductLimit } from "../middleware/subscription.middleware.js";

const productRouter = Router();

// All product routes require authentication
productRouter.use(protect);

productRouter.get("/", getProducts);
productRouter.post("/bulk", bulkAction);
productRouter.post(
  "/",
  checkProductLimit, // Enforce plan limit before upload
  uploadMultiple,
  createProductValidators,
  validate,
  createProduct,
);
productRouter.get("/:id", getProduct);
productRouter.put(
  "/:id",
  uploadMultiple,
  updateProductValidators,
  validate,
  updateProduct,
);
productRouter.delete("/:id", deleteProduct);

export default productRouter;
