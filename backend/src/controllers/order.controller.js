import Order from "../models/orderModel.js";
import Customer from "../models/customerModel.js";
import Product from "../models/productModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { buildDynamicWhatsAppLink } from "../services/whatsapp.service.js";
import { createNotification } from "../services/notification.service.js";

/* ── GET /api/orders ────────────────────────────────────────────── */
export const getOrders = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    sort = "createdAt",
    order: sortOrder = "desc",
  } = req.query;

  const filter = { vendor: vendorId };

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const [ordersRaw, total] = await Promise.all([
    Order.find(filter)
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(filter),
  ]);

  const orders = await Promise.all(
    ordersRaw.map(async (orderObj) => {
      const confirmed = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderConfirmedTemplate");
      const dispatched = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderDispatchedTemplate");
      const completed = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderCompletedTemplate");
      return {
        ...orderObj,
        whatsappLinks: { confirmed, dispatched, completed },
      };
    })
  );

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    orders,
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

/* ── GET /api/orders/summary/debt ───────────────────────────────── */
export const getDebtSummary = asyncHandler(async (req, res) => {
  const result = await Order.aggregate([
    {
      $match: {
        vendor: req.vendor._id,
        status: { $nin: ["completed", "cancelled"] },
        balanceOwed: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totalDebt: { $sum: "$balanceOwed" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const { totalDebt = 0, orderCount = 0 } = result[0] ?? {};

  return sendSuccess(res, { totalDebt, orderCount });
});

/* ── GET /api/orders/:id ────────────────────────────────────────── */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  }).populate("customer", "name phone email instagram tags");

  if (!order) {
    return sendError(res, "Order not found", 404);
  }

  const orderObj = order.toObject();
  orderObj.whatsappLinks = {
    confirmed: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderConfirmedTemplate"),
    dispatched: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderDispatchedTemplate"),
    completed: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderCompletedTemplate"),
  };

  return sendSuccess(res, orderObj);
});

/* ── POST /api/orders ───────────────────────────────────────────── */
export const createOrder = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    customerName,
    customerPhone,
    customerEmail = "",
    items,
    depositPaid = 0,
    notes = "",
    source = "dm",
  } = req.body;

  /*
   * Auto-create or find existing customer.
   * Customers are scoped per vendor (unique: vendor + phone).
   */
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

  if (normalizedItems.error) {
    return sendError(res, normalizedItems.error, 400);
  }

  // Compute total from normalized item snapshots
  const totalAmount = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const order = await Order.create({
    vendor: vendorId,
    customer: customer._id,
    customerSnapshot: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    },
    items: normalizedItems,
    totalAmount,
    depositPaid,
    notes,
    source,
  });

  const orderObj = order.toObject();
  orderObj.whatsappLinks = {
    confirmed: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderConfirmedTemplate"),
    dispatched: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderDispatchedTemplate"),
    completed: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderCompletedTemplate"),
  };

  await createNotification(vendorId, {
    title: "New Order Created",
    message: `Order #${order._id.toString().slice(-6).toUpperCase()} has been created for ${customerName} (Total: ₦${totalAmount.toLocaleString("en-NG")}).`,
    type: "order_status",
    actionUrl: `/dashboard/orders/${order._id}`,
  });

  return sendSuccess(res, orderObj, "Order created successfully", 201);
});

/* ── PUT /api/orders/:id ────────────────────────────────────────── */
export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!order) {
    return sendError(res, "Order not found", 404);
  }

  const { status, depositPaid, notes, whatsappSent } = req.body;
  const prevStatus = order.status;

  if (status !== undefined) order.status = status;
  if (depositPaid !== undefined) order.depositPaid = depositPaid;
  if (notes !== undefined) order.notes = notes;
  if (whatsappSent !== undefined) order.whatsappSent = whatsappSent;

  await order.save(); // Pre-save hook recomputes balanceOwed

  /*
   * Business Logic: Inventory management on status change.
   *
   * Stock should be depleted when the order moves to any "active" status
   * (confirmed, ready, dispatched, completed) — but only ONCE.
   * The `stockDepleted` flag on the order prevents double-deduction
   * if the order flows through confirmed → ready → dispatched → completed.
   *
   * If the order is cancelled, restore the stock (if it was depleted).
   */
  if (status !== undefined && status !== prevStatus) {
    const shouldDeplete =
      !order.stockDepleted &&
      ["confirmed", "ready", "dispatched", "completed"].includes(status);

    const shouldRestore =
      order.stockDepleted &&
      status === "cancelled";

    if (shouldDeplete) {
      await depleteInventory(order);
      order.stockDepleted = true;
      await order.save();
    }

    if (shouldRestore) {
      await restoreInventory(order);
      order.stockDepleted = false;
      await order.save();
    }

    await createNotification(order.vendor, {
      title: "Order Status Updated",
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} status has changed to "${status}".`,
      type: "order_status",
      actionUrl: `/dashboard/orders/${order._id}`,
    });
  }

  /*
   * Business Logic: When order is "completed", update customer LTV.
   */
  if (status === "completed" && prevStatus !== "completed") {
    await updateCustomerStats(order);
  }

  const orderObj = order.toObject();
  orderObj.whatsappLinks = {
    confirmed: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderConfirmedTemplate"),
    dispatched: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderDispatchedTemplate"),
    completed: await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderCompletedTemplate"),
  };

  return sendSuccess(res, orderObj, "Order updated successfully");
});

/* ── DELETE /api/orders/:id ─────────────────────────────────────── */
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!order) {
    return sendError(res, "Order not found", 404);
  }

  if (order.status === "completed") {
    return sendError(res, "Completed orders cannot be deleted", 400);
  }

  /*
   * If stock was already depleted for this order, restore it before deleting.
   */
  if (order.stockDepleted) {
    await restoreInventory(order);
  }

  await order.deleteOne();

  return sendSuccess(res, null, "Order deleted successfully");
});

/* ==== Private helpers ============================================= */

async function normalizeOrderItems(items, vendorId) {
  const normalized = [];

  for (const item of items) {
    const productRef = item.product || item.productId || null;
    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      normalized.error = "Each item quantity must be at least 1";
      return normalized;
    }

    if (!productRef) {
      if (!item.productName || !item.variantLabel || item.price === undefined) {
        normalized.error =
          "Custom order items require productName, variantLabel, price and quantity";
        return normalized;
      }

      normalized.push({
        product: null,
        productName: item.productName,
        variantLabel: item.variantLabel,
        price: Number(item.price),
        quantity,
      });
      continue;
    }

    const product = await Product.findOne({ _id: productRef, vendor: vendorId });
    if (!product) {
      normalized.error = "One or more products were not found";
      return normalized;
    }

    const variant = product.variants.find((v) => v.label === item.variantLabel);
    if (!variant) {
      normalized.error = `${product.name} does not have variant ${item.variantLabel}`;
      return normalized;
    }

    normalized.push({
      product: product._id,
      productName: product.name,
      variantLabel: variant.label,
      price: item.price !== undefined ? Number(item.price) : variant.price,
      quantity,
    });
  }

  return normalized;
}

/**
 * Decrement product variant quantities when an order is confirmed/completed.
 * Marks product as sold_out if all variants hit 0.
 */
async function depleteInventory(order) {
  for (const item of order.items) {
    if (!item.product) continue; // Skip if no product reference

    const product = await Product.findById(item.product);
    if (!product) continue;

    /*
     * Find the matching variant by label.
     * We match on label because that's what's stored in the order item.
     */
    const variant = product.variants.find((v) => v.label === item.variantLabel);
    if (variant) {
      variant.quantity = Math.max(0, variant.quantity - item.quantity);
      variant.sold += item.quantity;
    }

    // Check if ALL variants are depleted → auto-sold-out
    const allSoldOut = product.variants.every((v) => v.quantity === 0);
    if (allSoldOut) product.status = "sold_out";

    await product.save();

    if (variant.quantity <= 3) {
      await createNotification(order.vendor, {
        title: "Low Stock Alert",
        message: `Variant "${variant.label}" of product "${product.name}" is running low on stock (${variant.quantity} left).`,
        type: "low_stock",
        actionUrl: `/dashboard/products/edit/${product._id}`,
      });
    }
  }
}

/**
 * Restore product variant quantities when an order is cancelled.
 * Reverses the depletion done by depleteInventory.
 */
async function restoreInventory(order) {
  for (const item of order.items) {
    if (!item.product) continue; // Skip custom items

    const product = await Product.findById(item.product);
    if (!product) continue;

    const variant = product.variants.find((v) => v.label === item.variantLabel);
    if (variant) {
      variant.quantity += item.quantity;
      variant.sold = Math.max(0, variant.sold - item.quantity);
    }

    // If the product was sold_out and now has stock, reactivate it
    if (product.status === "sold_out") {
      const hasStock = product.variants.some((v) => v.quantity > 0);
      if (hasStock) product.status = "active";
    }

    await product.save();
  }
}

/**
 * Update customer LTV and order count when an order is completed.
 */
async function updateCustomerStats(order) {
  if (!order.customer) return;

  await Customer.findByIdAndUpdate(order.customer, {
    $inc: {
      ltv: order.totalAmount,
      orderCount: 1,
    },
    $set: { lastOrderDate: new Date() },
  });
}

