import Order from "../models/orderModel.js";
import Customer from "../models/customerModel.js";
import Product from "../models/productModel.js";
import CustomRequest from "../models/customRequestModel.js";
import Invoice from "../models/invoiceModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { buildDynamicWhatsAppLink, buildCustomRequestWhatsAppLink } from "../services/whatsapp.service.js";
import { createNotification } from "../services/notification.service.js";
import { escapeRegex } from "../utils/escapeRegex.js";

/* ── GET /api/orders ────────────────────────────────────────────── */
export const getOrders = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    page = 1,
    limit = 20,
    status,
    payment,
    search,
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
  if (startDate || endDate) orderFilter.createdAt = dateFilter;

  const customFilter = { vendor: vendorId };
  if (startDate || endDate) customFilter.createdAt = dateFilter;

  // Status Filter
  if (status && status !== "all") {
    orderFilter.status = status;
    if (status === "pending") {
      customFilter.status = { $in: ["inquiry", "quoted", "confirmed", "in_progress", "fitting"] };
    } else {
      customFilter.status = status;
    }
  }

  // Payment / Debt Filter
  if (payment === "unpaid" || payment === "pending" || payment === "debt") {
    orderFilter.balanceOwed = { $gt: 0 };
    customFilter.balanceOwed = { $gt: 0 };
  } else if (payment === "paid") {
    orderFilter.balanceOwed = { $lte: 0 };
    customFilter.balanceOwed = { $lte: 0 };
  }

  // Search Filter
  if (search && search.trim()) {
    const searchRegex = { $regex: escapeRegex(search.trim()), $options: "i" };
    orderFilter.$or = [
      { "customerSnapshot.name": searchRegex },
      { "customerSnapshot.phone": searchRegex },
      { "customerSnapshot.email": searchRegex },
      { "items.productName": searchRegex },
      { notes: searchRegex },
    ];
    customFilter.$or = [
      { "customerSnapshot.name": searchRegex },
      { "customerSnapshot.phone": searchRegex },
      { "customerSnapshot.email": searchRegex },
      { title: searchRegex },
      { description: searchRegex },
      { notes: searchRegex },
    ];
  }


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
    allOrdersList = customRaw.map((cr) => {
      let whatsappLinks = { confirmed: "", fitting: "", completed: "" };
      try {
        whatsappLinks = {
          confirmed: buildCustomRequestWhatsAppLink(req.vendor, cr, "confirmed"),
          fitting: buildCustomRequestWhatsAppLink(req.vendor, cr, "fitting"),
          completed: buildCustomRequestWhatsAppLink(req.vendor, cr, "completed"),
        };
      } catch (linkErr) {
        console.error(`[getOrders] Failed to generate WhatsApp links for custom request ${cr._id}:`, linkErr);
      }

      return {
        _id: cr._id,
        isBespoke: true,
        vendor: cr.vendor,
        customer: cr.customer,
        customerSnapshot: cr.customerSnapshot,
        title: cr.title,
        category: cr.category,
        estimatedPrice: cr.estimatedPrice || 0,
        agreedPrice: cr.agreedPrice || 0,
        deadline: cr.deadline,
        items: [
          {
            product: null,
            productName: cr.title,
            variantLabel: `Bespoke / ${cr.category || "Custom"}`,
            price: cr.agreedPrice > 0 ? cr.agreedPrice : (cr.estimatedPrice || 0),
            quantity: 1,
          },
        ],
        totalAmount: cr.agreedPrice > 0 ? cr.agreedPrice : (cr.estimatedPrice || 0),
        depositPaid: cr.depositPaid || 0,
        balanceOwed: cr.balanceOwed || 0,
        status: cr.status,
        source: cr.source,
        notes: cr.notes,
        createdAt: cr.createdAt,
        updatedAt: cr.updatedAt,
        whatsappLinks,
      };
    });
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
    // "all": fetch combined Order and CustomRequest via MongoDB $unionWith aggregation
    const allowedSorts = ["createdAt", "totalAmount", "updatedAt"];
    const sortField = allowedSorts.includes(sort) ? sort : "createdAt";

    const [totalOrders, totalCustom] = await Promise.all([
      Order.countDocuments(orderFilter),
      CustomRequest.countDocuments(customFilter),
    ]);

    totalCount = totalOrders + totalCustom;

    let paginatedDocs = [];

    try {
      paginatedDocs = await Order.aggregate([
        { $match: orderFilter },
        {
          $project: {
            _id: 1,
            vendor: 1,
            customer: 1,
            customerSnapshot: 1,
            items: 1,
            totalAmount: 1,
            depositPaid: 1,
            balanceOwed: 1,
            status: 1,
            source: 1,
            notes: 1,
            createdAt: 1,
            updatedAt: 1,
            isBespoke: { $literal: false },
          },
        },
        {
          $unionWith: {
            coll: "customrequests",
            pipeline: [
              { $match: customFilter },
              {
                $project: {
                  _id: 1,
                  vendor: 1,
                  customer: 1,
                  customerSnapshot: 1,
                  title: 1,
                  category: 1,
                  estimatedPrice: { $ifNull: ["$estimatedPrice", 0] },
                  agreedPrice: { $ifNull: ["$agreedPrice", 0] },
                  deadline: 1,
                  items: [
                    {
                      product: { $literal: null },
                      productName: "$title",
                      variantLabel: { $concat: ["Bespoke / ", { $ifNull: ["$category", "Custom"] }] },
                      price: {
                        $cond: [
                          { $gt: ["$agreedPrice", 0] },
                          "$agreedPrice",
                          { $ifNull: ["$estimatedPrice", 0] },
                        ],
                      },
                      quantity: { $literal: 1 },
                    },
                  ],
                  totalAmount: {
                    $cond: [
                      { $gt: ["$agreedPrice", 0] },
                      "$agreedPrice",
                      { $ifNull: ["$estimatedPrice", 0] },
                    ],
                  },
                  depositPaid: { $ifNull: ["$depositPaid", 0] },
                  balanceOwed: { $ifNull: ["$balanceOwed", 0] },
                  status: 1,
                  source: 1,
                  notes: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  isBespoke: { $literal: true },
                },
              },
            ],
          },
        },
        { $sort: { [sortField]: sortDir } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]);
    } catch (aggErr) {
      console.warn("[getOrders] $unionWith aggregation fallback:", aggErr.message);
      // Fallback for environments where $unionWith may be restricted: bounded query
      const [ordersRaw, customRaw] = await Promise.all([
        Order.find(orderFilter)
          .sort({ [sortField]: sortDir })
          .limit(skip + Number(limit))
          .lean(),
        CustomRequest.find(customFilter)
          .sort({ [sortField]: sortDir })
          .limit(skip + Number(limit))
          .lean(),
      ]);

      const merged = [
        ...ordersRaw.map((o) => ({ ...o, isBespoke: false })),
        ...customRaw.map((cr) => ({
          _id: cr._id,
          isBespoke: true,
          vendor: cr.vendor,
          customer: cr.customer,
          customerSnapshot: cr.customerSnapshot,
          title: cr.title,
          category: cr.category,
          estimatedPrice: cr.estimatedPrice || 0,
          agreedPrice: cr.agreedPrice || 0,
          deadline: cr.deadline,
          items: [
            {
              product: null,
              productName: cr.title,
              variantLabel: `Bespoke / ${cr.category || "Custom"}`,
              price: cr.agreedPrice > 0 ? cr.agreedPrice : (cr.estimatedPrice || 0),
              quantity: 1,
            },
          ],
          totalAmount: cr.agreedPrice > 0 ? cr.agreedPrice : (cr.estimatedPrice || 0),
          depositPaid: cr.depositPaid || 0,
          balanceOwed: cr.balanceOwed || 0,
          status: cr.status,
          source: cr.source,
          notes: cr.notes,
          createdAt: cr.createdAt,
          updatedAt: cr.updatedAt,
        })),
      ].sort((a, b) => {
        const aVal = new Date(a[sortField] || a.createdAt).getTime();
        const bVal = new Date(b[sortField] || b.createdAt).getTime();
        return sortDir === 1 ? aVal - bVal : bVal - aVal;
      });

      paginatedDocs = merged.slice(skip, skip + Number(limit));
    }

    // Generate WhatsApp links ONLY for the paginated page items (e.g. 20 items, not thousands)
    allOrdersList = await Promise.all(
      paginatedDocs.map(async (doc) => {
        try {
          if (doc.isBespoke) {
            return {
              ...doc,
              whatsappLinks: {
                confirmed: buildCustomRequestWhatsAppLink(req.vendor, doc, "confirmed"),
                fitting: buildCustomRequestWhatsAppLink(req.vendor, doc, "fitting"),
                completed: buildCustomRequestWhatsAppLink(req.vendor, doc, "completed"),
              },
            };
          }

          const confirmed = await buildDynamicWhatsAppLink(req.vendor, doc, "orderConfirmedTemplate");
          const dispatched = await buildDynamicWhatsAppLink(req.vendor, doc, "orderDispatchedTemplate");
          const completed = await buildDynamicWhatsAppLink(req.vendor, doc, "orderCompletedTemplate");
          return {
            ...doc,
            whatsappLinks: { confirmed, dispatched, completed },
          };
        } catch (linkErr) {
          console.error(`[getOrders] Failed to generate WhatsApp links for doc ${doc._id}:`, linkErr);
          return {
            ...doc,
            whatsappLinks: { confirmed: "", dispatched: "", completed: "" },
          };
        }
      })
    );
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

  const existingInvoice = await Invoice.findOne({
    order: order._id,
    vendor: req.vendor._id,
    status: { $ne: "cancelled" },
  }).select("_id invoiceNumber accessToken balanceDue totalAmount totalPaid status");

  if (existingInvoice) {
    orderObj.invoice = existingInvoice;
  }

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

  const orderStatus = req.body.status || "pending";
  if (orderStatus === "completed" && totalAmount - Number(depositPaid || 0) > 0) {
    return sendError(
      res,
      `Cannot create order as completed while a balance of ₦${(totalAmount - Number(depositPaid || 0)).toLocaleString()} is still due. Please record full payment before completing the order.`,
      400
    );
  }

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
    depositPaid: Number(depositPaid || 0),
    notes,
    source,
    status: orderStatus,
    completedAt: orderStatus === "completed" ? new Date() : null,
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
    const targetStatus = status !== undefined ? status : prevStatus;
    const effectiveDeposit = depositPaid !== undefined ? Number(depositPaid) : (customRequest.depositPaid || 0);
    const targetPrice = (customRequest.agreedPrice > 0 ? customRequest.agreedPrice : customRequest.estimatedPrice) || 0;
    const remainingBalance = Math.max(0, targetPrice - effectiveDeposit);

    // L8: Guard against completing bespoke demand with unpaid balance
    if (targetStatus === "completed" && remainingBalance > 0) {
      return sendError(
        res,
        `Cannot mark bespoke demand as completed while a balance of ₦${remainingBalance.toLocaleString()} is still due. Please record full payment before completing the order.`,
        400
      );
    }

    if (status !== undefined) customRequest.status = status;
    if (depositPaid !== undefined) customRequest.depositPaid = Number(depositPaid);
    if (notes !== undefined) customRequest.notes = notes;
    if (whatsappSent !== undefined) customRequest.whatsappSent = whatsappSent;

    // L9: Record completion timestamp
    if (targetStatus === "completed" && !customRequest.completedAt) {
      customRequest.completedAt = new Date();
    } else if (targetStatus !== "completed") {
      customRequest.completedAt = null;
    }

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
      } else if (prevStatus === "completed" && status !== "completed" && customRequest.customer) {
        const finalRevenue = customRequest.agreedPrice || customRequest.estimatedPrice || 0;
        const cust = await Customer.findById(customRequest.customer);
        if (cust) {
          await Customer.findByIdAndUpdate(customRequest.customer, {
            $set: {
              ltv: Math.max(0, (cust.ltv || 0) - finalRevenue),
              orderCount: Math.max(0, (cust.orderCount || 0) - 1),
            },
          });
        }
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
      completedAt: customRequest.completedAt,
      whatsappLinks: {
        confirmed: buildCustomRequestWhatsAppLink(req.vendor, customRequest, "confirmed"),
        fitting: buildCustomRequestWhatsAppLink(req.vendor, customRequest, "fitting"),
        completed: buildCustomRequestWhatsAppLink(req.vendor, customRequest, "completed"),
      },
    };

    return sendSuccess(res, formattedObj, "Bespoke order updated successfully");
  }

  const prevStatus = order.status;
  const targetStatus = status !== undefined ? status : prevStatus;
  const isStatusChanging = status !== undefined && status !== prevStatus;

  const effectiveDeposit = depositPaid !== undefined ? Number(depositPaid) : (order.depositPaid || 0);
  const remainingBalance = Math.max(0, order.totalAmount - effectiveDeposit);

  // L8: Guard against completing order with unpaid balance
  if (targetStatus === "completed" && remainingBalance > 0) {
    return sendError(
      res,
      `Cannot mark order as completed while a balance of ₦${remainingBalance.toLocaleString()} is still due. Please record full payment before completing the order.`,
      400
    );
  }

  const shouldDeplete =
    isStatusChanging &&
    !order.stockDepleted &&
    ["confirmed", "ready", "dispatched", "completed"].includes(targetStatus);

  const shouldRestore =
    isStatusChanging &&
    order.stockDepleted &&
    targetStatus === "cancelled";

  if (depositPaid !== undefined) order.depositPaid = depositPaid;
  if (notes !== undefined) order.notes = notes;
  if (whatsappSent !== undefined) order.whatsappSent = whatsappSent;

  if (shouldDeplete) {
    await depleteInventory(order);
    order.stockDepleted = true;
  }

  if (shouldRestore) {
    await restoreInventory(order);
    order.stockDepleted = false;
  }

  if (status !== undefined) {
    order.status = status;
  }

  // L9: Record completion timestamp
  if (targetStatus === "completed" && !order.completedAt) {
    order.completedAt = new Date();
  } else if (targetStatus !== "completed") {
    order.completedAt = null;
  }

  try {
    await order.save(); // Pre-save hook recomputes balanceOwed
  } catch (saveErr) {
    // If order save failed after we already depleted inventory, rollback the depletion
    if (shouldDeplete && order.stockDepleted) {
      try {
        await restoreInventory(order);
      } catch (rollbackErr) {
        console.error(
          "[Inventory Rollback Error] Failed to restore inventory after order save failure:",
          rollbackErr
        );
      }
    }
    // If order save failed after we restored inventory on cancellation, re-deplete
    if (shouldRestore && !order.stockDepleted) {
      try {
        await depleteInventory(order);
      } catch (rollbackErr) {
        console.error(
          "[Inventory Rollback Error] Failed to re-deplete inventory after order save failure:",
          rollbackErr
        );
      }
    }
    throw saveErr;
  }

  if (isStatusChanging) {
    await createNotification(order.vendor, {
      title: "Order Status Updated",
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} status has changed to "${status}".`,
      type: "order_status",
      actionUrl: `/dashboard/orders/${order._id}`,
    });
  }

  /*
   * Business Logic: When order is "completed", update customer LTV.
   * If an order was previously "completed" and is now changed to another status, decrement stats.
   */
  if (targetStatus === "completed" && prevStatus !== "completed") {
    await updateCustomerStats(order);
  } else if (prevStatus === "completed" && targetStatus !== "completed") {
    await decrementCustomerStats(order);
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

    const linkedInvoice = await Invoice.findOne({ customRequest: customRequest._id });
    if (linkedInvoice) {
      return sendError(
        res,
        "Cannot delete bespoke order with linked invoices. Please delete or settle the invoices first.",
        400,
      );
    }

    await customRequest.deleteOne();
    return sendSuccess(res, null, "Bespoke order deleted successfully");
  }

  if (order.status === "completed") {
    return sendError(res, "Completed orders cannot be deleted", 400);
  }

  const linkedInvoice = await Invoice.findOne({ order: order._id });
  if (linkedInvoice) {
    return sendError(
      res,
      "Cannot delete an order with linked invoices. Please delete or settle the invoices first.",
      400,
    );
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
 * Supports compensating rollback if any product update fails midway.
 */
export async function depleteInventory(order) {
  const depletedRecords = [];

  try {
    for (const item of order.items) {
      if (!item.product) continue; // Skip if no product reference

      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(
          `Product "${item.productName || item.product}" no longer exists in inventory.`
        );
      }

      /*
       * Find the matching variant by label.
       * We match on label because that's what's stored in the order item.
       */
      const variant = product.variants.find((v) => v.label === item.variantLabel);
      if (!variant) {
        throw new Error(
          `Variant "${item.variantLabel}" for product "${product.name}" no longer exists.`
        );
      }

      if (variant.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}" (${variant.label}). Available: ${variant.quantity}, Requested: ${item.quantity}`
        );
      }

      const prevQuantity = variant.quantity;
      const prevSold = variant.sold;
      const prevStatus = product.status;

      variant.quantity = Math.max(0, variant.quantity - item.quantity);
      variant.sold += item.quantity;

      // Check if ALL variants are depleted → auto-sold-out
      const allSoldOut = product.variants.every((v) => v.quantity === 0);
      if (allSoldOut) product.status = "sold_out";

      await product.save();

      depletedRecords.push({
        productId: product._id,
        variantLabel: item.variantLabel,
        prevQuantity,
        prevSold,
        prevStatus,
      });

      const threshold = product.lowStockThreshold ?? 5;
      if (variant && variant.quantity <= threshold) {
        await createNotification(order.vendor, {
          title: "Low Stock Alert",
          message: `Variant "${variant.label}" of product "${product.name}" is running low on stock (${variant.quantity} left).`,
          type: "low_stock",
          actionUrl: `/dashboard/products/edit/${product._id}`,
        });
      }
    }
  } catch (err) {
    // Compensating rollback for any variants that were already depleted in this batch
    for (const record of depletedRecords) {
      try {
        const prod = await Product.findById(record.productId);
        if (prod) {
          const v = prod.variants.find((vr) => vr.label === record.variantLabel);
          if (v) {
            v.quantity = record.prevQuantity;
            v.sold = record.prevSold;
          }
          prod.status = record.prevStatus;
          await prod.save();
        }
      } catch (rollbackErr) {
        console.error(
          `[Inventory Rollback Error] Failed to restore product ${record.productId} (${record.variantLabel}):`,
          rollbackErr.message
        );
      }
    }
    throw err;
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

      // If the product was sold_out and now has stock, reactivate it
      if (product.status === "sold_out") {
        const hasStock = product.variants.some((v) => v.quantity > 0);
        if (hasStock) product.status = "active";
      }

      await product.save();
    }
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

/**
 * Decrement customer LTV and order count when an order moves away from completed.
 */
async function decrementCustomerStats(order) {
  if (!order.customer) return;

  const customer = await Customer.findById(order.customer);
  if (!customer) return;

  await Customer.findByIdAndUpdate(order.customer, {
    $set: {
      ltv: Math.max(0, (customer.ltv || 0) - (order.totalAmount || 0)),
      orderCount: Math.max(0, (customer.orderCount || 0) - 1),
    },
  });
}

