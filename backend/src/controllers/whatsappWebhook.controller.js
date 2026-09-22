import crypto from "node:crypto";
import asyncHandler from "../utils/asyncHandler.js";
import { handleIncomingMessage } from "../services/whatsappBot.service.js";
import { verifyWebhookSignature } from "../services/whatsappCloudApi.service.js";

/* ── GET /api/whatsapp/webhook ──────────────────────────────────────── */
/**
 * Meta Webhook Verification (Challenge Handshake).
 * When you configure the webhook URL in Meta App Dashboard,
 * Meta sends a GET request with:
 *   - hub.mode = "subscribe"
 *   - hub.verify_token = your custom token
 *   - hub.challenge = a random string to echo back
 *
 * We verify the token matches and respond with the challenge.
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified successfully ✅");
    return res.status(200).send(challenge);
  }

  console.warn("[WhatsApp] Webhook verification failed ❌", { mode, token });
  return res.status(403).json({ success: false, message: "Forbidden" });
};

/* ── POST /api/whatsapp/webhook ─────────────────────────────────────── */
/**
 * Handles incoming WhatsApp messages from Meta Cloud API.
 *
 * Meta sends a POST request with the message payload.
 * We MUST respond with 200 OK immediately to prevent retries,
 * then process the message asynchronously.
 *
 * Payload structure:
 * {
 *   "object": "whatsapp_business_account",
 *   "entry": [{
 *     "changes": [{
 *       "value": {
 *         "messages": [{
 *           "from": "2348012345678",
 *           "id": "wamid.xxx",
 *           "type": "text",
 *           "text": { "body": "Sold 2 blue Ankara bubu" }
 *         }],
 *         "metadata": { "phone_number_id": "..." }
 *       }
 *     }]
 *   }]
 * }
 */
export const handleIncoming = asyncHandler(async (req, res) => {
  /*
   * IMMEDIATELY respond 200 to Meta.
   * Meta retries webhooks that don't get a 200 within ~20 seconds.
   * We process the message asynchronously after acknowledging.
   */
  res.status(200).json({ success: true });

  console.log("[WhatsApp Webhook] Received incoming webhook POST");

  /* ── Verify HMAC signature ────────────────────────────── */
  const signature = req.headers["x-hub-signature-256"];
  if (signature && process.env.WHATSAPP_APP_SECRET) {
    const rawBody = req.rawBody;
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[WhatsApp Webhook] Invalid webhook signature, rejecting payload");
      return;
    }
  }

  /* ── Parse the webhook payload ────────────────────────── */
  const body = req.body;

  if (body.object !== "whatsapp_business_account") {
    return;
  }

  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value) return;

  /* ── Handle incoming messages ─────────────────────────── */
  const messages = value.messages;
  if (messages && messages.length > 0) {
    for (const message of messages) {
      const senderPhone = message.from;
      const messageId = message.id;
      const messageType = message.type;

      let messageText = "";

      if (messageType === "text") {
        messageText = message.text?.body || "";
      } else if (messageType === "interactive") {
        /*
         * Interactive messages come from button clicks.
         * The button ID is in message.interactive.button_reply.id
         * The button title is in message.interactive.button_reply.title
         */
        const interactive = message.interactive;
        if (interactive?.type === "button_reply") {
          messageText = interactive.button_reply?.title || interactive.button_reply?.id || "";
        } else if (interactive?.type === "list_reply") {
          messageText = interactive.list_reply?.title || interactive.list_reply?.id || "";
        }
      } else {
        /* For unsupported message types (image, audio, etc.) */
        messageText = `[${messageType} message received — please send text messages only]`;
      }

      if (!messageText.trim()) continue;

      /*
       * Process message asynchronously.
       * We don't await this because we already sent 200 to Meta.
       * Errors are caught and logged internally by handleIncomingMessage.
       */
      handleIncomingMessage(senderPhone, messageText, messageId, messageType).catch(
        (err) => {
          console.error("[WhatsApp] Error processing message:", err);
        },
      );
    }
  }

  /* ── Handle status updates (delivered, read, etc.) ────── */
  const statuses = value.statuses;
  if (statuses && statuses.length > 0) {
    /* Status updates can be logged if needed for analytics */
    for (const status of statuses) {
      console.log(
        `[WhatsApp] Message ${status.id} → ${status.status} (to: ${status.recipient_id})`,
      );
    }
  }
});
