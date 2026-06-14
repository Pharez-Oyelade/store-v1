import Subscription, { PLAN_PRICES } from "../models/subscriptionModel.js";
import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
} from "../services/paystack.service.js";
import { createNotification } from "../services/notification.service.js";

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
  const subscriptionPeriodEnd = new Date();
  subscriptionPeriodEnd.setMonth(subscriptionPeriodEnd.getMonth() + 1); // 1 month access

  await Subscription.findOneAndUpdate(
    { vendor: vendor._id },
    {
      plan,
      status: "active",
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

  // Handle specific events (e.g., charge.success for recurring subscriptions)
  if (event.event === "charge.success") {
    const paymentData = event.data;
    const { vendorId, plan } = paymentData.metadata || {};

    if (vendorId && plan) {
      await Vendor.findByIdAndUpdate(vendorId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
      });
      
      const subscriptionPeriodEnd = new Date();
      subscriptionPeriodEnd.setMonth(subscriptionPeriodEnd.getMonth() + 1);
      
      await Subscription.findOneAndUpdate(
        { vendor: vendorId },
        {
          plan,
          status: "active",
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
