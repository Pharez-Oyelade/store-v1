import "dotenv/config"; //load first
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import dns from "node:dns";

import connectDB from "./src/config/db.js";

/* ── Route Imports ──────────────────────────────────────────────── */
import authRouter from "./src/routes/auth.routes.js";
import vendorRouter from "./src/routes/vendor.routes.js";
import productRouter from "./src/routes/product.routes.js";
import orderRouter from "./src/routes/order.routes.js";
import customerRouter from "./src/routes/customer.routes.js";
import analyticsRouter from "./src/routes/analytics.routes.js";
import storefrontRouter from "./src/routes/storefront.routes.js";
import supplierRouter from "./src/routes/supplier.routes.js";

/* ── Error Handling ─────────────────────────────────────────────── */
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);
connectDB();

// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* ── Security ───────────────────────────────────────────────────── */
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, Please slow down." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for auth endpoints
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

/* ── Body Parsing ───────────────────────────────────────────────── */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
// app.use(mongoSanitize());

/* ── Logging ────────────────────────────────────────────────────── */
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* ── Health Check ───────────────────────────────────────────────── */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Vendra API is running",
    env: process.env.NODE_ENV,
  });
});

/* ── API Routes ─────────────────────────────────────────────────── */
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/vendor", apiLimiter, vendorRouter);
app.use("/api/products", apiLimiter, productRouter);
app.use("/api/orders", apiLimiter, orderRouter);
app.use("/api/customers", apiLimiter, customerRouter);
app.use("/api/suppliers", apiLimiter, supplierRouter);
app.use("/api/analytics", apiLimiter, analyticsRouter);
app.use("/api/storefront", storefrontRouter); // Public — no rate limit

/* ── Error Handling (must be LAST) ──────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ── Start Server ───────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || "5000", 10);

app.listen(PORT, () => {
  console.log(`✅ Vendra API running on http://localhost:${PORT}`);
});

export default app;
