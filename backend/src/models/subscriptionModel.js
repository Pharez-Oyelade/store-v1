import mongoose from "mongoose";

/*
 * Subscription plans mirror the PRD pricing tiers:
 *   free     → ₦0/mo   | 5 products | 5 orders/mo  | 1 team seat
 *   stitch   → ₦4,900  | 15 products | 10 orders/mo | 1 team seat
 *   drape    → ₦14,900 | 200 products | 500 orders/mo | 3 team seats
 *   atelier  → ₦34,900 | unlimited    | unlimited     | 10 team seats
 *   maison   → Custom  | unlimited    | unlimited     | unlimited
 */

export const PLAN_LIMITS = {
  free: { products: 5, ordersPerMonth: 5, teamSeats: 1 },
  stitch: { products: 15, ordersPerMonth: 10, teamSeats: 1 },
  drape: { products: 200, ordersPerMonth: 500, teamSeats: 3 },
  atelier: { products: Infinity, ordersPerMonth: Infinity, teamSeats: 10 },
  maison: { products: Infinity, ordersPerMonth: Infinity, teamSeats: Infinity },
};

export const PLAN_PRICES = {
  free: 0,
  stitch: 4900,
  drape: 14900,
  atelier: 34900,
  maison: 0,
};

const subscriptionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: ["free", "stitch", "drape", "atelier", "maison"],
      default: "free",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "past_due"],
      default: "active",
    },

    /* ── Paystack references ──────────────────────────────── */
    paystackCustomerCode: { type: String, default: "" },
    paystackSubscriptionCode: { type: String, default: "" },

    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },

    /* If true, subscription cancels at end of billing period (not immediately) */
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
