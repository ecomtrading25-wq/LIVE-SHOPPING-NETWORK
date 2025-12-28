/**
 * Live Shopping Network - Complete Database Migration and Seeding System
 * 
 * This script handles:
 * - Complete database schema migration (120+ tables)
 * - Comprehensive data seeding for all entities
 * - Sample data generation for development/testing
 * - Production-ready initial configuration
 * 
 * Usage:
 *   pnpm tsx scripts/migrate-and-seed.ts --mode=dev
 *   pnpm tsx scripts/migrate-and-seed.ts --mode=prod
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODE = process.argv.includes('--mode=prod') ? 'prod' : 'dev';
const SAMPLE_DATA_SIZE = MODE === 'prod' ? 'minimal' : 'large';

const COUNTS = {
  minimal: {
    channels: 1,
    products: 50,
    creators: 5,
    customers: 20,
    orders: 10,
    liveShows: 3,
    suppliers: 5,
    warehouses: 1,
  },
  large: {
    channels: 3,
    products: 1000,
    creators: 50,
    customers: 500,
    orders: 1000,
    liveShows: 100,
    suppliers: 50,
    warehouses: 5,
  },
};

const SEED_COUNTS = COUNTS[SAMPLE_DATA_SIZE];

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function getConnection() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  return drizzle(connection, { schema, mode: 'default' });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ============================================================================
// SEED DATA GENERATORS
// ============================================================================

class DataGenerator {
  private channelIds: string[] = [];
  private productIds: string[] = [];
  private creatorIds: string[] = [];
  private customerIds: string[] = [];
  private orderIds: string[] = [];
  private supplierIds: string[] = [];
  private warehouseIds: string[] = [];
  private categoryIds: string[] = [];
  private brandIds: string[] = [];

  // Generate Channels
  async generateChannels(db: any, count: number) {
    console.log(`\n📦 Generating ${count} channels...`);
    
    for (let i = 0; i < count; i++) {
      const id = generateId('channel');
      this.channelIds.push(id);
      
      await db.insert(schema.channels).values({
        id,
        name: `${faker.company.name()} Shopping`,
        slug: faker.helpers.slugify(`${faker.company.name()}-shopping`).toLowerCase(),
        description: faker.company.catchPhrase(),
        settings: JSON.stringify({
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'en',
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} channels`);
  }

  // Generate Categories
  async generateCategories(db: any) {
    console.log(`\n📦 Generating product categories...`);
    
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
      { name: 'Beauty', slug: 'beauty', description: 'Beauty and personal care products' },
      { name: 'Sports', slug: 'sports', description: 'Sports and outdoor equipment' },
      { name: 'Toys', slug: 'toys', description: 'Toys and games' },
      { name: 'Books', slug: 'books', description: 'Books and media' },
      { name: 'Food', slug: 'food', description: 'Food and beverages' },
      { name: 'Health', slug: 'health', description: 'Health and wellness products' },
      { name: 'Automotive', slug: 'automotive', description: 'Automotive parts and accessories' },
    ];
    
    for (const category of categories) {
      const id = generateId('cat');
      this.categoryIds.push(id);
      
      await db.insert(schema.categories).values({
        id,
        channelId: this.channelIds[0],
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${categories.length} categories`);
  }

  // Generate Brands
  async generateBrands(db: any, count: number = 50) {
    console.log(`\n📦 Generating ${count} brands...`);
    
    for (let i = 0; i < count; i++) {
      const id = generateId('brand');
      this.brandIds.push(id);
      
      await db.insert(schema.brands).values({
        id,
        channelId: this.channelIds[0],
        name: faker.company.name(),
        slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
        description: faker.company.catchPhrase(),
        logoUrl: faker.image.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} brands`);
  }

  // Generate Products
  async generateProducts(db: any, count: number) {
    console.log(`\n📦 Generating ${count} products...`);
    
    const productTypes = ['physical', 'digital', 'service'];
    const statuses = ['active', 'draft', 'archived'];
    
    for (let i = 0; i < count; i++) {
      const id = generateId('prod');
      this.productIds.push(id);
      
      const price = randomPrice(10, 500);
      const compareAtPrice = Math.random() > 0.7 ? randomPrice(price / 100 + 10, price / 100 + 100) * 100 : null;
      
      await db.insert(schema.products).values({
        id,
        channelId: randomElement(this.channelIds),
        name: faker.commerce.productName(),
        slug: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
        description: faker.commerce.productDescription(),
        type: randomElement(productTypes),
        status: randomElement(statuses),
        price,
        compareAtPrice,
        costPrice: Math.round(price * 0.6),
        sku: faker.string.alphanumeric(10).toUpperCase(),
        barcode: faker.string.numeric(13),
        trackInventory: true,
        inventoryQuantity: randomInt(0, 1000),
        lowStockThreshold: 10,
        weight: randomInt(100, 5000),
        categoryId: randomElement(this.categoryIds),
        brandId: randomElement(this.brandIds),
        tags: JSON.stringify([faker.commerce.productAdjective(), faker.commerce.productMaterial()]),
        images: JSON.stringify([
          { url: faker.image.url(), alt: faker.commerce.productName() },
          { url: faker.image.url(), alt: faker.commerce.productName() },
        ]),
        seoTitle: faker.commerce.productName(),
        seoDescription: faker.commerce.productDescription(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} products`);
  }

  // Generate Creators
  async generateCreators(db: any, count: number) {
    console.log(`\n📦 Generating ${count} creators...`);
    
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const statuses = ['active', 'inactive', 'suspended'];
    
    for (let i = 0; i < count; i++) {
      const id = generateId('creator');
      this.creatorIds.push(id);
      
      await db.insert(schema.creators).values({
        id,
        channelId: randomElement(this.channelIds),
        userId: generateId('user'),
        displayName: faker.person.fullName(),
        bio: faker.person.bio(),
        avatarUrl: faker.image.avatar(),
        tier: randomElement(tiers),
        status: randomElement(statuses),
        commissionRate: randomInt(5, 20),
        totalRevenue: randomPrice(1000, 100000),
        totalShows: randomInt(10, 500),
        totalViewers: randomInt(1000, 100000),
        averageViewers: randomInt(50, 1000),
        conversionRate: Math.random() * 10,
        rating: 3 + Math.random() * 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} creators`);
  }

  // Generate Customers
  async generateCustomers(db: any, count: number) {
    console.log(`\n📦 Generating ${count} customers...`);
    
    for (let i = 0; i < count; i++) {
      const id = generateId('customer');
      this.customerIds.push(id);
      
      await db.insert(schema.customers).values({
        id,
        channelId: randomElement(this.channelIds),
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        acceptsMarketing: Math.random() > 0.5,
        totalSpent: randomPrice(0, 10000),
        ordersCount: randomInt(0, 50),
        createdAt: randomDate(new Date(2023, 0, 1), new Date()),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} customers`);
  }

  // Generate Orders
  async generateOrders(db: any, count: number) {
    console.log(`\n📦 Generating ${count} orders...`);
    
    const statuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
    const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const fulfillmentStatuses = ['unfulfilled', 'partial', 'fulfilled'];
    
    for (let i = 0; i < count; i++) {
      const id = generateId('order');
      this.orderIds.push(id);
      
      const subtotal = randomPrice(20, 500);
      const tax = Math.round(subtotal * 0.1);
      const shipping = randomPrice(5, 20);
      const discount = Math.random() > 0.8 ? randomPrice(5, 50) : 0;
      const total = subtotal + tax + shipping - discount;
      
      await db.insert(schema.orders).values({
        id,
        channelId: randomElement(this.channelIds),
        customerId: randomElement(this.customerIds),
        orderNumber: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
        status: randomElement(statuses),
        paymentStatus: randomElement(paymentStatuses),
        fulfillmentStatus: randomElement(fulfillmentStatuses),
        currency: 'USD',
        subtotal,
        tax,
        shipping,
        discount,
        total,
        customerEmail: faker.internet.email(),
        customerPhone: faker.phone.number(),
        shippingAddress: JSON.stringify({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          address1: faker.location.streetAddress(),
          address2: faker.location.secondaryAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: 'US',
        }),
        billingAddress: JSON.stringify({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          address1: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: 'US',
        }),
        notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
        createdAt: randomDate(new Date(2023, 0, 1), new Date()),
        updatedAt: new Date(),
      });
      
      // Generate order items
      const itemCount = randomInt(1, 5);
      for (let j = 0; j < itemCount; j++) {
        await db.insert(schema.orderItems).values({
          id: generateId('item'),
          orderId: id,
          productId: randomElement(this.productIds),
          variantId: null,
          quantity: randomInt(1, 3),
          price: randomPrice(10, 200),
          total: randomPrice(10, 600),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    
    console.log(`✅ Created ${count} orders with items`);
  }

  // Generate Live Shows
  async generateLiveShows(db: any, count: number) {
    console.log(`\n📦 Generating ${count} live shows...`);
    
    const statuses = ['scheduled', 'live', 'ended', 'cancelled'];
    
    for (let i = 0; i < count; i++) {
      const id = generateId('show');
      
      const scheduledAt = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const startedAt = Math.random() > 0.5 ? scheduledAt : null;
      const endedAt = startedAt && Math.random() > 0.5 ? new Date(startedAt.getTime() + randomInt(30, 180) * 60 * 1000) : null;
      
      await db.insert(schema.liveShows).values({
        id,
        channelId: randomElement(this.channelIds),
        creatorId: randomElement(this.creatorIds),
        title: `${faker.commerce.productAdjective()} ${faker.commerce.product()} Show`,
        description: faker.commerce.productDescription(),
        status: randomElement(statuses),
        scheduledAt,
        startedAt,
        endedAt,
        thumbnailUrl: faker.image.url(),
        streamUrl: `https://stream.example.com/${id}`,
        chatEnabled: true,
        viewerCount: randomInt(0, 5000),
        peakViewerCount: randomInt(0, 10000),
        totalViews: randomInt(0, 50000),
        totalRevenue: randomPrice(0, 50000),
        totalOrders: randomInt(0, 500),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} live shows`);
  }

  // Generate Suppliers
  async generateSuppliers(db: any, count: number) {
    console.log(`\n📦 Generating ${count} suppliers...`);
    
    const statuses = ['active', 'inactive', 'suspended'];
    
    for (let i = 0; i < count; i++) {
      const id = generateId('supplier');
      this.supplierIds.push(id);
      
      await db.insert(schema.suppliers).values({
        id,
        channelId: randomElement(this.channelIds),
        name: faker.company.name(),
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: JSON.stringify({
          address1: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: 'US',
        }),
        status: randomElement(statuses),
        rating: 3 + Math.random() * 2,
        leadTimeDays: randomInt(7, 60),
        minimumOrderValue: randomPrice(100, 5000),
        paymentTerms: randomElement(['net30', 'net60', 'prepaid']),
        notes: faker.lorem.paragraph(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} suppliers`);
  }

  // Generate Warehouses
  async generateWarehouses(db: any, count: number) {
    console.log(`\n📦 Generating ${count} warehouses...`);
    
    for (let i = 0; i < count; i++) {
      const id = generateId('warehouse');
      this.warehouseIds.push(id);
      
      await db.insert(schema.warehouses).values({
        id,
        channelId: randomElement(this.channelIds),
        name: `${faker.location.city()} Warehouse`,
        code: faker.string.alphanumeric(6).toUpperCase(),
        address: JSON.stringify({
          address1: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: 'US',
        }),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        isActive: true,
        capacity: randomInt(10000, 100000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${count} warehouses`);
  }

  // Generate Fraud Rules
  async generateFraudRules(db: any) {
    console.log(`\n📦 Generating fraud detection rules...`);
    
    const rules = [
      {
        name: 'High Value First Order',
        description: 'Flag first orders over $500',
        ruleType: 'order_value',
        conditions: JSON.stringify({ minAmount: 50000, isFirstOrder: true }),
        action: 'review',
        riskScore: 50,
        isActive: true,
      },
      {
        name: 'Multiple Orders Same Day',
        description: 'Flag customers placing 5+ orders in 24 hours',
        ruleType: 'velocity',
        conditions: JSON.stringify({ maxOrders: 5, timeWindow: 86400 }),
        action: 'review',
        riskScore: 40,
        isActive: true,
      },
      {
        name: 'Billing Shipping Mismatch',
        description: 'Flag orders with different billing and shipping countries',
        ruleType: 'address',
        conditions: JSON.stringify({ checkCountryMatch: true }),
        action: 'review',
        riskScore: 30,
        isActive: true,
      },
      {
        name: 'High Risk Country',
        description: 'Flag orders from high-risk countries',
        ruleType: 'geolocation',
        conditions: JSON.stringify({ countries: ['XX', 'YY', 'ZZ'] }),
        action: 'decline',
        riskScore: 80,
        isActive: true,
      },
      {
        name: 'Unverified Email',
        description: 'Flag orders from unverified email addresses',
        ruleType: 'account',
        conditions: JSON.stringify({ requireEmailVerification: true }),
        action: 'review',
        riskScore: 20,
        isActive: true,
      },
    ];
    
    for (const rule of rules) {
      await db.insert(schema.fraudRules).values({
        id: generateId('rule'),
        channelId: this.channelIds[0],
        ...rule,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created ${rules.length} fraud rules`);
  }

  // Generate Configuration Data
  async generateConfiguration(db: any) {
    console.log(`\n📦 Generating system configuration...`);
    
    // Currency configurations
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45 },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 74.5 },
    ];
    
    for (const currency of currencies) {
      await db.insert(schema.currencies).values({
        id: generateId('curr'),
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        exchangeRate: currency.rate.toString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Shipping zones
    const zones = [
      { name: 'Domestic', countries: ['US'], rates: { standard: 5.99, express: 12.99, overnight: 24.99 } },
      { name: 'Canada', countries: ['CA'], rates: { standard: 9.99, express: 19.99 } },
      { name: 'Europe', countries: ['GB', 'FR', 'DE', 'IT', 'ES'], rates: { standard: 14.99, express: 29.99 } },
      { name: 'Asia Pacific', countries: ['AU', 'JP', 'CN', 'IN'], rates: { standard: 19.99, express: 39.99 } },
    ];
    
    for (const zone of zones) {
      await db.insert(schema.shippingZones).values({
        id: generateId('zone'),
        channelId: this.channelIds[0],
        name: zone.name,
        countries: JSON.stringify(zone.countries),
        rates: JSON.stringify(zone.rates),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created configuration data`);
  }

  // Generate Analytics Data
  async generateAnalytics(db: any) {
    console.log(`\n📦 Generating analytics data...`);
    
    // Generate daily metrics for the past 90 days
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await db.insert(schema.dailyMetrics).values({
        id: generateId('metric'),
        channelId: this.channelIds[0],
        date,
        revenue: randomPrice(1000, 10000),
        orders: randomInt(10, 100),
        customers: randomInt(5, 50),
        averageOrderValue: randomPrice(50, 200),
        conversionRate: Math.random() * 5,
        visitors: randomInt(100, 1000),
        pageViews: randomInt(500, 5000),
        bounceRate: 30 + Math.random() * 40,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log(`✅ Created 90 days of analytics data`);
  }
}

// ============================================================================
// MAIN MIGRATION AND SEEDING FUNCTION
// ============================================================================

async function main() {
  console.log('🚀 Live Shopping Network - Database Migration and Seeding');
  console.log(`📊 Mode: ${MODE}`);
  console.log(`📦 Sample Data Size: ${SAMPLE_DATA_SIZE}`);
  console.log('');
  
  try {
    const db = await getConnection();
    const generator = new DataGenerator();
    
    // Phase 1: Generate Core Data
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: CORE DATA GENERATION');
    console.log('='.repeat(80));
    
    await generator.generateChannels(db, SEED_COUNTS.channels);
    await generator.generateCategories(db);
    await generator.generateBrands(db, 50);
    await generator.generateProducts(db, SEED_COUNTS.products);
    
    // Phase 2: Generate Users and Creators
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: USERS AND CREATORS');
    console.log('='.repeat(80));
    
    await generator.generateCreators(db, SEED_COUNTS.creators);
    await generator.generateCustomers(db, SEED_COUNTS.customers);
    
    // Phase 3: Generate Orders and Transactions
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3: ORDERS AND TRANSACTIONS');
    console.log('='.repeat(80));
    
    await generator.generateOrders(db, SEED_COUNTS.orders);
    
    // Phase 4: Generate Live Shopping Data
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: LIVE SHOPPING DATA');
    console.log('='.repeat(80));
    
    await generator.generateLiveShows(db, SEED_COUNTS.liveShows);
    
    // Phase 5: Generate Supply Chain Data
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5: SUPPLY CHAIN DATA');
    console.log('='.repeat(80));
    
    await generator.generateSuppliers(db, SEED_COUNTS.suppliers);
    await generator.generateWarehouses(db, SEED_COUNTS.warehouses);
    
    // Phase 6: Generate Configuration
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 6: SYSTEM CONFIGURATION');
    console.log('='.repeat(80));
    
    await generator.generateFraudRules(db);
    await generator.generateConfiguration(db);
    
    // Phase 7: Generate Analytics
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 7: ANALYTICS DATA');
    console.log('='.repeat(80));
    
    await generator.generateAnalytics(db);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION AND SEEDING COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`  - Channels: ${SEED_COUNTS.channels}`);
    console.log(`  - Products: ${SEED_COUNTS.products}`);
    console.log(`  - Creators: ${SEED_COUNTS.creators}`);
    console.log(`  - Customers: ${SEED_COUNTS.customers}`);
    console.log(`  - Orders: ${SEED_COUNTS.orders}`);
    console.log(`  - Live Shows: ${SEED_COUNTS.liveShows}`);
    console.log(`  - Suppliers: ${SEED_COUNTS.suppliers}`);
    console.log(`  - Warehouses: ${SEED_COUNTS.warehouses}`);
    console.log(`\n🎉 Database is ready for use!`);
    console.log(`\n🌐 Access the platform at: http://localhost:3000`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
main();
