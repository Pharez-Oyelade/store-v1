import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { deleteImage } from "../services/cloudinary.service.js";

/* ── GET /api/vendor/profile ────────────────────────────────────── */
export const getProfile = asyncHandler(async (req, res) => {
  // req.vendor is attached by protect middleware (fresh from DB)
  return sendSuccess(res, req.vendor);
});

/* ── PUT /api/vendor/profile ────────────────────────────────────── */
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    businessName,
    bio,
    state,
    city,
    area,
    instagram,
    whatsapp,
    email,
  } = req.body;

  const vendor = await Vendor.findById(req.vendor._id);

  if (businessName !== undefined) vendor.businessName = businessName.trim();
  if (bio !== undefined) vendor.bio = bio;
  if (email !== undefined) vendor.email = email?.toLowerCase().trim() || undefined;

  // Location fields (update individual sub-fields)
  if (state !== undefined) vendor.location.state = state;
  if (city !== undefined) vendor.location.city = city;
  if (area !== undefined) vendor.location.area = area;

  // Social links
  if (instagram !== undefined) vendor.socials.instagram = instagram;
  if (whatsapp !== undefined) vendor.socials.whatsapp = whatsapp;

  await vendor.save();

  return sendSuccess(res, vendor, "Profile updated successfully");
});

/* ── PUT /api/vendor/logo ───────────────────────────────────────── */
export const updateLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "Please upload an image file", 400);
  }

  const vendor = await Vendor.findById(req.vendor._id);

  // Delete old logo from Cloudinary (non-blocking on failure)
  if (vendor.logo?.publicId) {
    await deleteImage(vendor.logo.publicId);
  }

  vendor.logo = {
    url: req.file.path,
    publicId: req.file.filename,
  };

  await vendor.save();

  return sendSuccess(res, { logo: vendor.logo }, "Logo updated successfully");
});
