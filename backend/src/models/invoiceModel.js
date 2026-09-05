import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },
    variantLabel: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const paymentRecordSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },
    channel: {
      type: String,
      enum: ["card", "bank_transfer", "ussd", "qr", "cash", "manual_transfer", "other"],
      default: "card",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: String,
      enum: ["paystack", "vendor_manual", "admin"],
      default: "paystack",
    },
    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const manualPaymentProofSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    bankSenderName: {
      type: String,
      default: "",
      trim: true,
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    customRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomRequest",
      default: null,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    accessToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    customerSnapshot: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
      },
      phone: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      address: {
        type: String,
        default: "",
        trim: true,
      },
    },

    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (v) => v.length >= 1,
        message: "Invoice must contain at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    depositRequired: {
      type: Number,
      default: 0,
      min: [0, "Deposit cannot be negative"],
    },

    totalPaid: {
      type: Number,
      default: 0,
      min: [0, "Total paid cannot be negative"],
    },

    balanceDue: {
      type: Number,
      default: 0,
      min: [0, "Balance due cannot be negative"],
    },

    status: {
      type: String,
      enum: ["draft", "issued", "partially_paid", "paid", "cancelled"],
      default: "issued",
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    terms: {
      type: String,
      maxlength: [1000, "Terms cannot exceed 1000 characters"],
      default: "Thank you for your business! Please settle the remaining balance upon delivery or completion.",
    },

    paymentHistory: [paymentRecordSchema],

    manualPaymentProofs: [manualPaymentProofSchema],
  },
  {
    timestamps: true,
  }
);

/* ── Compound Indexes ───────────────────────────────────────── */
invoiceSchema.index({ vendor: 1, status: 1 });
invoiceSchema.index({ vendor: 1, createdAt: -1 });
invoiceSchema.index({ vendor: 1, balanceDue: 1 });

/* ── Pre-save: Auto-compute balanceDue and status ────────────── */
invoiceSchema.pre("save", function () {
  this.balanceDue = Math.max(0, this.totalAmount - this.totalPaid);

  if (this.status !== "cancelled" && this.status !== "draft") {
    if (this.balanceDue <= 0 && this.totalAmount > 0) {
      this.status = "paid";
    } else if (this.totalPaid > 0) {
      this.status = "partially_paid";
    } else {
      this.status = "issued";
    }
  }
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
