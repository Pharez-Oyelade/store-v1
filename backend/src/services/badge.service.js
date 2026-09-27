import Invoice from "../models/invoiceModel.js";
import CustomRequest from "../models/customRequestModel.js";
import Order from "../models/orderModel.js";

/**
 * Computes real-time actionable badge counts for a vendor workspace:
 * - invoices: Unreviewed manual payment proofs requiring vendor approval/rejection
 * - demands: Active bespoke demands that have surpassed their target delivery deadline
 * - orders: Orders awaiting confirmation/fulfillment review
 *
 * @param {string|mongoose.Types.ObjectId} vendorId
 * @returns {Promise<{ invoices: number, demands: number, orders: number, totalActionable: number }>}
 */
export const getVendorBadgeCounts = async (vendorId) => {
  const now = new Date();

  const [invoicesCount, demandsCount, ordersCount] = await Promise.all([
    // Invoices with pending manual payment proof
    Invoice.countDocuments({
      vendor: vendorId,
      "manualPaymentProofs.status": "pending",
    }),

    // Demands that are active and have passed their deadline
    CustomRequest.countDocuments({
      vendor: vendorId,
      status: { $nin: ["completed", "cancelled"] },
      deadline: { $lt: now, $ne: null },
    }),

    // Orders requiring review/confirmation
    Order.countDocuments({
      vendor: vendorId,
      status: "pending",
    }),
  ]);

  return {
    invoices: invoicesCount,
    demands: demandsCount,
    orders: ordersCount,
    totalActionable: invoicesCount + demandsCount + ordersCount,
  };
};
