import express from "express";
import { verifyWebhookSignature, handleWebhookEvent } from "../stripe";

/**
 * Stripe Webhook Endpoint
 * MUST be registered with express.raw() before express.json()
 */

export function setupStripeWebhook(app: express.Application) {
  // Register webhook route with raw body parser for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        console.error("[Stripe Webhook] Missing signature");
        return res.status(400).send("Missing signature");
      }

      try {
        // Verify webhook signature
        const event = verifyWebhookSignature(req.body, signature);

        // Handle the event
        const result = await handleWebhookEvent(event);

        // Return appropriate response
        res.json(result);
      } catch (err: any) {
        console.error("[Stripe Webhook] Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  );

  console.log("[Stripe] Webhook endpoint registered at /api/stripe/webhook");
}
