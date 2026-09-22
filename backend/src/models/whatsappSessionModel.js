import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    senderPhone: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["vendor", "team"],
      default: "vendor",
    },
    teamMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    state: {
      type: String,
      enum: [
        "idle",
        "intake_order",
        "resolving_product",
        "resolving_customer",
        "pending_confirmation",
        "inventory_action",
        "read_query",
      ],
      default: "idle",
    },
    intent: {
      type: String,
      enum: [
        "CREATE_ORDER",
        "UPDATE_STOCK",
        "GET_ANALYTICS",
        "LOOKUP_DEBT",
        "CHECK_STOCK",
        "GENERAL",
      ],
      default: null,
    },
    draftData: {
      items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
          },
          productName: { type: String },
          variantLabel: { type: String },
          quantity: { type: Number, min: 1 },
          price: { type: Number, min: 0 },
        },
      ],
      customer: {
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
          default: null,
        },
        name: { type: String, default: "" },
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        isNew: { type: Boolean, default: false },
      },
      payment: {
        totalAmount: { type: Number, default: 0 },
        depositPaid: { type: Number, default: 0 },
        balanceOwed: { type: Number, default: 0 },
        paymentStatus: {
          type: String,
          enum: ["paid", "partial", "unpaid", "unknown"],
          default: "unknown",
        },
      },
      sendCustomerReceipt: { type: Boolean, default: true },
      notes: { type: String, default: "" },
    },
    pendingConfirmation: {
      actionType: {
        type: String,
        enum: ["CREATE_ORDER", "ADJUST_STOCK", "CANCEL_ORDER"],
        default: null,
      },
      summaryText: { type: String, default: "" },
      expiresAt: { type: Date, default: null },
    },
    dialogHistory: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* ── Indexes ────────────────────────────────────────────────────── */
whatsappSessionSchema.index({ senderPhone: 1 }, { unique: true });
whatsappSessionSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 1200 });

const WhatsappSession = mongoose.model("WhatsappSession", whatsappSessionSchema);

export default WhatsappSession;
