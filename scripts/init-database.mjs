/**
 * Database Initialization Script
 * Sets up core data structures for Live Shopping Network
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

// Import schema
import { 
  warehouses, 
  zones, 
  bins,
  channels,
  suppliers,
  products,
  inventory
} from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // 1. Create default warehouse
    console.log('📦 Creating default warehouse...');
    const warehouseId = nanoid();
    await db.insert(warehouses).values({
      id: warehouseId,
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      address: 'Sydney, NSW, Australia',
      status: 'active'
    }).onDuplicateKeyUpdate({ set: { status: 'active' } });
    console.log('✅ Main warehouse created:', warehouseId);

    // 2. Create warehouse zones
    console.log('\n📍 Creating warehouse zones...');
    const zones_data = [
      { code: 'RECV', name: 'Receiving Zone', zoneType: 'receiving' },
      { code: 'STOR', name: 'Storage Zone', zoneType: 'storage' },
      { code: 'PICK', name: 'Picking Zone', zoneType: 'pick' },
      { code: 'PACK', name: 'Packing Zone', zoneType: 'pack' }
    ];

    const zoneIds = {};
    for (const zone of zones_data) {
      const zoneId = nanoid();
      await db.insert(zones).values({
        id: zoneId,
        warehouseId: warehouseId,
        code: zone.code,
        name: zone.name,
        zoneType: zone.zoneType,
        status: 'active'
      }).onDuplicateKeyUpdate({ set: { status: 'active' } });
      zoneIds[zone.code] = zoneId;
      console.log(`✅ Zone created: ${zone.name} (${zone.code})`);
    }

    // 3. Create bins in storage zone
    console.log('\n🗄️  Creating storage bins...');
    const storageZoneId = zoneIds['STOR'];
    const binPromises = [];
    
    // Create 5 rows x 10 columns x 3 levels = 150 bins
    for (let row = 1; row <= 5; row++) {
      for (let col = 1; col <= 10; col++) {
        for (let level = 1; level <= 3; level++) {
          const binCode = `A${row.toString().padStart(2, '0')}-${col.toString().padStart(2, '0')}-${level}`;
          binPromises.push(
            db.insert(bins).values({
              id: nanoid(),
              zoneId: storageZoneId,
              code: binCode,
              name: `Bin ${binCode}`,
              row: row,
              col: col,
              level: level,
              status: 'active'
            }).onDuplicateKeyUpdate({ set: { status: 'active' } })
          );
        }
      }
    }
    await Promise.all(binPromises);
    console.log('✅ Created 150 storage bins (5 rows × 10 cols × 3 levels)');

    // 4. Create default sales channel
    console.log('\n🛍️  Creating default sales channel...');
    const channelId = nanoid();
    await db.insert(channels).values({
      id: channelId,
      slug: 'main',
      name: 'Live Shopping Network',
      status: 'active',
      settings: JSON.stringify({
        currency: 'AUD',
        language: 'en-AU',
        timezone: 'Australia/Sydney'
      })
    }).onDuplicateKeyUpdate({ set: { status: 'active' } });
    console.log('✅ Default channel created:', channelId);

    // 5. Create sample supplier
    console.log('\n🏭 Creating sample supplier...');
    const supplierId = nanoid();
    await db.insert(suppliers).values({
      id: supplierId,
      name: 'CJ Dropshipping',
      contactEmail: 'support@cjdropshipping.com',
      contactPhone: '+86-400-000-0000',
      address: 'Shenzhen, China',
      status: 'active',
      paymentTerms: 'NET30',
      shippingTerms: 'FOB',
      leadTimeDays: 7
    }).onDuplicateKeyUpdate({ set: { status: 'active' } });
    console.log('✅ Sample supplier created:', supplierId);

    console.log('\n✨ Database initialization complete!\n');
    console.log('📊 Summary:');
    console.log('  • 1 warehouse (Main Warehouse)');
    console.log('  • 4 zones (Receiving, Storage, Picking, Packing)');
    console.log('  • 150 storage bins');
    console.log('  • 1 sales channel (Live Shopping Network)');
    console.log('  • 1 supplier (CJ Dropshipping)');
    console.log('\n🎯 Next steps:');
    console.log('  1. Import products via product sourcing system');
    console.log('  2. Configure third-party API credentials');
    console.log('  3. Set up autonomous operations');
    console.log('  4. Test live streaming infrastructure\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run initialization
initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
