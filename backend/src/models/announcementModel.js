import mongoose from "mongoose";

/*
 * Announcement — platform-wide messages from Vendra admins to vendors.
 *
 * Announcements appear as dismissible banners in the vendor dashboard.
 * Urgent announcements are non-dismissible.
 *
 * Admins can target all vendors or a specific subscription tier.
 * Announcements auto-expire via the `expiresAt` field.
 */

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    message: {
      type: String,
      required: [true, "Announcement message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    /*
     * type controls visual styling on the vendor dashboard:
     * - info    → blue banner (general info, updates)
     * - warning → amber banner (upcoming changes, maintenance)
     * - urgent  → red banner, non-dismissible (critical issues)
     */
    type: {
      type: String,
      enum: ["info", "warning", "urgent"],
      default: "info",
    },

    /*
     * targetTier: null = show to ALL vendors
     * Otherwise, only vendors on that subscription plan see it.
     */
    targetTier: {
      type: String,
      enum: ["free", "stitch", "drape", "atelier", "maison", null],
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
     * Optional expiry — if set, the announcement is automatically
     * hidden after this date. If null, it remains active until
     * an admin manually deactivates it.
     */
    expiresAt: {
      type: Date,
      default: null,
    },

    /* Admin who created the announcement */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
  },
  { timestamps: true },
);

/* Index for efficient vendor-facing queries */
announcementSchema.index({ isActive: 1, expiresAt: 1 });
announcementSchema.index({ targetTier: 1, isActive: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
