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

export const createInvoiceValidators = [
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
    .withMessage("At least one item is required on an invoice"),

  body("items.*.description")
    .trim()
    .notEmpty()
    .withMessage("Each item must have a description"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Each item quantity must be at least 1"),

  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Each item must have a non-negative unit price"),

  body("depositRequired")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deposit required must be a non-negative number"),

  body("dueDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Due date must be a valid date"),
];

export const recordManualPaymentValidators = [
  body("amount")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isFloat({ min: 1 })
    .withMessage("Payment amount must be at least ₦1"),

  body("channel")
    .optional()
    .isIn(["card", "bank_transfer", "ussd", "qr", "cash", "manual_transfer", "other"])
    .withMessage("Invalid payment channel"),

  body("notes")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

export const submitProofValidators = [
  body("amount")
    .notEmpty()
    .withMessage("Transfer amount is required")
    .isFloat({ min: 1 })
    .withMessage("Transfer amount must be at least ₦1"),

  body("bankSenderName")
    .trim()
    .notEmpty()
    .withMessage("Sender account name is required"),

  body("reference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Reference cannot exceed 100 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];
