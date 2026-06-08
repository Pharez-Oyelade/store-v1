import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
    },

    /*
     * Optional reference to a Customer document.
     * Walk-in or anonymous orders may not have a customer record.
     * When a customer is found (or created) during order creation,
     * this field is populated.
     */
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    /*
     * customerSnapshot is a denormalized copy of the customer's
     * name and phone at the time of order.
     * This ensures the order history is accurate even if the
     * customer record is later updated or deleted.
     */
    customerSnapshot: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Customer phone is required"],
        trim: true,
      },
      email: { type: String, default: "" },
    },

    /*
     * Each item stores both a product reference and a snapshot of
     * the product name + variant + price at order time.
     * This preserves historical accuracy even if the product is edited later.
     */
    items: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
          },
          productName: {
            type: String,
            required: [true, "Product name is required"],
          },
          variantLabel: {
            type: String,
            required: [true, "Variant label is required"],
          },
          price: {
            type: Number,
            required: [true, "Item price is required"],
            min: 0,
          },
          quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
          },
        },
      ],
      validate: {
        validator: (v) => v.length >= 1,
        message: "An order must have at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },

    depositPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * balanceOwed is auto-computed in the pre-save hook:
     *   balanceOwed = totalAmount - depositPaid
     * Negative values are clamped to 0 (overpayment edge case).
     */
    balanceOwed: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "ready",
        "dispatched",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    source: {
      type: String,
      enum: ["dm", "call", "walk_in", "storefront"],
      default: "dm",
    },

    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },

    /* Tracks whether a WhatsApp confirmation has been sent to the customer */
    whatsappSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

/* ── Indexes ────────────────────────────────────────────────────── */
// List all orders for a vendor, filtered by status
orderSchema.index({ vendor: 1, status: 1 });
// Sort orders by newest first (most used query pattern)
orderSchema.index({ vendor: 1, createdAt: -1 });
// Debt summary query: vendor + status filter + balanceOwed aggregation
orderSchema.index({ vendor: 1, balanceOwed: 1, status: 1 });

/* ── Pre-save: compute balanceOwed ──────────────────────────────── */
orderSchema.pre("save", function () {
  this.balanceOwed = Math.max(0, this.totalAmount - this.depositPaid);
  /*
   * Math.max(0, ...) prevents negative balanceOwed in edge cases
   * where depositPaid > totalAmount (overpayment or discount applied).
   */
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
