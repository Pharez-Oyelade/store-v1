import "dotenv/config"; //load first
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { sanitizeRequest } from "./src/middleware/sanitize.middleware.js";
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
import subscriptionRouter from "./src/routes/subscription.routes.js";
import notificationRouter from "./src/routes/notification.routes.js";
import adminRouter from "./src/routes/admin.routes.js";
import customRequestRouter from "./src/routes/customRequest.routes.js";
import contactRouter from "./src/routes/contact.routes.js";
import newsletterRouter from "./src/routes/newsletter.routes.js";
import teamRouter from "./src/routes/team.routes.js";
import invoiceRouter from "./src/routes/invoice.routes.js";



/* ── Error Handling ─────────────────────────────────────────────── */
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);
connectDB();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

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

/* Admin limiter: tighter than API, looser than auth (admins make many reads) */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many admin requests. Please slow down.",
  },
});

/* Storefront limiter: generous for shopping, protects against scraping / spam orders */
const storefrontLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many storefront requests. Please try again later.",
  },
});

/* ── Body Parsing ───────────────────────────────────────────────── */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(sanitizeRequest);

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
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.use("/api/auth", apiLimiter, authRouter);
app.use("/api/vendor", apiLimiter, vendorRouter);
app.use("/api/products", apiLimiter, productRouter);
app.use("/api/orders", apiLimiter, orderRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/custom-requests", apiLimiter, customRequestRouter);
app.use("/api/customers", apiLimiter, customerRouter);
app.use("/api/suppliers", apiLimiter, supplierRouter);
app.use("/api/analytics", apiLimiter, analyticsRouter);
app.use("/api/subscriptions", subscriptionRouter); // Note: webhook handles its own rate limit, endpoints use their own logic or apiLimiter
app.use("/api/notifications", apiLimiter, notificationRouter);
app.use("/api/contact", apiLimiter, contactRouter);
app.use("/api/newsletter", apiLimiter, newsletterRouter);
app.use("/api/storefront", storefrontLimiter, storefrontRouter);
app.use("/api/team", apiLimiter, teamRouter);
app.use("/api/admin", adminLimiter, adminRouter);



/* ── Error Handling (must be LAST) ──────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ── Start Server & Graceful Shutdown ───────────────────────────── */
const PORT = parseInt(process.env.PORT || "5000", 10);

const server = app.listen(PORT, () => {
  console.log(`✅ Vendra API running on http://localhost:${PORT}`);
});

const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Closing HTTP server and database connection...`);
  server.close(() => {
    import("mongoose").then(({ default: mongoose }) => {
      mongoose.connection.close(false).then(() => {
        console.log("MongoDB connection closed gracefully.");
        process.exit(0);
      });
    }).catch(() => process.exit(0));
  });

  // Force close after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("Forcefully shutting down after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;

