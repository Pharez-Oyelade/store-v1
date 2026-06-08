import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    /* Up to 5 images, stored as Cloudinary public URLs */
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      validate: {
        validator: (v) => v.length <= 5,
        message: "A product can have at most 5 images",
      },
      default: [],
    },

    /*
     * Variants capture each distinct size/colour/price combination.
     * Every product must have at least one variant.
     * e.g. { label: "S / Red", size: "S", color: "Red", price: 15000, quantity: 8 }
     */
    variants: {
      type: [
        {
          label: {
            type: String,
            required: [true, "Variant label is required"],
            trim: true,
          },
          size: { type: String, trim: true, default: "" },
          color: { type: String, trim: true, default: "" },
          custom: { type: String, trim: true, default: "" }, // e.g. "Fabric: Ankara"
          sku: { type: String, trim: true, default: "" },
          price: {
            type: Number,
            required: [true, "Variant price is required"],
            min: [0, "Price cannot be negative"],
          },
          quantity: {
            type: Number,
            default: 0,
            min: [0, "Quantity cannot be negative"],
          },
          sold: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
      validate: {
        validator: (v) => v.length >= 1,
        message: "A product must have at least one variant",
      },
    },

    /*
     * basePrice = lowest variant price, auto-computed in pre-save hook.
     * Used for sorting products by price in product lists / storefront.
     */
    basePrice: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "draft", "archived", "sold_out"],
      default: "draft",
    },

    /*
     * Low stock alert fires when ANY variant quantity drops to or below this value.
     * Vendors set this per-product (default: 5 units).
     */
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
  },
  { timestamps: true },
);

/* ── Indexes ────────────────────────────────────────────────────── */
// Filter products by vendor + status (most common query pattern)
productSchema.index({ vendor: 1, status: 1 });
// Filter products by category within a vendor's catalogue
productSchema.index({ vendor: 1, category: 1 });
// Text search on name + description
productSchema.index({ name: "text", description: "text" });

/* ── Pre-save: compute basePrice from variants ──────────────────── */
productSchema.pre("save", function () {
  if (this.variants && this.variants.length > 0) {
    this.basePrice = Math.min(...this.variants.map((v) => v.price));
  }

  // Auto-set status to sold_out if all variants are depleted
  const allSoldOut = this.variants.every((v) => v.quantity === 0);
  if (allSoldOut && this.status === "active") {
    this.status = "sold_out";
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
