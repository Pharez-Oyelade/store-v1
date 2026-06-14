import Vendor from "../models/vendorModel.js";

/**
 * Normalizes a Nigerian phone number for wa.me
 */
const normalizePhone = (phone) => {
  if (!phone) return "";
  return phone.startsWith("0") ? `234${phone.slice(1)}` : phone.replace(/^\+/, "");
};

/**
 * Replaces tokens in a template string with actual data
 */
const interpolate = (template, data) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
};

/**
 * Generates a WhatsApp message link based on vendor's tier and templates
 */
export const buildDynamicWhatsAppLink = async (vendor, order, messageType) => {
  if (!vendor) throw new Error("Vendor not found");

  const { customerSnapshot, totalAmount, balanceOwed, items } = order;

  // Compile items list
  const itemsList = items
    .map(
      (item) =>
        `• ${item.productName} (${item.variantLabel}) × ${item.quantity} — ₦${item.price.toLocaleString("en-NG")}`
    )
    .join("\n");

  const templateData = {
    customerName: customerSnapshot.name,
    businessName: vendor.businessName,
    orderId: order._id.toString().slice(-6).toUpperCase(),
    totalAmount: totalAmount.toLocaleString("en-NG"),
    balanceOwed: balanceOwed.toLocaleString("en-NG"),
    itemsList,
    trackingCode: order._id.toString().slice(-8).toUpperCase(), // Mock tracking code for now
  };

  // Determine if vendor is allowed custom templates
  const plan = vendor.subscriptionPlan;
  const isPremium = plan === "atelier" || plan === "maison";

  let template = "";
  
  // Default system templates
  const defaultTemplates = {
    orderConfirmedTemplate: `Hi {customerName}, your order with {businessName} is confirmed! Total: ₦{totalAmount}. Balance: ₦{balanceOwed}.\n\n*Order Summary:*\n{itemsList}`,
    orderDispatchedTemplate: `Hi {customerName}, your order is out for delivery! Track code: {trackingCode}.`,
    orderCompletedTemplate: `Thank you for shopping with {businessName}, {customerName}! We'd love your feedback.`,
  };

  if (isPremium && vendor.socialMessaging && vendor.socialMessaging[messageType]) {
    // Use vendor's custom template
    template = vendor.socialMessaging[messageType];
  } else {
    // Fallback to default
    template = defaultTemplates[messageType] || defaultTemplates.orderConfirmedTemplate;
  }

  const message = interpolate(template, templateData);
  const targetPhone = customerSnapshot.phone; // Messaging the customer

  return `https://wa.me/${normalizePhone(targetPhone)}?text=${encodeURIComponent(message)}`;
};
