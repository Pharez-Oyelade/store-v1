import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import validator from "validator";

const COOKIE_NAME = "access_token";

// jwt token
const signTokenAndSetCookie = (res, vendor) => {
  const token = jwt.sign(
    { id: vendor._id, role: vendor.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in ms - consistent with JWT expiry
  });

  return token;
};

// AuthUser response
const buildAuthUserResponse = (vendor) => ({
  _id: vendor._id,
  businessName: vendor.businessName,
  handle: vendor.handle,
  phone: vendor.phone,
  email: vendor.email || null,
  logo: vendor.logo,
  role: vendor.role,
  subscriptionPlan: vendor.subscriptionPlan,
  subscriptionStatus: vendor.subscriptionStatus,
});

/* Register -------------------------------- */
export const register = asyncHandler(async (req, res) => {
  const { businessName, handle, phone, email, password } = req.body;

  // check if vendor exists
  const existingByPhone = await Vendor.findOne({ phone });

  if (existingByPhone) {
    return sendError(
      res,
      "A store is already registered with this phone number.",
      409,
    );
  }

  if (email) {
    const existingByEmail = await Vendor.findOne({
      email: email.toLowerCase(),
    });
    if (existingByEmail) {
      return sendError(
        res,
        "A store is already registered with this email.",
        409,
      );
    }
  }

  const existingByHandle = await Vendor.findOne({
    handle: handle.toLowerCase(),
  });
  if (existingByHandle) {
    return sendError(
      res,
      `The handle "@${handle}" is already taken. Try another.`,
      409,
    );
  }

  const vendor = await Vendor.create({
    businessName: businessName.trim(),
    handle: handle.toLowerCase().trim(),
    phone: phone.trim(),
    email: email ? email.toLowerCase().trim() : undefined,
    password,
  });

  signTokenAndSetCookie(res, vendor);

  return sendSuccess(
    res,
    buildAuthUserResponse(vendor),
    "Account created successfully",
    201,
  );
});

/* ---------- login ------------------- */
export const login = asyncHandler(async (req, res) => {
  const { credential, password } = req.body;

  // accepting either email or phone as credential
  const isEmail = validator.isEmail(credential);

  // use .select("+password") since password as select: false in schema
  const query = isEmail
    ? { email: credential.toLowerCase() }
    : { phone: credential };
  const vendor = await Vendor.findOne(query).select("+password");

  if (!vendor) {
    return sendError(
      res,
      "Invalid credentials. Please check your details",
      401,
    );
  }

  if (!vendor.isActive) {
    return sendError(
      res,
      "Your account has been deactivated. Please contact support.",
      403,
    );
  }

  // compare password (comparePassword method in schema)

  const isPasswordCorrect = await vendor.comparePassword(password);

  if (!isPasswordCorrect) {
    return sendError(
      res,
      "Invalid credentials. Please check your details.",
      401,
    );
  }

  signTokenAndSetCookie(res, vendor);

  return sendSuccess(
    res,
    buildAuthUserResponse(vendor),
    `Welcome back, ${vendor.businessName}`,
  );
});

/* -------------- Logout ---------------- */
export const logout = asyncHandler(async (req, res) => {
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 0, // Expire immediately
  });

  return sendSuccess(res, null, "signed out successfully");
});

/* -------------- Get Me (current vendor) ---------------- */
export const getMe = asyncHandler(async (req, res) => {
  /*
   * req.vendor is attached by the `protect` middleware.
   * We return a fresh copy with only the fields the client needs.
   */
  return sendSuccess(res, buildAuthUserResponse(req.vendor), "Authenticated");
});

/* -------------- Forgot Password ---------------- */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return sendError(res, "Email or phone number is required", 400);
  }

  const isEmail = validator.isEmail(credential);
  const query = isEmail
    ? { email: credential.toLowerCase() }
    : { phone: credential };

  const vendor = await Vendor.findOne(query);

  /*
   * Always return 200 even if vendor not found.
   * This prevents user enumeration attacks.
   */
  if (!vendor) {
    return sendSuccess(
      res,
      null,
      "If an account with that credential exists, a reset link has been sent.",
    );
  }

  // Generate a random reset token (32 bytes → 64-char hex string)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token before storing (we store the hash, send the raw token)
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Store the hash + expiry on the vendor document
  vendor.passwordResetToken = hashedToken;
  vendor.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await vendor.save({ validateBeforeSave: false });

  /*
   * TODO: Send the reset token via email or SMS.
   * For now, returning it in the response for development.
   * In production, remove the token from the response and send via Termii/email.
   */
  return sendSuccess(
    res,
    { resetToken }, // REMOVE in production — send via email/SMS instead
    "Password reset token generated",
  );
});

/* -------------- Reset Password ---------------- */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return sendError(res, "Reset token and new password are required", 400);
  }

  if (password.length < 8) {
    return sendError(res, "Password must be at least 8 characters", 400);
  }

  // Hash the incoming token to compare against stored hash
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const vendor = await Vendor.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Must not be expired
  });

  if (!vendor) {
    return sendError(res, "Invalid or expired reset token", 400);
  }

  // Update password and clear reset token fields
  vendor.password = password;
  vendor.passwordResetToken = undefined;
  vendor.passwordResetExpires = undefined;
  await vendor.save(); // Pre-save hook will hash the new password

  // Sign in the vendor immediately after reset
  signTokenAndSetCookie(res, vendor);

  return sendSuccess(
    res,
    buildAuthUserResponse(vendor),
    "Password reset successfully. You are now signed in.",
  );
});
