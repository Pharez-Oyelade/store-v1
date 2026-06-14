import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["low_stock", "order_status", "subscription", "storefront_enquiry", "system"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: "", // Redirect URL for context (e.g. /dashboard/products/edit/id)
    },
  },
  { timestamps: true }
);

notificationSchema.index({ vendor: 1, isRead: 1 });
notificationSchema.index({ vendor: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
