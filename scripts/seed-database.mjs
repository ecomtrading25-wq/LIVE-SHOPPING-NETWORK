import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";
import {
  channels,
  products,
  warehouses,
  inventory,
  liveSessions,
  pinnedProducts,
  suppliers,
  emailCampaigns,
} from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Starting database seeding with Drizzle ORM...");

try {
  // 1. Create default channel first
  console.log("📺 Creating default channel...");
  await db.insert(channels).values({
    id: "default",
    slug: "default",
    name: "Default Channel",
    status: "active",
  }).onDuplicateKeyUpdate({ set: { id: "default" } });
  console.log("✅ Default channel created");

  // 2. Create sample products
  console.log("📦 Seeding products...");
  const productData = [
    {
      id: nanoid(),
      channelId: "default",
      sku: "WH-001",
      name: "Premium Wireless Headphones",
      description: "High-quality wireless headphones with active noise cancellation and 30-hour battery life.",
      price: "299.99",
      compareAtPrice: "399.99",
      cost: "150.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "SW-001",
      name: "Smart Watch Pro",
      description: "Advanced smartwatch with health tracking, GPS, and 7-day battery life.",
      price: "449.99",
      compareAtPrice: "549.99",
      cost: "220.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "LS-001",
      name: "Ergonomic Laptop Stand",
      description: "Adjustable aluminum laptop stand for better posture and cooling.",
      price: "79.99",
      compareAtPrice: "99.99",
      cost: "35.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "KB-001",
      name: "Mechanical Keyboard RGB",
      description: "Premium mechanical keyboard with customizable RGB lighting and Cherry MX switches.",
      price: "159.99",
      compareAtPrice: "199.99",
      cost: "80.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "WC-001",
      name: "4K Webcam Pro",
      description: "Professional 4K webcam with auto-focus and built-in microphone.",
      price: "199.99",
      compareAtPrice: "249.99",
      cost: "95.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "PB-001",
      name: "Portable Power Bank 20000mAh",
      description: "High-capacity power bank with fast charging and dual USB ports.",
      price: "49.99",
      compareAtPrice: "69.99",
      cost: "22.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "BT-001",
      name: "Bluetooth Speaker Waterproof",
      description: "Portable waterproof Bluetooth speaker with 12-hour battery life.",
      price: "89.99",
      compareAtPrice: "119.99",
      cost: "40.00",
      status: "active",
    },
    {
      id: nanoid(),
      channelId: "default",
      sku: "MM-001",
      name: "Wireless Gaming Mouse",
      description: "High-precision wireless gaming mouse with customizable buttons.",
      price: "79.99",
      compareAtPrice: "99.99",
      cost: "35.00",
      status: "active",
    },
  ];

  await db.insert(products).values(productData).onDuplicateKeyUpdate({ set: { id: productData[0].id } });
  console.log(`✅ Seeded ${productData.length} products`);

  // 3. Create warehouse
  console.log("🏭 Seeding warehouse...");
  const warehouseId = nanoid();
  await db.insert(warehouses).values({
    id: warehouseId,
    code: "WH-MAIN",
    name: "Main Warehouse",
    address: "123 Commerce St, San Francisco, CA 94102",
    status: "active",
  }).onDuplicateKeyUpdate({ set: { id: warehouseId } });
  console.log("✅ Warehouse created");

  // 4. Create inventory for each product
  console.log("📊 Seeding inventory...");
  const inventoryData = productData.map(product => ({
    id: nanoid(),
    warehouseId: warehouseId,
    productId: product.id,
    onHand: Math.floor(Math.random() * 100) + 50,
    available: Math.floor(Math.random() * 100) + 50,
    reserved: 0,
  }));

  await db.insert(inventory).values(inventoryData).onDuplicateKeyUpdate({ set: { id: inventoryData[0].id } });
  console.log(`✅ Seeded inventory for ${inventoryData.length} products`);

  // 5. Create live session
  console.log("📺 Seeding live session...");
  const liveSessionId = nanoid();
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 2);

  await db.insert(liveSessions).values({
    id: liveSessionId,
    channelId: "default",
    title: "Tech Tuesday - Amazing Deals on Electronics",
    description: "Join us for exclusive deals on the latest tech gadgets!",
    status: "scheduled",
    scheduledAt: scheduledAt,
  }).onDuplicateKeyUpdate({ set: { id: liveSessionId } });
  console.log("✅ Live session created");

  // 6. Pin products to live session
  console.log("📌 Pinning products to live session...");
  const pinnedProductsData = productData.slice(0, 3).map((product, index) => ({
    id: nanoid(),
    sessionId: liveSessionId,
    productId: product.id,
    displayOrder: index,
  }));

  await db.insert(pinnedProducts).values(pinnedProductsData).onDuplicateKeyUpdate({ set: { id: pinnedProductsData[0].id } });
  console.log(`✅ Pinned ${pinnedProductsData.length} products to live session`);

  // 7. Create suppliers
  console.log("🚚 Seeding suppliers...");
  const supplierData = [
    {
      id: nanoid(),
      name: "TechSupply Co.",
      contactEmail: "john@techsupply.com",
      contactPhone: "+1-555-0101",
      address: "456 Supplier Ave, San Jose, CA 95110",
      status: "active",
    },
    {
      id: nanoid(),
      name: "Gadget Wholesale",
      contactEmail: "sarah@gadgetwholesale.com",
      contactPhone: "+1-555-0202",
      address: "789 Wholesale Blvd, Oakland, CA 94601",
      status: "active",
    },
  ];

  await db.insert(suppliers).values(supplierData).onDuplicateKeyUpdate({ set: { id: supplierData[0].id } });
  console.log(`✅ Seeded ${supplierData.length} suppliers`);

  // 8. Create email campaigns
  console.log("📧 Seeding email campaigns...");
  const campaignData = [
    {
      id: nanoid(),
      name: "Abandoned Cart Recovery",
      type: "abandoned_cart",
      subject: "You left something behind! Complete your order now",
      content: "Hi there! We noticed you left some items in your cart. Complete your purchase now and get 10% off!",
      status: "active",
      sentCount: 1234,
      openedCount: 567,
      clickedCount: 234,
      revenue: "12450.00",
    },
    {
      id: nanoid(),
      name: "Win-Back Campaign",
      type: "win_back",
      subject: "We miss you! Here's 20% off your next order",
      content: "It's been a while! Come back and enjoy 20% off your next purchase.",
      status: "active",
      sentCount: 890,
      openedCount: 345,
      clickedCount: 123,
      revenue: "8900.00",
    },
  ];

  await db.insert(emailCampaigns).values(campaignData).onDuplicateKeyUpdate({ set: { id: campaignData[0].id } });
  console.log(`✅ Seeded ${campaignData.length} email campaigns`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - 1 channel`);
  console.log(`  - ${productData.length} products`);
  console.log(`  - 1 warehouse`);
  console.log(`  - ${inventoryData.length} inventory records`);
  console.log(`  - 1 live session`);
  console.log(`  - ${pinnedProductsData.length} pinned products`);
  console.log(`  - ${supplierData.length} suppliers`);
  console.log(`  - ${campaignData.length} email campaigns`);

} catch (error) {
  console.error("\n❌ Error seeding database:", error);
  process.exit(1);
} finally {
  await connection.end();
}
