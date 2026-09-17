import mongoose from "mongoose";

const whatsappLogSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    senderPhone: {
      type: String,
      required: true,
    },
    recipientPhone: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      unique: true,
      sparse: true,
    },
    messageType: {
      type: String,
      enum: ["text", "interactive", "template", "image", "unknown"],
      default: "text",
    },
    content: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["received", "sent", "delivered", "read", "failed"],
      default: "received",
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/* ── Indexes ────────────────────────────────────────────────────── */
whatsappLogSchema.index({ vendor: 1, createdAt: -1 });

const WhatsappLog = mongoose.model("WhatsappLog", whatsappLogSchema);

export default WhatsappLog;
