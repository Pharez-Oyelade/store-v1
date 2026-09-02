import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js";
import TeamMember from "../models/teamMemberModel.js";
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
  const token = req.cookies[TOKEN_COOKIE];

  if (!token) {
    return sendError(res, "Not authenticated. Please login.", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.isTeamMember) {
    // Authenticate as invited Team Member
    const member = await TeamMember.findById(decoded.userId);

    if (!member) {
      return sendError(res, "Team member account no longer exists.", 401);
    }

    if (!member.isActive) {
      return sendError(
        res,
        "Your team access has been deactivated. Please contact your store manager.",
        403
      );
    }

    const vendor = await Vendor.findById(decoded.vendorId || member.vendor);

    if (!vendor) {
      return sendError(res, "Store workspace no longer exists.", 401);
    }

    if (!vendor.isActive) {
      return sendError(
        res,
        "This store account has been deactivated. Please contact support.",
        403
      );
    }

    await syncVendorSubscription(vendor._id);

    req.vendor = vendor;
    req.teamMember = member;
    req.user = {
      _id: member._id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      isTeamMember: true,
    };

    return next();
  }

  // Authenticate as primary Store Owner / Vendor
  await syncVendorSubscription(decoded.id);

  const vendor = await Vendor.findById(decoded.id);

  if (!vendor) {
    return sendError(res, "Vendor no longer exists.", 401);
  }

  if (!vendor.isActive) {
    return sendError(
      res,
      "Your account has been deactivated. Please contact support.",
      403
    );
  }

  req.vendor = vendor;
  req.user = {
    _id: vendor._id,
    name: vendor.businessName,
    email: vendor.email,
    phone: vendor.phone,
    role: vendor.role === "admin" ? "admin" : "owner",
    isTeamMember: false,
  };

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
