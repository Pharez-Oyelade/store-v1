import Vendor from "../models/vendorModel.js";
import Product from "../models/productModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

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
