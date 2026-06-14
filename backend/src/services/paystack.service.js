import crypto from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Initialize a Paystack transaction
 * @param {Object} data - email, amount (in kobo), metadata, plan (optional)
 * @returns {Promise<Object>} The Paystack initialization response
 */
export const initializeTransaction = async (data) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paystack secret key is missing");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to initialize Paystack transaction");
  }

  return result.data;
};

/**
 * Verify a Paystack transaction
 * @param {string} reference - The transaction reference
 * @returns {Promise<Object>} The verification data
 */
export const verifyTransaction = async (reference) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paystack secret key is missing");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to verify Paystack transaction");
  }

  return result.data;
};

/**
 * Verify Paystack webhook signature
 * @param {string} signature - The X-Paystack-Signature header
 * @param {Buffer|string} rawBody - The raw request body
 * @returns {boolean} True if valid
 */
export const verifyWebhookSignature = (signature, rawBody) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return false;
  
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
    
  return hash === signature;
};
