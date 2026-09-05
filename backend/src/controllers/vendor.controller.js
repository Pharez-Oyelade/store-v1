import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { deleteImage } from "../services/cloudinary.service.js";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";
import {
  fetchBanks,
  resolveAccountNumber,
  createSubaccount,
} from "../services/paystack.service.js";

/* ── GET /api/vendor/profile ────────────────────────────────────── */
export const getProfile = asyncHandler(async (req, res) => {
  // req.vendor is attached by protect middleware (fresh from DB)
  return sendSuccess(res, req.vendor);
});

/* ── PUT /api/vendor/profile ────────────────────────────────────── */
export const updateProfile = asyncHandler(async (req, res) => {
  const { businessName, bio, state, city, area, instagram, whatsapp, email, socialMessaging } =
    req.body;

  const vendor = await Vendor.findById(req.vendor._id);

  if (businessName !== undefined) vendor.businessName = businessName.trim();
  if (bio !== undefined) vendor.bio = bio;
  if (email !== undefined)
    vendor.email = email?.toLowerCase().trim() || undefined;

  // Location fields (update individual sub-fields)
  if (state !== undefined) vendor.location.state = state;
  if (city !== undefined) vendor.location.city = city;
  if (area !== undefined) vendor.location.area = area;

  // Social links
  if (instagram !== undefined) vendor.socials.instagram = instagram;
  if (whatsapp !== undefined) vendor.socials.whatsapp = whatsapp;

  // Social messaging templates
  if (socialMessaging !== undefined) {
    if (socialMessaging.orderConfirmedTemplate !== undefined) {
      vendor.socialMessaging.orderConfirmedTemplate = socialMessaging.orderConfirmedTemplate;
    }
    if (socialMessaging.orderDispatchedTemplate !== undefined) {
      vendor.socialMessaging.orderDispatchedTemplate = socialMessaging.orderDispatchedTemplate;
    }
    if (socialMessaging.orderCompletedTemplate !== undefined) {
      vendor.socialMessaging.orderCompletedTemplate = socialMessaging.orderCompletedTemplate;
    }
  }

  await vendor.save();

  return sendSuccess(res, vendor, "Profile updated successfully");
});

/* ── PUT /api/vendor/logo ───────────────────────────────────────── */
export const updateLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "Please upload an image file", 400);
  }

  const vendor = await Vendor.findById(req.vendor._id);

  if (vendor.logo?.publicId) {
    await deleteImage(vendor.logo.publicId);
  }

  const result = await uploadToCloudinary(req.file.buffer);

  vendor.logo = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await vendor.save();

  return sendSuccess(res, { logo: vendor.logo }, "Logo updated successfully");
});

/* ── GET /api/vendor/payout/banks ───────────────────────────────── */
export const getBanksList = asyncHandler(async (req, res) => {
  const rawBanks = await fetchBanks();
  const bankMap = new Map();

  for (const b of (rawBanks || [])) {
    if (b.active !== false && b.code && !bankMap.has(b.code)) {
      bankMap.set(b.code, {
        id: b.id,
        name: b.name.trim(),
        code: b.code.trim(),
        slug: b.slug,
      });
    }
  }

  const sortedBanks = Array.from(bankMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return sendSuccess(res, sortedBanks, "Banks fetched successfully");
});

/* ── POST /api/vendor/payout/resolve ────────────────────────────── */
export const resolveBankDetails = asyncHandler(async (req, res) => {
  const { accountNumber, bankCode } = req.body;
  if (!accountNumber || !bankCode) {
    return sendError(res, "Account number and bank code are required", 400);
  }

  const resolved = await resolveAccountNumber(accountNumber.trim(), bankCode.trim());
  return sendSuccess(res, resolved, "Account resolved successfully");
});

/* ── GET /api/vendor/payout ─────────────────────────────────────── */
export const getPayoutSettings = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id).select("payoutAccount");
  return sendSuccess(res, vendor.payoutAccount || {}, "Payout settings fetched");
});

/* ── PUT /api/vendor/payout ─────────────────────────────────────── */
export const updatePayoutSettings = asyncHandler(async (req, res) => {
  const { bankName, bankCode, accountNumber } = req.body;
  if (!bankName || !bankCode || !accountNumber) {
    return sendError(res, "Bank name, bank code, and account number are required", 400);
  }

  // 1. Resolve account name to ensure accuracy
  const resolved = await resolveAccountNumber(accountNumber.trim(), bankCode.trim());
  const accountName = resolved.account_name;

  const vendor = await Vendor.findById(req.vendor._id);

  // 2. Create Paystack Subaccount for split settlements
  let subaccountCode = vendor.payoutAccount?.paystackSubaccountCode;
  try {
    const subaccount = await createSubaccount({
      businessName: `${vendor.businessName} (${accountName})`,
      settlementBank: bankCode.trim(),
      accountNumber: accountNumber.trim(),
      percentageCharge: 0, // 0% platform deduction (vendor gets 100% of order value)
    });
    subaccountCode = subaccount.subaccount_code;
  } catch (err) {
    console.error("[Paystack Subaccount Error]", err.message);
    // Even if subaccount creation has a sandbox/key limit, still record the verified bank account
  }

  vendor.payoutAccount = {
    bankName: bankName.trim(),
    bankCode: bankCode.trim(),
    accountNumber: accountNumber.trim(),
    accountName,
    paystackSubaccountCode: subaccountCode || "",
    isVerified: true,
  };

  await vendor.save();

  return sendSuccess(res, vendor.payoutAccount, "Payout account updated and verified successfully");
});

