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

/**
 * Fetch supported banks list from Paystack
 * @returns {Promise<Array>} List of banks
 */
export const fetchBanks = async () => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paystack secret key is missing");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&perPage=100`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch bank list from Paystack");
  }

  return result.data;
};

/**
 * Resolve NUBAN account number
 * @param {string} accountNumber - 10 digit NUBAN
 * @param {string} bankCode - Paystack bank code
 * @returns {Promise<Object>} Resolved account details { account_number, account_name }
 */
export const resolveAccountNumber = async (accountNumber, bankCode) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paystack secret key is missing");
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(
      accountNumber
    )}&bank_code=${encodeURIComponent(bankCode)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Could not resolve account name. Check details and try again.");
  }

  return result.data;
};

/**
 * Create a Paystack subaccount for merchant split payments
 * @param {Object} data - businessName, settlementBank, accountNumber, percentageCharge
 * @returns {Promise<Object>} Subaccount details with subaccount_code
 */
export const createSubaccount = async ({
  businessName,
  settlementBank,
  accountNumber,
  percentageCharge = 0,
}) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paystack secret key is missing");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: settlementBank,
      account_number: accountNumber,
      percentage_charge: percentageCharge,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create Paystack subaccount");
  }

  return result.data;
};

