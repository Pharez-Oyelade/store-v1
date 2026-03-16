import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import validator from "validator";

const COOKIE_NAME = "access_token";

// jwt token
const signTokenAndSetCookie = (res, vendorId) => {
  const token = jwt.sign({ id: vendorId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

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

  signTokenAndSetCookie(res, vendor._id);

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

  signTokenAndSetCookie(res, vendor._id);

  return sendSuccess(
    res,
    buildAuthUserResponse(vendor),
    `Welcome back, ${vendor.businessName}`,
  );
});
