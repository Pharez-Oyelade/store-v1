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
import authRouter from "./src/routes/auth.routes.js";

connectDB();

const app = express();

// dns.setServers(["8.8.8.8", "8.8.4.4"]);

app.use(helmet()); //set security HTTP headers automatically

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, //allow cookies, auth headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, Please slow down." },
});
app.use("/api", limiter);

// General Middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb " }));

// cookie-parser - cookies vailable as req.cookies
app.use(cookieParser());

// mongo-sanitize - remove keys starting with $ or containing . from req.body, req.query, req.params - prevent operator injection attacks
// app.use(mongoSanitize());

// morgan - log HTTP request - only log in dev
if (process.env.NODE_ENV === "production") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    env: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRouter);

// start server
const PORT = parseInt(process.env.PORT || "5000", 10);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
