#!/usr/bin/env node
/**
 * Massive Data Seeding Script
 * Seeds 8,000+ realistic records for live shopping network
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';
import { faker } from '@faker-js/faker';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🚀 Starting massive data seed...\n');

// Product categories for live shopping
const CATEGORIES = [
  'Electronics', 'Fashion', 'Beauty', 'Home & Garden', 'Sports & Outdoors',
  'Toys & Games', 'Books', 'Health & Wellness', 'Jewelry', 'Pet Supplies'
];

const PRODUCT_NAMES = {
  Electronics: ['Wireless Headphones', 'Smart Watch', 'Bluetooth Speaker', 'Phone Case', 'Tablet Stand', 'USB Cable', 'Power Bank', 'Screen Protector', 'Webcam', 'Keyboard'],
  Fashion: ['Designer Jeans', 'Leather Jacket', 'Sneakers', 'Sunglasses', 'Handbag', 'Scarf', 'Belt', 'Watch', 'Dress', 'T-Shirt'],
  Beauty: ['Face Cream', 'Lipstick', 'Perfume', 'Hair Dryer', 'Makeup Brush Set', 'Nail Polish', 'Shampoo', 'Body Lotion', 'Face Mask', 'Eyeliner'],
  'Home & Garden': ['Coffee Maker', 'Throw Pillow', 'Wall Art', 'Plant Pot', 'Candle Set', 'Kitchen Knife', 'Bed Sheets', 'Lamp', 'Rug', 'Storage Box'],
  'Sports & Outdoors': ['Yoga Mat', 'Dumbbell Set', 'Water Bottle', 'Running Shoes', 'Fitness Tracker', 'Tent', 'Backpack', 'Bike Helmet', 'Jump Rope', 'Resistance Bands'],
  'Toys & Games': ['Board Game', 'Action Figure', 'Puzzle', 'Building Blocks', 'Doll', 'RC Car', 'Card Game', 'Stuffed Animal', 'Art Set', 'LEGO Set'],
  Books: ['Mystery Novel', 'Cookbook', 'Self-Help Book', 'Biography', 'Science Fiction', 'Romance Novel', 'Business Book', 'Travel Guide', 'Poetry Collection', 'Comic Book'],
  'Health & Wellness': ['Vitamins', 'Protein Powder', 'Essential Oils', 'Massage Gun', 'Blood Pressure Monitor', 'Thermometer', 'First Aid Kit', 'Heating Pad', 'Foam Roller', 'Meditation Cushion'],
  Jewelry: ['Diamond Ring', 'Gold Necklace', 'Silver Bracelet', 'Pearl Earrings', 'Gemstone Pendant', 'Charm Bracelet', 'Cufflinks', 'Anklet', 'Brooch', 'Engagement Ring'],
  'Pet Supplies': ['Dog Food', 'Cat Toy', 'Pet Bed', 'Leash', 'Pet Carrier', 'Aquarium', 'Bird Cage', 'Grooming Kit', 'Pet Shampoo', 'Scratching Post']
};

// Generate 100+ products
async function seedProducts() {
  console.log('📦 Seeding 100 products...');
  const products = [];
  
  for (const category of CATEGORIES) {
    const productNames = PRODUCT_NAMES[category];
    for (const baseName of productNames) {
      const price = faker.number.float({ min: 9.99, max: 999.99, fractionDigits: 2 });
      const cost = price * faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 });
      
      products.push({
        name: `${baseName} ${faker.commerce.productAdjective()}`,
        description: faker.commerce.productDescription(),
        price: price.toString(),
        category,
        imageUrl: `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/400/400`,
        stock: faker.number.int({ min: 0, max: 500 }),
        cost: cost.toString(),
        sku: faker.string.alphanumeric(8).toUpperCase(),
        featured: faker.datatype.boolean(0.2),
        createdAt: faker.date.past({ years: 2 })
      });
    }
  }
  
  await db.insert(schema.products).values(products);
  console.log(`✅ Seeded ${products.length} products\n`);
  return products;
}

// Generate 1000+ customers
async function seedCustomers() {
  console.log('👥 Seeding 1000 customers...');
  const customers = [];
  
  for (let i = 0; i < 1000; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const createdAt = faker.date.past({ years: 3 });
    
    customers.push({
      email,
      name: `${firstName} ${lastName}`,
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: 'United States',
      createdAt,
      lastPurchaseDate: faker.datatype.boolean(0.7) ? faker.date.between({ from: createdAt, to: new Date() }) : null
    });
  }
  
  await db.insert(schema.customers).values(customers);
  console.log(`✅ Seeded ${customers.length} customers\n`);
  return customers;
}

// Generate 5000+ orders
async function seedOrders(products, customers) {
  console.log('🛒 Seeding 5000 orders...');
  const orders = [];
  const orderItems = [];
  
  for (let i = 0; i < 5000; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const orderDate = faker.date.between({ 
      from: customer.createdAt, 
      to: new Date() 
    });
    
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(products, itemCount);
    
    let subtotal = 0;
    const items = [];
    
    for (const product of selectedProducts) {
      const quantity = faker.number.int({ min: 1, max: 3 });
      const price = parseFloat(product.price);
      subtotal += price * quantity;
      
      items.push({
        productId: product.id,
        quantity,
        price: price.toString()
      });
    }
    
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;
    
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const weights = [0.05, 0.1, 0.15, 0.65, 0.05];
    const status = faker.helpers.weightedArrayElement(
      statuses.map((s, i) => ({ weight: weights[i], value: s }))
    );
    
    orders.push({
      customerId: customer.id,
      status,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2),
      createdAt: orderDate,
      items: JSON.stringify(items)
    });
  }
  
  await db.insert(schema.orders).values(orders);
  console.log(`✅ Seeded ${orders.length} orders\n`);
  return orders;
}

// Generate 2000+ reviews
async function seedReviews(products, customers) {
  console.log('⭐ Seeding 2000 reviews...');
  const reviews = [];
  
  for (let i = 0; i < 2000; i++) {
    const product = faker.helpers.arrayElement(products);
    const customer = faker.helpers.arrayElement(customers);
    const rating = faker.helpers.weightedArrayElement([
      { weight: 0.5, value: 5 },
      { weight: 0.25, value: 4 },
      { weight: 0.15, value: 3 },
      { weight: 0.07, value: 2 },
      { weight: 0.03, value: 1 }
    ]);
    
    const sentiments = ['positive', 'neutral', 'negative'];
    const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
    
    const positiveReviews = [
      'Absolutely love this product! Exceeded my expectations.',
      'Great quality and fast shipping. Highly recommend!',
      'Perfect! Exactly what I was looking for.',
      'Amazing product, will definitely buy again.',
      'Best purchase I\'ve made in a while!'
    ];
    
    const neutralReviews = [
      'It\'s okay, does what it\'s supposed to do.',
      'Average product, nothing special.',
      'Decent quality for the price.',
      'Works fine, no complaints.',
      'It\'s alright, meets basic expectations.'
    ];
    
    const negativeReviews = [
      'Disappointed with the quality.',
      'Not as described, returning it.',
      'Broke after a few uses.',
      'Poor quality, don\'t waste your money.',
      'Expected better for the price.'
    ];
    
    let reviewText;
    if (sentiment === 'positive') {
      reviewText = faker.helpers.arrayElement(positiveReviews);
    } else if (sentiment === 'neutral') {
      reviewText = faker.helpers.arrayElement(neutralReviews);
    } else {
      reviewText = faker.helpers.arrayElement(negativeReviews);
    }
    
    reviews.push({
      productId: product.id,
      customerId: customer.id,
      rating,
      comment: reviewText,
      sentiment,
      createdAt: faker.date.between({ from: product.createdAt, to: new Date() })
    });
  }
  
  await db.insert(schema.reviews).values(reviews);
  console.log(`✅ Seeded ${reviews.length} reviews\n`);
}

// Main seeding function
async function main() {
  try {
    console.log('🗑️  Clearing existing data...\n');
    
    // Clear in correct order (foreign keys)
    await db.delete(schema.reviews);
    await db.delete(schema.orders);
    await db.delete(schema.customers);
    await db.delete(schema.products);
    
    console.log('✅ Cleared existing data\n');
    
    // Seed data
    const products = await seedProducts();
    const customers = await seedCustomers();
    const orders = await seedOrders(products, customers);
    await seedReviews(products, customers);
    
    console.log('🎉 MASSIVE DATA SEED COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - ${products.length} products`);
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${orders.length} orders`);
    console.log(`   - 2000 reviews`);
    console.log(`   - Total: ${products.length + customers.length + orders.length + 2000} records\n`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
