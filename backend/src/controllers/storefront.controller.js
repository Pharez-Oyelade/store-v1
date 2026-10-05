import Vendor from "../models/vendorModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import Order from "../models/orderModel.js";
import CustomRequest from "../models/customRequestModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { normalizeOrderItems, depleteInventory } from "./order.controller.js";
import { createNotification } from "../services/notification.service.js";
import { uploadMultipleImages } from "../services/cloudinary.service.js";
import { buildCustomRequestWhatsAppLink } from "../services/whatsapp.service.js";
import { verifyTransaction } from "../services/paystack.service.js";

/* ── GET /api/storefront/:handle ────────────────────────────────── */
export const getVendorStorefront = asyncHandler(async (req, res) => {
  const { handle } = req.params;

  const vendor = await Vendor.findOne({
    handle: handle.toLowerCase(),
    isActive: true,
  }).select(
    "businessName handle bio logo location socials subscriptionPlan businessType category storefrontSettings discounts payoutAccount"
  );

  if (!vendor) {
    return sendError(res, "Store not found", 404);
  }

  const vendorObj = vendor.toObject();

  // Find active discount marked for announcement banner
  const activeCampaign = (vendorObj.discounts || []).find(
    (d) =>
      d.isActive &&
      d.showInAnnouncementBar &&
      (!d.endDate || new Date(d.endDate) > new Date())
  );

  vendorObj.activeCampaign = activeCampaign
    ? {
        code: activeCampaign.code,
        type: activeCampaign.type,
        value: activeCampaign.value,
        minOrderAmount: activeCampaign.minOrderAmount,
      }
    : null;

  // Don't leak private full discount list in public endpoint
  delete vendorObj.discounts;

  // Provide payout capability flag (whether Paystack online payments are verified)
  vendorObj.hasOnlinePayment = Boolean(vendorObj.payoutAccount?.isVerified);
  delete vendorObj.payoutAccount;

  return sendSuccess(res, vendorObj);
});

/* ── GET /api/storefront/:handle/products ───────────────────────── */
export const getStorefrontProducts = asyncHandler(async (req, res) => {
  const { handle } = req.params;
  const { page = 1, limit = 20, category } = req.query;

  const vendor = await Vendor.findOne({
    handle: handle.toLowerCase(),
    isActive: true,
  }).select("_id");

  if (!vendor) {
    return sendError(res, "Store not found", 404);
  }

  const filter = {
    vendor: vendor._id,
    status: "active", // Public storefront shows only active (in-stock) products
  };
  if (category) filter.category = category;

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("name description category images hasVariants variantOptions variants basePrice status fulfillmentType leadTimeDays createdAt updatedAt")
      .lean(),
    Product.countDocuments(filter),
  ]);

  const sanitizedProducts = products.map((product) => {
    const { lowStockThreshold, vendor: _v, __v, ...rest } = product;
    return {
      ...rest,
      variants: Array.isArray(rest.variants)
        ? rest.variants.map(({ sold, ...vRest }) => vRest)
        : [],
    };
  });

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    products: sanitizedProducts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
    },
  });
});

/* ── GET /api/storefront/:handle/products/:productId ────────────── */
export const getStorefrontProduct = asyncHandler(async (req, res) => {
  const { handle, productId } = req.params;

  const vendor = await Vendor.findOne({
    handle: handle.toLowerCase(),
    isActive: true,
  }).select("_id businessName socials");

  if (!vendor) {
    return sendError(res, "Store not found", 404);
  }

  const product = await Product.findOne({
    _id: productId,
    vendor: vendor._id,
    status: "active",
  })
    .select("name description category images hasVariants variantOptions variants basePrice status fulfillmentType leadTimeDays createdAt updatedAt")
    .lean();

  if (!product) {
    return sendError(res, "Product not found or unavailable", 404);
  }

  // Sanitize internal fields from product and variants (strip internal sold metrics)
  const { lowStockThreshold, vendor: _v, __v, ...sanitizedProduct } = product;
  if (Array.isArray(sanitizedProduct.variants)) {
    sanitizedProduct.variants = sanitizedProduct.variants.map(
      ({ sold, ...vRest }) => vRest
    );
  }

  return sendSuccess(res, {
    product: sanitizedProduct,
    vendor: {
      businessName: vendor.businessName,
      whatsapp: vendor.socials?.whatsapp,
    },
  });
});

/* ── POST /api/storefront/:handle/validate-coupon ───────────────── */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { handle } = req.params;
  const { code, subtotal = 0 } = req.body;

  if (!code) {
    return sendError(res, "Coupon code is required", 400);
  }

  const vendor = await Vendor.findOne({
    handle: handle.toLowerCase(),
    isActive: true,
  }).select("discounts");

  if (!vendor) {
    return sendError(res, "Store not found", 404);
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = (vendor.discounts || []).find(
    (d) => d.code === cleanCode && d.isActive
  );

  if (!coupon) {
    return sendError(res, "Invalid or inactive coupon code", 404);
  }

  if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
    return sendError(res, "This coupon code has expired", 400);
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return sendError(res, "This coupon code has reached its usage limit", 400);
  }

  const orderSubtotal = Number(subtotal) || 0;
  if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
    return sendError(
      res,
      `Minimum order amount of ₦${coupon.minOrderAmount.toLocaleString("en-NG")} required for this coupon`,
      400
    );
  }

  let discountAmount = 0;
  if (coupon.type === "percentage") {
    discountAmount = Math.round((orderSubtotal * coupon.value) / 100);
  } else {
    discountAmount = Math.min(coupon.value, orderSubtotal);
  }

  return sendSuccess(
    res,
    {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      newSubtotal: Math.max(0, orderSubtotal - discountAmount),
    },
    "Coupon applied successfully"
  );
});

/* ── POST /api/storefront/:handle/orders ────────────────────────── */
export const createStorefrontOrder = asyncHandler(async (req, res) => {
  const { handle } = req.params;
  const {
    customerName,
    customerPhone,
    customerEmail = "",
    deliveryAddress = {},
    deliveryFee = 0,
    items,
    notes = "",
    paymentMethod = "whatsapp",
    paymentReference = "",
    couponCode = "",
  } = req.body;

  const vendor = await Vendor.findOne({ handle: handle.toLowerCase(), isActive: true });
  if (!vendor) return sendError(res, "Store not found", 404);

  const vendorId = vendor._id;

  // 1. Find or create/update customer record with delivery address
  let customer = await Customer.findOne({ vendor: vendorId, phone: customerPhone });
  if (!customer) {
    customer = await Customer.create({
      vendor: vendorId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      deliveryAddress: {
        street: deliveryAddress.street || "",
        city: deliveryAddress.city || "",
        state: deliveryAddress.state || "",
      },
    });
  } else {
    let updated = false;
    if (customerName && customer.name !== customerName) {
      customer.name = customerName;
      updated = true;
    }
    if (customerEmail && !customer.email) {
      customer.email = customerEmail;
      updated = true;
    }
    if (deliveryAddress?.street || deliveryAddress?.city || deliveryAddress?.state) {
      customer.deliveryAddress = {
        street: deliveryAddress.street || customer.deliveryAddress?.street || "",
        city: deliveryAddress.city || customer.deliveryAddress?.city || "",
        state: deliveryAddress.state || customer.deliveryAddress?.state || "",
      };
      updated = true;
    }
    if (updated) await customer.save();
  }

  // 2. Validate and normalize cart items
  const normalizedItems = await normalizeOrderItems(items, vendorId);
  if (normalizedItems.error) return sendError(res, normalizedItems.error, 400);

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 3. Process Discount / Coupon if provided
  let discountSnapshot = { code: "", amount: 0, percentage: 0 };
  let discountAmount = 0;
  if (couponCode) {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = (vendor.discounts || []).find(
      (d) => d.code === cleanCode && d.isActive
    );

    if (coupon) {
      const isValidDate = !coupon.endDate || new Date(coupon.endDate) > new Date();
      const isUnderUsageLimit = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
      const meetsMinAmount = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

      if (isValidDate && isUnderUsageLimit && meetsMinAmount) {
        if (coupon.type === "percentage") {
          discountAmount = Math.round((subtotal * coupon.value) / 100);
          discountSnapshot = { code: coupon.code, amount: discountAmount, percentage: coupon.value };
        } else {
          discountAmount = Math.min(coupon.value, subtotal);
          discountSnapshot = { code: coupon.code, amount: discountAmount, percentage: 0 };
        }
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await vendor.save();
      }
    }
  }

  const deliveryFeeNum = Math.max(0, Number(deliveryFee) || 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFeeNum);

  // 4. Verify Paystack payment if paymentMethod is paystack and reference is supplied
  let depositPaid = 0;
  let orderStatus = "pending";

  if (paymentMethod === "paystack" && paymentReference) {
    try {
      const verification = await verifyTransaction(paymentReference);
      if (verification && verification.status === "success") {
        depositPaid = totalAmount;
        orderStatus = "confirmed";
      }
    } catch (paystackErr) {
      console.warn("[Paystack Verification Warning]", paystackErr.message);
    }
  }

  // 5. Create Order
  const order = await Order.create({
    vendor: vendorId,
    customer: customer._id,
    customerSnapshot: { name: customerName, phone: customerPhone, email: customerEmail },
    deliveryAddress: {
      street: deliveryAddress.street || "",
      city: deliveryAddress.city || "",
      state: deliveryAddress.state || "",
    },
    deliveryFee: deliveryFeeNum,
    items: normalizedItems,
    totalAmount,
    depositPaid,
    paymentMethod,
    paymentReference: paymentReference || "",
    discount: discountSnapshot,
    status: orderStatus,
    notes,
    source: "storefront",
  });

  // Atomically reserve inventory to prevent overselling on the storefront
  try {
    await depleteInventory(order);
    order.stockDepleted = true;
    await order.save();
  } catch (stockErr) {
    // If inventory depletion fails (e.g. stock exhausted by concurrent checkout), delete unconfirmed order
    await Order.findByIdAndDelete(order._id);
    return sendError(
      res,
      stockErr.message || "One or more items in your cart are no longer available in the requested quantity",
      400
    );
  }

  const addressSummary = deliveryAddress.street
    ? ` (Delivery to: ${deliveryAddress.street}, ${deliveryAddress.city})`
    : "";

  await createNotification(vendorId, {
    title: "New Storefront Order",
    message: `Order #${order._id.toString().slice(-6).toUpperCase()} received from ${customerName} via Storefront (Total: ₦${totalAmount.toLocaleString("en-NG")})${addressSummary}.`,
    type: "order_status",
    actionUrl: `/dashboard/orders/${order._id}`,
  });

  return sendSuccess(
    res,
    {
      orderId: order._id,
      totalAmount,
      depositPaid,
      paymentMethod,
      status: order.status,
    },
    "Order placed successfully",
    201
  );
});

/* ── Helper: Normalize measurements ────────────────────────────── */
function normalizeMeasurements(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? normalizeMeasurements(parsed) : {};
    } catch {
      return {};
    }
  }
  if (raw instanceof Map) {
    return Object.fromEntries(raw);
  }
  if (typeof raw === "object") {
    if (typeof raw.toJSON === "function") {
      return normalizeMeasurements(raw.toJSON());
    }
    const clean = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!k.startsWith("$") && !k.startsWith("_") && typeof v !== "object" && typeof v !== "function") {
        clean[k] = String(v);
      }
    }
    return clean;
  }
  return {};
}

/* ── POST /api/storefront/:handle/custom-requests ───────────────── */
export const createStorefrontCustomRequest = asyncHandler(async (req, res) => {
  const { handle } = req.params;
  const {
    customerName,
    customerPhone,
    customerEmail = "",
    title,
    description = "",
    category = "clothing",
    measurements,
    notes = "",
  } = req.body;

  const vendor = await Vendor.findOne({ handle: handle.toLowerCase(), isActive: true });
  if (!vendor) return sendError(res, "Store not found", 404);

  const vendorId = vendor._id;
  const parsedMeasurements = normalizeMeasurements(measurements);

  let customer = await Customer.findOne({ vendor: vendorId, phone: customerPhone });
  if (!customer) {
    customer = await Customer.create({
      vendor: vendorId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      measurements: parsedMeasurements,
    });
  } else {
    if (customerName) customer.name = customerName;
    if (customerEmail) customer.email = customerEmail;
    if (Object.keys(parsedMeasurements).length > 0) {
      if (!customer.measurements) customer.measurements = new Map();
      for (const [k, v] of Object.entries(parsedMeasurements)) {
        if (typeof customer.measurements.set === "function") {
          customer.measurements.set(k, String(v));
        } else {
          customer.measurements[k] = String(v);
        }
      }
    }
    await customer.save();
  }

  // Upload reference images if any (with automatic rollback on partial failure)
  const referenceImages = await uploadMultipleImages(req.files || []);

  let finalMeasurements = parsedMeasurements;
  if (Object.keys(finalMeasurements).length === 0 && customer.measurements) {
    finalMeasurements = normalizeMeasurements(customer.measurements);
  }

  const customRequest = await CustomRequest.create({
    vendor: vendorId,
    customer: customer._id,
    customerSnapshot: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    },
    title,
    description,
    category,
    referenceImages,
    measurements: finalMeasurements,
    source: "storefront",
    notes,
    status: "inquiry",
  });


  await createNotification(vendorId, {
    title: "New Bespoke Inquiry",
    message: `Customer ${customerName} submitted a bespoke inquiry: "${title}".`,
    type: "storefront_enquiry",
    actionUrl: `/dashboard/demands/${customRequest._id}`,
  });

  const reqObj = customRequest.toObject({ flattenMaps: true });
  const quoteLink = buildCustomRequestWhatsAppLink(vendor, reqObj, "quote");

  return sendSuccess(
    res,
    { requestId: customRequest._id, whatsappLink: quoteLink },
    "Bespoke request submitted successfully",
    201
  );
});

