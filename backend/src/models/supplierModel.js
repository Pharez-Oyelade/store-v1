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
  },
  { timestamps: true },
);

supplierSchema.index({ vendor: 1, status: 1 });
supplierSchema.index({ vendor: 1, name: "text", materials: "text" });

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
