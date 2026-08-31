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

/* ── Storefront Order Validation ────────────────────────────────── */
export const createStorefrontOrderValidators = [
  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Customer name must be between 2 and 100 characters"),

  body("customerPhone")
    .trim()
    .notEmpty()
    .withMessage("Customer phone number is required")
    .isLength({ min: 7, max: 20 })
    .withMessage("Please enter a valid phone number"),

  body("customerEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),

  body("items")
    .customSanitizer(parseJsonArray)
    .isArray({ min: 1 })
    .withMessage("At least one item is required in the order"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),
];
