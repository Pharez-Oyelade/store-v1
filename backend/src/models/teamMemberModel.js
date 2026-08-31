import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

export const TEAM_ROLES = ["manager", "tailor", "sales"];

const teamMemberSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Team member name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Team member email is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: "Please provide a valid email address",
      },
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: {
        values: TEAM_ROLES,
        message: "Role must be manager, tailor, or sales",
      },
      default: "manager",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    inviteToken: {
      type: String,
      select: false,
    },
    inviteExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/* ── Compound index: one email per store workspace ────────── */
teamMemberSchema.index({ vendor: 1, email: 1 }, { unique: true });

/* ── Pre-save Hook: Hash Password ─────────────────────────── */
teamMemberSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ── Instance Method: Compare Password ────────────────────── */
teamMemberSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── toJSON Transform: Remove Sensitive Fields ────────────── */
teamMemberSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.inviteToken;
    delete ret.inviteExpires;
    delete ret.__v;
    return ret;
  },
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
