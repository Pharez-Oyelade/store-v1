import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import Vendor from "../models/vendorModel.js";
import TeamMember from "../models/teamMemberModel.js";
import Subscription from "../models/subscriptionModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import validator from "validator";
import {
  sendPasswordResetEmail,
  sendWelcomeTrialEmail,
} from "../services/email.service.js";
import { createNotification } from "../services/notification.service.js";
import { syncVendorSubscription } from "../services/subscription.service.js";

const COOKIE_NAME = "access_token";

// jwt token for store owner
const signTokenAndSetCookie = (res, vendor) => {
  const token = jwt.sign(
    { id: vendor._id, role: vendor.role || "owner", isTeamMember: false },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};

// jwt token for team members
const signTeamMemberTokenAndSetCookie = (res, member, vendor) => {
  const token = jwt.sign(
    {
      userId: member._id,
      vendorId: vendor._id,
      role: member.role,
      isTeamMember: true,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

// AuthUser response
const buildAuthUserResponse = (vendor, user = null) => {
  const currentUser = user || {
    _id: vendor._id,
    name: vendor.businessName,
    email: vendor.email || null,
    phone: vendor.phone,
    role: "owner",
    isTeamMember: false,
  };

  return {
    _id: vendor._id,
    businessName: vendor.businessName,
    handle: vendor.handle,
    phone: vendor.phone,
    email: vendor.email || null,
    logo: vendor.logo,
    role: currentUser.role || vendor.role || "owner",
    user: currentUser,
    subscriptionPlan: vendor.subscriptionPlan,
    subscriptionStatus: vendor.subscriptionStatus,
  };
};


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

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial

  const vendor = await Vendor.create({
    businessName: businessName.trim(),
    handle: handle.toLowerCase().trim(),
    phone: phone.trim(),
    email: email ? email.toLowerCase().trim() : undefined,
    password,
    subscriptionPlan: "stitch",
    subscriptionStatus: "active",
  });

  await Subscription.create({
    vendor: vendor._id,
    plan: "stitch",
    status: "active",
    isTrial: true,
    trialStartDate: trialStart,
    trialEndDate: trialEnd,
    currentPeriodStart: trialStart,
    currentPeriodEnd: trialEnd,
    expiryNoticeSent: false,
  });

  await createNotification(vendor._id, {
    title: "14-Day Stitch Free Trial Activated",
    message:
      "Welcome to Vendra! Your 14-day free trial on The Stitch Plan is active. Enjoy up to 50 products, bespoke demands, and debt tracking.",
    type: "subscription",
    actionUrl: "/dashboard",
  });

  if (vendor.email) {
    await sendWelcomeTrialEmail(vendor.email, {
      businessName: vendor.businessName,
      trialDays: 14,
    });
  }

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

  if (!credential || !password) {
    return sendError(res, "Please provide email/phone and password.", 400);
  }

  // accepting either email or phone as credential
  const isEmail = validator.isEmail(credential);
  const query = isEmail
    ? { email: credential.toLowerCase().trim() }
    : { phone: credential.trim() };

  // 1. Check if a primary Store Owner (Vendor) matches
  const vendor = await Vendor.findOne(query).select("+password");

  if (vendor) {
    if (!vendor.isActive) {
      return sendError(
        res,
        "Your account has been deactivated. Please contact support.",
        403,
      );
    }

    const isPasswordCorrect = await vendor.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendError(
        res,
        "Invalid credentials. Please check your details.",
        401,
      );
    }

    // Real-time subscription sync on login
    await syncVendorSubscription(vendor._id);
    const updatedVendor = await Vendor.findById(vendor._id);

    signTokenAndSetCookie(res, updatedVendor || vendor);

    return sendSuccess(
      res,
      buildAuthUserResponse(updatedVendor || vendor),
      `Welcome back, ${vendor.businessName}`,
    );
  }

  // 2. Check if an invited Team Member matches
  const teamMember = await TeamMember.findOne(query)
    .select("+password")
    .populate("vendor");

  if (teamMember) {
    if (!teamMember.isActive) {
      return sendError(
        res,
        "Your team access has been deactivated. Please contact your store manager.",
        403
      );
    }

    if (!teamMember.vendor || !teamMember.vendor.isActive) {
      return sendError(
        res,
        "This store account has been deactivated. Please contact support.",
        403
      );
    }

    const isPasswordCorrect = await teamMember.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendError(
        res,
        "Invalid credentials. Please check your details.",
        401
      );
    }

    await syncVendorSubscription(teamMember.vendor._id);
    const freshVendor = await Vendor.findById(teamMember.vendor._id);

    teamMember.lastLogin = new Date();
    await teamMember.save();

    signTeamMemberTokenAndSetCookie(res, teamMember, freshVendor || teamMember.vendor);

    const userProfile = {
      _id: teamMember._id,
      name: teamMember.name,
      email: teamMember.email,
      phone: teamMember.phone,
      role: teamMember.role,
      isTeamMember: true,
    };

    return sendSuccess(
      res,
      buildAuthUserResponse(freshVendor || teamMember.vendor, userProfile),
      `Welcome back, ${teamMember.name}`
    );
  }

  return sendError(
    res,
    "Invalid credentials. Please check your details.",
    401,
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

/* -------------- Get Me (current vendor / user) ---------------- */
export const getMe = asyncHandler(async (req, res) => {
  // Sync real-time subscription lifecycle (expiry/downgrade check)
  await syncVendorSubscription(req.vendor._id);
  const freshVendor = await Vendor.findById(req.vendor._id);

  return sendSuccess(
    res,
    buildAuthUserResponse(freshVendor || req.vendor, req.user),
    "Authenticated",
  );
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

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

  if (vendor.email) {
    await sendPasswordResetEmail(vendor.email, resetUrl);
  }

  // In development, also log the reset URL to the server console for rapid testing
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n🔑 [DEV ONLY] Password Reset Token: ${resetToken}`);
    console.log(`🔗 [DEV ONLY] Reset URL: ${resetUrl}\n`);
  }

  return sendSuccess(
    res,
    null,
    "If an account with that credential exists, a password reset link has been sent.",
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
