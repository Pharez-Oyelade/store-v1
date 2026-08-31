import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendError } from "../utils/apiResponse.js";
import { syncVendorSubscription } from "../services/subscription.service.js";

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
    return sendError(res, "Not authenticated. Please login.", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Sync real-time subscription lifecycle check
  await syncVendorSubscription(decoded.id);

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
