import { body } from "express-validator";

function parseJsonField(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export const createCustomRequestValidators = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Request title / style name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Title must be between 2 and 200 characters"),

  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required"),

  body("customerPhone")
    .trim()
    .notEmpty()
    .withMessage("Customer phone number is required"),

  body("customerEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("category")
    .optional()
    .isIn(["clothing", "accessories", "alteration", "repair", "other"])
    .withMessage("Invalid category selected"),

  body("estimatedPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estimated price must be a non-negative number"),

  body("agreedPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Agreed price must be a non-negative number"),

  body("depositPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deposit paid must be a non-negative number"),

  body("source")
    .optional()
    .isIn(["dm", "call", "walk_in", "storefront", "referral"])
    .withMessage("Invalid source"),

  body("materials")
    .optional()
    .customSanitizer(parseJsonField),

  body("measurements")
    .optional()
    .customSanitizer(parseJsonField),
];

export const updateCustomRequestValidators = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Title must be between 2 and 200 characters"),

  body("status")
    .optional()
    .isIn([
      "inquiry",
      "quoted",
      "confirmed",
      "sourcing",
      "in_progress",
      "fitting",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid status value"),

  body("estimatedPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estimated price must be non-negative"),

  body("agreedPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Agreed price must be non-negative"),

  body("depositPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deposit paid must be non-negative"),

  body("materials")
    .optional()
    .customSanitizer(parseJsonField),

  body("measurements")
    .optional()
    .customSanitizer(parseJsonField),
];
