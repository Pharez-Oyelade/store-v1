/**
 * Vendra Admin Seed Script
 *
 * Creates the initial admin account directly in the database.
 * Run this ONCE after setting up the production database.
 *
 * Usage:
 *   node src/scripts/seedAdmin.js
 *
 * Environment variables (from .env):
 *   ADMIN_PHONE     — phone number for the admin account
 *   ADMIN_PASSWORD  — password for the admin account
 *   ADMIN_NAME      — business name displayed in admin UI
 *
 * Or pass inline:
 *   ADMIN_PHONE=08012345678 ADMIN_PASSWORD=Secure123! node src/scripts/seedAdmin.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import Vendor from "../models/vendorModel.js";

async function seedAdmin() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Vendra Admin";

  /* ── Validate inputs ────────────────────────────── */
  if (!phone || !password) {
    console.error(
      "❌  Missing required env vars: ADMIN_PHONE and ADMIN_PASSWORD must be set.\n" +
        "    Example: ADMIN_PHONE=08012345678 ADMIN_PASSWORD=SecurePass123! node src/scripts/seedAdmin.js",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌  Password must be at least 8 characters.");
    process.exit(1);
  }

  /* ── Connect to DB ──────────────────────────────── */
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌  MONGO_URI is not set in .env");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅  Connected.");

  /* ── Check if admin already exists ─────────────── */
  const existingAdmin = await Vendor.findOne({ role: "admin" });
  if (existingAdmin) {
    console.log(
      `⚠️   An admin account already exists: ${existingAdmin.businessName} (${existingAdmin.phone})\n` +
        "    Skipping creation. If you need a second admin, update the database directly.",
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  /* ── Check if phone is already in use ──────────── */
  const existingPhone = await Vendor.findOne({ phone });
  if (existingPhone) {
    console.error(
      `❌  Phone number ${phone} is already registered to another account.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  /* ── Create admin ───────────────────────────────── */
  const admin = await Vendor.create({
    businessName: name,
    handle: "vendra-admin",
    phone,
    password,
    role: "admin",
    isActive: true,
    subscriptionPlan: "maison",
    subscriptionStatus: "active",
  });

  console.log("✅  Admin account created successfully:");
  console.log(`    Name    : ${admin.businessName}`);
  console.log(`    Handle  : ${admin.handle}`);
  console.log(`    Phone   : ${admin.phone}`);
  console.log(`    Role    : ${admin.role}`);
  console.log(`    ID      : ${admin._id}`);
  console.log(
    "\n🔐  Keep these credentials secure. Do NOT commit them to version control.",
  );

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌  Seed script failed:", err.message);
  process.exit(1);
});
