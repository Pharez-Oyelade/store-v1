import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Vendor from "../models/vendorModel.js";

async function run() {
  await connectDB();
  console.log("Connected to MongoDB");

  const vendor = await Vendor.findOne({ handle: "didisfashion" });
  if (!vendor) {
    console.error("Vendor didisfashion not found!");
    process.exit(1);
  }

  console.log("Found vendor:", vendor.businessName, "Plan:", vendor.subscriptionPlan);
  vendor.subscriptionPlan = "drape";

  // Setup test delivery rates and announcement
  vendor.storefrontSettings = vendor.storefrontSettings || {};
  vendor.storefrontSettings.announcementText = "Welcome to Didi's Fashion! Use code ROSE10 for 10% off today.";
  vendor.storefrontSettings.announcementActive = true;
  vendor.storefrontSettings.whatsappFabEnabled = true;
  vendor.storefrontSettings.deliveryRates = [
    { state: "Lagos", fee: 2500, areas: ["Ikeja", "Lekki", "Yaba", "Victoria Island"] },
    { state: "Abuja", fee: 4500, areas: ["Maitama", "Garki", "Wuse", "Asokoro"] },
    { state: "Rivers", fee: 4000, areas: ["Port Harcourt", "Obio-Akpor"] }
  ];

  // Setup test discount campaign
  vendor.discounts = [
    {
      code: "ROSE10",
      type: "percentage",
      value: 10,
      minOrderAmount: 5000,
      isActive: true,
      showInAnnouncementBar: true
    }
  ];

  await vendor.save();
  console.log("Updated vendor storefront settings and discounts successfully.");

  // Test storefront fetch via HTTP
  const getRes = await fetch("http://localhost:5000/api/storefront/didisfashion");
  const getData = await getRes.json();
  console.log("GET /api/storefront/didisfashion status:", getRes.status);
  console.log("Active Campaign:", getData.data?.activeCampaign);
  console.log("Delivery Rates count:", getData.data?.storefrontSettings?.deliveryRates?.length);
  console.log("Announcement:", getData.data?.storefrontSettings?.announcementText);

  // Test coupon validation via HTTP
  const couponRes = await fetch("http://localhost:5000/api/storefront/didisfashion/validate-coupon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "ROSE10", subtotal: 15000 })
  });
  const couponData = await couponRes.json();
  console.log("POST /validate-coupon status:", couponRes.status);
  console.log("Coupon validation response:", JSON.stringify(couponData, null, 2));

  // Test coupon validation below minSpend
  const lowSubtotalRes = await fetch("http://localhost:5000/api/storefront/didisfashion/validate-coupon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "ROSE10", subtotal: 3000 })
  });
  const lowSubtotalData = await lowSubtotalRes.json();
  console.log("POST /validate-coupon with low subtotal (below 5000):", JSON.stringify(lowSubtotalData, null, 2));

  // Test storefront order creation
  const orderPayload = {
    customerName: "Chioma Okonjo",
    customerEmail: "chioma.test@example.com",
    customerPhone: "08012345678",
    items: [
      {
        productId: "6aaaf088291a76b84df827f8",
        variantId: "6aaaf088291a76b84df827f9",
        quantity: 1,
        price: 15000,
        variantLabel: "Blue / Free Size"
      }
    ],
    deliveryAddress: {
      street: "12 Admiralty Way, Lekki Phase 1",
      city: "Lekki",
      state: "Lagos",
      area: "Lekki"
    },
    deliveryFee: 2500,
    paymentMethod: "whatsapp",
    couponCode: "ROSE10",
    notes: "Please pack in gift box."
  };

  const orderRes = await fetch("http://localhost:5000/api/storefront/didisfashion/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload)
  });
  const orderData = await orderRes.json();
  console.log("POST /api/storefront/didisfashion/orders status:", orderRes.status);
  console.log("Created Order data:", JSON.stringify(orderData, null, 2));

  await mongoose.disconnect();
  console.log("Disconnected and finished test successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
