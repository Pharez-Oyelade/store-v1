import { body } from "express-validator";

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/* ── Order Validators ───────────────────────────────────────────── */

export const createOrderValidators = [
  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required"),

  body("customerPhone")
    .trim()
    .notEmpty()
    .withMessage("Customer phone is required"),

  body("items")
    .customSanitizer(parseJsonArray)
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),

  body("items.*.productName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each item must have a product name"),

  body("items.*.variantLabel")
    .trim()
    .notEmpty()
    .withMessage("Each item must have a variant label"),

  body("items.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Each item must have a valid price"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Each item quantity must be at least 1"),

  body("depositPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deposit paid must be a non-negative number"),

  body("source")
    .optional()
    .isIn(["dm", "call", "walk_in", "storefront"])
    .withMessage("Invalid order source"),
];

export const updateOrderValidators = [
  body("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "ready",
      "dispatched",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid order status"),

  body("depositPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deposit paid must be non-negative"),
];
