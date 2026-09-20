import Subscription from "../models/subscriptionModel.js";
import Vendor from "../models/vendorModel.js";
import { createNotification } from "./notification.service.js";
import {
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiredEmail,
} from "./email.service.js";

const SYNC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const vendorSyncCache = new Map();

/**
 * Invalidate in-memory sync cache for a vendor (e.g. after upgrade/renewal/cancellation)
 */
export function invalidateVendorSyncCache(vendorId) {
  if (vendorId) {
    vendorSyncCache.delete(vendorId.toString());
  }
}

/**
 * Clears the entire sync cache (useful for testing or full reset)
 */
export function clearAllVendorSyncCache() {
  vendorSyncCache.clear();
}

/**
 * Evaluates and synchronizes a vendor's subscription status in real-time.
 * Checks for expiration (downgrade to Free) or upcoming expiry warnings.
 * Uses a 5-minute in-memory cache to prevent database hammering on every request.
 */
export async function syncVendorSubscription(vendorId, force = false) {
  if (!vendorId) return null;

  const key = vendorId.toString();
  const lastSync = vendorSyncCache.get(key);
  if (!force && lastSync && Date.now() - lastSync < SYNC_CACHE_TTL_MS) {
    return null;
  }

  try {
    const sub = await Subscription.findOne({ vendor: vendorId });
    if (!sub) return null;

    vendorSyncCache.set(key, Date.now());

    const now = new Date();

    // 1. Check if paid plan or trial has expired
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < now && sub.plan !== "free") {
      const prevPlan = sub.plan;
      
      // Downgrade to Free
      sub.plan = "free";
      sub.status = "active";
      sub.isTrial = false;
      sub.currentPeriodStart = now;
      sub.currentPeriodEnd = null;
      sub.expiryNoticeSent = false;
      await sub.save();

      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          subscriptionPlan: "free",
          subscriptionStatus: "active",
        },
        { new: true }
      );

      // Create in-app notification
      await createNotification(vendorId, {
        title: "Subscription Ended — Moved to Free Plan",
        message: `Your ${prevPlan.toUpperCase()} plan/trial has expired. Your store is now on the Free Plan (5 products, 5 orders/mo).`,
        type: "subscription",
        actionUrl: "/dashboard/settings",
      });

      // Send email if vendor has email
      if (vendor?.email) {
        await sendSubscriptionExpiredEmail(vendor.email, {
          businessName: vendor.businessName,
          plan: prevPlan.charAt(0).toUpperCase() + prevPlan.slice(1),
        });
      }

      return sub;
    }

    // 2. Check for pre-expiry warning (3 days or less remaining)
    if (
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd > now &&
      sub.plan !== "free" &&
      !sub.expiryNoticeSent
    ) {
      const diffMs = sub.currentPeriodEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) {
        sub.expiryNoticeSent = true;
        await sub.save();

        const vendor = await Vendor.findById(vendorId);

        await createNotification(vendorId, {
          title: "Subscription Expiring Soon",
          message: `Your ${sub.plan.toUpperCase()} plan ${sub.isTrial ? "trial " : ""}expires in ${diffDays} day(s). Renew or upgrade to maintain 50 products and 25 orders/mo.`,
          type: "subscription",
          actionUrl: "/dashboard/settings",
        });

        if (vendor?.email) {
          await sendSubscriptionExpiringEmail(vendor.email, {
            businessName: vendor.businessName,
            plan: sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1),
            daysLeft: diffDays,
          });
        }
      }
    }

    return sub;
  } catch (err) {
    console.error("[SubscriptionService] Sync error:", err.message);
    return null;
  }
}

/**
 * Batch sweep for automated background checks
 */
export async function processAllSubscriptionExpiries() {
  try {
    const activeSubs = await Subscription.find({
      plan: { $ne: "free" },
      currentPeriodEnd: { $exists: true, $ne: null },
    });

    for (const sub of activeSubs) {
      await syncVendorSubscription(sub.vendor, true);
    }
  } catch (err) {
    console.error("[SubscriptionService] Batch process error:", err.message);
  }
}
