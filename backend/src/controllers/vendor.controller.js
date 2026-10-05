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
  let subaccountCode = "";
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
    // If subaccount creation fails (e.g. account is same as primary Paystack account), leave blank so payments settle directly
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

/* ── PUT /api/vendor/storefront-settings ────────────────────────── */
export const updateStorefrontSettings = asyncHandler(async (req, res) => {
  const {
    themeColor,
    accentColor,
    announcementText,
    announcementActive,
    whatsappFabEnabled,
    customCss,
    customDomain,
    businessType,
    category,
    deliveryRates,
    featuredProductIds,
  } = req.body;

  const vendor = await Vendor.findById(req.vendor._id);

  if (!vendor.storefrontSettings) {
    vendor.storefrontSettings = {};
  }

  if (themeColor !== undefined) vendor.storefrontSettings.themeColor = themeColor;
  if (accentColor !== undefined) vendor.storefrontSettings.accentColor = accentColor;
  if (announcementText !== undefined) vendor.storefrontSettings.announcementText = announcementText;
  if (announcementActive !== undefined) vendor.storefrontSettings.announcementActive = Boolean(announcementActive);
  if (whatsappFabEnabled !== undefined) vendor.storefrontSettings.whatsappFabEnabled = Boolean(whatsappFabEnabled);
  if (customCss !== undefined) vendor.storefrontSettings.customCss = customCss;
  if (customDomain !== undefined) vendor.storefrontSettings.customDomain = customDomain.toLowerCase().trim();
  if (deliveryRates !== undefined && Array.isArray(deliveryRates)) {
    vendor.storefrontSettings.deliveryRates = deliveryRates;
  }
  if (featuredProductIds !== undefined && Array.isArray(featuredProductIds)) {
    vendor.storefrontSettings.featuredProductIds = featuredProductIds;
  }

  if (businessType !== undefined) vendor.businessType = businessType;
  if (category !== undefined) vendor.category = category;

  await vendor.save();

  return sendSuccess(
    res,
    {
      storefrontSettings: vendor.storefrontSettings,
      businessType: vendor.businessType,
      category: vendor.category,
    },
    "Storefront settings updated successfully"
  );
});

/* ── PUT /api/vendor/storefront-banner ──────────────────────────── */
export const updateStorefrontBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "Please upload a banner image file", 400);
  }

  const vendor = await Vendor.findById(req.vendor._id);

  if (vendor.storefrontSettings?.bannerImage?.publicId) {
    await deleteImage(vendor.storefrontSettings.bannerImage.publicId);
  }

  const result = await uploadToCloudinary(req.file.buffer);

  if (!vendor.storefrontSettings) vendor.storefrontSettings = {};
  vendor.storefrontSettings.bannerImage = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await vendor.save();

  return sendSuccess(
    res,
    { bannerImage: vendor.storefrontSettings.bannerImage },
    "Storefront banner updated successfully"
  );
});

/* ── GET /api/vendor/discounts ─────────────────────────────────── */
export const getDiscounts = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id).select("discounts");
  return sendSuccess(res, vendor.discounts || []);
});

/* ── POST /api/vendor/discounts ────────────────────────────────── */
export const createDiscount = asyncHandler(async (req, res) => {
  const {
    code,
    type = "percentage",
    value,
    minOrderAmount = 0,
    maxUses = null,
    startDate,
    endDate,
    showInAnnouncementBar = false,
  } = req.body;

  if (!code || !value) {
    return sendError(res, "Discount code and value are required", 400);
  }

  const vendor = await Vendor.findById(req.vendor._id);
  const cleanCode = code.trim().toUpperCase();

  const exists = (vendor.discounts || []).some((d) => d.code === cleanCode);
  if (exists) {
    return sendError(res, `Discount code "${cleanCode}" already exists`, 400);
  }

  const newDiscount = {
    code: cleanCode,
    type,
    value: Number(value),
    minOrderAmount: Number(minOrderAmount) || 0,
    maxUses: maxUses ? Number(maxUses) : null,
    usedCount: 0,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
    isActive: true,
    showInAnnouncementBar: Boolean(showInAnnouncementBar),
  };

  vendor.discounts.push(newDiscount);
  await vendor.save();

  return sendSuccess(res, vendor.discounts, "Discount created successfully", 201);
});

/* ── DELETE /api/vendor/discounts/:discountId ──────────────────── */
export const deleteDiscount = asyncHandler(async (req, res) => {
  const { discountId } = req.params;
  const vendor = await Vendor.findById(req.vendor._id);

  vendor.discounts = (vendor.discounts || []).filter(
    (d) => d._id.toString() !== discountId && d.code !== discountId.toUpperCase()
  );

  await vendor.save();
  return sendSuccess(res, vendor.discounts, "Discount removed successfully");
});

