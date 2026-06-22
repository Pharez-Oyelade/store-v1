import { body, param, query } from "express-validator";

/* ── Vendor Status Toggle ───────────────────────────────────── */
export const validateVendorStatusToggle = [
  param("id").isMongoId().withMessage("Invalid vendor ID"),

  body("isActive")
    .isBoolean()
    .withMessage("isActive must be a boolean (true or false)"),

  body("reason")
    .if(body("isActive").equals(false))
    .notEmpty()
    .withMessage("A reason is required when suspending a vendor")
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

/* ── Subscription Override ──────────────────────────────────── */
export const validateSubscriptionOverride = [
  param("id").isMongoId().withMessage("Invalid vendor ID"),

  body("plan")
    .isIn(["free", "stitch", "drape", "atelier", "maison"])
    .withMessage("Invalid subscription plan"),

  body("reason")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

/* ── Announcement Create / Update ───────────────────────────── */
export const validateAnnouncement = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 120 })
    .withMessage("Title cannot exceed 120 characters"),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),

  body("type")
    .isIn(["info", "warning", "urgent"])
    .withMessage("Type must be info, warning, or urgent"),

  body("targetTier")
    .optional({ nullable: true })
    .isIn(["free", "stitch", "drape", "atelier", "maison", null])
    .withMessage("Invalid target tier"),

  body("expiresAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("expiresAt must be a valid ISO 8601 date"),
];

/* ── Vendor List Query ──────────────────────────────────────── */
export const validateVendorListQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status").optional().isIn(["active", "suspended", "all"]).withMessage("Invalid status filter"),
  query("plan").optional().isIn(["free", "stitch", "drape", "atelier", "maison", "all"]).withMessage("Invalid plan filter"),
];
