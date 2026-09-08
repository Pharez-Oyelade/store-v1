import IdempotencyKey from "../models/idempotencyModel.js";

/**
 * Idempotency middleware for preventing duplicate mutations during network sync retries.
 * Reads `x-idempotency-key` or `idempotency-key` header and caches the response.
 */
export const checkIdempotency = async (req, res, next) => {
  const key = req.headers["x-idempotency-key"] || req.headers["idempotency-key"];

  // Only apply to state-changing requests with an idempotency key and authenticated vendor
  if (!key || req.method === "GET" || !req.vendor?._id) {
    return next();
  }

  try {
    const existing = await IdempotencyKey.findOne({
      key,
      vendor: req.vendor._id,
    });

    if (existing) {
      // Return cached response directly without re-executing business logic
      return res.status(existing.statusCode).json(existing.responseBody);
    }

    // Intercept res.json to capture response on successful completion
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only cache successful mutations (status code 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        IdempotencyKey.create({
          key,
          vendor: req.vendor._id,
          statusCode: res.statusCode,
          responseBody: body,
        }).catch((err) => {
          console.error("[Idempotency] Failed to save response snapshot:", err.message);
        });
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error("[Idempotency] Middleware check failed:", error.message);
    // On unexpected error, proceed with normal execution rather than blocking the request
    next();
  }
};
