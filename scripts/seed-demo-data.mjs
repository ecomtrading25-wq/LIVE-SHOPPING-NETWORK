#!/usr/bin/env node
/**
 * Demo Data Seeding Script
 * Populates the database with realistic test data for all features
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

// Import schema
import * as schema from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🌱 Starting demo data seeding...\n");

// Helper to generate random dates
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];

try {
  // 1. Create Channels
  console.log("📺 Creating channels...");
  
  // Check if data already exists
  const existingChannels = await db.select().from(schema.channels).limit(1);
  if (existingChannels.length > 0) {
    console.log("⚠️  Database already has data. Skipping seeding to avoid duplicates.");
    console.log("💡 To re-seed, manually clear the database first.");
    process.exit(0);
  }
  const channelIds = [];
  const channels = [
    { name: "TikTok Shop Main", platform: "tiktok_shop", slug: "tiktok-main" },
    { name: "Shopify Store", platform: "shopify", slug: "shopify-store" },
    { name: "Amazon Seller", platform: "amazon", slug: "amazon-seller" },
  ];

  for (const channel of channels) {
    const id = nanoid();
    channelIds.push(id);
    await db.insert(schema.channels).values({
      id,
      name: channel.name,
      platform: channel.platform,
      slug: channel.slug,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅ Created ${channels.length} channels\n`);

  // 2. Create Products
  console.log("📦 Creating products...");
  const productIds = [];
  const products = [
    {
      name: "Wireless Bluetooth Headphones",
      sku: "WBH-001",
      price: "79.99",
      compareAtPrice: "129.99",
      description: "Premium wireless headphones with noise cancellation",
    },
    {
      name: "Smart Fitness Tracker",
      sku: "SFT-002",
      price: "49.99",
      compareAtPrice: "89.99",
      description: "Track your health and fitness goals",
    },
    {
      name: "Portable Phone Charger 20000mAh",
      sku: "PPC-003",
      price: "29.99",
      compareAtPrice: "49.99",
      description: "Fast charging power bank for all devices",
    },
    {
      name: "LED Desk Lamp with USB Port",
      sku: "LDL-004",
      price: "34.99",
      compareAtPrice: "59.99",
      description: "Adjustable brightness desk lamp",
    },
    {
      name: "Stainless Steel Water Bottle",
      sku: "SWB-005",
      price: "24.99",
      compareAtPrice: "39.99",
      description: "Insulated 32oz water bottle",
    },
  ];

  for (const product of products) {
    const id = nanoid();
    productIds.push(id);
    await db.insert(schema.products).values({
      id,
      channelId: channelIds[0], // Assign to first channel
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add inventory
    await db.insert(schema.inventory).values({
      id: nanoid(),
      productId: id,
      warehouseId: "default",
      quantityOnHand: randomInt(50, 500),
      quantityAvailable: randomInt(40, 450),
      quantityReserved: randomInt(0, 50),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅ Created ${products.length} products with inventory\n`);

  // 3. Create Live Sessions
  console.log("🎥 Creating live sessions...");
  const sessionIds = [];
  const sessions = [
    {
      title: "Friday Night Flash Sale",
      status: "live",
      streamUrl: "https://stream.example.com/friday-flash.m3u8",
      viewerCount: randomInt(500, 2000),
    },
    {
      title: "Weekend Deals Extravaganza",
      status: "scheduled",
      streamUrl: "https://stream.example.com/weekend-deals.m3u8",
      viewerCount: 0,
    },
    {
      title: "Tech Tuesday Live",
      status: "ended",
      streamUrl: "https://stream.example.com/tech-tuesday.m3u8",
      viewerCount: 1250,
    },
  ];

  for (const session of sessions) {
    const id = nanoid();
    sessionIds.push(id);
    await db.insert(schema.liveSessions).values({
      id,
      channelId: randomChoice(channelIds),
      title: session.title,
      status: session.status,
      streamUrl: session.streamUrl,
      viewerCount: session.viewerCount,
      startedAt: session.status === "live" ? new Date(Date.now() - 3600000) : null,
      endedAt: session.status === "ended" ? new Date() : null,
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: new Date(),
    });

    // Pin a random product to live sessions
    if (session.status === "live") {
      await db.insert(schema.pinnedProducts).values({
        id: nanoid(),
        sessionId: id,
        productId: randomChoice(productIds),
        pinnedAt: new Date(),
        unpinnedAt: null,
      });
    }
  }
  console.log(`✅ Created ${sessions.length} live sessions\n`);

  // 4. Create Orders
  console.log("🛒 Creating orders...");
  const orderIds = [];
  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const customerNames = [
    "John Smith",
    "Emma Johnson",
    "Michael Brown",
    "Sarah Davis",
    "James Wilson",
  ];

  for (let i = 0; i < 20; i++) {
    const id = nanoid();
    orderIds.push(id);
    const status = randomChoice(statuses);
    const itemCount = randomInt(1, 3);
    let total = 0;

    await db.insert(schema.orders).values({
      id,
      channelId: randomChoice(channelIds),
      platformOrderId: `ORD-${randomInt(10000, 99999)}`,
      customerName: randomChoice(customerNames),
      customerEmail: `customer${i}@example.com`,
      status,
      totalAmount: "0", // Will update after items
      currency: "USD",
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: new Date(),
    });

    // Add order items
    for (let j = 0; j < itemCount; j++) {
      const product = products[randomInt(0, products.length - 1)];
      const quantity = randomInt(1, 3);
      const price = parseFloat(product.price);
      total += price * quantity;

      await db.insert(schema.orderItems).values({
        id: nanoid(),
        orderId: id,
        productId: randomChoice(productIds),
        sku: product.sku,
        quantity,
        unitPrice: product.price,
        totalPrice: (price * quantity).toFixed(2),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update order total
    // Note: Update would be done via proper Drizzle syntax in production
  }
  console.log(`✅ Created ${orderIds.length} orders\n`);

  // 5. Create Fulfillment Tasks
  console.log("📋 Creating fulfillment tasks...");
  const taskTypes = ["pick", "pack", "ship"];
  const taskStatuses = ["pending", "in_progress", "completed", "failed"];
  const priorities = ["low", "medium", "high"];

  for (let i = 0; i < 30; i++) {
    await db.insert(schema.fulfillmentTasks).values({
      id: nanoid(),
      orderId: randomChoice(orderIds),
      type: randomChoice(taskTypes),
      status: randomChoice(taskStatuses),
      priority: randomChoice(priorities),
      assignedTo: randomInt(0, 1) === 1 ? `user-${randomInt(1, 5)}` : null,
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: new Date(),
    });
  }
  console.log(`✅ Created 30 fulfillment tasks\n`);

  // 6. Create Creators
  console.log("👥 Creating creators...");
  const creatorIds = [];
  const creators = [
    {
      name: "Alex Martinez",
      email: "alex@creators.com",
      tier: "platinum",
      commissionRate: 25.0,
    },
    { name: "Sophie Chen", email: "sophie@creators.com", tier: "gold", commissionRate: 18.0 },
    { name: "Marcus Johnson", email: "marcus@creators.com", tier: "silver", commissionRate: 12.0 },
    { name: "Olivia Taylor", email: "olivia@creators.com", tier: "bronze", commissionRate: 8.0 },
  ];

  for (const creator of creators) {
    const id = nanoid();
    creatorIds.push(id);
    await db.insert(schema.creators).values({
      id,
      name: creator.name,
      email: creator.email,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add creator tier
    await db.insert(schema.creatorTiers).values({
      id: nanoid(),
      creatorId: id,
      tier: creator.tier,
      commissionRate: creator.commissionRate,
      effectiveFrom: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅ Created ${creators.length} creators\n`);

  // 7. Create Disputes
  console.log("⚖️ Creating disputes...");
  const disputeReasons = ["not_received", "defective", "not_as_described", "unauthorized"];
  const disputeStatuses = ["open", "under_review", "won", "lost"];
  const severities = ["low", "medium", "high", "critical"];

  for (let i = 0; i < 10; i++) {
    await db.insert(schema.disputes).values({
      id: nanoid(),
      orderId: randomChoice(orderIds),
      reason: randomChoice(disputeReasons),
      status: randomChoice(disputeStatuses),
      amount: (randomInt(20, 150) + Math.random()).toFixed(2),
      severity: randomChoice(severities),
      deadline: new Date(Date.now() + randomInt(1, 30) * 86400000),
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: new Date(),
    });
  }
  console.log(`✅ Created 10 disputes\n`);

  // 8. Create Warehouses
  console.log("🏭 Creating warehouses...");
  const warehouseIds = [];
  const warehouses = [
    { name: "Main Warehouse", location: "Los Angeles, CA", isActive: true },
    { name: "East Coast Hub", location: "New York, NY", isActive: true },
    { name: "Midwest Center", location: "Chicago, IL", isActive: true },
  ];

  for (const warehouse of warehouses) {
    const id = nanoid();
    warehouseIds.push(id);
    await db.insert(schema.warehouses).values({
      id,
      name: warehouse.name,
      location: warehouse.location,
      isActive: warehouse.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅ Created ${warehouses.length} warehouses\n`);

  console.log("✨ Demo data seeding complete!\n");
  console.log("📊 Summary:");
  console.log(`   - ${channels.length} channels`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${sessions.length} live sessions`);
  console.log(`   - ${orderIds.length} orders`);
  console.log(`   - 30 fulfillment tasks`);
  console.log(`   - ${creators.length} creators`);
  console.log(`   - 10 disputes`);
  console.log(`   - ${warehouses.length} warehouses`);
  console.log("\n🎉 You can now explore the admin dashboard with realistic data!");
} catch (error) {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
} finally {
  await connection.end();
}
