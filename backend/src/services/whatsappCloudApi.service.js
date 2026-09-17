import crypto from "node:crypto";

/**
 * Internal helper to call the Meta WhatsApp Business Cloud API.
 * @param {string} endpoint - The API endpoint (e.g., "/messages").
 * @param {object} body - The request body payload.
 * @returns {Promise<object>} The response JSON.
 */
async function callMetaApi(endpoint, body) {
  const url = `${process.env.WHATSAPP_CLOUD_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp Cloud API Error:", data);
    }
    return data;
  } catch (error) {
    console.error("Error calling WhatsApp Cloud API:", error);
    // Don't throw (fire-and-forget style for bot replies)
    return null;
  }
}

/**
 * Sends a plain text message to a WhatsApp number.
 * @param {string} recipientPhone - The recipient's phone number.
 * @param {string} text - The text message body.
 * @returns {Promise<object>} The response JSON.
 */
export async function sendTextMessage(recipientPhone, text) {
  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "text",
    text: { body: text }
  };
  return callMetaApi("/messages", payload);
}

/**
 * Sends an interactive button message.
 * @param {string} recipientPhone - The recipient's phone number.
 * @param {string} bodyText - The body text to display above the buttons.
 * @param {Array<{id: string, title: string}>} buttons - Array of button objects (max 3).
 * @returns {Promise<object>} The response JSON.
 */
export async function sendInteractiveButtons(recipientPhone, bodyText, buttons) {
  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({
          type: "reply",
          reply: { id: b.id, title: b.title }
        }))
      }
    }
  };
  return callMetaApi("/messages", payload);
}

/**
 * Sends an approved template message. Used for customer order receipts.
 * @param {string} recipientPhone - The recipient's phone number.
 * @param {string} templateName - The name of the approved template.
 * @param {string} languageCode - The language code (e.g., 'en_US').
 * @param {Array<object>} components - Array of template components.
 * @returns {Promise<object>} The response JSON.
 */
export async function sendTemplateMessage(recipientPhone, templateName, languageCode, components) {
  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components
    }
  };
  return callMetaApi("/messages", payload);
}

/**
 * Verifies HMAC SHA256 signature from Meta webhooks using WHATSAPP_APP_SECRET.
 * @param {string|Buffer} rawBody - The raw HTTP request body string or buffer.
 * @param {string} signature - The signature from the X-Hub-Signature-256 header.
 * @returns {boolean} True if the signature is valid, false otherwise.
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  
  if (!secret) {
    console.warn("WHATSAPP_APP_SECRET is not set, bypassing webhook signature verification.");
    return true;
  }

  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expectedSig = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
