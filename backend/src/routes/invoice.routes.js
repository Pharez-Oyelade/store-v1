import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getPublicInvoiceByToken,
  initializeInvoicePayment,
  recordManualPayment,
  submitManualPaymentProof,
  verifyManualPaymentProof,
  cancelInvoice,
} from "../controllers/invoice.controller.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const invoiceRouter = Router();

/* ── Public Routes (Unauthenticated, accessed via secret token) ─── */
invoiceRouter.get("/public/:token", getPublicInvoiceByToken);
invoiceRouter.post("/public/:token/pay", initializeInvoicePayment);
invoiceRouter.post("/public/:token/manual-proof", submitManualPaymentProof);

/* ── Protected Vendor Routes ────────────────────────────────────── */
invoiceRouter.use(protect, requireRole("owner", "manager", "sales"));

invoiceRouter.get("/", getInvoices);
invoiceRouter.post("/", createInvoice);
invoiceRouter.get("/:id", getInvoiceById);
invoiceRouter.patch("/:id/manual-payment", recordManualPayment);
invoiceRouter.patch("/:id/verify-proof", verifyManualPaymentProof);
invoiceRouter.patch("/:id/cancel", cancelInvoice);

export default invoiceRouter;
