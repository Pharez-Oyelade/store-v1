import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getPublicInvoiceByToken,
  initializeInvoicePayment,
  verifyInvoicePayment,
  recordManualPayment,
  submitManualPaymentProof,
  verifyManualPaymentProof,
  cancelInvoice,
} from "../controllers/invoice.controller.js";
import { paystackWebhook } from "../controllers/subscription.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { checkIdempotency } from "../middleware/idempotency.middleware.js";
import { checkInvoiceLimit } from "../middleware/subscriptionGating.middleware.js";
import rateLimit from "express-rate-limit";
import {
  createInvoiceValidators,
  recordManualPaymentValidators,
  submitProofValidators,
} from "../validators/invoice.validators.js";
import { validate } from "../validators/auth.validators.js";

const invoiceRouter = Router();

const invoicePublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: "Too many payment requests. Please try again later." },
});

/* ── Public Routes (Unauthenticated, accessed via secret token or webhook) ─── */
invoiceRouter.get("/public/:token", getPublicInvoiceByToken);
invoiceRouter.post("/public/:token/pay", invoicePublicLimiter, initializeInvoicePayment);
invoiceRouter.post("/public/:token/verify", invoicePublicLimiter, verifyInvoicePayment);
invoiceRouter.post(
  "/public/:token/manual-proof",
  invoicePublicLimiter,
  submitProofValidators,
  validate,
  submitManualPaymentProof
);
invoiceRouter.post("/webhook", paystackWebhook);

/* ── Protected Vendor Routes ────────────────────────────────────── */
invoiceRouter.use(protect, requireRole("owner", "manager", "sales"), checkIdempotency);

invoiceRouter.get("/", getInvoices);
invoiceRouter.post("/", checkInvoiceLimit, createInvoiceValidators, validate, createInvoice);
invoiceRouter.get("/:id", getInvoiceById);
invoiceRouter.patch("/:id/manual-payment", recordManualPaymentValidators, validate, recordManualPayment);
invoiceRouter.patch("/:id/verify-proof", verifyManualPaymentProof);
invoiceRouter.patch("/:id/cancel", cancelInvoice);

export default invoiceRouter;
