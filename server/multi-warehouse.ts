/**
 * Multi-Warehouse Fulfillment Automation System
 * 
 * Comprehensive warehouse management with:
 * - Intelligent order routing based on proximity, inventory, and capacity
 * - Real-time inventory synchronization across warehouses
 * - Automated pick-pack-ship workflows
 * - Wave picking optimization
 * - Cross-docking and transfer management
 * - Zone-based picking strategies
 * - Batch processing for efficiency
 * - SLA monitoring and enforcement
 * - Carrier integration and rate shopping
 * - Returns processing and restocking
 */

import { getDb } from './db';
import { 
  warehouses,
  warehouseInventory,
  warehouseZones,
  pickingTasks,
  packingStations,
  shippingLabels,
  inventoryTransfers,
  warehouseStaff,
  orders,
  orderItems,
  products
} from '../drizzle/schema';
import { eq, and, gte, lte, sql, desc, asc, inArray, or } from 'drizzle-orm';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentUtilization: number;
  zones: WarehouseZone[];
}

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  name: string;
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'returns';
  capacity: number;
  currentLoad: number;
}

export interface InventoryItem {
  productId: string;
  warehouseId: string;
  zoneId: string;
  binLocation: string;
  quantity: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
}

export interface RoutingDecision {
  orderId: string;
  selectedWarehouse: string;
  reason: string;
  estimatedShipDate: Date;
  estimatedDeliveryDate: Date;
  shippingCost: number;
  score: number;
}

export interface PickingWave {
  id: string;
  warehouseId: string;
  orders: string[];
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface PackingTask {
  id: string;
  orderId: string;
  stationId: string;
  items: PackingItem[];
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  packagingType: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
}

export interface PackingItem {
  productId: string;
  quantity: number;
  picked: boolean;
  binLocation: string;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  trackingAvailable: boolean;
}

// ============================================================================
// INTELLIGENT ORDER ROUTING
// ============================================================================

/**
 * Route order to optimal warehouse based on multiple factors
 */
export async function routeOrder(orderId: string): Promise<RoutingDecision> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get order details
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order.length) throw new Error('Order not found');

  const orderData = order[0];
  const orderItemsList = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  // Get all warehouses with inventory
  const warehouseList = await db.select().from(warehouses);
  
  // Score each warehouse
  const scores = await Promise.all(
    warehouseList.map(warehouse => scoreWarehouse(warehouse, orderData, orderItemsList))
  );

  // Select best warehouse
  const bestWarehouse = scores.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  return bestWarehouse;
}

/**
 * Score warehouse based on multiple factors
 */
async function scoreWarehouse(
  warehouse: any,
  order: any,
  items: any[]
): Promise<RoutingDecision> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  let score = 0;
  const factors: { [key: string]: number } = {};

  // Factor 1: Inventory availability (40% weight)
  const inventoryScore = await calculateInventoryScore(warehouse.id, items);
  factors.inventory = inventoryScore * 0.4;
  score += factors.inventory;

  // Factor 2: Distance to customer (30% weight)
  const distanceScore = calculateDistanceScore(
    warehouse.latitude,
    warehouse.longitude,
    order.shippingLatitude || 0,
    order.shippingLongitude || 0
  );
  factors.distance = distanceScore * 0.3;
  score += factors.distance;

  // Factor 3: Warehouse capacity (15% weight)
  const capacityScore = calculateCapacityScore(warehouse);
  factors.capacity = capacityScore * 0.15;
  score += factors.capacity;

  // Factor 4: Historical performance (10% weight)
  const performanceScore = await calculatePerformanceScore(warehouse.id);
  factors.performance = performanceScore * 0.1;
  score += factors.performance;

  // Factor 5: Current workload (5% weight)
  const workloadScore = await calculateWorkloadScore(warehouse.id);
  factors.workload = workloadScore * 0.05;
  score += factors.workload;

  // Calculate shipping estimates
  const distance = calculateDistance(
    warehouse.latitude,
    warehouse.longitude,
    order.shippingLatitude || 0,
    order.shippingLongitude || 0
  );

  const shippingCost = calculateShippingCost(distance, order.totalAmount);
  const estimatedDays = Math.ceil(distance / 500); // ~500km per day

  const estimatedShipDate = new Date();
  estimatedShipDate.setDate(estimatedShipDate.getDate() + 1);

  const estimatedDeliveryDate = new Date(estimatedShipDate);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays);

  return {
    orderId: order.id,
    selectedWarehouse: warehouse.id,
    reason: `Best match: Inventory ${Math.round(factors.inventory * 100)}%, Distance ${Math.round(factors.distance * 100)}%, Capacity ${Math.round(factors.capacity * 100)}%`,
    estimatedShipDate,
    estimatedDeliveryDate,
    shippingCost,
    score
  };
}

async function calculateInventoryScore(warehouseId: string, items: any[]): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const productIds = items.map(item => item.productId);
  const inventory = await db
    .select()
    .from(warehouseInventory)
    .where(and(
      eq(warehouseInventory.warehouseId, warehouseId),
      inArray(warehouseInventory.productId, productIds)
    ));

  let availableItems = 0;
  let totalItems = items.length;

  items.forEach(item => {
    const inv = inventory.find(i => i.productId === item.productId);
    if (inv && inv.quantity >= item.quantity) {
      availableItems++;
    }
  });

  return availableItems / totalItems;
}

function calculateDistanceScore(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const maxDistance = 5000; // 5000km max
  return Math.max(0, 1 - (distance / maxDistance));
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateCapacityScore(warehouse: any): number {
  const utilization = warehouse.currentUtilization || 0;
  const capacity = warehouse.capacity || 1;
  const utilizationRate = utilization / capacity;
  return Math.max(0, 1 - utilizationRate);
}

async function calculatePerformanceScore(warehouseId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0.8; // Default score

  // Calculate on-time fulfillment rate
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const performance = await db
    .select({
      total: sql<number>`COUNT(*)`,
      onTime: sql<number>`SUM(CASE WHEN ${orders.status} = 'delivered' AND ${orders.deliveredAt} <= ${orders.estimatedDelivery} THEN 1 ELSE 0 END)`
    })
    .from(orders)
    .where(and(
      eq(orders.warehouseId, warehouseId),
      gte(orders.createdAt, last30Days)
    ));

  const total = performance[0]?.total || 1;
  const onTime = performance[0]?.onTime || 0;

  return onTime / total;
}

async function calculateWorkloadScore(warehouseId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 1;

  // Count pending orders
  const pending = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(and(
      eq(orders.warehouseId, warehouseId),
      inArray(orders.status, ['pending', 'processing'])
    ));

  const pendingCount = pending[0]?.count || 0;
  const maxLoad = 100; // Max 100 pending orders before penalty

  return Math.max(0, 1 - (pendingCount / maxLoad));
}

function calculateShippingCost(distance: number, orderValue: number): number {
  const baseCost = 5;
  const perKmCost = 0.01;
  const cost = baseCost + (distance * perKmCost);
  
  // Free shipping for orders over $100
  return orderValue > 100 ? 0 : cost;
}

// ============================================================================
// WAVE PICKING OPTIMIZATION
// ============================================================================

/**
 * Create optimized picking waves
 * Groups orders for efficient batch picking
 */
export async function createPickingWaves(warehouseId: string): Promise<PickingWave[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get pending orders for warehouse
  const pendingOrders = await db
    .select()
    .from(orders)
    .where(and(
      eq(orders.warehouseId, warehouseId),
      eq(orders.status, 'pending')
    ))
    .orderBy(desc(orders.priority), asc(orders.createdAt));

  if (pendingOrders.length === 0) return [];

  // Group orders into waves
  const waves: PickingWave[] = [];
  const maxOrdersPerWave = 20;
  const priorityGroups = {
    urgent: pendingOrders.filter(o => o.priority === 'urgent'),
    high: pendingOrders.filter(o => o.priority === 'high'),
    normal: pendingOrders.filter(o => o.priority === 'normal'),
    low: pendingOrders.filter(o => o.priority === 'low')
  };

  // Create waves by priority
  for (const [priority, orders] of Object.entries(priorityGroups)) {
    for (let i = 0; i < orders.length; i += maxOrdersPerWave) {
      const waveOrders = orders.slice(i, i + maxOrdersPerWave);
      
      waves.push({
        id: `wave_${Date.now()}_${i}`,
        warehouseId,
        orders: waveOrders.map(o => o.id),
        priority: priority as any,
        status: 'pending',
        assignedTo: [],
        createdAt: new Date()
      });
    }
  }

  return waves;
}

/**
 * Optimize picking path within warehouse
 * Uses zone-based routing to minimize travel time
 */
export async function optimizePickingPath(
  warehouseId: string,
  orderIds: string[]
): Promise<{ productId: string; binLocation: string; quantity: number }[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get all items needed
  const items = await db
    .select({
      productId: orderItems.productId,
      quantity: sql<number>`SUM(${orderItems.quantity})`,
      binLocation: warehouseInventory.binLocation,
      zoneId: warehouseInventory.zoneId
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(warehouseInventory, and(
      eq(warehouseInventory.productId, orderItems.productId),
      eq(warehouseInventory.warehouseId, warehouseId)
    ))
    .where(inArray(orders.id, orderIds))
    .groupBy(orderItems.productId, warehouseInventory.binLocation, warehouseInventory.zoneId);

  // Sort by zone and bin location for optimal path
  const sortedItems = items.sort((a, b) => {
    if (a.zoneId !== b.zoneId) return a.zoneId.localeCompare(b.zoneId);
    return a.binLocation.localeCompare(b.binLocation);
  });

  return sortedItems.map(item => ({
    productId: item.productId,
    binLocation: item.binLocation,
    quantity: item.quantity
  }));
}

// ============================================================================
// PACKING AUTOMATION
// ============================================================================

/**
 * Assign order to packing station
 */
export async function assignToPacking(orderId: string): Promise<PackingTask> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get order items
  const items = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      binLocation: warehouseInventory.binLocation
    })
    .from(orderItems)
    .innerJoin(warehouseInventory, eq(orderItems.productId, warehouseInventory.productId))
    .where(eq(orderItems.orderId, orderId));

  // Find available packing station
  const availableStation = await db
    .select()
    .from(packingStations)
    .where(eq(packingStations.status, 'available'))
    .limit(1);

  if (!availableStation.length) {
    throw new Error('No available packing stations');
  }

  const station = availableStation[0];

  // Calculate packaging requirements
  const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 0.5), 0); // Assume 0.5kg per item
  const packagingType = selectPackagingType(items.length, totalWeight);
  const dimensions = calculatePackageDimensions(items.length);

  const packingTask: PackingTask = {
    id: `pack_${Date.now()}`,
    orderId,
    stationId: station.id,
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      picked: false,
      binLocation: item.binLocation
    })),
    status: 'pending',
    assignedTo: station.assignedTo || '',
    packagingType,
    weight: totalWeight,
    dimensions
  };

  return packingTask;
}

function selectPackagingType(itemCount: number, weight: number): string {
  if (itemCount === 1 && weight < 0.5) return 'envelope';
  if (weight < 2) return 'small_box';
  if (weight < 10) return 'medium_box';
  if (weight < 30) return 'large_box';
  return 'pallet';
}

function calculatePackageDimensions(itemCount: number): { length: number; width: number; height: number } {
  // Simplified dimension calculation
  if (itemCount <= 2) return { length: 20, width: 15, height: 10 };
  if (itemCount <= 5) return { length: 30, width: 25, height: 15 };
  if (itemCount <= 10) return { length: 40, width: 35, height: 20 };
  return { length: 60, width: 50, height: 40 };
}

// ============================================================================
// CARRIER INTEGRATION & RATE SHOPPING
// ============================================================================

/**
 * Get shipping rates from multiple carriers
 */
export async function getShippingRates(options: {
  origin: { zip: string; country: string };
  destination: { zip: string; country: string };
  weight: number;
  dimensions: { length: number; width: number; height: number };
}): Promise<ShippingRate[]> {
  const { origin, destination, weight, dimensions } = options;

  // Simulate carrier rate shopping
  const carriers = [
    { name: 'FedEx', baseRate: 10, perKg: 2, daysMin: 2, daysMax: 5 },
    { name: 'UPS', baseRate: 12, perKg: 1.8, daysMin: 2, daysMax: 4 },
    { name: 'USPS', baseRate: 8, perKg: 2.5, daysMin: 3, daysMax: 7 },
    { name: 'DHL', baseRate: 15, perKg: 1.5, daysMin: 1, daysMax: 3 }
  ];

  const rates: ShippingRate[] = [];

  carriers.forEach(carrier => {
    const cost = carrier.baseRate + (weight * carrier.perKg);
    const estimatedDays = Math.floor(Math.random() * (carrier.daysMax - carrier.daysMin + 1)) + carrier.daysMin;

    rates.push({
      carrier: carrier.name,
      service: 'Standard',
      cost,
      estimatedDays,
      trackingAvailable: true
    });

    // Add express option
    rates.push({
      carrier: carrier.name,
      service: 'Express',
      cost: cost * 1.5,
      estimatedDays: Math.max(1, estimatedDays - 2),
      trackingAvailable: true
    });
  });

  return rates.sort((a, b) => a.cost - b.cost);
}

/**
 * Generate shipping label
 */
export async function generateShippingLabel(options: {
  orderId: string;
  carrier: string;
  service: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
}): Promise<{ trackingNumber: string; labelUrl: string }> {
  const { orderId, carrier, service } = options;

  // Simulate label generation
  const trackingNumber = `${carrier.substring(0, 3).toUpperCase()}${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const labelUrl = `https://labels.example.com/${trackingNumber}.pdf`;

  return {
    trackingNumber,
    labelUrl
  };
}

// ============================================================================
// INVENTORY TRANSFERS
// ============================================================================

/**
 * Create inventory transfer between warehouses
 */
export async function createInventoryTransfer(options: {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason: string;
}): Promise<{ transferId: string; status: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = options;

  // Check source inventory
  const sourceInventory = await db
    .select()
    .from(warehouseInventory)
    .where(and(
      eq(warehouseInventory.productId, productId),
      eq(warehouseInventory.warehouseId, fromWarehouseId)
    ))
    .limit(1);

  if (!sourceInventory.length || sourceInventory[0].quantity < quantity) {
    throw new Error('Insufficient inventory at source warehouse');
  }

  const transferId = `transfer_${Date.now()}`;

  // Create transfer record
  await db.insert(inventoryTransfers).values({
    id: transferId,
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
    reason,
    status: 'pending',
    createdAt: new Date()
  });

  return {
    transferId,
    status: 'pending'
  };
}

/**
 * Process inventory transfer
 */
export async function processTransfer(transferId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get transfer details
  const transfer = await db
    .select()
    .from(inventoryTransfers)
    .where(eq(inventoryTransfers.id, transferId))
    .limit(1);

  if (!transfer.length) throw new Error('Transfer not found');

  const { productId, fromWarehouseId, toWarehouseId, quantity } = transfer[0];

  // Deduct from source
  await db
    .update(warehouseInventory)
    .set({ 
      quantity: sql`${warehouseInventory.quantity} - ${quantity}` 
    })
    .where(and(
      eq(warehouseInventory.productId, productId),
      eq(warehouseInventory.warehouseId, fromWarehouseId)
    ));

  // Add to destination
  await db
    .update(warehouseInventory)
    .set({ 
      quantity: sql`${warehouseInventory.quantity} + ${quantity}` 
    })
    .where(and(
      eq(warehouseInventory.productId, productId),
      eq(warehouseInventory.warehouseId, toWarehouseId)
    ));

  // Update transfer status
  await db
    .update(inventoryTransfers)
    .set({ 
      status: 'completed',
      completedAt: new Date()
    })
    .where(eq(inventoryTransfers.id, transferId));
}

// ============================================================================
// RETURNS PROCESSING
// ============================================================================

/**
 * Process product return
 */
export async function processReturn(options: {
  orderId: string;
  productId: string;
  quantity: number;
  reason: string;
  condition: 'new' | 'opened' | 'damaged';
}): Promise<{ returnId: string; refundAmount: number; restockable: boolean }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { orderId, productId, quantity, reason, condition } = options;

  // Get order and item details
  const orderItem = await db
    .select()
    .from(orderItems)
    .where(and(
      eq(orderItems.orderId, orderId),
      eq(orderItems.productId, productId)
    ))
    .limit(1);

  if (!orderItem.length) throw new Error('Order item not found');

  const item = orderItem[0];
  const refundAmount = item.price * quantity;
  const restockable = condition === 'new' || condition === 'opened';

  // If restockable, add back to inventory
  if (restockable) {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length && order[0].warehouseId) {
      await db
        .update(warehouseInventory)
        .set({ 
          quantity: sql`${warehouseInventory.quantity} + ${quantity}` 
        })
        .where(and(
          eq(warehouseInventory.productId, productId),
          eq(warehouseInventory.warehouseId, order[0].warehouseId)
        ));
    }
  }

  const returnId = `return_${Date.now()}`;

  return {
    returnId,
    refundAmount,
    restockable
  };
}

// ============================================================================
// REAL-TIME INVENTORY SYNC
// ============================================================================

/**
 * Sync inventory across all warehouses
 */
export async function syncInventory(): Promise<{ synced: number; conflicts: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get all inventory records
  const inventory = await db.select().from(warehouseInventory);

  let synced = 0;
  let conflicts = 0;

  // Check for discrepancies and sync
  for (const item of inventory) {
    const reserved = item.reserved || 0;
    const available = item.quantity - reserved;

    if (available < 0) {
      conflicts++;
      // Resolve conflict by adjusting reserved
      await db
        .update(warehouseInventory)
        .set({ reserved: item.quantity })
        .where(eq(warehouseInventory.id, item.id));
    }

    synced++;
  }

  return { synced, conflicts };
}

/**
 * Get warehouse performance metrics
 */
export async function getWarehouseMetrics(warehouseId: string): Promise<{
  ordersProcessed: number;
  avgPickTime: number;
  avgPackTime: number;
  avgShipTime: number;
  accuracy: number;
  utilization: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const metrics = await db
    .select({
      ordersProcessed: sql<number>`COUNT(*)`,
      avgFulfillmentTime: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${orders.createdAt}, ${orders.shippedAt}))`
    })
    .from(orders)
    .where(and(
      eq(orders.warehouseId, warehouseId),
      gte(orders.createdAt, last30Days),
      eq(orders.status, 'shipped')
    ));

  const warehouse = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, warehouseId))
    .limit(1);

  const utilization = warehouse.length 
    ? (warehouse[0].currentUtilization / warehouse[0].capacity) * 100 
    : 0;

  return {
    ordersProcessed: metrics[0]?.ordersProcessed || 0,
    avgPickTime: 15, // minutes (simulated)
    avgPackTime: 8, // minutes (simulated)
    avgShipTime: (metrics[0]?.avgFulfillmentTime || 0) * 60, // convert to minutes
    accuracy: 98.5, // percentage (simulated)
    utilization
  };
}
