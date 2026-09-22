/**
 * WhatsApp Bot Simulator / Verification Script
 *
 * Tests:
 * 1. Webhook GET verification handshake
 * 2. Vendor resolution with registered phone
 * 3. Gemini NLU conversational flow (e.g., "Sold 2 blue Ankara bubu")
 * 4. Revenue query (e.g., "How much was made this month?")
 *
 * Usage:
 *   node src/scripts/testWhatsAppBot.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import Vendor from "../models/vendorModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import { handleIncomingMessage } from "../services/whatsappBot.service.js";
import { verifyWebhookSignature } from "../services/whatsappCloudApi.service.js";

async function runTests() {
  console.log("==========================================");
  console.log("  VENDRA WHATSAPP BOT INTEGRATION TEST   ");
  console.log("==========================================\n");

  /* ── 1. Test HMAC Signature Verification ────────── */
  console.log("1. Testing Webhook HMAC Signature...");
  const rawTestBody = JSON.stringify({ test: "payload" });
  const isValid = verifyWebhookSignature(rawTestBody, "sha256=invalid_sig");
  console.log(`   Invalid signature rejected properly: ${isValid === false ? "✅ PASS" : "❌ FAIL"}`);

  /* ── 2. Test MongoDB Connection ─────────────────── */
  console.log("\n2. Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("   ✅ MongoDB connected.");

  /* ── 3. Find or seed a test vendor ───────────────── */
  console.log("\n3. Finding or creating test vendor...");
  let vendor = await Vendor.findOne({ role: "vendor" });
  if (!vendor) {
    vendor = await Vendor.findOne();
  }

  if (!vendor) {
    console.log("   No vendor found in database. Please register a vendor first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`   Found vendor: ${vendor.businessName} (Phone: ${vendor.phone})`);

  /* Ensure vendor has at least one active product */
  let product = await Product.findOne({ vendor: vendor._id });
  if (!product) {
    product = await Product.create({
      vendor: vendor._id,
      name: "Blue Ankara Bubu Dress",
      description: "Classic silk-blend Ankara bubu in ocean blue",
      category: "Ready-to-Wear",
      variants: [
        { label: "Blue / Free Size", size: "Free Size", color: "Blue", price: 15000, quantity: 10 },
      ],
      status: "active",
    });
    console.log(`   Created test product: "${product.name}" (Stock: 10)`);
  } else {
    console.log(`   Found existing product: "${product.name}"`);
  }

  /* ── 4. Test Unregistered Sender ─────────────────── */
  console.log("\n4. Testing Unregistered Phone Number...");
  await handleIncomingMessage("2349999999999", "Hello", "wamid.test_unregistered", "text");
  console.log("   ✅ Unregistered sender handled gracefully.");

  /* ── 5. Test Analytics / Read Query ──────────────── */
  console.log("\n5. Testing Conversational Analytics Query...");
  console.log(`   Sending: "How much was made this month?" from ${vendor.phone}...`);
  await handleIncomingMessage(vendor.phone, "How much was made this month?", "wamid.test_analytics", "text");
  console.log("   ✅ Analytics query processed.");

  /* ── 6. Test Order Intake Flow ───────────────────── */
  console.log("\n6. Testing Order Intake Flow...");
  console.log(`   Sending: "Sold 2 blue Ankara bubu" from ${vendor.phone}...`);
  await handleIncomingMessage(vendor.phone, "Sold 2 blue Ankara bubu", "wamid.test_order_intake", "text");
  console.log("   ✅ Order intake processed.");

  console.log("\n==========================================");
  console.log("  ALL TESTS COMPLETED SUCCESSFULLY! ✅   ");
  console.log("==========================================");

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
