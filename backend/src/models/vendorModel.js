import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const vendorSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Business name must be at least 2 characters"],
      maxlength: [100, "Business name cannot exceed 100 characters"],
    },

    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9_-]+$/,
        "Handle can only contain lowercase letters, numbers, hyphens and underscores",
      ],
      minlength: [2, "Handle must be at least 2 characters"],
      maxlength: [30, "Handle cannot exceed 30 characters"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        /*
         * Custom validator function.
         * `validator.isMobilePhone(value, "en-NG")` uses the
         * `validator` npm package to check Nigerian phone formats.
         * Returns true (valid) or false (invalid).
         */
        validator: (v) => validator.isMobilePhone(v, "en-NG"),
        message: "Please provide a valid Nigerian phone number",
      },
    },

    email: {
      type: String,
      unique: true,
      sparse: true, //unique index only applies to documents where the field exists
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: "Please provide a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, //excluded by default from all queries
    },

    role: {
      type: String,
      enum: ["vendor", "admin"],
      default: "vendor",
    },

    /* ── Profile ──────────────────────────────────────── */
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },

    location: {
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      area: { type: String, default: "" },
    },

    socials: {
      instagram: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },

    /* ── Status ───────────────────────────────────────── */
    isActive: {
      type: Boolean,
      default: true,
    },

    /* ── Subscription (populated later) ──────────────── */
    subscriptionPlan: {
      type: String,
      enum: ["starter", "growth", "pro"],
      default: "starter",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "past_due"],
      default: "active",
    },
  },
  {
    timestamps: true, //auto add createdAt and updatedAt
  },
);

/* ── Indexes ────────────────────────────────────────────────── */
/*
 * Compound index for the "discovery" feature (Phase 3) —
 * finding vendors near a location.
 * Defined here for forward compatibility.
 */
vendorSchema.index({ "location.state": 1, "location.city": 1 });

/* ── Pre-save Hook: Hash Password ───────────────────────────── */
vendorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  //prevent re-hashing an already hashed password when other fields are updated unless password modified

  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Instance Method: Compare Password ─────────────────────── */
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── toJSON Transform: Remove Sensitive Fields ──────────────── */
vendorSchema.set("toJSON", {
  transform: function (doc, ret) {
    /*
     * This runs whenever .toJSON() is called (which happens
     * automatically when you JSON.stringify() a document,
     * which Express does for res.json()).
     *
     * We delete sensitive fields to ensure they're never
     * accidentally included in API responses.
     */
    delete ret.password;
    delete ret.__v; // Mongoose internal version field
    return ret;
  },
});

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
