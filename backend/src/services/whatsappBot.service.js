import Vendor from "../models/vendorModel.js";
import TeamMember from "../models/teamMemberModel.js";
import WhatsAppSession from "../models/whatsappSessionModel.js";
import WhatsAppLog from "../models/whatsappLogModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import Order from "../models/orderModel.js";
import { normalizeOrderItems } from "../controllers/order.controller.js";
import { createNotification } from "../services/notification.service.js";
import { getRevenueOverview } from "../services/analytics.service.js";
import { sendTextMessage, sendInteractiveButtons } from "./whatsappCloudApi.service.js";
import { processWithGemini } from "./whatsappNlu.service.js";

/* ── Phone Normalization ────────────────────────────────────────────── */

/**
 * Normalizes a Nigerian phone number to E.164-style (without +).
 * WhatsApp Cloud API sends numbers like "2348012345678".
 * Vendors may register with "08012345678" or "+2348012345678".
 */
const normalizePhone = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = `234${cleaned.slice(1)}`;
  }
  return cleaned;
};

/* ── Vendor Authentication ──────────────────────────────────────────── */

/**
 * Resolves the sender's phone number to a Vendor or TeamMember.
 * Returns { vendor, senderType, teamMember } or null if unrecognized.
 */
async function resolveVendor(senderPhone) {
  const normalized = normalizePhone(senderPhone);

  /*
   * Try matching against vendor phone numbers first.
   * Vendors can register with local format (080...) or E.164.
   * We check both the normalized incoming phone and common variants.
   */
  const localFormat = normalized.startsWith("234")
    ? `0${normalized.slice(3)}`
    : normalized;

  const vendor = await Vendor.findOne({
    $or: [
      { phone: normalized },
      { phone: localFormat },
      { phone: `+${normalized}` },
      { "socials.whatsapp": normalized },
      { "socials.whatsapp": localFormat },
      { "socials.whatsapp": `+${normalized}` },
    ],
    isActive: true,
  });

  if (vendor) {
    return { vendor, senderType: "vendor", teamMember: null };
  }

  /*
   * If not a vendor, check TeamMember model.
   * Team members (managers, sales staff) can also log orders.
   */
  const teamMember = await TeamMember.findOne({
    $or: [
      { phone: normalized },
      { phone: localFormat },
      { phone: `+${normalized}` },
    ],
    isActive: true,
  }).populate("vendor");

  if (teamMember) {
    const ownerVendor = await Vendor.findById(teamMember.vendor);
    if (ownerVendor && ownerVendor.isActive) {
      return { vendor: ownerVendor, senderType: "team", teamMember };
    }
  }

  return null;
}

/* ── Session Management ─────────────────────────────────────────────── */

/**
 * Gets or creates a WhatsApp session for the sender.
 * Sessions auto-expire after 20 minutes via TTL index.
 */
async function getOrCreateSession(vendor, senderPhone, senderType, teamMember) {
  let session = await WhatsAppSession.findOne({ senderPhone });

  if (!session) {
    session = await WhatsAppSession.create({
      vendor: vendor._id,
      senderPhone,
      senderType,
      teamMember: teamMember?._id || null,
      state: "idle",
      draftData: {
        items: [],
        customer: {},
        payment: {},
      },
      dialogHistory: [],
    });
  }

  /* Refresh TTL on every interaction */
  session.lastActiveAt = new Date();
  return session;
}

/* ── Function Call Executors ─────────────────────────────────────────── */

/**
 * Executes a function call returned by Gemini and returns the result
 * as a string to feed back into the conversation.
 */
async function executeFunctionCall(fnCall, vendorId) {
  const { name, args } = fnCall;

  switch (name) {
    case "search_catalog":
      return await searchCatalog(vendorId, args.query, args.category);

    case "lookup_customer":
      return await lookupCustomer(vendorId, args.query);

    case "create_order_draft":
      return await createOrderDraft(vendorId, args);

    case "adjust_stock":
      return await adjustStockDraft(vendorId, args);

    case "get_revenue_summary":
      return await getRevenueSummary(vendorId, args.timeframe);

    case "get_debt_summary":
      return await getDebtSummary(vendorId);

    case "lookup_orders":
      return await lookupOrders(vendorId, args);

    case "check_stock":
      return await checkStock(vendorId, args.query);

    default:
      return JSON.stringify({ error: `Unknown function: ${name}` });
  }
}

/**
 * Searches the vendor's product catalog using text matching.
 */
async function searchCatalog(vendorId, query, category) {
  const filter = { vendor: vendorId, status: "active" };
  if (category) filter.category = { $regex: category, $options: "i" };

  const products = await Product.find(filter)
    .select("name category variants basePrice")
    .lean();

  if (!products.length) {
    return JSON.stringify({
      found: 0,
      message: "No active products found in catalog.",
    });
  }

  /*
   * Score products by relevance to query keywords.
   * Simple text matching against product name, variant labels, colors, and sizes.
   */
  const queryWords = query.toLowerCase().split(/\s+/);

  const scored = products.map((p) => {
    const searchText = [
      p.name,
      p.category,
      ...p.variants.map((v) => `${v.label} ${v.color} ${v.size}`),
    ]
      .join(" ")
      .toLowerCase();

    const score = queryWords.reduce(
      (acc, word) => acc + (searchText.includes(word) ? 1 : 0),
      0,
    );
    return { ...p, score };
  });

  const matches = scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!matches.length) {
    return JSON.stringify({
      found: 0,
      message: `No products matching "${query}" found. Available products: ${products.slice(0, 5).map((p) => p.name).join(", ")}`,
    });
  }

  const results = matches.map((p) => ({
    productId: p._id,
    name: p.name,
    category: p.category,
    variants: p.variants.map((v) => ({
      label: v.label,
      color: v.color,
      size: v.size,
      price: v.price,
      stock: v.quantity,
    })),
  }));

  return JSON.stringify({ found: results.length, products: results });
}

/**
 * Looks up customers by name or phone number fragment.
 */
async function lookupCustomer(vendorId, query) {
  const isPhoneQuery = /^\d+$/.test(query.replace(/[\s\-+]/g, ""));

  let customers;
  if (isPhoneQuery) {
    customers = await Customer.find({
      vendor: vendorId,
      phone: { $regex: query.replace(/[\s\-+]/g, ""), $options: "i" },
    })
      .select("name phone email ltv orderCount")
      .limit(5)
      .lean();
  } else {
    customers = await Customer.find({
      vendor: vendorId,
      name: { $regex: query, $options: "i" },
    })
      .select("name phone email ltv orderCount")
      .limit(5)
      .lean();
  }

  if (!customers.length) {
    return JSON.stringify({
      found: 0,
      message: `No customer matching "${query}" found in your records.`,
    });
  }

  return JSON.stringify({
    found: customers.length,
    customers: customers.map((c) => ({
      customerId: c._id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalSpent: c.ltv,
      orderCount: c.orderCount,
    })),
  });
}

/**
 * Stages an order draft in the session. Does NOT write to DB.
 * Returns structured data for the bot to format a confirmation message.
 */
async function createOrderDraft(vendorId, args) {
  const { items, customerName, customerPhone, paymentStatus, depositPaid, sendReceipt, notes } = args;

  /* Validate products exist and have stock */
  const resolvedItems = [];
  for (const item of items) {
    const products = await Product.find({
      vendor: vendorId,
      status: "active",
      name: { $regex: item.productName, $options: "i" },
    }).lean();

    if (!products.length) {
      return JSON.stringify({
        success: false,
        error: `Product "${item.productName}" not found in your catalog.`,
      });
    }

    const product = products[0];
    const variant = product.variants.find(
      (v) =>
        v.label.toLowerCase().includes((item.variantLabel || "").toLowerCase()) ||
        v.color?.toLowerCase().includes((item.variantLabel || "").toLowerCase()),
    );

    if (!variant) {
      return JSON.stringify({
        success: false,
        error: `Variant "${item.variantLabel}" not found for "${product.name}". Available: ${product.variants.map((v) => v.label).join(", ")}`,
      });
    }

    if (variant.quantity < item.quantity) {
      return JSON.stringify({
        success: false,
        error: `Insufficient stock for ${product.name} (${variant.label}). Available: ${variant.quantity}, Requested: ${item.quantity}`,
      });
    }

    resolvedItems.push({
      productId: product._id,
      productName: product.name,
      variantLabel: variant.label,
      quantity: item.quantity,
      price: item.price || variant.price,
      stockAfterSale: variant.quantity - item.quantity,
    });
  }

  const totalAmount = resolvedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  const deposit = depositPaid || (paymentStatus === "paid" ? totalAmount : 0);

  return JSON.stringify({
    success: true,
    draft: {
      items: resolvedItems,
      customer: { name: customerName, phone: customerPhone },
      totalAmount,
      depositPaid: deposit,
      balanceOwed: Math.max(0, totalAmount - deposit),
      paymentStatus: paymentStatus || "unknown",
      sendReceipt: sendReceipt !== false,
      notes: notes || "",
    },
    message: "Draft ready for vendor confirmation.",
  });
}

/**
 * Stages a stock adjustment draft. Does NOT write to DB.
 */
async function adjustStockDraft(vendorId, args) {
  const { productName, variantLabel, quantityChange } = args;

  const products = await Product.find({
    vendor: vendorId,
    name: { $regex: productName, $options: "i" },
  }).lean();

  if (!products.length) {
    return JSON.stringify({
      success: false,
      error: `Product "${productName}" not found.`,
    });
  }

  const product = products[0];
  const variant = product.variants.find(
    (v) =>
      v.label.toLowerCase().includes(variantLabel.toLowerCase()) ||
      v.size?.toLowerCase() === variantLabel.toLowerCase(),
  );

  if (!variant) {
    return JSON.stringify({
      success: false,
      error: `Variant "${variantLabel}" not found for "${product.name}". Available: ${product.variants.map((v) => v.label).join(", ")}`,
    });
  }

  const newQuantity = variant.quantity + quantityChange;

  return JSON.stringify({
    success: true,
    draft: {
      productId: product._id,
      productName: product.name,
      variantLabel: variant.label,
      currentStock: variant.quantity,
      change: quantityChange,
      newStock: Math.max(0, newQuantity),
    },
    message: "Stock adjustment draft ready for confirmation.",
  });
}

/**
 * Fetches revenue overview using the existing analytics service.
 */
async function getRevenueSummary(vendorId, timeframe) {
  try {
    const data = await getRevenueOverview(vendorId);
    return JSON.stringify({
      timeframe: timeframe || "month",
      revenueToday: data.revenueToday,
      ordersToday: data.ordersToday,
      revenueThisWeek: data.revenueThisWeek,
      ordersThisWeek: data.ordersThisWeek,
      revenueThisMonth: data.revenueThisMonth,
      ordersThisMonth: data.ordersThisMonth,
      totalDebt: data.totalDebt,
      debtOrderCount: data.debtOrderCount,
      lowStockCount: data.lowStockCount,
    });
  } catch (err) {
    console.error("Revenue summary error:", err.message);
    return JSON.stringify({ error: "Unable to fetch revenue data." });
  }
}

/**
 * Fetches outstanding debt details for the vendor.
 */
async function getDebtSummary(vendorId) {
  try {
    const orders = await Order.find({
      vendor: vendorId,
      status: { $nin: ["completed", "cancelled"] },
      balanceOwed: { $gt: 0 },
    })
      .select("customerSnapshot items balanceOwed totalAmount status createdAt")
      .sort({ balanceOwed: -1 })
      .limit(10)
      .lean();

    const totalDebt = orders.reduce((sum, o) => sum + o.balanceOwed, 0);

    return JSON.stringify({
      totalDebt,
      orderCount: orders.length,
      debtors: orders.map((o) => ({
        customerName: o.customerSnapshot?.name || "Customer",
        customerPhone: o.customerSnapshot?.phone || "",
        orderId: o._id.toString().slice(-6).toUpperCase(),
        items: (o.items || []).map((i) => `${i.quantity}x ${i.productName} (${i.variantLabel || "Standard"})`),
        balanceOwed: o.balanceOwed,
        totalAmount: o.totalAmount,
        status: o.status,
        date: o.createdAt,
      })),
    });
  } catch (err) {
    console.error("Debt summary error:", err.message);
    return JSON.stringify({ error: "Unable to fetch debt data." });
  }
}

/**
 * Looks up specific orders and their items for a customer or by order ID.
 */
async function lookupOrders(vendorId, args = {}) {
  try {
    const { customerQuery, orderId, status } = args;
    const filter = { vendor: vendorId };

    if (status) filter.status = status;

    if (orderId) {
      if (orderId.length === 24) {
        filter._id = orderId;
      } else {
        const allOrders = await Order.find({ vendor: vendorId }).select("_id").lean();
        const match = allOrders.find((o) =>
          o._id.toString().toUpperCase().endsWith(orderId.toUpperCase()),
        );
        if (match) filter._id = match._id;
      }
    } else if (customerQuery) {
      const cleanPhone = customerQuery.replace(/[\s\-+]/g, "");
      const isPhone = /^\d+$/.test(cleanPhone);

      if (isPhone) {
        filter["customerSnapshot.phone"] = { $regex: cleanPhone, $options: "i" };
      } else {
        filter["customerSnapshot.name"] = { $regex: customerQuery, $options: "i" };
      }
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (!orders.length) {
      return JSON.stringify({
        found: 0,
        message: `No orders found${customerQuery ? ` for "${customerQuery}"` : ""}.`,
      });
    }

    return JSON.stringify({
      found: orders.length,
      orders: orders.map((o) => ({
        orderId: o._id.toString().slice(-6).toUpperCase(),
        customerName: o.customerSnapshot?.name || "Customer",
        customerPhone: o.customerSnapshot?.phone || "",
        items: (o.items || []).map((i) => ({
          productName: i.productName,
          variant: i.variantLabel || "",
          quantity: i.quantity,
          price: i.price,
          lineTotal: i.price * i.quantity,
        })),
        totalAmount: o.totalAmount,
        depositPaid: o.depositPaid,
        balanceOwed: o.balanceOwed,
        status: o.status,
        source: o.source,
        date: o.createdAt,
      })),
    });
  } catch (err) {
    console.error("Lookup orders error:", err.message);
    return JSON.stringify({ error: "Unable to search orders." });
  }
}

/**
 * Checks stock levels for a product query.
 */
async function checkStock(vendorId, query) {
  const products = await Product.find({
    vendor: vendorId,
    status: { $in: ["active", "sold_out"] },
    name: { $regex: query, $options: "i" },
  })
    .select("name variants status")
    .lean();

  if (!products.length) {
    return JSON.stringify({ found: 0, message: `No products matching "${query}".` });
  }

  const results = products.slice(0, 3).map((p) => ({
    name: p.name,
    status: p.status,
    variants: p.variants.map((v) => ({
      label: v.label,
      stock: v.quantity,
      sold: v.sold,
    })),
  }));

  return JSON.stringify({ found: results.length, products: results });
}

/* ── Confirmation Executor ──────────────────────────────────────────── */

/**
 * Executes a confirmed order creation. Only called after vendor says "yes".
 * This is the ONLY path that writes to the database.
 */
async function executeOrderCreation(session) {
  const { vendor, draftData } = session;

  const { customer: custData, items, payment, sendCustomerReceipt, notes } = draftData;

  /* Auto-create or find existing customer */
  let customer = await Customer.findOne({
    vendor,
    phone: custData.phone,
  });

  if (!customer) {
    customer = await Customer.create({
      vendor,
      name: custData.name,
      phone: custData.phone,
      email: custData.email || "",
    });
  }

  /* Normalize items for order creation */
  const orderItems = items.map((i) => ({
    product: i.productId || null,
    productName: i.productName,
    variantLabel: i.variantLabel,
    price: i.price,
    quantity: i.quantity,
  }));

  const normalizedItems = await normalizeOrderItems(orderItems, vendor);

  if (normalizedItems.error) {
    return { success: false, error: normalizedItems.error };
  }

  const totalAmount = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  /* Create the order */
  const order = await Order.create({
    vendor,
    customer: customer._id,
    customerSnapshot: {
      name: custData.name,
      phone: custData.phone,
      email: custData.email || "",
    },
    items: normalizedItems,
    totalAmount,
    depositPaid: payment.depositPaid || 0,
    notes: notes || "",
    source: "whatsapp",
  });

  /* Notification for the web dashboard */
  await createNotification(vendor, {
    title: "New Order (WhatsApp)",
    message: `Order #${order._id.toString().slice(-6).toUpperCase()} created via WhatsApp for ${custData.name} (₦${totalAmount.toLocaleString("en-NG")}).`,
    type: "order_status",
    actionUrl: `/dashboard/orders/${order._id}`,
  });

  return {
    success: true,
    orderId: order._id.toString().slice(-6).toUpperCase(),
    totalAmount,
    balanceOwed: order.balanceOwed,
    customerName: custData.name,
  };
}

/**
 * Executes a confirmed stock adjustment.
 */
async function executeStockAdjustment(session) {
  const { vendor, draftData } = session;
  const draft = draftData;

  if (!draft.items || !draft.items.length) {
    return { success: false, error: "No stock adjustment data found." };
  }

  /* Use the first item's productId and variant info */
  const item = draft.items[0];
  const product = await Product.findOne({
    _id: item.productId,
    vendor,
  });

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  const variant = product.variants.find((v) => v.label === item.variantLabel);
  if (!variant) {
    return { success: false, error: `Variant "${item.variantLabel}" not found.` };
  }

  /* item.quantity here is used as the change amount (positive = restock) */
  variant.quantity = Math.max(0, variant.quantity + item.quantity);

  /* Reactivate if product was sold_out and now has stock */
  if (product.status === "sold_out" && variant.quantity > 0) {
    product.status = "active";
  }

  await product.save();

  return {
    success: true,
    productName: product.name,
    variantLabel: variant.label,
    newStock: variant.quantity,
  };
}

/* ── Main Message Handler ───────────────────────────────────────────── */

/**
 * The main entry point for processing an incoming WhatsApp message.
 * Called by the webhook controller after initial validation.
 *
 * @param {string} senderPhone - E.164 format phone number
 * @param {string} messageText - The message body
 * @param {string} messageId   - Meta message ID for deduplication
 * @param {string} messageType - "text", "interactive", etc.
 */
export async function handleIncomingMessage(senderPhone, messageText, messageId, messageType) {
  const startTime = Date.now();
  const normalized = normalizePhone(senderPhone);

  /* ── Step 1: Deduplicate ──────────────────────────────── */
  if (messageId) {
    const existing = await WhatsAppLog.findOne({ messageId });
    if (existing) {
      console.log(`[WhatsApp] Duplicate message ${messageId}, skipping.`);
      return;
    }
  }

  /* ── Step 2: Authenticate vendor ──────────────────────── */
  const authResult = await resolveVendor(normalized);

  if (!authResult) {
    await sendTextMessage(
      normalized,
      "Hello! 👋 This is the Vendra Assistant.\n\nYour phone number is not linked to a Vendra store account.\n\nTo connect, log in to your Vendra Dashboard at https://vendra.ng/dashboard/settings and add this number, or sign up to start selling!",
    );

    await WhatsAppLog.create({
      direction: "inbound",
      senderPhone: normalized,
      recipientPhone: process.env.WHATSAPP_PHONE_NUMBER_ID,
      messageId,
      messageType,
      content: messageText,
      status: "received",
      processingTimeMs: Date.now() - startTime,
      error: "Unregistered sender",
    });
    return;
  }

  const { vendor, senderType, teamMember } = authResult;

  /* Check if WhatsApp bot is enabled for this vendor */
  if (vendor.whatsappBotSettings && vendor.whatsappBotSettings.enabled === false) {
    await sendTextMessage(
      normalized,
      "The WhatsApp assistant has been disabled for this store. Please enable it from your Vendra Dashboard settings.",
    );
    return;
  }

  /* ── Step 3: Get or create session ────────────────────── */
  const session = await getOrCreateSession(vendor, normalized, senderType, teamMember);

  /* Log inbound message */
  await WhatsAppLog.create({
    vendor: vendor._id,
    direction: "inbound",
    senderPhone: normalized,
    recipientPhone: process.env.WHATSAPP_PHONE_NUMBER_ID,
    messageId,
    messageType,
    content: messageText,
    status: "received",
  });

  /* ── Step 4: Handle confirmations / cancellations ─────── */
  const lowerText = (messageText || "").trim().toLowerCase();
  const isConfirmation =
    lowerText === "yes" ||
    lowerText === "confirm" ||
    lowerText === "yes confirm" ||
    lowerText === "go ahead" ||
    lowerText === "proceed" ||
    lowerText === "log it" ||
    lowerText === "ok" ||
    lowerText.startsWith("yes");

  const isCancellation =
    lowerText === "no" ||
    lowerText === "cancel" ||
    lowerText === "nah" ||
    lowerText === "stop" ||
    lowerText === "nope" ||
    lowerText === "nevermind";

  if (session.state === "pending_confirmation") {
    if (isConfirmation) {
      return await handleConfirmation(session, vendor, normalized, startTime);
    }

    if (isCancellation) {
      session.state = "idle";
      session.draftData = { items: [], customer: {}, payment: {} };
      session.pendingConfirmation = {};
      session.dialogHistory = [];
      await session.save();

      await sendTextMessage(normalized, "Cancelled ✌️ No changes were made. What else can I help with?");
      return;
    }
    /* If not a clear yes/no, fall through to Gemini for disambiguation */
  }

  /* ── Step 5: Process with Gemini AI ───────────────────── */
  /* Build dialog history in Gemini format */
  session.dialogHistory.push({
    role: "user",
    text: messageText,
    timestamp: new Date(),
  });

  /* Trim history to last 20 messages to stay within context limits */
  if (session.dialogHistory.length > 20) {
    session.dialogHistory = session.dialogHistory.slice(-20);
  }

  const geminiHistory = session.dialogHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  const vendorContext = {
    vendorId: vendor._id.toString(),
    businessName: vendor.businessName,
    senderPhone: normalized,
  };

  const geminiResult = await processWithGemini(geminiHistory, vendorContext);

  /* ── Step 6: Handle function calls from Gemini ────────── */
  if (geminiResult.functionCalls && geminiResult.functionCalls.length > 0) {
    let combinedResults = [];

    for (const fnCall of geminiResult.functionCalls) {
      const result = await executeFunctionCall(fnCall, vendor._id);
      combinedResults.push({ name: fnCall.name, result });

      /* If it's an order draft or stock draft, store in session */
      const parsed = JSON.parse(result);
      if (fnCall.name === "create_order_draft" && parsed.success) {
        session.state = "pending_confirmation";
        session.intent = "CREATE_ORDER";
        session.draftData = {
          items: parsed.draft.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            variantLabel: i.variantLabel,
            quantity: i.quantity,
            price: i.price,
          })),
          customer: {
            name: parsed.draft.customer.name,
            phone: parsed.draft.customer.phone,
            isNew: false,
          },
          payment: {
            totalAmount: parsed.draft.totalAmount,
            depositPaid: parsed.draft.depositPaid,
            balanceOwed: parsed.draft.balanceOwed,
            paymentStatus: parsed.draft.paymentStatus,
          },
          sendCustomerReceipt: parsed.draft.sendReceipt,
          notes: parsed.draft.notes,
        };
        session.pendingConfirmation = {
          actionType: "CREATE_ORDER",
          summaryText: result,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        };
      }

      if (fnCall.name === "adjust_stock" && parsed.success) {
        session.state = "pending_confirmation";
        session.intent = "UPDATE_STOCK";
        session.draftData = {
          items: [
            {
              productId: parsed.draft.productId,
              productName: parsed.draft.productName,
              variantLabel: parsed.draft.variantLabel,
              quantity: parsed.draft.change,
              price: 0,
            },
          ],
          customer: {},
          payment: {},
        };
        session.pendingConfirmation = {
          actionType: "ADJUST_STOCK",
          summaryText: result,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };
      }
    }

    /*
     * Feed function results back to Gemini for a natural language response.
     * Gemini sees what the functions returned and crafts a user-facing message.
     */
    const functionResultParts = combinedResults.map((r) => ({
      functionResponse: {
        name: r.name,
        response: JSON.parse(r.result),
      },
    }));

    /* Add function results as a model turn in the history */
    if (geminiResult.rawContent) {
      geminiHistory.push(geminiResult.rawContent);
    } else {
      geminiHistory.push({
        role: "model",
        parts: geminiResult.functionCalls.map((fc) => ({
          functionCall: { name: fc.name, args: fc.args },
        })),
      });
    }

    geminiHistory.push({
      role: "user",
      parts: functionResultParts,
    });

    /* Second Gemini call to get the natural language response */
    const followUp = await processWithGemini(geminiHistory, vendorContext);

    if (followUp.text) {
      session.dialogHistory.push({
        role: "assistant",
        text: followUp.text,
        timestamp: new Date(),
      });

      await session.save();

      /* Send the response */
      if (session.state === "pending_confirmation") {
        await sendInteractiveButtons(normalized, followUp.text, [
          { id: "btn_confirm", title: "✅ Confirm" },
          { id: "btn_cancel", title: "❌ Cancel" },
        ]);
      } else {
        await sendTextMessage(normalized, followUp.text);
      }
    }
  } else if (geminiResult.text) {
    /* ── Step 7: Plain text response (no function calls) ── */
    session.dialogHistory.push({
      role: "assistant",
      text: geminiResult.text,
      timestamp: new Date(),
    });

    await session.save();
    await sendTextMessage(normalized, geminiResult.text);
  }

  /* Log outbound message */
  await WhatsAppLog.create({
    vendor: vendor._id,
    direction: "outbound",
    senderPhone: process.env.WHATSAPP_PHONE_NUMBER_ID,
    recipientPhone: normalized,
    messageType: "text",
    content: geminiResult.text || "(function call response)",
    status: "sent",
    processingTimeMs: Date.now() - startTime,
  });
}

/* ── Confirmation Handler ───────────────────────────────────────────── */

/**
 * Handles vendor confirmation of a pending action.
 */
async function handleConfirmation(session, vendor, senderPhone, startTime) {
  const actionType = session.pendingConfirmation?.actionType;

  if (actionType === "CREATE_ORDER") {
    const result = await executeOrderCreation(session);

    if (result.success) {
      /* Send customer receipt if requested */
      if (session.draftData.sendCustomerReceipt) {
        const custPhone = normalizePhone(session.draftData.customer.phone);
        if (custPhone) {
          await sendTextMessage(
            custPhone,
            `Hi ${session.draftData.customer.name}! Your order with ${vendor.businessName} has been confirmed ✅\n\n` +
              `📋 Order #${result.orderId}\n` +
              `💰 Total: ₦${result.totalAmount.toLocaleString("en-NG")}\n` +
              `${result.balanceOwed > 0 ? `⚖️ Balance Due: ₦${result.balanceOwed.toLocaleString("en-NG")}\n` : ""}` +
              `\nThank you for shopping with ${vendor.businessName}! 🙏`,
          );
        }
      }

      await sendTextMessage(
        senderPhone,
        `✅ Order #${result.orderId} recorded successfully!\n\n` +
          `• Customer: ${result.customerName}\n` +
          `• Total: ₦${result.totalAmount.toLocaleString("en-NG")}\n` +
          `${result.balanceOwed > 0 ? `• Balance: ₦${result.balanceOwed.toLocaleString("en-NG")}\n` : "• Payment: Paid in full\n"}` +
          `${session.draftData.sendCustomerReceipt ? "• Receipt sent to customer ✅" : ""}\n\n` +
          `Stock has been updated. What else can I help with?`,
      );
    } else {
      await sendTextMessage(
        senderPhone,
        `⚠️ Couldn't record the order: ${result.error}\n\nPlease try again or check your dashboard.`,
      );
    }
  } else if (actionType === "ADJUST_STOCK") {
    const result = await executeStockAdjustment(session);

    if (result.success) {
      await sendTextMessage(
        senderPhone,
        `✅ Stock updated!\n\n` +
          `• ${result.productName} (${result.variantLabel})\n` +
          `• New stock count: ${result.newStock} units\n\n` +
          `What else can I help with?`,
      );
    } else {
      await sendTextMessage(
        senderPhone,
        `⚠️ Couldn't update stock: ${result.error}\n\nPlease try again.`,
      );
    }
  }

  /* Reset session state after confirmation */
  session.state = "idle";
  session.draftData = { items: [], customer: {}, payment: {} };
  session.pendingConfirmation = {};
  session.dialogHistory = [];
  await session.save();

  /* Log the confirmation */
  await WhatsAppLog.create({
    vendor: vendor._id,
    direction: "outbound",
    senderPhone: process.env.WHATSAPP_PHONE_NUMBER_ID,
    recipientPhone: senderPhone,
    messageType: "text",
    content: `Confirmation executed: ${actionType}`,
    status: "sent",
    processingTimeMs: Date.now() - startTime,
  });
}
