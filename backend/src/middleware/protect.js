import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendError } from "../utils/apiResponse.js";

/*
 * The cookie name MUST match what the frontend checks.
 * Frontend middleware.ts: const AUTH_COOKIE = "access_token"
 * Backend here: const TOKEN_COOKIE = "access_token"
 */
const TOKEN_COOKIE = "access_token";

export const protect = asyncHandler(async (req, res, next) => {
  /*
   * req.cookies is populated by cookie-parser middleware in server.js.
   * We extract the JWT from the cookie.
   */
  const token = req.cookies[TOKEN_COOKIE];

  if (!token) {
    /*
     * We pass a custom error object with statusCode.
     * The errorHandler middleware reads statusCode from the error.
     * This is cleaner than calling sendError() directly here because
     * it goes through the centralized error handler.
     */
    return sendError(res, "Not authenticated. Please login.", 401);
  }

  /*
   * jwt.verify(token, secret) does two things:
   * 1. Verifies the signature (tamper detection)
   * 2. Checks the expiry date (exp field in payload)
   *
   * If either fails, it THROWS:
   * - JsonWebTokenError (bad signature)
   * - TokenExpiredError (past expiry)
   *
   * These are caught by asyncHandler → next(err) → errorHandler.
   */
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  /*
   * decoded = { id: "vendor_id", iat: 1234567890, exp: 1234567890 }
   *
   * We fetch the fresh vendor from DB to:
   * 1. Confirm they still exist (not deleted)
   * 2. Confirm they're still active
   * 3. Get fresh data (in case role/subscription changed)
   *
   * Note: no .select("+password") here — we don't need the password
   * in protected route handlers.
   */
  const vendor = await Vendor.findById(decoded.id);

  if (!vendor) {
    return sendError(res, "Vendor no longer exists.", 401);
  }

  if (!vendor.isActive) {
    return sendError(
      res,
      "Your account has been deactivated. Please contact support.",
      403,
    );
  }

  /*
   * Attach the vendor to the request object.
   * All downstream route handlers can access req.vendor.
   * This is the Express pattern for passing data between middleware.
   */
  req.vendor = vendor;
  next();
});

/* ── Optional: restrict to specific roles ───────────────────── */
export const restrictTo = (...roles) => {
  /*
   * restrictTo("admin") returns a middleware function.
   * Used as: router.delete("/vendor/:id", protect, restrictTo("admin"), handler)
   *
   * This is another higher-order function pattern:
   * restrictTo takes arguments and returns a middleware.
   */
  return (req, res, next) => {
    if (!roles.includes(req.vendor.role)) {
      return sendError(
        res,
        "You do not have permission to perform this action.",
        403,
      );
    }
    next();
  };
};
