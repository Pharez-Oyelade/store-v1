import { sendError } from "../utils/apiResponse.js";

/* ── 404 Not Found ─────────────────────────────────────────── */
export const notFound = (req, res, next) => {
  /*
   * Creating an Error object and passing it to next(err)
   * routes it to the errorHandler below.
   * We set err.statusCode so errorHandler can use it.
   */
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

/* ── Global Error Handler ───────────────────────────────────── */
export const errorHandler = (err, req, res, next) => {
  /*
   * Start with whatever statusCode is set on the error, or 500.
   * Controllers can set err.statusCode before calling next(err)
   * to control the status code.
   */
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = null;

  /* ── Handle specific error types ───────────────────────── */

  /*
   * Mongoose CastError: thrown when an invalid ObjectId is passed.
   * e.g. GET /api/products/not-a-valid-id
   * MongoDB ObjectIds are 24-char hex strings — other formats throw CastError.
   */
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  /*
   * Mongoose ValidationError: thrown when document.save() fails
   * because of schema validators (required, minlength, etc.)
   * err.errors is an object where keys = field names.
   * We extract messages into our errors format.
   */
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, error]) => [
        field,
        error.message,
      ]),
    );
    /*
     * Object.entries() → [["field1", errObj], ["field2", errObj], ...]
     * .map() → [["field1", "message"], ["field2", "message"], ...]
     * Object.fromEntries() → { field1: "message", field2: "message" }
     * This matches our ApiError.errors type on the frontend.
     */
  }

  /*
   * MongoDB Duplicate Key Error (code 11000):
   * Thrown when inserting a document that violates a unique index.
   * e.g. Registering with an email that already exists.
   * err.keyValue = { handle: "existing-handle" }
   */
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const keyValue =
      err.keyValue ||
      (err.keyPattern
        ? Object.fromEntries(Object.keys(err.keyPattern).map((k) => [k, ""]))
        : {});
    const field = Object.keys(keyValue)[0] || "field";
    const value = keyValue[field];

    if (field === "handle") {
      message = value
        ? `The handle "@${value}" is already taken. Try another.`
        : "That store handle is already taken. Try another.";
    } else if (field === "phone") {
      message = "A store is already registered with this phone number.";
    } else if (field === "email") {
      message = "An account is already registered with this email.";
    } else if (value) {
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already taken`;
    } else {
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`;
    }
  }

  /*
   * Mongoose VersionError (Optimistic Concurrency Control):
   * Thrown when two concurrent requests attempt to save the same document.
   */
  if (err.name === "VersionError") {
    statusCode = 409;
    message = "This record was updated by another request. Please refresh and try again.";
  }

  /*
   * JWT Errors (from jsonwebtoken package):
   * - JsonWebTokenError: token is malformed or signature is invalid
   * - TokenExpiredError: token exists but has expired
   */
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please login again.";
  }

  /*
   * Multer Errors (from multer package):
   * - LIMIT_FILE_SIZE: file exceeded fileSize limit
   * - LIMIT_FILE_COUNT: too many files uploaded
   */
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum allowed image size is 15MB per file.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files. Maximum 5 images allowed per upload.";
    } else {
      message = `Upload error: ${err.message}`;
    }
  }


  /* ── Log errors in development ──────────────────────────── */
  if (process.env.NODE_ENV !== "production") {
    console.error(`\n❌ ERROR [${statusCode}]: ${message}`);
    if (errors) console.error("Field errors:", errors);
    if (statusCode === 500 && err.stack) console.error(err.stack);
  } else if (statusCode === 500) {
    // In production, mask raw internal 500 error messages
    message = "An unexpected server error occurred. Please try again later.";
  }

  return sendError(res, message, statusCode, errors);
};

