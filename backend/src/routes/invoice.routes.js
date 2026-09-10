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

const invoiceRouter = Router();

/* ── Public Routes (Unauthenticated, accessed via secret token or webhook) ─── */
invoiceRouter.get("/public/:token", getPublicInvoiceByToken);
invoiceRouter.post("/public/:token/pay", initializeInvoicePayment);
invoiceRouter.post("/public/:token/verify", verifyInvoicePayment);
invoiceRouter.post("/public/:token/manual-proof", submitManualPaymentProof);
invoiceRouter.post("/webhook", paystackWebhook);

/* ── Protected Vendor Routes ────────────────────────────────────── */
invoiceRouter.use(protect, requireRole("owner", "manager", "sales"), checkIdempotency);

invoiceRouter.get("/", getInvoices);
invoiceRouter.post("/", checkInvoiceLimit, createInvoice);
invoiceRouter.get("/:id", getInvoiceById);
invoiceRouter.patch("/:id/manual-payment", recordManualPayment);
invoiceRouter.patch("/:id/verify-proof", verifyManualPaymentProof);
invoiceRouter.patch("/:id/cancel", cancelInvoice);

export default invoiceRouter;
