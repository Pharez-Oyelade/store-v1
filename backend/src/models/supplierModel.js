import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
    },
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      maxlength: [120, "Supplier name cannot exceed 120 characters"],
    },
    category: {
      type: String,
      enum: ["fabric", "trim", "tailoring", "packaging", "tools", "logistics", "other"],
      default: "fabric",
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Supplier phone is required"],
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
    whatsapp: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    materials: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "preferred", "inactive"],
      default: "active",
    },
    lastPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    /* Individual purchases from this supplier */
    purchases: {
      type: [
        {
          description: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          paidAmount: { type: Number, default: 0, min: 0 },
          status: { type: String, enum: ["ordered", "delivered"], default: "ordered" },
          date: { type: Date, default: Date.now },
        }
      ],
      default: []
    }
  },
  { timestamps: true },
);

supplierSchema.index({ vendor: 1, status: 1 });
supplierSchema.index({ vendor: 1, name: "text", materials: "text" });

/* ── Pre-save: update amounts and dates ── */
supplierSchema.pre("save", function () {
  if (this.purchases && this.purchases.length > 0) {
    // To find the last purchase, we look at the one with the latest date. 
    // If dates are identical (e.g. same day), the one added last (at the end of the array) wins.
    let lastPurchase = this.purchases[0];
    for (let i = 1; i < this.purchases.length; i++) {
      const p = this.purchases[i];
      if (new Date(p.date).getTime() >= new Date(lastPurchase.date).getTime()) {
        lastPurchase = p;
      }
    }
    
    this.lastPurchaseAmount = lastPurchase.amount;
    this.lastPurchaseDate = lastPurchase.date;

    // Compute totals
    const totalAmount = this.purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaid = this.purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    
    this.totalPurchaseAmount = totalAmount;
    this.outstandingBalance = totalAmount - totalPaid;
  } else {
    this.lastPurchaseAmount = 0;
    this.lastPurchaseDate = null;
    this.totalPurchaseAmount = 0;
    this.outstandingBalance = 0;
  }
});

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
