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
  body().customSanitizer((reqBody) => {
    if (typeof reqBody.customerSnapshot === "string") {
      try {
        reqBody.customerSnapshot = JSON.parse(reqBody.customerSnapshot);
      } catch {}
    }
    if (!reqBody.customerSnapshot && reqBody.customerName) {
      reqBody.customerSnapshot = {
        name: reqBody.customerName,
        phone: reqBody.customerPhone || "",
        email: reqBody.customerEmail || "",
        address: reqBody.customerAddress || "",
      };
    }
    return reqBody;
  }),

  body("customerSnapshot.name")
    .custom((val, { req }) => {
      const hasLinkedSource = Boolean(req.body.orderId || req.body.customRequestId);
      const name = val || req.body.customerName;
      if (!hasLinkedSource && (!name || !String(name).trim())) {
        throw new Error("Customer name is required");
      }
      return true;
    }),

  body("customerSnapshot.phone")
    .optional({ values: "falsy" })
    .trim(),

  body("customerSnapshot.email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Invalid customer email address"),

  body("items")
    .customSanitizer(parseJsonArray)
    .custom((items, { req }) => {
      const hasLinkedSource = Boolean(req.body.orderId || req.body.customRequestId);
      if (!hasLinkedSource) {
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error("At least one item is required on an invoice");
        }
      }
      return true;
    }),

  body("items.*.description")
    .if(body("items").isArray({ min: 1 }))
    .trim()
    .notEmpty()
    .withMessage("Each item must have a description"),

  body("items.*.quantity")
    .if(body("items").isArray({ min: 1 }))
    .custom((val) => {
      const num = Number(val);
      if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
        throw new Error("Each item quantity must be at least 1");
      }
      return true;
    }),

  body("items.*.unitPrice")
    .if(body("items").isArray({ min: 1 }))
    .custom((val) => {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        throw new Error("Each item must have a non-negative unit price");
      }
      return true;
    }),

  body("totalAmount")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a non-negative number"),

  body("depositRequired")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Deposit required must be a non-negative number"),

  body("initialPaid")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Initial payment must be a non-negative number"),

  body("dueDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("orderId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid order ID"),

  body("customRequestId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid custom request ID"),
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
