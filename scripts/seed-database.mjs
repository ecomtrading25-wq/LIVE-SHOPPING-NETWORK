import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Starting database seeding...");

// Create default channel first
console.log("📺 Creating default channel...");
await db.execute(`
  INSERT INTO channels (id, slug, name, status)
  VALUES (
    'default',
    'default',
    'Default Channel',
    'active'
  )
  ON DUPLICATE KEY UPDATE id=id
`);
console.log("✅ Default channel created");

// Sample products
const products = [
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
    // tags: JSON.stringify(["electronics", "audio", "wireless"]),
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
    // tags: JSON.stringify(["electronics", "wearables", "fitness"]),
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
    // tags: JSON.stringify(["accessories", "office", "ergonomic"]),
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
    // tags: JSON.stringify(["electronics", "gaming", "peripherals"]),
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
    // tags: JSON.stringify(["electronics", "video", "streaming"]),
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
    // tags: JSON.stringify(["electronics", "accessories", "charging"]),
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
    // tags: JSON.stringify(["electronics", "audio", "portable"]),
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
    // tags: JSON.stringify(["electronics", "gaming", "peripherals"]),
  },
];

console.log("📦 Seeding products...");
await db.execute(`
  INSERT INTO products (id, channel_id, sku, name, description, price, compare_at_price, cost, status)
  VALUES ${products.map(p => `(
    '${p.id}',
    '${p.channelId}',
    '${p.sku}',
    '${p.name}',
    '${p.description}',
    ${p.price},
    ${p.compareAtPrice},
    ${p.cost},
    '${p.status}'
  )`).join(',')}
  ON DUPLICATE KEY UPDATE id=id
`);

console.log(`✅ Seeded ${products.length} products`);

// Sample warehouse - MUST be created before inventory
const warehouseId = nanoid();
console.log("🏭 Seeding warehouse...");
await db.execute(`
  INSERT INTO warehouses (id, code, name, address, status)
  VALUES (
    '${warehouseId}',
    'WH-MAIN',
    'Main Warehouse',
    '123 Commerce St, San Francisco, CA 94102',
    'active'
  )
  ON DUPLICATE KEY UPDATE id=id
`);
console.log("✅ Warehouse created");

// Sample inventory for each product
console.log("📊 Seeding inventory...");
for (const product of products) {
  const inventoryId = nanoid();
  const onHand = Math.floor(Math.random() * 100) + 50;
  const available = Math.floor(Math.random() * 100) + 50;
  await db.execute(`
    INSERT INTO inventory (id, warehouse_id, product_id, on_hand, available, reserved)
    VALUES (
      '${inventoryId}',
      '${warehouseId}',
      '${product.id}',
      ${onHand},
      ${available},
      0
    )
    ON DUPLICATE KEY UPDATE id=id
  `);
}

console.log(`✅ Seeded inventory for ${products.length} products`);

// Sample live session
const liveSessionId = nanoid();
await db.execute(`
  INSERT INTO live_sessions (id, channel_id, title, description, status, scheduled_at, started_at)
  VALUES (
    '${liveSessionId}',
    'default',
    'Tech Tuesday - Amazing Deals on Electronics',
    'Join us for exclusive deals on the latest tech gadgets!',
    'scheduled',
    DATE_ADD(NOW(), INTERVAL 2 HOUR),
    NULL
  )
  ON DUPLICATE KEY UPDATE id=id
`);

console.log("📺 Seeded live session");

// Pin some products to the live session
console.log("📌 Pinning products to live session...");
for (let i = 0; i < 3; i++) {
  await db.execute(`
    INSERT INTO pinned_products (id, session_id, product_id, pinned_at, display_order)
    VALUES (
      '${nanoid()}',
      '${liveSessionId}',
      '${products[i].id}',
      NOW(),
      ${i}
    )
    ON DUPLICATE KEY UPDATE id=id
  `);
}

console.log("✅ Pinned 3 products to live session");

// Sample suppliers
const suppliers = [
  {
    id: nanoid(),
    code: "SUP-001",
    name: "TechSupply Co.",
    contactName: "John Smith",
    email: "john@techsupply.com",
    phone: "+1-555-0101",
    address: "456 Supplier Ave, San Jose, CA 95110",
    status: "active",
  },
  {
    id: nanoid(),
    code: "SUP-002",
    name: "Gadget Wholesale",
    contactName: "Sarah Johnson",
    email: "sarah@gadgetwholesale.com",
    phone: "+1-555-0202",
    address: "789 Wholesale Blvd, Oakland, CA 94601",
    status: "active",
  },
];

console.log("🚚 Seeding suppliers...");
for (const supplier of suppliers) {
  await db.execute(`
    INSERT INTO suppliers (id, code, name, contact_name, email, phone, address, status)
    VALUES (
      '${supplier.id}',
      '${supplier.code}',
      '${supplier.name}',
      '${supplier.contactName}',
      '${supplier.email}',
      '${supplier.phone}',
      '${supplier.address}',
      '${supplier.status}'
    )
    ON DUPLICATE KEY UPDATE id=id
  `);
}

console.log(`✅ Seeded ${suppliers.length} suppliers`);

// Sample email campaigns
const campaigns = [
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

console.log("📧 Seeding email campaigns...");
for (const campaign of campaigns) {
  await db.execute(`
    INSERT INTO email_campaigns (
      id, name, type, subject, content, status,
      sent_count, opened_count, clicked_count, revenue
    )
    VALUES (
      '${campaign.id}',
      '${campaign.name}',
      '${campaign.type}',
      '${campaign.subject}',
      '${campaign.content}',
      '${campaign.status}',
      ${campaign.sentCount},
      ${campaign.openedCount},
      ${campaign.clickedCount},
      ${campaign.revenue}
    )
    ON DUPLICATE KEY UPDATE id=id
  `);
}

console.log(`✅ Seeded ${campaigns.length} email campaigns`);

await connection.end();

console.log("🎉 Database seeding completed successfully!");
console.log("\n📊 Summary:");
console.log(`  - ${products.length} products`);
console.log(`  - 1 warehouse`);
console.log(`  - ${products.length} inventory records`);
console.log(`  - 1 live session`);
console.log(`  - 3 pinned products`);
console.log(`  - ${suppliers.length} suppliers`);
console.log(`  - ${campaigns.length} email campaigns`);
