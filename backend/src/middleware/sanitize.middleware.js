import mongoSanitize from "express-mongo-sanitize";

/**
 * Express 5 compatible MongoDB injection sanitization middleware.
 * In Express 5, req.query is a getter-only property and cannot be directly reassigned.
 * mongoSanitize.sanitize() mutates the object in-place, safely stripping prohibited keys ($ and .).
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params && typeof req.params === "object") {
    mongoSanitize.sanitize(req.params);
  }
  if (req.query && typeof req.query === "object") {
    mongoSanitize.sanitize(req.query);
  }
  next();
};
