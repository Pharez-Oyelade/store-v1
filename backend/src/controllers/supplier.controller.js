import Supplier from "../models/supplierModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function pickSupplierFields(body) {
  return {
    name: body.name,
    category: body.category,
    contactName: body.contactName,
    phone: body.phone,
    email: body.email,
    instagram: body.instagram,
    whatsapp: body.whatsapp,
    location: body.location,
    notes: body.notes,
    status: body.status,
    lastPurchaseAmount:
      body.lastPurchaseAmount !== undefined ? Number(body.lastPurchaseAmount) : undefined,
    outstandingBalance:
      body.outstandingBalance !== undefined ? Number(body.outstandingBalance) : undefined,
    lastPurchaseDate: body.lastPurchaseDate ? new Date(body.lastPurchaseDate) : undefined,
  };
}

export const getSuppliers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    search,
    sort = "updatedAt",
    order = "desc",
  } = req.query;

  const filter = { vendor: req.vendor._id };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { contactName: { $regex: search, $options: "i" } },
      { materials: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === "asc" ? 1 : -1;

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter)
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Supplier.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    suppliers,
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

export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!supplier) return sendError(res, "Supplier not found", 404);
  return sendSuccess(res, supplier);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create({
    vendor: req.vendor._id,
    ...pickSupplierFields(req.body),
    materials: normalizeList(req.body.materials),
  });

  return sendSuccess(res, supplier, "Supplier created successfully", 201);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!supplier) return sendError(res, "Supplier not found", 404);

  const fields = pickSupplierFields(req.body);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) supplier[key] = value;
  });

  if (req.body.materials !== undefined) {
    supplier.materials = normalizeList(req.body.materials);
  }

  await supplier.save();
  return sendSuccess(res, supplier, "Supplier updated successfully");
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOneAndDelete({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!supplier) return sendError(res, "Supplier not found", 404);
  return sendSuccess(res, null, "Supplier deleted successfully");
});

export const getSupplierSummary = asyncHandler(async (req, res) => {
  const [summary] = await Supplier.aggregate([
    { $match: { vendor: req.vendor._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        preferred: {
          $sum: { $cond: [{ $eq: ["$status", "preferred"] }, 1, 0] },
        },
        outstandingBalance: { $sum: "$outstandingBalance" },
        lastPurchaseTotal: { $sum: "$lastPurchaseAmount" },
      },
    },
  ]);

  return sendSuccess(res, {
    total: summary?.total ?? 0,
    preferred: summary?.preferred ?? 0,
    outstandingBalance: summary?.outstandingBalance ?? 0,
    lastPurchaseTotal: summary?.lastPurchaseTotal ?? 0,
  });
});
