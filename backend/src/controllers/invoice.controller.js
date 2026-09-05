import crypto from "node:crypto";
import Invoice from "../models/invoiceModel.js";
import Vendor from "../models/vendorModel.js";
import Order from "../models/orderModel.js";
import CustomRequest from "../models/customRequestModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { initializeTransaction } from "../services/paystack.service.js";

/**
 * Generate a unique access token for public invoice links
 */
const generateAccessToken = () => {
  return "inv_" + crypto.randomBytes(12).toString("hex");
};

/**
 * Generate human-readable invoice number e.g. INV-2026-0042
 */
const generateInvoiceNumber = async (vendorId) => {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({ vendor: vendorId });
  const sequence = (count + 1).toString().padStart(4, "0");
  return `INV-${year}-${sequence}`;
};

/* ── POST /api/invoices ─────────────────────────────────────────── */
export const createInvoice = asyncHandler(async (req, res) => {
  const {
    orderId,
    customRequestId,
    customerSnapshot,
    items,
    totalAmount,
    depositRequired,
    initialPaid,
    dueDate,
    notes,
    terms,
  } = req.body;

  let invoiceItems = [];
  let invoiceTotal = 0;
  let invoiceDeposit = 0;
  let priorPaidAmount = 0;
  let invoiceCustomer = { name: "", phone: "", email: "", address: "" };
  let linkedOrder = null;
  let linkedCustomRequest = null;
  const initialPayments = [];

  // 1. If generated from an existing Order
  if (orderId) {
    linkedOrder = await Order.findOne({ _id: orderId, vendor: req.vendor._id });
    if (!linkedOrder) {
      return sendError(res, "Linked order not found", 404);
    }

    invoiceCustomer = {
      name: customerSnapshot?.name?.trim() || linkedOrder.customerSnapshot?.name || "Customer",
      phone: customerSnapshot?.phone?.trim() ?? (linkedOrder.customerSnapshot?.phone || ""),
      email: customerSnapshot?.email?.toLowerCase().trim() ?? (linkedOrder.customerSnapshot?.email || ""),
      address: customerSnapshot?.address?.trim() ?? (linkedOrder.customerSnapshot?.address || ""),
    };

    if (items && Array.isArray(items) && items.length > 0) {
      invoiceItems = items.map((item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const price = Math.max(0, Number(item.unitPrice) || 0);
        return {
          description: item.description?.trim() || "Item",
          variantLabel: item.variantLabel?.trim() || "",
          quantity: qty,
          unitPrice: price,
          subtotal: qty * price,
        };
      });
      invoiceTotal = totalAmount !== undefined ? Math.max(0, Number(totalAmount)) : invoiceItems.reduce((acc, i) => acc + i.subtotal, 0);
    } else {
      invoiceItems = linkedOrder.items.map((item) => ({
        description: item.productName || "Product",
        variantLabel: item.variantLabel || "",
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        subtotal: (item.price || 0) * (item.quantity || 1),
      }));
      invoiceTotal = totalAmount !== undefined ? Math.max(0, Number(totalAmount)) : (linkedOrder.totalAmount || 0);
    }

    // Prior payment already paid outside the invoice
    priorPaidAmount = initialPaid !== undefined ? Math.max(0, Number(initialPaid)) : (linkedOrder.depositPaid || 0);
    invoiceDeposit = depositRequired !== undefined ? Math.max(0, Number(depositRequired)) : 0;

    if (priorPaidAmount > 0) {
      initialPayments.push({
        reference: `PREV-ORD-${linkedOrder._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        amount: priorPaidAmount,
        channel: "manual_transfer",
        verifiedBy: "vendor_manual",
        status: "success",
        notes: "Prior deposit / payment recorded on linked order prior to invoice generation",
        paidAt: linkedOrder.createdAt || new Date(),
      });
    }

    // Synchronize linked Order depositPaid and balanceOwed
    if (priorPaidAmount > (linkedOrder.depositPaid || 0)) {
      linkedOrder.depositPaid = priorPaidAmount;
      if (linkedOrder.depositPaid >= linkedOrder.totalAmount && linkedOrder.status === "pending") {
        linkedOrder.status = "confirmed";
      }
      await linkedOrder.save();
    }
  }
  // 2. If generated from an existing Custom Bespoke Request / Demand
  else if (customRequestId) {
    linkedCustomRequest = await CustomRequest.findOne({
      _id: customRequestId,
      vendor: req.vendor._id,
    });
    if (!linkedCustomRequest) {
      return sendError(res, "Linked bespoke demand not found", 404);
    }

    invoiceCustomer = {
      name: customerSnapshot?.name?.trim() || linkedCustomRequest.customerSnapshot?.name || "Bespoke Customer",
      phone: customerSnapshot?.phone?.trim() ?? (linkedCustomRequest.customerSnapshot?.phone || ""),
      email: customerSnapshot?.email?.toLowerCase().trim() ?? (linkedCustomRequest.customerSnapshot?.email || ""),
      address: customerSnapshot?.address?.trim() ?? "",
    };

    const bespokePrice = linkedCustomRequest.agreedPrice || linkedCustomRequest.estimatedPrice || 0;

    if (items && Array.isArray(items) && items.length > 0) {
      invoiceItems = items.map((item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const price = Math.max(0, Number(item.unitPrice) || 0);
        return {
          description: item.description?.trim() || "Item",
          variantLabel: item.variantLabel?.trim() || "",
          quantity: qty,
          unitPrice: price,
          subtotal: qty * price,
        };
      });
      invoiceTotal = totalAmount !== undefined ? Math.max(0, Number(totalAmount)) : invoiceItems.reduce((acc, i) => acc + i.subtotal, 0);
    } else {
      invoiceItems = [
        {
          description: `Bespoke Tailoring: ${linkedCustomRequest.title || "Custom Garment"}`,
          variantLabel: linkedCustomRequest.category ? `Category: ${linkedCustomRequest.category}` : "Bespoke Garment",
          quantity: 1,
          unitPrice: bespokePrice,
          subtotal: bespokePrice,
        },
      ];
      invoiceTotal = totalAmount !== undefined ? Math.max(0, Number(totalAmount)) : bespokePrice;
    }

    priorPaidAmount = initialPaid !== undefined ? Math.max(0, Number(initialPaid)) : (linkedCustomRequest.depositPaid || 0);
    invoiceDeposit = depositRequired !== undefined ? Math.max(0, Number(depositRequired)) : 0;

    if (priorPaidAmount > 0) {
      initialPayments.push({
        reference: `PREV-DEM-${linkedCustomRequest._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        amount: priorPaidAmount,
        channel: "manual_transfer",
        verifiedBy: "vendor_manual",
        status: "success",
        notes: "Prior deposit recorded on bespoke tailoring demand prior to invoice generation",
        paidAt: linkedCustomRequest.createdAt || new Date(),
      });
    }

    // Synchronize linked CustomRequest depositPaid and balanceOwed
    if (priorPaidAmount > (linkedCustomRequest.depositPaid || 0)) {
      linkedCustomRequest.depositPaid = priorPaidAmount;
      if (linkedCustomRequest.depositPaid >= bespokePrice && linkedCustomRequest.status === "quoted") {
        linkedCustomRequest.status = "confirmed";
      }
      await linkedCustomRequest.save();
    }
  }
  // 3. Custom Line Items from merchant scratch
  else {
    if (!customerSnapshot || !customerSnapshot.name) {
      return sendError(res, "Customer name is required", 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, "At least one invoice line item is required", 400);
    }

    invoiceCustomer = {
      name: customerSnapshot.name.trim(),
      phone: customerSnapshot.phone?.trim() || "",
      email: customerSnapshot.email?.toLowerCase().trim() || "",
      address: customerSnapshot.address?.trim() || "",
    };

    invoiceItems = items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.unitPrice) || 0);
      return {
        description: item.description.trim(),
        variantLabel: item.variantLabel?.trim() || "",
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
      };
    });

    invoiceTotal =
      totalAmount !== undefined
        ? Math.max(0, Number(totalAmount))
        : invoiceItems.reduce((acc, i) => acc + i.subtotal, 0);

    priorPaidAmount = Math.max(0, Number(initialPaid || 0));
    invoiceDeposit = depositRequired !== undefined ? Math.max(0, Number(depositRequired)) : 0;

    if (priorPaidAmount > 0) {
      initialPayments.push({
        reference: `INIT-CUST-${Date.now().toString().slice(-6)}`,
        amount: priorPaidAmount,
        channel: "manual_transfer",
        verifiedBy: "vendor_manual",
        status: "success",
        notes: "Initial payment / deposit credited upon invoice creation",
        paidAt: new Date(),
      });
    }
  }

  const invoiceNumber = await generateInvoiceNumber(req.vendor._id);
  const accessToken = generateAccessToken();

  const balanceDue = Math.max(0, invoiceTotal - priorPaidAmount);
  const invoiceStatus =
    balanceDue <= 0 && invoiceTotal > 0
      ? "paid"
      : priorPaidAmount > 0
      ? "partially_paid"
      : "issued";

  const invoice = await Invoice.create({
    vendor: req.vendor._id,
    order: linkedOrder ? linkedOrder._id : null,
    customRequest: linkedCustomRequest ? linkedCustomRequest._id : null,
    invoiceNumber,
    accessToken,
    customerSnapshot: invoiceCustomer,
    items: invoiceItems,
    totalAmount: invoiceTotal,
    depositRequired: invoiceDeposit,
    totalPaid: priorPaidAmount,
    balanceDue,
    status: invoiceStatus,
    paymentHistory: initialPayments,
    dueDate: dueDate ? new Date(dueDate) : null,
    notes: notes?.trim() || "",
    terms: terms?.trim() || undefined,
  });

  return sendSuccess(res, invoice, "Invoice created successfully", 201);
});

/* ── GET /api/invoices ──────────────────────────────────────────── */
export const getInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;

  const query = { vendor: req.vendor._id };

  if (status && status !== "all") {
    query.status = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { invoiceNumber: { $regex: s, $options: "i" } },
      { "customerSnapshot.name": { $regex: s, $options: "i" } },
      { "customerSnapshot.phone": { $regex: s, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("order", "status totalAmount depositPaid")
      .populate("customRequest", "status agreedValue depositPaid"),
    Invoice.countDocuments(query),
  ]);

  // Aggregate Vendor Invoice Metrics
  const metricsAgg = await Invoice.aggregate([
    { $match: { vendor: req.vendor._id, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: null,
        totalInvoiced: { $sum: "$totalAmount" },
        totalCollected: { $sum: "$totalPaid" },
        totalOutstanding: { $sum: "$balanceDue" },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const metrics = metricsAgg[0] || {
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalCount: 0,
  };

  return sendSuccess(res, {
    invoices,
    metrics,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/* ── GET /api/invoices/:id ──────────────────────────────────────── */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  })
    .populate("order")
    .populate("customRequest");

  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  return sendSuccess(res, invoice);
});

/* ── GET /api/invoices/public/:token ────────────────────────────── */
export const getPublicInvoiceByToken = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ accessToken: req.params.token })
    .populate({
      path: "vendor",
      select: "businessName handle phone email logo socials storefrontSettings payoutAccount",
    });

  if (!invoice) {
    return sendError(res, "Invoice not found or link is invalid", 404);
  }

  return sendSuccess(res, invoice);
});

/* ── POST /api/invoices/public/:token/pay ───────────────────────── */
export const initializeInvoicePayment = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { amount, email } = req.body;

  const invoice = await Invoice.findOne({ accessToken: token }).populate("vendor");
  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  if (invoice.status === "paid" || invoice.balanceDue <= 0) {
    return sendError(res, "This invoice is already paid in full", 400);
  }

  if (invoice.status === "cancelled") {
    return sendError(res, "This invoice has been cancelled", 400);
  }

  // Determine payment amount (in Naira)
  let payAmount = Number(amount);
  if (!payAmount || payAmount <= 0) {
    // If no amount specified, default to balance due
    payAmount = invoice.balanceDue;
  }
  // Clamp to remaining balance
  payAmount = Math.min(payAmount, invoice.balanceDue);

  const amountInKobo = Math.round(payAmount * 100);

  const customerEmail =
    email?.trim() ||
    invoice.customerSnapshot?.email ||
    `${invoice.customerSnapshot?.name?.toLowerCase().replace(/\s+/g, "") || "customer"}@tryvendra.ng`;

  const payload = {
    email: customerEmail,
    amount: amountInKobo,
    metadata: {
      invoiceId: invoice._id.toString(),
      accessToken: invoice.accessToken,
      vendorId: invoice.vendor._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      amountPaidNaira: payAmount,
      customerName: invoice.customerSnapshot?.name,
    },
  };

  // Route directly to vendor via Paystack Subaccount if configured
  if (invoice.vendor.payoutAccount?.paystackSubaccountCode) {
    payload.subaccount = invoice.vendor.payoutAccount.paystackSubaccountCode;
    payload.bearer = "subaccount";
  }

  const paystackRes = await initializeTransaction(payload);

  return sendSuccess(res, paystackRes, "Payment initialized successfully");
});

/* ── POST /api/invoices/public/:token/manual-proof ──────────────── */
export const submitManualPaymentProof = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { amount, bankSenderName, reference, notes } = req.body;

  if (!amount || Number(amount) <= 0) {
    return sendError(res, "Please provide a valid transfer amount", 400);
  }

  const invoice = await Invoice.findOne({ accessToken: token });
  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  if (invoice.status === "cancelled") {
    return sendError(res, "This invoice has been cancelled and cannot accept payments", 400);
  }

  invoice.manualPaymentProofs.push({
    amount: Number(amount),
    bankSenderName: bankSenderName?.trim() || "",
    reference: reference?.trim() || "",
    notes: notes?.trim() || "",
    status: "pending",
    submittedAt: new Date(),
  });

  await invoice.save();

  return sendSuccess(
    res,
    invoice.manualPaymentProofs[invoice.manualPaymentProofs.length - 1],
    "Payment proof submitted successfully. The vendor has been notified to verify."
  );
});

/* ── PATCH /api/invoices/:id/manual-payment ─────────────────────── */
export const recordManualPayment = asyncHandler(async (req, res) => {
  const { amount, channel = "cash", notes } = req.body;

  if (!amount || Number(amount) <= 0) {
    return sendError(res, "Valid payment amount is required", 400);
  }

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  if (invoice.status === "cancelled") {
    return sendError(res, "Cannot record payment on a cancelled invoice", 400);
  }

  const payAmount = Number(amount);
  const paymentRef = `MANUAL-${Date.now()}`;

  invoice.paymentHistory.push({
    reference: paymentRef,
    amount: payAmount,
    channel,
    paidAt: new Date(),
    verifiedBy: "vendor_manual",
    status: "success",
    notes: notes?.trim() || "Manual payment recorded by vendor",
  });

  invoice.totalPaid += payAmount;
  await invoice.save();

  // Synchronize linked Order or CustomRequest
  if (invoice.order) {
    const order = await Order.findById(invoice.order);
    if (order) {
      order.depositPaid += payAmount;
      if (order.balanceOwed <= 0 && order.status === "pending") {
        order.status = "confirmed";
      }
      await order.save();
    }
  } else if (invoice.customRequest) {
    const demand = await CustomRequest.findById(invoice.customRequest);
    if (demand) {
      demand.depositPaid += payAmount;
      if (demand.balanceOwed <= 0 && demand.status === "quoted") {
        demand.status = "confirmed";
      }
      await demand.save();
    }
  }

  return sendSuccess(res, invoice, `Recorded ₦${payAmount.toLocaleString()} payment successfully`);
});

/* ── PATCH /api/invoices/:id/verify-proof ───────────────────────── */
export const verifyManualPaymentProof = asyncHandler(async (req, res) => {
  const { proofId, action } = req.body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return sendError(res, "Action must be 'approve' or 'reject'", 400);
  }

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  if (invoice.status === "cancelled") {
    return sendError(res, "Cannot verify payment proofs on a cancelled invoice", 400);
  }

  const proof = invoice.manualPaymentProofs.id(proofId);
  if (!proof) {
    return sendError(res, "Payment proof record not found", 404);
  }

  if (proof.status !== "pending") {
    return sendError(res, `Proof has already been ${proof.status}`, 400);
  }

  proof.status = action === "approve" ? "approved" : "rejected";
  proof.reviewedAt = new Date();

  if (action === "approve") {
    // Credit payment into invoice payment history
    invoice.paymentHistory.push({
      reference: proof.reference || `PROOF-${proof._id}`,
      amount: proof.amount,
      channel: "manual_transfer",
      paidAt: proof.submittedAt || new Date(),
      verifiedBy: "vendor_manual",
      status: "success",
      notes: `Bank Transfer verified from ${proof.bankSenderName || "Customer"}`,
    });

    invoice.totalPaid += proof.amount;

    // Sync linked Order or CustomRequest
    if (invoice.order) {
      const order = await Order.findById(invoice.order);
      if (order) {
        order.depositPaid += proof.amount;
        if (order.balanceOwed <= 0 && order.status === "pending") {
          order.status = "confirmed";
        }
        await order.save();
      }
    } else if (invoice.customRequest) {
      const demand = await CustomRequest.findById(invoice.customRequest);
      if (demand) {
        demand.depositPaid += proof.amount;
        if (demand.balanceOwed <= 0 && demand.status === "quoted") {
          demand.status = "confirmed";
        }
        await demand.save();
      }
    }
  }

  await invoice.save();

  return sendSuccess(
    res,
    invoice,
    `Payment proof ${action === "approve" ? "approved and balance updated" : "rejected"}`
  );
});

/* ── PATCH /api/invoices/:id/cancel ─────────────────────────────── */
export const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!invoice) {
    return sendError(res, "Invoice not found", 404);
  }

  if (invoice.totalPaid > 0) {
    return sendError(res, "Cannot cancel an invoice with payments recorded", 400);
  }

  invoice.status = "cancelled";
  await invoice.save();

  return sendSuccess(res, invoice, "Invoice cancelled successfully");
});
