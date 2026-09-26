import cron from "node-cron";
import { processAllSubscriptionExpiries } from "../services/subscription.service.js";

/**
 * Initializes all background scheduled jobs for the platform.
 */
export function initCronJobs() {
  console.log("⏰ [Cron] Initializing background cron jobs...");

  // Run daily at 00:00 (midnight) to evaluate subscription expiries and send pre-expiry notices
  const subscriptionJob = cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [Cron] Running daily subscription lifecycle check...");
    try {
      await processAllSubscriptionExpiries();
      console.log("✅ [Cron] Subscription lifecycle check completed.");
    } catch (err) {
      console.error("❌ [Cron] Error during subscription lifecycle check:", err.message);
    }
  });

  // Optional: run an initial sweep on server boot after 10 seconds to catch up missed expiries
  setTimeout(async () => {
    try {
      console.log("⏰ [Cron] Running initial startup subscription check...");
      await processAllSubscriptionExpiries();
      console.log("✅ [Cron] Initial startup subscription check completed.");
    } catch (err) {
      console.error("❌ [Cron] Initial startup subscription check error:", err.message);
    }
  }, 10_000);

  return { subscriptionJob };
}
