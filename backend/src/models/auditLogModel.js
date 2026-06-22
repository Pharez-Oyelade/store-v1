import mongoose from "mongoose";

/*
 * AuditLog — immutable record of admin actions on the platform.
 *
 * Every time an admin suspends a vendor, changes a subscription,
 * or publishes an announcement, a log entry is created.
 * This provides accountability and a full history for review.
 *
 * Logs are intentionally NOT deletable via the API.
 */

const AUDIT_ACTIONS = [
  "vendor_suspended",
  "vendor_activated",
  "vendor_subscription_changed",
  "announcement_created",
  "announcement_updated",
  "announcement_deleted",
  "subscription_tier_updated",
];

const auditLogSchema = new mongoose.Schema(
  {
    /* Admin who performed the action */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    adminName: {
      type: String,
      required: true,
    },

    /* What happened */
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
    },

    /* What was acted upon */
    targetType: {
      type: String,
      enum: ["vendor", "subscription", "announcement", "platform"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    targetName: {
      type: String,
      default: "",
    },

    /* Context: reason, before/after state, etc. */
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /* Optional: client IP for security auditing */
    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    /* Prevent accidental updates to audit records */
    statics: {
      async log({ adminId, adminName, action, targetType, targetId, targetName, details, ipAddress }) {
        return this.create({
          adminId,
          adminName,
          action,
          targetType,
          targetId: targetId || null,
          targetName: targetName || "",
          details: details || {},
          ipAddress: ipAddress || "",
        });
      },
    },
  },
);

/* Index for fast lookups by target (e.g. all actions on vendor X) */
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
