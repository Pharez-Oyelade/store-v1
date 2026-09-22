import mongoose from "mongoose";

const idempotencySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB automatically deletes documents after 24 hours (86400 seconds)
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencySchema);

export default IdempotencyKey;
