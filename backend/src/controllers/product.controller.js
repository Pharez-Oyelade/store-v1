import Product from "../models/productModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { deleteImages } from "../services/cloudinary.service.js";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";

/* ── GET /api/products ──────────────────────────────────────────── */
export const getProducts = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    page = 1,
    limit = 20,
    status,
    category,
    search,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const filter = { vendor: vendorId };

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    // Text search if text index exists; fallback to regex
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit))
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

/* ── GET /api/products/:id ──────────────────────────────────────── */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    vendor: req.vendor._id, // Ownership check — vendors can only see their own products
  });

  if (!product) {
    return sendError(res, "Product not found", 404);
  }

  return sendSuccess(res, product);
});

/* ── POST /api/products ─────────────────────────────────────────── */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    tags,
    variants,
    status,
    lowStockThreshold,
  } = req.body;

  // Upload each file buffer to Cloudinary manually
  const images = await Promise.all(
    (req.files || []).map(async (file) => {
      const result = await uploadToCloudinary(file.buffer);
      return { url: result.secure_url, publicId: result.public_id };
    }),
  );

  // Parse variants — may come as JSON string in FormData
  let parsedVariants = variants;
  if (typeof variants === "string") {
    try {
      parsedVariants = JSON.parse(variants);
    } catch {
      return sendError(res, "Invalid variants format", 400);
    }
  }

  const product = await Product.create({
    vendor: req.vendor._id,
    name,
    description,
    category,
    tags:
      typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags,
    images,
    variants: parsedVariants,
    status: status || "draft",
    lowStockThreshold: lowStockThreshold ?? 5,
  });

  return sendSuccess(res, product, "Product created successfully", 201);
});

/* ── PUT /api/products/:id ──────────────────────────────────────── */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!product) {
    return sendError(res, "Product not found", 404);
  }

  const {
    name,
    description,
    category,
    tags,
    variants,
    status,
    lowStockThreshold,
    removeImageIds, // Array of Cloudinary publicIds to remove
  } = req.body;

  // Process new uploaded images
  const newImages = await Promise.all(
    (req.files || []).map(async (file) => {
      const result = await uploadToCloudinary(file.buffer);
      return { url: result.secure_url, publicId: result.public_id };
    }),
  );

  // Remove specific images if requested
  if (removeImageIds) {
    const idsToRemove = Array.isArray(removeImageIds)
      ? removeImageIds
      : [removeImageIds];
    await deleteImages(idsToRemove);
    product.images = product.images.filter(
      (img) => !idsToRemove.includes(img.publicId),
    );
  }

  // Append new images (respecting max 5)
  if (newImages.length > 0) {
    product.images = [...product.images, ...newImages].slice(0, 5);
  }

  // Update scalar fields
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (category !== undefined) product.category = category;
  if (tags !== undefined) {
    product.tags =
      typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags;
  }
  if (variants !== undefined) {
    product.variants =
      typeof variants === "string" ? JSON.parse(variants) : variants;
  }
  if (status !== undefined) product.status = status;
  if (lowStockThreshold !== undefined)
    product.lowStockThreshold = lowStockThreshold;

  await product.save();

  return sendSuccess(res, product, "Product updated successfully");
});

/* ── DELETE /api/products/:id ───────────────────────────────────── */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!product) {
    return sendError(res, "Product not found", 404);
  }

  // Clean up all Cloudinary images
  await deleteImages(product.images.map((img) => img.publicId));

  await product.deleteOne();

  return sendSuccess(res, null, "Product deleted successfully");
});

/* ── POST /api/products/bulk ────────────────────────────────────── */
export const bulkAction = asyncHandler(async (req, res) => {
  const { action, productIds } = req.body;
  const vendorId = req.vendor._id;

  if (!action || !Array.isArray(productIds) || productIds.length === 0) {
    return sendError(res, "action and productIds[] are required", 400);
  }

  const validActions = ["archive", "activate", "delete"];
  if (!validActions.includes(action)) {
    return sendError(
      res,
      `Invalid action. Must be one of: ${validActions.join(", ")}`,
      400,
    );
  }

  // Ensure all products belong to this vendor
  const filter = { _id: { $in: productIds }, vendor: vendorId };

  if (action === "delete") {
    const products = await Product.find(filter).select("images");
    const allPublicIds = products.flatMap((p) =>
      p.images.map((img) => img.publicId),
    );
    await deleteImages(allPublicIds);
    await Product.deleteMany(filter);
    return sendSuccess(res, null, `${products.length} products deleted`);
  }

  const statusMap = { archive: "archived", activate: "active" };
  const result = await Product.updateMany(filter, {
    status: statusMap[action],
  });

  return sendSuccess(
    res,
    { modified: result.modifiedCount },
    `Products ${action}d successfully`,
  );
});
