import dns from "dns/promises";
import Vendor from "../models/vendorModel.js";
import Product from "../models/productModel.js";
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
    bannerHeadline,
    bannerText,
    announcementText,
    announcementActive,
    whatsappFabEnabled,
    customCss,
    customDomain,
    businessType,
    category,
    deliveryRates,
    featuredProductIds,
    isPublished,
  } = req.body;

  const vendor = await Vendor.findById(req.vendor._id);

  if (!vendor.storefrontSettings) {
    vendor.storefrontSettings = {};
  }

  if (themeColor !== undefined) vendor.storefrontSettings.themeColor = themeColor;
  if (accentColor !== undefined) vendor.storefrontSettings.accentColor = accentColor;
  if (bannerHeadline !== undefined) vendor.storefrontSettings.bannerHeadline = bannerHeadline;
  if (bannerText !== undefined) vendor.storefrontSettings.bannerText = bannerText;
  if (announcementText !== undefined) vendor.storefrontSettings.announcementText = announcementText;
  if (announcementActive !== undefined) vendor.storefrontSettings.announcementActive = Boolean(announcementActive);
  if (whatsappFabEnabled !== undefined) vendor.storefrontSettings.whatsappFabEnabled = Boolean(whatsappFabEnabled);
  if (customCss !== undefined) vendor.storefrontSettings.customCss = customCss;
  if (customDomain !== undefined) {
    const rawDomain = (customDomain || "").toLowerCase().trim();
    if (rawDomain && rawDomain !== vendor.storefrontSettings?.customDomain) {
      // Check tier permission: only atelier and maison can configure a custom domain
      const plan = (vendor.subscriptionPlan || "free").toLowerCase();
      const hasCustomDomainPrivilege = ["atelier", "maison"].includes(plan);
      if (!hasCustomDomainPrivilege) {
        return sendError(
          res,
          "Custom domains require The Atelier or The Maison subscription plan",
          403
        );
      }

      // Sanitize domain: strip http://, https://, trailing slashes
      const sanitized = rawDomain
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "")
        .split("/")[0];

      // Validate domain format (FQDN pattern: e.g. shop.domain.com or brand.ng)
      const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(sanitized)) {
        return sendError(
          res,
          "Please provide a valid domain name (e.g. shop.yourboutique.com)",
          400
        );
      }

      // Prevent using internal or reserved Vendra domains
      const reservedBase = ["vendra.ng", "tryvendra.ng", "localhost"];
      if (reservedBase.some((r) => sanitized === r || sanitized.endsWith(`.${r}`))) {
        return sendError(
          res,
          "Cannot use internal Vendra domain names as a custom domain",
          400
        );
      }

      // Check if domain is already claimed by another vendor
      const existingVendor = await Vendor.findOne({
        _id: { $ne: vendor._id },
        "storefrontSettings.customDomain": sanitized,
      });
      if (existingVendor) {
        return sendError(
          res,
          "This domain is already registered to another boutique on Vendra",
          409
        );
      }

      vendor.storefrontSettings.customDomain = sanitized;
      vendor.storefrontSettings.customDomainStatus = "pending";
      vendor.storefrontSettings.customDomainVerifiedAt = null;
      vendor.storefrontSettings.customDomainError = "";
    } else if (!rawDomain) {
      // If cleared, reset domain fields
      vendor.storefrontSettings.customDomain = "";
      vendor.storefrontSettings.customDomainStatus = "none";
      vendor.storefrontSettings.customDomainVerifiedAt = null;
      vendor.storefrontSettings.customDomainError = "";
    }
  }
  if (deliveryRates !== undefined && Array.isArray(deliveryRates)) {
    vendor.storefrontSettings.deliveryRates = deliveryRates;
  }
  if (featuredProductIds !== undefined && Array.isArray(featuredProductIds)) {
    vendor.storefrontSettings.featuredProductIds = featuredProductIds;
  }

  if (businessType !== undefined) vendor.businessType = businessType;
  if (category !== undefined) vendor.category = category;

  // Validate publish prerequisites if vendor is attempting to publish
  if (isPublished !== undefined) {
    if (isPublished) {
      if (!vendor.businessType || vendor.businessType === "unselected") {
        return sendError(res, "Please select your business model before publishing your storefront", 400);
      }
      if (vendor.businessType === "demand") {
        const hasContact = Boolean(vendor.socials?.whatsapp || vendor.phone);
        if (!hasContact) {
          return sendError(res, "Please provide a WhatsApp or contact phone number for customer inquiries before publishing", 400);
        }
      } else {
        const activeProductCount = await Product.countDocuments({
          vendor: vendor._id,
          status: "active",
        });
        if (activeProductCount < 2) {
          return sendError(
            res,
            `Catalog requires at least 2 active products to publish your storefront (currently ${activeProductCount}/2)`,
            400
          );
        }
      }
      vendor.storefrontSettings.isPublished = true;
    } else {
      vendor.storefrontSettings.isPublished = false;
    }
  }

  await vendor.save();

  // Return readiness stats for dashboard
  const activeProductCount = await Product.countDocuments({
    vendor: vendor._id,
    status: "active",
  });

  const isEligible =
    vendor.businessType !== "unselected" &&
    (vendor.businessType === "demand"
      ? Boolean(vendor.socials?.whatsapp || vendor.phone)
      : activeProductCount >= 2);

  return sendSuccess(
    res,
    {
      storefrontSettings: vendor.storefrontSettings,
      businessType: vendor.businessType,
      category: vendor.category,
      activeProductCount,
      isEligible,
      isPublished: Boolean(vendor.storefrontSettings?.isPublished),
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

/* ── POST /api/vendor/custom-domain/verify ────────────────────────── */
export const verifyCustomDomain = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id);
  const customDomain = vendor?.storefrontSettings?.customDomain;

  if (!customDomain) {
    return sendError(res, "No custom domain configured to verify", 400);
  }

  const plan = (vendor.subscriptionPlan || "free").toLowerCase();
  if (!["atelier", "maison"].includes(plan)) {
    return sendError(res, "Custom domains require The Atelier or The Maison plan", 403);
  }

  const EXPECTED_CNAME = process.env.VENDRA_CNAME_TARGET || "cname.tryvendra.ng";
  const EXPECTED_A = process.env.VENDRA_SERVER_IP || "";

  let verified = false;
  let verificationDetails = "";

  try {
    // 1. Try CNAME resolution
    try {
      const cnames = await dns.resolveCname(customDomain);
      if (
        cnames &&
        cnames.some(
          (c) =>
            c.toLowerCase().includes("vendra.ng") ||
            c.toLowerCase() === EXPECTED_CNAME.toLowerCase()
        )
      ) {
        verified = true;
        verificationDetails = `CNAME successfully resolved to ${cnames.join(", ")}`;
      } else {
        verificationDetails = `CNAME points to ${cnames.join(", ")}, expected ${EXPECTED_CNAME}`;
      }
    } catch {
      // CNAME resolution failed or not found, try A record resolution if IP is configured
      if (EXPECTED_A) {
        try {
          const aRecords = await dns.resolve4(customDomain);
          if (aRecords && aRecords.includes(EXPECTED_A)) {
            verified = true;
            verificationDetails = `A record successfully resolved to ${EXPECTED_A}`;
          } else {
            verificationDetails = `A record points to ${aRecords.join(", ")}, expected ${EXPECTED_A}`;
          }
        } catch {
          verificationDetails = "No valid CNAME or A record found for this domain yet";
        }
      } else {
        verificationDetails = `No CNAME record found pointing to ${EXPECTED_CNAME}`;
      }
    }

    if (verified) {
      vendor.storefrontSettings.customDomainStatus = "active";
      vendor.storefrontSettings.customDomainVerifiedAt = new Date();
      vendor.storefrontSettings.customDomainError = "";
      await vendor.save();
      return sendSuccess(res, vendor.storefrontSettings, "Domain verified and active!");
    } else {
      vendor.storefrontSettings.customDomainStatus = "pending";
      vendor.storefrontSettings.customDomainError = verificationDetails;
      await vendor.save();
      return sendError(
        res,
        verificationDetails || "DNS records not yet propagated. Please allow a few minutes.",
        400
      );
    }
  } catch (err) {
    vendor.storefrontSettings.customDomainStatus = "error";
    vendor.storefrontSettings.customDomainError = err.message || "DNS lookup failed";
    await vendor.save();
    return sendError(res, `Failed to verify DNS: ${err.message || "Unknown error"}`, 500);
  }
});

/* ── DELETE /api/vendor/custom-domain ─────────────────────────────── */
export const removeCustomDomain = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id);
  if (!vendor.storefrontSettings) {
    vendor.storefrontSettings = {};
  }
  vendor.storefrontSettings.customDomain = "";
  vendor.storefrontSettings.customDomainStatus = "none";
  vendor.storefrontSettings.customDomainVerifiedAt = null;
  vendor.storefrontSettings.customDomainError = "";
  await vendor.save();
  return sendSuccess(res, vendor.storefrontSettings, "Custom domain disconnected successfully");
});

