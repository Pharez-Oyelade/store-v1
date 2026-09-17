import { Router } from "express";
import {
  verifyWebhook,
  handleIncoming,
} from "../controllers/whatsappWebhook.controller.js";

const router = Router();

/*
 * Meta WhatsApp Cloud API Webhook
 *
 * GET  /api/whatsapp/webhook — Verification handshake (Meta sends this once during setup)
 * POST /api/whatsapp/webhook — Incoming messages & status updates
 *
 * NOTE: These routes are NOT behind auth middleware.
 * Authentication is handled via HMAC signature verification
 * on the POST endpoint and verify_token on the GET endpoint.
 */
router.get("/webhook", verifyWebhook);
router.post("/webhook", handleIncoming);

export default router;
