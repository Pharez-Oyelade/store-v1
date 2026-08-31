import Order from "../models/orderModel.js";
import Customer from "../models/customerModel.js";
import Product from "../models/productModel.js";
import CustomRequest from "../models/customRequestModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { buildDynamicWhatsAppLink, buildCustomRequestWhatsAppLink } from "../services/whatsapp.service.js";
import { createNotification } from "../services/notification.service.js";

/* ── GET /api/orders ────────────────────────────────────────────── */
export const getOrders = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    page = 1,
    limit = 20,
    status,
    type = "all", // "all" | "ready_to_wear" | "bespoke"
    startDate,
    endDate,
    sort = "createdAt",
    order: sortOrder = "desc",
  } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const orderFilter = { vendor: vendorId };
  if (status && status !== "all") orderFilter.status = status;
  if (startDate || endDate) orderFilter.createdAt = dateFilter;

  const customFilter = { vendor: vendorId };
  if (status && status !== "all") customFilter.status = status;
  if (startDate || endDate) customFilter.createdAt = dateFilter;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = sortOrder === "asc" ? 1 : -1;

  let allOrdersList = [];
  let totalCount = 0;

  if (type === "bespoke") {
    const [customRaw, totalCustom] = await Promise.all([
      CustomRequest.find(customFilter)
        .sort({ [sort]: sortDir })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CustomRequest.countDocuments(customFilter),
    ]);

    totalCount = totalCustom;
    allOrdersList = customRaw.map((cr) => ({
      _id: cr._id,
      isBespoke: true,
      vendor: cr.vendor,
      customer: cr.customer,
      customerSnapshot: cr.customerSnapshot,
      items: [
        {
          product: null,
          productName: cr.title,
          variantLabel: `Bespoke / ${cr.category}`,
          price: cr.agreedPrice > 0 ? cr.agreedPrice : cr.estimatedPrice,
          quantity: 1,
        },
      ],
      totalAmount: cr.agreedPrice > 0 ? cr.agreedPrice : cr.estimatedPrice,
      depositPaid: cr.depositPaid,
      balanceOwed: cr.balanceOwed,
      status: cr.status,
      source: cr.source,
      notes: cr.notes,
      createdAt: cr.createdAt,
      updatedAt: cr.updatedAt,
      whatsappLinks: {
        confirmed: buildCustomRequestWhatsAppLink(req.vendor, cr, "confirmed"),
        fitting: buildCustomRequestWhatsAppLink(req.vendor, cr, "fitting"),
        completed: buildCustomRequestWhatsAppLink(req.vendor, cr, "completed"),
      },
    }));
  } else if (type === "ready_to_wear") {
    const [ordersRaw, totalOrders] = await Promise.all([
      Order.find(orderFilter)
        .sort({ [sort]: sortDir })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(orderFilter),
    ]);

    totalCount = totalOrders;
    allOrdersList = await Promise.all(
      ordersRaw.map(async (orderObj) => {
        const confirmed = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderConfirmedTemplate");
        const dispatched = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderDispatchedTemplate");
        const completed = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderCompletedTemplate");
        return {
          ...orderObj,
          isBespoke: false,
          whatsappLinks: { confirmed, dispatched, completed },
        };
      })
    );
  } else {
    // "all": fetch both Order and CustomRequest
    const [ordersRaw, customRaw, totalOrders, totalCustom] = await Promise.all([
      Order.find(orderFilter).lean(),
      CustomRequest.find(customFilter).lean(),
      Order.countDocuments(orderFilter),
      CustomRequest.countDocuments(customFilter),
    ]);

    totalCount = totalOrders + totalCustom;

    const formattedOrders = await Promise.all(
      ordersRaw.map(async (orderObj) => {
        const confirmed = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderConfirmedTemplate");
        const dispatched = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderDispatchedTemplate");
        const completed = await buildDynamicWhatsAppLink(req.vendor, orderObj, "orderCompletedTemplate");
        return {
          ...orderObj,
          isBespoke: false,
          whatsappLinks: { confirmed, dispatched, completed },
        };
      })
    );

    const formattedCustom = customRaw.map((cr) => ({
      _id: cr._id,
      isBespoke: true,
      vendor: cr.vendor,
      customer: cr.customer,
      customerSnapshot: cr.customerSnapshot,
      items: [
        {
          product: null,
          productName: cr.title,
          variantLabel: `Bespoke / ${cr.category}`,
          price: cr.agreedPrice > 0 ? cr.agreedPrice : cr.estimatedPrice,
          quantity: 1,
        },
      ],
      totalAmount: cr.agreedPrice > 0 ? cr.agreedPrice : cr.estimatedPrice,
      depositPaid: cr.depositPaid,
      balanceOwed: cr.balanceOwed,
      status: cr.status,
      source: cr.source,
      notes: cr.notes,
      createdAt: cr.createdAt,
      updatedAt: cr.updatedAt,
      whatsappLinks: {
        confirmed: buildCustomRequestWhatsAppLink(req.vendor, cr, "confirmed"),
        fitting: buildCustomRequestWhatsAppLink(req.vendor, cr, "fitting"),
        completed: buildCustomRequestWhatsAppLink(req.vendor, cr, "completed"),
      },
    }));

    const merged = [...formattedOrders, ...formattedCustom].sort((a, b) => {
      const aVal = new Date(a[sort] || a.createdAt).getTime();
      const bVal = new Date(b[sort] || b.createdAt).getTime();
      return sortDir === 1 ? aVal - bVal : bVal - aVal;
    });

    allOrdersList = merged.slice(skip, skip + Number(limit));
  }

  const totalPages = Math.ceil(totalCount / Number(limit)) || 1;

  return sendSuccess(res, {
    orders: allOrdersList,
    pagination: {
      total: totalCount,
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
  let order = await Order.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  const { status, depositPaid, notes, whatsappSent } = req.body;

  // If not found in Order, check if it's a CustomRequest (Bespoke)
  if (!order) {
    const customRequest = await CustomRequest.findOne({
      _id: req.params.id,
      vendor: req.vendor._id,
    });

    if (!customRequest) {
      return sendError(res, "Order not found", 404);
    }

    const prevStatus = customRequest.status;
    if (status !== undefined) customRequest.status = status;
    if (depositPaid !== undefined) customRequest.depositPaid = Number(depositPaid);
    if (notes !== undefined) customRequest.notes = notes;
    if (whatsappSent !== undefined) customRequest.whatsappSent = whatsappSent;

    await customRequest.save();

    if (status && status !== prevStatus) {
      await createNotification(customRequest.vendor, {
        title: "Bespoke Status Updated",
        message: `Bespoke order "${customRequest.title}" status changed to "${status}".`,
        type: "order_status",
        actionUrl: `/dashboard/demands/${customRequest._id}`,
      });

      if (status === "completed" && prevStatus !== "completed" && customRequest.customer) {
        const finalRevenue = customRequest.agreedPrice || customRequest.estimatedPrice || 0;
        await Customer.findByIdAndUpdate(customRequest.customer, {
          $inc: { ltv: finalRevenue, orderCount: 1 },
          $set: { lastOrderDate: new Date() },
        });
      }
    }

    const formattedObj = {
      _id: customRequest._id,
      isBespoke: true,
      vendor: customRequest.vendor,
      customer: customRequest.customer,
      customerSnapshot: customRequest.customerSnapshot,
      items: [
        {
          product: null,
          productName: customRequest.title,
          variantLabel: `Bespoke / ${customRequest.category}`,
          price: customRequest.agreedPrice > 0 ? customRequest.agreedPrice : customRequest.estimatedPrice,
          quantity: 1,
        },
      ],
      totalAmount: customRequest.agreedPrice > 0 ? customRequest.agreedPrice : customRequest.estimatedPrice,
      depositPaid: customRequest.depositPaid,
      balanceOwed: customRequest.balanceOwed,
      status: customRequest.status,
      source: customRequest.source,
      notes: customRequest.notes,
      createdAt: customRequest.createdAt,
      updatedAt: customRequest.updatedAt,
      whatsappLinks: {
        confirmed: buildCustomRequestWhatsAppLink(req.vendor, customRequest, "confirmed"),
        fitting: buildCustomRequestWhatsAppLink(req.vendor, customRequest, "fitting"),
        completed: buildCustomRequestWhatsAppLink(req.vendor, customRequest, "completed"),
      },
    };

    return sendSuccess(res, formattedObj, "Bespoke order updated successfully");
  }

  const prevStatus = order.status;

  if (status !== undefined) order.status = status;
  if (depositPaid !== undefined) order.depositPaid = depositPaid;
  if (notes !== undefined) order.notes = notes;
  if (whatsappSent !== undefined) order.whatsappSent = whatsappSent;

  await order.save(); // Pre-save hook recomputes balanceOwed

  /*
   * Business Logic: Inventory management on status change.
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
  orderObj.isBespoke = false;
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
    const customRequest = await CustomRequest.findOne({
      _id: req.params.id,
      vendor: req.vendor._id,
    });

    if (!customRequest) {
      return sendError(res, "Order not found", 404);
    }

    if (customRequest.status === "completed") {
      return sendError(res, "Completed bespoke requests cannot be deleted", 400);
    }

    await customRequest.deleteOne();
    return sendSuccess(res, null, "Bespoke order deleted successfully");
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

export async function normalizeOrderItems(items, vendorId) {
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

    if (variant.quantity < quantity) {
      normalized.error = `Insufficient stock for ${product.name} (${item.variantLabel}). Available: ${variant.quantity}, Requested: ${quantity}`;
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

