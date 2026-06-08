import mongoose from "mongoose";

/*
 * Subscription plans mirror the PRD pricing tiers:
 *   free     → ₦0/mo   | 10 products | 50 orders/mo  | 1 team seat
 *   starter  → ₦5,000  | 100 products | 500 orders/mo | 2 team seats
 *   growth   → ₦12,000 | unlimited    | unlimited     | 5 team seats
 *   agency   → ₦25,000 | unlimited    | unlimited     | 15 team seats (white-label)
 */

export const PLAN_LIMITS = {
  free: { products: 10, ordersPerMonth: 50, teamSeats: 1 },
  starter: { products: 100, ordersPerMonth: 500, teamSeats: 2 },
  growth: { products: Infinity, ordersPerMonth: Infinity, teamSeats: 5 },
  agency: { products: Infinity, ordersPerMonth: Infinity, teamSeats: 15 },
};

export const PLAN_PRICES = {
  free: 0,
  starter: 5000,
  growth: 12000,
  agency: 25000,
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
      enum: ["free", "starter", "growth", "agency"],
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
