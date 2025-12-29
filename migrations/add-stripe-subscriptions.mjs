/**
 * Migration: Add Stripe Subscription Tables
 * Adds customer portal subscription management tables
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function migrate() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Starting migration: Add Stripe Subscription Tables");

  try {
    // Create stripe_subscription_plans table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stripe_subscription_plans (
        id VARCHAR(64) PRIMARY KEY,
        stripe_product_id VARCHAR(255) NOT NULL UNIQUE,
        stripe_price_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        \`interval\` ENUM('month', 'year') NOT NULL,
        interval_count INT NOT NULL DEFAULT 1,
        features JSON,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        metadata JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX plan_active_idx (active)
      )
    `);
    console.log("✓ Created stripe_subscription_plans table");

    // Create stripe_subscriptions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stripe_subscriptions (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        stripe_customer_id VARCHAR(255) NOT NULL,
        stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
        plan_id VARCHAR(64) NOT NULL,
        status ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid') NOT NULL,
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
        canceled_at TIMESTAMP NULL,
        cancel_reason TEXT,
        trial_start TIMESTAMP NULL,
        trial_end TIMESTAMP NULL,
        metadata JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES stripe_subscription_plans(id),
        INDEX subscription_user_id_idx (user_id),
        INDEX subscription_status_idx (status),
        INDEX subscription_stripe_customer_id_idx (stripe_customer_id)
      )
    `);
    console.log("✓ Created stripe_subscriptions table");

    // Create stripe_payment_methods table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stripe_payment_methods (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        stripe_customer_id VARCHAR(255) NOT NULL,
        stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        brand VARCHAR(50),
        last4 VARCHAR(4),
        exp_month INT,
        exp_year INT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX payment_method_user_id_idx (user_id),
        INDEX payment_method_stripe_customer_id_idx (stripe_customer_id)
      )
    `);
    console.log("✓ Created stripe_payment_methods table");

    // Create stripe_billing_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stripe_billing_history (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        subscription_id VARCHAR(64) NOT NULL,
        stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
        stripe_payment_intent_id VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status ENUM('draft', 'open', 'paid', 'uncollectible', 'void') NOT NULL,
        invoice_date TIMESTAMP NOT NULL,
        due_date TIMESTAMP,
        paid_at TIMESTAMP,
        hosted_invoice_url TEXT,
        invoice_pdf TEXT,
        metadata JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subscription_id) REFERENCES stripe_subscriptions(id),
        INDEX billing_user_id_idx (user_id),
        INDEX billing_subscription_id_idx (subscription_id),
        INDEX billing_status_idx (status)
      )
    `);
    console.log("✓ Created stripe_billing_history table");

    // Create stripe_webhook_events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stripe_webhook_events (
        id VARCHAR(64) PRIMARY KEY,
        stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
        event_type VARCHAR(255) NOT NULL,
        processed BOOLEAN NOT NULL DEFAULT FALSE,
        processed_at TIMESTAMP NULL,
        error TEXT,
        event_data JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX webhook_processed_idx (processed),
        INDEX webhook_event_type_idx (event_type)
      )
    `);
    console.log("✓ Created stripe_webhook_events table");

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
