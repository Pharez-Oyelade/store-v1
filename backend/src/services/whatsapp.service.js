import Vendor from "../models/vendorModel.js";

/**
 * Normalizes a Nigerian phone number for wa.me
 */
const normalizePhone = (phone) => {
  if (!phone) return "";
  const cleaned = String(phone).trim();
  return cleaned.startsWith("0") ? `234${cleaned.slice(1)}` : cleaned.replace(/^\+/, "");
};

/**
 * Replaces tokens in a template string with actual data
 */
const interpolate = (template, data) => {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data && data[key] !== undefined ? data[key] : match;
  });
};

/**
 * Generates a WhatsApp message link based on vendor's tier and templates
 */
export const buildDynamicWhatsAppLink = async (vendor, order, messageType) => {
  if (!vendor) throw new Error("Vendor not found");

  const { customerSnapshot, totalAmount, balanceOwed, items } = order || {};

  // Compile items list
  const itemsList = (items || [])
    .map(
      (item) =>
        `• ${item?.productName || "Item"} (${item?.variantLabel || "Standard"}) × ${item?.quantity || 1} — ₦${(Number(item?.price) || 0).toLocaleString("en-NG")}`
    )
    .join("\n");

  const safeTotal = Number(totalAmount) || 0;
  const safeBalance = Number(balanceOwed) || 0;
  const orderId = order?._id ? order._id.toString().slice(-6).toUpperCase() : "ORDER";
  const trackingCode = order?._id ? order._id.toString().slice(-8).toUpperCase() : "TRACK";

  const templateData = {
    customerName: customerSnapshot?.name || "Valued Customer",
    businessName: vendor?.businessName || "our store",
    orderId,
    totalAmount: safeTotal.toLocaleString("en-NG"),
    balanceOwed: safeBalance.toLocaleString("en-NG"),
    itemsList,
    trackingCode,
  };

  // Determine if vendor is allowed custom templates
  const plan = vendor?.subscriptionPlan;
  const isPremium = plan === "drape" || plan === "atelier" || plan === "maison";

  let template = "";
  
  // Default system templates
  const defaultTemplates = {
    orderConfirmedTemplate: `Hi {customerName}, your order with {businessName} is confirmed! Total: ₦{totalAmount}. Balance: ₦{balanceOwed}.\n\n*Order Summary:*\n{itemsList}`,
    orderDispatchedTemplate: `Hi {customerName}, your order is out for delivery! Track code: {trackingCode}.`,
    orderCompletedTemplate: `Thank you for shopping with {businessName}, {customerName}! We'd love your feedback.`,
  };

  if (isPremium && vendor?.socialMessaging && vendor.socialMessaging[messageType]) {
    // Use vendor's custom template
    template = vendor.socialMessaging[messageType];
  } else {
    // Fallback to default
    template = defaultTemplates[messageType] || defaultTemplates.orderConfirmedTemplate;
  }

  const message = interpolate(template, templateData);
  const targetPhone = customerSnapshot?.phone || ""; // Messaging the customer

  return `https://wa.me/${normalizePhone(targetPhone)}?text=${encodeURIComponent(message)}`;
};

/**
 * Generates a WhatsApp message link for bespoke / custom demands
 */
export const buildCustomRequestWhatsAppLink = (vendor, request, actionType = "quote") => {
  if (!vendor) throw new Error("Vendor not found");

  const { customerSnapshot, title, estimatedPrice, agreedPrice, depositPaid, balanceOwed, deadline } = request || {};

  const rawPrice = (agreedPrice > 0 ? agreedPrice : estimatedPrice) ?? request?.totalAmount ?? 0;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice) || 0;
  const safeDeposit = Number(depositPaid) || 0;
  const safeBalance = Number(balanceOwed) || 0;

  const safeTitle = title || request?.items?.[0]?.productName || "Custom Order";
  const customerName = customerSnapshot?.name || "there";
  const businessName = vendor?.businessName || "our store";

  let deadlineStr = "To be scheduled";
  if (deadline) {
    const d = new Date(deadline);
    if (!isNaN(d.getTime())) {
      deadlineStr = d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
    }
  }

  let message = "";
  if (actionType === "quote") {
    message = `Hi ${customerName}! Here is your quote from *${businessName}* for "${safeTitle}":\n\n💰 *Estimated Total:* ₦${price.toLocaleString("en-NG")}\n📅 *Estimated Completion:* ${deadlineStr}\n\nPlease let us know if you'd like to proceed!`;
  } else if (actionType === "confirmed") {
    message = `Hi ${customerName}! Your custom order for *"${safeTitle}"* with *${businessName}* has been confirmed.\n\n💰 *Total:* ₦${price.toLocaleString("en-NG")}\n💵 *Deposit Paid:* ₦${safeDeposit.toLocaleString("en-NG")}\n⚖️ *Balance Due:* ₦${safeBalance.toLocaleString("en-NG")}\n📅 *Expected Completion:* ${deadlineStr}\n\nWe'll update you as work begins!`;
  } else if (actionType === "fitting") {
    message = `Hi ${customerName}! Great news — your custom outfit *"${safeTitle}"* is ready for fitting/review with *${businessName}*! Please reach out to arrange a convenient time.`;
  } else if (actionType === "completed") {
    message = `Hi ${customerName}! Your bespoke order for *"${safeTitle}"* is completed and ready for pickup/delivery. Thank you for choosing *${businessName}*!`;
  } else {
    message = `Hi ${customerName}, update on your custom order *"${safeTitle}"* with *${businessName}*: Status is currently "${request?.status || "pending"}".`;
  }

  const targetPhone = customerSnapshot?.phone || "";
  return `https://wa.me/${normalizePhone(targetPhone)}?text=${encodeURIComponent(message)}`;
};

