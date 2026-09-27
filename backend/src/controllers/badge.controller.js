import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getVendorBadgeCounts } from "../services/badge.service.js";

/**
 * GET /api/vendor/badge-counts
 * Returns actionable badge counts for the authenticated vendor workspace.
 */
export const getBadgeCountsHandler = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const counts = await getVendorBadgeCounts(vendorId);

  return sendSuccess(res, counts, "Badge counts retrieved successfully");
});
