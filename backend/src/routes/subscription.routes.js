import { Router } from "express";
import {
  initializeUpgrade,
  verifyUpgrade,
  paystackWebhook,
  getCurrentSubscription,
  checkSubscriptionLifecycle,
} from "../controllers/subscription.controller.js";
import { protect } from "../middleware/protect.js";

const subscriptionRouter = Router();

// Webhook doesn't require authentication (Paystack sends it)
subscriptionRouter.post("/webhook", paystackWebhook);

// Protect the rest
subscriptionRouter.use(protect);

subscriptionRouter.post("/initialize", initializeUpgrade);
subscriptionRouter.post("/verify", verifyUpgrade);
subscriptionRouter.get("/current", getCurrentSubscription);
subscriptionRouter.post("/check-lifecycle", checkSubscriptionLifecycle);

export default subscriptionRouter;

