import mongoose from "mongoose";

const customRequestSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

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
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
    },

    /* ── What the customer wants / design brief ────────────────── */
    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },

    category: {
      type: String,
      enum: ["clothing", "accessories", "alteration", "repair", "other"],
      default: "clothing",
    },

    /* Reference/Inspiration images uploaded for the bespoke piece */
    referenceImages: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      validate: {
        validator: (v) => v.length <= 5,
        message: "Maximum 5 reference images allowed",
      },
      default: [],
    },

    /* ── Measurements snapshot at the time of demand creation ── */
    measurements: {
      type: Map,
      of: String,
      default: {},
    },

    /* ── Materials & Sourcing ─────────────────────────────────── */
    materials: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          quantity: { type: String, default: "", trim: true },
          supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            default: null,
          },
          estimatedCost: { type: Number, default: 0, min: 0 },
          acquired: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    /* ── Pricing & Payments ───────────────────────────────────── */
    estimatedPrice: {
      type: Number,
      default: 0,
      min: [0, "Estimated price cannot be negative"],
    },

    agreedPrice: {
      type: Number,
      default: 0,
      min: [0, "Agreed price cannot be negative"],
    },

    depositPaid: {
      type: Number,
      default: 0,
      min: [0, "Deposit paid cannot be negative"],
    },

    balanceOwed: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ── Production Timeline & Status ─────────────────────────── */
    deadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "inquiry",     // Initial inquiry / design brief received
        "quoted",      // Price estimate provided to customer
        "confirmed",   // Customer agreed / deposit paid
        "sourcing",    // Sourcing fabrics/materials
        "in_progress", // Cutting / sewing / crafting
        "fitting",     // Ready for customer fitting / adjustments
        "completed",   // Delivered and finished
        "cancelled",   // Cancelled
      ],
      default: "inquiry",
    },

    source: {
      type: String,
      enum: ["dm", "call", "walk_in", "storefront", "referral"],
      default: "dm",
    },

    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
      default: "",
    },

    whatsappSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ── Indexes ────────────────────────────────────────────────────── */
customRequestSchema.index({ vendor: 1, status: 1 });
customRequestSchema.index({ vendor: 1, createdAt: -1 });
customRequestSchema.index({ vendor: 1, deadline: 1 });
customRequestSchema.index({ vendor: 1, "customerSnapshot.phone": 1 });

/* ── Pre-save: compute balanceOwed ──────────────────────────────── */
customRequestSchema.pre("save", function () {
  const targetPrice = this.agreedPrice > 0 ? this.agreedPrice : this.estimatedPrice;
  this.balanceOwed = Math.max(0, targetPrice - (this.depositPaid || 0));
});

const CustomRequest = mongoose.model("CustomRequest", customRequestSchema);

export default CustomRequest;
