import Stripe from "stripe";

/**
 * Stripe Integration
 * Handles payment processing and webhook events
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
  items: Array<{ productId: string; quantity: number; name: string; price: string }>;
  userId: string;
  userEmail: string;
  userName?: string;
  origin: string;
}) {
  const { items, userId, userEmail, userName, origin } = params;

  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity * 100, // Convert to cents
    0
  );

  // Create line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(parseFloat(item.price) * 100), // Convert to cents
    },
    quantity: item.quantity,
  }));

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      customer_email: userEmail,
      customer_name: userName || "",
      items: JSON.stringify(items.map((i) => ({ id: i.productId, qty: i.quantity }))),
    },
    allow_promotion_codes: true,
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Verify Stripe Webhook Signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

/**
 * Handle Stripe Webhook Events
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Test event detection - CRITICAL for webhook verification
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe] Payment succeeded: ${paymentIntent.id}`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe] Payment failed: ${paymentIntent.id}`);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      console.log(`[Stripe] Charge refunded: ${charge.id}`);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

/**
 * Handle Checkout Session Completed
 * Create order in database when payment succeeds
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe] Checkout completed: ${session.id}`);

  const userId = session.client_reference_id;
  const customerEmail = session.customer_email || session.metadata?.customer_email;
  const customerName = session.metadata?.customer_name;
  const itemsJson = session.metadata?.items;

  if (!userId || !customerEmail) {
    console.error("[Stripe] Missing user information in checkout session");
    return;
  }

  // Parse items from metadata
  let items: Array<{ id: string; qty: number }> = [];
  if (itemsJson) {
    try {
      items = JSON.parse(itemsJson);
    } catch (e) {
      console.error("[Stripe] Failed to parse items from metadata");
    }
  }

  console.log(`[Stripe] Creating order for user ${userId}`);
  console.log(`[Stripe] Items: ${JSON.stringify(items)}`);
  console.log(`[Stripe] Amount: $${(session.amount_total || 0) / 100}`);

  // TODO: Create order in database using db.ts functions
  // This will be implemented when integrating with the orders system
  // For now, just log the successful payment

  return {
    userId,
    customerEmail,
    customerName,
    items,
    amount: session.amount_total,
    sessionId: session.id,
  };
}
