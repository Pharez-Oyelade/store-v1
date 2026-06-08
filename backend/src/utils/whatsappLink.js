/**
 * Build a WhatsApp deeplink that opens a pre-filled message to the vendor.
 *
 * @param {object} order      - The populated Order document
 * @param {string} vendorPhone - The vendor's WhatsApp phone number
 * @returns {string} wa.me URL with encoded message
 *
 * Example output:
 *   https://wa.me/2348012345678?text=Hi%20Ada!%20Your%20order%20is%20confirmed...
 */
export function buildOrderConfirmationLink(order, vendorPhone) {
  const { customerSnapshot, items, totalAmount, depositPaid, balanceOwed } = order;

  const itemLines = items
    .map(
      (item) =>
        `• ${item.productName} (${item.variantLabel}) × ${item.quantity} — ₦${item.price.toLocaleString("en-NG")}`,
    )
    .join("\n");

  const message = [
    `Hi ${customerSnapshot.name}! 👋`,
    ``,
    `Your order from Vendra has been confirmed ✅`,
    ``,
    `*Order Summary:*`,
    itemLines,
    ``,
    `*Total:*      ₦${totalAmount.toLocaleString("en-NG")}`,
    `*Deposit:*    ₦${depositPaid.toLocaleString("en-NG")}`,
    `*Balance:*    ₦${balanceOwed.toLocaleString("en-NG")}`,
    ``,
    balanceOwed > 0
      ? `Please note that ₦${balanceOwed.toLocaleString("en-NG")} is outstanding. Kindly complete payment before delivery.`
      : `Payment is complete — thank you! 🎉`,
    ``,
    `Thank you for shopping with us 🛍️`,
  ].join("\n");

  /*
   * Normalize phone: strip leading 0 and add +234 country code if needed.
   * wa.me requires international format without + or spaces.
   */
  const normalizedPhone = vendorPhone.startsWith("0")
    ? `234${vendorPhone.slice(1)}`
    : vendorPhone.replace(/^\+/, "");

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Build a WhatsApp enquiry link for the public storefront.
 * Pre-fills a message to the vendor about a specific product.
 *
 * @param {string} vendorPhone    - The vendor's WhatsApp number
 * @param {string} productName    - The product the buyer is enquiring about
 * @param {string} variantLabel   - The selected variant (e.g. "M / Blue")
 * @returns {string} wa.me URL
 */
export function buildProductEnquiryLink(vendorPhone, productName, variantLabel = "") {
  const message = [
    `Hi! I found your store on Vendra 👋`,
    ``,
    `I'm interested in *${productName}*${variantLabel ? ` (${variantLabel})` : ""}.`,
    `Is it still available?`,
  ].join("\n");

  const normalizedPhone = vendorPhone.startsWith("0")
    ? `234${vendorPhone.slice(1)}`
    : vendorPhone.replace(/^\+/, "");

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
