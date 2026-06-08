import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    instagram: {
      type: String,
      trim: true,
      default: "",
    },

    /*
     * ltv = Life-Time Value — the total amount this customer has spent.
     * Auto-updated when an order is marked "completed".
     * Useful for identifying VIP customers.
     */
    ltv: {
      type: Number,
      default: 0,
      min: 0,
    },

    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastOrderDate: {
      type: Date,
      default: null,
    },

    /* Private vendor notes about this customer */
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    /*
     * Vendor-defined tags for customer segmentation.
     * e.g. ["VIP", "Prefers S", "Owes Balance", "Regular"]
     */
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

/* ── Indexes ────────────────────────────────────────────────────── */
// A customer is unique per phone number within a vendor's account
customerSchema.index({ vendor: 1, phone: 1 }, { unique: true });
// Search customers by name
customerSchema.index({ vendor: 1, name: "text" });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
