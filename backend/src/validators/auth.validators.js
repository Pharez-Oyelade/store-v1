import { body, validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse.js";

/* ── Helper: run validation result ────────────────────────────
 * Called at the start of each controller to check if validation passed.
 * If not, responds with 400 and structured errors immediately.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  /*
   * validationResult returns an object.
   * .isEmpty() → true if no errors
   * .array() → [{ field, msg, value }, ...]
   */
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach(({ path, msg }) => {
      /*
       * Build a key→message map:
       * { email: "Invalid email", phone: "Phone required" }
       * This matches ApiError.errors on the frontend.
       */
      fieldErrors[path] = msg;
    });
    return sendError(res, "Validation failed", 400, fieldErrors);
  }
  next();
};

/* ── Register Validators ─────────────────────────────────────── */
export const registerValidators = [
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Business name must be 2-100 characters"),

  body("handle")
    .trim()
    .notEmpty()
    .withMessage("Store handle is required")
    .toLowerCase()
    .isLength({ min: 2, max: 30 })
    .withMessage("Handle must be 2-30 characters")
    .matches(/^[a-z0-9_-]+$/)
    .withMessage(
      "Handle can only contain lowercase letters, numbers, hyphens and underscores",
    ),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage("Enter a valid Nigerian phone number (e.g. 08012345678)"),

  body("email")
    .optional({ values: "falsy" }) // optional: skip if not provided or empty
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
];

/* ── Login Validators ────────────────────────────────────────── */
export const loginValidators = [
  /*
   * Login accepts either phone or email.
   * We validate the credential field is non-empty and
   * the password is provided.
   * The controller handles which field to query.
   */
  body("credential")
    .trim()
    .notEmpty()
    .withMessage("Phone or email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];
