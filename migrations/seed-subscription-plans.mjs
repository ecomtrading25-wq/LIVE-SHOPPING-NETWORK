/**
 * Seed Subscription Plans
 * Creates initial subscription plans in database and Stripe
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import Stripe from "stripe";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY environment variable is not set");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

const PLANS = [
  {
    name: "Basic Plan",
    description: "Perfect for small businesses getting started with live shopping",
    amount: 29.99,
    interval: "month",
    features: [
      "Up to 100 products",
      "Up to 500 orders per month",
      "5 concurrent live streams",
      "Advanced analytics",
      "Email support",
    ],
  },
  {
    name: "Pro Plan",
    description: "For growing businesses that need more power and features",
    amount: 99.99,
    interval: "month",
    features: [
      "Up to 1,000 products",
      "Up to 5,000 orders per month",
      "20 concurrent live streams",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "API access",
      "Multi-channel support",
    ],
  },
  {
    name: "Enterprise Plan",
    description: "Unlimited everything for large-scale operations",
    amount: 299.99,
    interval: "month",
    features: [
      "Unlimited products",
      "Unlimited orders",
      "Unlimited live streams",
      "Advanced analytics",
      "24/7 priority support",
      "Custom branding",
      "API access",
      "Multi-channel support",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

async function seedPlans() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Starting subscription plans seeding...");

  try {
    for (const planData of PLANS) {
      console.log(`\nCreating plan: ${planData.name}`);

      // Create product in Stripe
      const product = await stripe.products.create({
        name: planData.name,
        description: planData.description,
      });

      console.log(`✓ Created Stripe product: ${product.id}`);

      // Create price in Stripe
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(planData.amount * 100), // Convert to cents
        currency: "usd",
        recurring: {
          interval: planData.interval,
        },
      });

      console.log(`✓ Created Stripe price: ${price.id}`);

      // Insert into database
      await connection.execute(
        `INSERT INTO stripe_subscription_plans 
        (id, stripe_product_id, stripe_price_id, name, description, amount, currency, \`interval\`, interval_count, features, active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          nanoid(),
          product.id,
          price.id,
          planData.name,
          planData.description,
          planData.amount,
          "USD",
          planData.interval,
          1,
          JSON.stringify(planData.features),
          true,
        ]
      );

      console.log(`✓ Saved plan to database: ${planData.name}`);
    }

    console.log("\n✅ Successfully seeded all subscription plans!");
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedPlans().catch((error) => {
  console.error(error);
  process.exit(1);
});
