import Subscription, { PLAN_PRICES } from "../models/subscriptionModel.js";
import Vendor from "../models/vendorModel.js";
import Invoice from "../models/invoiceModel.js";
import Order from "../models/orderModel.js";
import CustomRequest from "../models/customRequestModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
} from "../services/paystack.service.js";
import { createNotification } from "../services/notification.service.js";
import {
  syncVendorSubscription,
  processAllSubscriptionExpiries,
} from "../services/subscription.service.js";


/**
 * Initialize a subscription upgrade/payment
 * POST /api/subscriptions/initialize
 */
export const initializeUpgrade = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const vendor = req.vendor;

  if (!plan || !PLAN_PRICES.hasOwnProperty(plan)) {
    return sendError(res, "Invalid subscription plan selected", 400);
  }

  const amount = PLAN_PRICES[plan] * 100; // Paystack expects amount in kobo

  // If free plan, no need to initialize payment - update immediately
  if (amount === 0) {
    if (plan === "maison") {
      return sendError(res, "Please contact sales for The Maison plan", 400);
    }
    
    vendor.subscriptionPlan = plan;
    vendor.subscriptionStatus = "active";
    await vendor.save();

    await Subscription.findOneAndUpdate(
      { vendor: vendor._id },
      { plan, status: "active", cancelAtPeriodEnd: false },
      { upsert: true }
    );

    return sendSuccess(res, { isFree: true, plan }, `Successfully changed to ${plan} plan`);
  }

  // Initialize transaction with Paystack
  const paystackData = await initializeTransaction({
    email: vendor.email || `vendor-${vendor._id}@sabistore.com`, // email is optional in vendor, but required by paystack
    amount,
    metadata: {
      vendorId: vendor._id,
      plan,
    },
    // callback_url: `${process.env.FRONTEND_URL}/dashboard/settings/billing/verify`
  });

  return sendSuccess(res, paystackData, "Payment initialized successfully");
});

/**
 * Verify a payment and upgrade subscription
 * POST /api/subscriptions/verify
 */
export const verifyUpgrade = asyncHandler(async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return sendError(res, "Transaction reference is required", 400);
  }

  const paymentData = await verifyTransaction(reference);

  if (paymentData.status !== "success") {
    return sendError(res, "Payment was not successful", 400);
  }

  const { vendorId, plan } = paymentData.metadata || {};

  if (!vendorId || !plan) {
    return sendError(res, "Invalid payment metadata", 400);
  }

  // Ensure this payment was meant for the current vendor
  if (vendorId.toString() !== req.vendor._id.toString()) {
    return sendError(res, "Unauthorized transaction verification", 403);
  }

  // Update vendor plan
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return sendError(res, "Vendor not found", 404);
  }

  vendor.subscriptionPlan = plan;
  vendor.subscriptionStatus = "active";
  await vendor.save();

  // Also update or create the Subscription record
  const subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days access

  await Subscription.findOneAndUpdate(
    { vendor: vendor._id },
    {
      plan,
      status: "active",
      isTrial: false,
      expiryNoticeSent: false,
      paystackCustomerCode: paymentData.customer?.customer_code,
      currentPeriodStart: new Date(),
      currentPeriodEnd: subscriptionPeriodEnd,
    },
    { upsert: true, new: true }
  );

  await createNotification(vendor._id, {
    title: "Subscription Upgraded",
    message: `Your account has been upgraded to the ${plan} plan.`,
    type: "subscription",
    actionUrl: `/dashboard/settings`,
  });

  return sendSuccess(res, { plan }, `Successfully upgraded to ${plan} plan`);
});

/**
 * Webhook handler for Paystack events
 * POST /api/subscriptions/webhook
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const isValid = verifyWebhookSignature(signature, JSON.stringify(req.body));

  if (!isValid) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  // Handle specific events (e.g., charge.success for recurring subscriptions or invoices)
  if (event.event === "charge.success") {
    const paymentData = event.data;
    const metadata = paymentData.metadata || {};

    // ── Branch A: Live Dynamic Invoice Payment ──────────────────────
    if (metadata.invoiceId) {
      try {
        const invoice = await Invoice.findById(metadata.invoiceId);
        if (invoice) {
          // Idempotency check: don't process duplicate webhook delivery
          const alreadyProcessed = invoice.paymentHistory?.some(
            (p) => p.reference === paymentData.reference
          );

          if (!alreadyProcessed) {
            const paidNaira = Number(paymentData.amount) / 100;

            invoice.paymentHistory.push({
              reference: paymentData.reference,
              amount: paidNaira,
              channel: paymentData.channel || "card",
              paidAt: paymentData.paid_at ? new Date(paymentData.paid_at) : new Date(),
              verifiedBy: "paystack",
              status: "success",
              notes: `Online checkout via ${paymentData.channel || "card"}`,
            });

            invoice.totalPaid += paidNaira;
            await invoice.save();

            // Sync linked Order
            if (invoice.order) {
              const order = await Order.findById(invoice.order);
              if (order) {
                order.depositPaid += paidNaira;
                if (order.balanceOwed <= 0 && order.status === "pending") {
                  order.status = "confirmed";
                }
                await order.save();
              }
            }
            // Sync linked CustomRequest
            else if (invoice.customRequest) {
              const demand = await CustomRequest.findById(invoice.customRequest);
              if (demand) {
                demand.depositPaid += paidNaira;
                if (demand.balanceOwed <= 0 && demand.status === "quoted") {
                  demand.status = "confirmed";
                }
                await demand.save();
              }
            }

            // Create notification for vendor
            await createNotification(invoice.vendor, {
              title: "Invoice Payment Received",
              message: `Payment of ₦${paidNaira.toLocaleString()} received for Invoice #${invoice.invoiceNumber}.`,
              type: "order",
              actionUrl: `/dashboard/invoices/${invoice._id}`,
            });
          }
        }
      } catch (err) {
        console.error("[Invoice Webhook Error]", err);
      }
    }

    // ── Branch B: SaaS Subscription Upgrade / Renewal ───────────────
    const { vendorId, plan } = metadata;
    if (vendorId && plan) {
      await Vendor.findByIdAndUpdate(vendorId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
      });
      
      const subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days renewal
      
      await Subscription.findOneAndUpdate(
        { vendor: vendorId },
        {
          plan,
          status: "active",
          isTrial: false,
          expiryNoticeSent: false,
          paystackCustomerCode: paymentData.customer?.customer_code,
          currentPeriodStart: new Date(),
          currentPeriodEnd: subscriptionPeriodEnd,
        },
        { upsert: true }
      );

      await createNotification(vendorId, {
        title: "Subscription Renewed",
        message: `Your subscription for the ${plan} plan has been successfully renewed.`,
        type: "subscription",
        actionUrl: `/dashboard/settings`,
      });
    }
  }

  return res.status(200).send("Webhook received");
});

/**
 * Get current subscription details
 * GET /api/subscriptions/current
 */
export const getCurrentSubscription = asyncHandler(async (req, res) => {
  // Sync real-time lifecycle check
  await syncVendorSubscription(req.vendor._id);

  let sub = await Subscription.findOne({ vendor: req.vendor._id });
  
  if (!sub) {
    sub = await Subscription.create({
      vendor: req.vendor._id,
      plan: req.vendor.subscriptionPlan,
      status: req.vendor.subscriptionStatus,
    });
  }

  return sendSuccess(res, sub, "Subscription details fetched");
});

/**
 * Background / Admin trigger to check all subscription expiries
 * POST /api/subscriptions/check-lifecycle
 */
export const checkSubscriptionLifecycle = asyncHandler(async (req, res) => {
  await processAllSubscriptionExpiries();
  return sendSuccess(res, null, "Subscription lifecycles checked and processed");
});

