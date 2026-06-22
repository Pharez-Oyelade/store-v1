import Vendor from "../models/vendorModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import Order from "../models/orderModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { normalizeOrderItems } from "./order.controller.js";
import { createNotification } from "../services/notification.service.js";

/* ── GET /api/storefront/:handle ────────────────────────────────── */
export const getVendorStorefront = asyncHandler(async (req, res) => {
  const { handle } = req.params;

  const vendor = await Vendor.findOne({
    handle: handle.toLowerCase(),
    isActive: true,
  }).select("businessName handle bio logo location socials subscriptionPlan");

  if (!vendor) {
    return sendError(res, "Store not found", 404);
  }

  return sendSuccess(res, vendor);
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
      .select("name description category images variants basePrice status")
      .lean(),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    products,
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
  }).lean();

  if (!product) {
    return sendError(res, "Product not found or unavailable", 404);
  }

  return sendSuccess(res, {
    product,
    vendor: {
      businessName: vendor.businessName,
      whatsapp: vendor.socials?.whatsapp,
    },
  });
});

/* ── POST /api/storefront/:handle/orders ────────────────────────── */
export const createStorefrontOrder = asyncHandler(async (req, res) => {
  const { handle } = req.params;
  const { customerName, customerPhone, customerEmail = "", items, notes = "" } = req.body;

  const vendor = await Vendor.findOne({ handle: handle.toLowerCase(), isActive: true });
  if (!vendor) return sendError(res, "Store not found", 404);

  const vendorId = vendor._id;

  let customer = await Customer.findOne({ vendor: vendorId, phone: customerPhone });
  if (!customer) {
    customer = await Customer.create({
      vendor: vendorId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    });
  }

  const normalizedItems = await normalizeOrderItems(items, vendorId);
  if (normalizedItems.error) return sendError(res, normalizedItems.error, 400);

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    vendor: vendorId,
    customer: customer._id,
    customerSnapshot: { name: customerName, phone: customerPhone, email: customerEmail },
    items: normalizedItems,
    totalAmount,
    depositPaid: 0,
    notes,
    source: "storefront",
  });

  await createNotification(vendorId, {
    title: "New Storefront Order",
    message: `Order #${order._id.toString().slice(-6).toUpperCase()} received from ${customerName} via Storefront (Total: ₦${totalAmount.toLocaleString("en-NG")}).`,
    type: "order_status",
    actionUrl: `/dashboard/orders/${order._id}`,
  });

  return sendSuccess(res, { orderId: order._id }, "Order placed successfully", 201);
});
