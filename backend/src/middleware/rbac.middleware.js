import { PLAN_LIMITS } from "../models/subscriptionModel.js";
import TeamMember from "../models/teamMemberModel.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Middleware to enforce subscription tier team seat limits before adding staff.
 * Note: The store owner occupies 1 seat, so allowed staff invites = plan.teamSeats - 1.
 */
export const checkTeamSeatLimit = async (req, res, next) => {
  try {
    const plan = req.vendor.subscriptionPlan || "free";
    const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    const maxSeats = planConfig.teamSeats;

    // Free and Stitch plans only have 1 seat (the owner)
    if (maxSeats <= 1) {
      return sendError(
        res,
        `Your ${plan.toUpperCase()} plan does not include team seats. Upgrade to The Drape Plan (3 seats) or The Atelier Plan (10 seats) to invite team members.`,
        403
      );
    }

    if (maxSeats !== Infinity) {
      const allowedInvites = maxSeats - 1;
      const currentTeamCount = await TeamMember.countDocuments({
        vendor: req.vendor._id,
        isActive: true,
      });

      if (currentTeamCount >= allowedInvites) {
        return sendError(
          res,
          `Your ${plan.toUpperCase()} plan limit of ${maxSeats} team seats has been reached (${currentTeamCount + 1}/${maxSeats} seats used). Upgrade your plan to add more staff.`,
          403
        );
      }
    }

    next();
  } catch (error) {
    return sendError(res, error.message || "Failed to check team seat capacity", 500);
  }
};

/**
 * Middleware to restrict route access to specific team/user roles.
 * Owner and platform Admin roles always bypass role restrictions.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Owner or Super Admin has unrestricted access
    if (req.user?.role === "owner" || req.vendor?.role === "admin") {
      return next();
    }

    const currentRole = req.user?.role;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return sendError(
        res,
        `Access denied. Role '${currentRole || "unknown"}' is not authorized to perform this action.`,
        403
      );
    }

    next();
  };
};
