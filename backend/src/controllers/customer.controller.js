import Customer from "../models/customerModel.js";
import Order from "../models/orderModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/* ── GET /api/customers ─────────────────────────────────────────── */
export const getCustomers = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    page = 1,
    limit = 20,
    search,
    sort = "ltv",
    order = "desc",
  } = req.query;

  const filter = { vendor: vendorId };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === "asc" ? 1 : -1;

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Customer.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    customers,
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

/* ── GET /api/customers/:id ─────────────────────────────────────── */
export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!customer) {
    return sendError(res, "Customer not found", 404);
  }

  // Fetch the customer's recent order history (last 10 orders)
  const orders = await Order.find({
    vendor: req.vendor._id,
    customer: customer._id,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("items totalAmount depositPaid balanceOwed status createdAt")
    .lean();

  return sendSuccess(res, { ...customer.toObject({ flattenMaps: true }), orders });
});

/* ── PUT /api/customers/:id ─────────────────────────────────────── */
export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!customer) {
    return sendError(res, "Customer not found", 404);
  }

  const { notes, tags, instagram, email, measurements } = req.body;

  if (notes !== undefined) customer.notes = notes;
  if (tags !== undefined) customer.tags = tags;
  if (instagram !== undefined) customer.instagram = instagram;
  if (email !== undefined) customer.email = email;
  if (measurements !== undefined) customer.measurements = measurements;

  await customer.save();

  return sendSuccess(res, customer.toObject({ flattenMaps: true }), "Customer updated successfully");
});

/* ── DELETE /api/customers/:id ──────────────────────────────────── */
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!customer) {
    return sendError(res, "Customer not found", 404);
  }

  return sendSuccess(res, null, "Customer deleted successfully");
});
