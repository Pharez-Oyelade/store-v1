import { body } from "express-validator";

/* ── Product Validators ─────────────────────────────────────────── */

export const createProductValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category cannot exceed 100 characters"),

  body("variants")
    .isArray({ min: 1 })
    .withMessage("At least one variant is required"),

  body("variants.*.label")
    .trim()
    .notEmpty()
    .withMessage("Each variant must have a label"),

  body("variants.*.price")
    .isFloat({ min: 0 })
    .withMessage("Each variant must have a valid price (≥ 0)"),

  body("variants.*.quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant quantity must be a non-negative integer"),

  body("status")
    .optional()
    .isIn(["active", "draft", "archived", "sold_out"])
    .withMessage("Invalid status value"),

  body("lowStockThreshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Low stock threshold must be a non-negative integer"),
];

export const updateProductValidators = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),

  body("variants")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one variant is required"),

  body("variants.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variant price must be a non-negative number"),

  body("status")
    .optional()
    .isIn(["active", "draft", "archived", "sold_out"])
    .withMessage("Invalid status value"),
];
