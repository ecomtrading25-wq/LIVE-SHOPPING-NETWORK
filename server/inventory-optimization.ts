/**
 * Inventory Optimization AI
 * Demand forecasting, reorder point optimization, and stock allocation
 */

interface DemandForecast {
  productId: string;
  sku: string;
  forecastedDemand: number[];
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  seasonality: boolean;
}

interface ReorderRecommendation {
  productId: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  recommendedOrderQuantity: number;
  urgency: "critical" | "high" | "medium" | "low";
  daysUntilStockout: number;
  estimatedCost: number;
}

interface StockAllocation {
  productId: string;
  sku: string;
  totalStock: number;
  allocations: {
    warehouseId: string;
    quantity: number;
    utilizationRate: number;
  }[];
}

/**
 * Forecast Demand using Time Series Analysis
 */
export async function forecastDemand(
  productId: string,
  historicalDays: number = 90,
  forecastDays: number = 30
): Promise<DemandForecast> {
  // Mock implementation - in production, use ML model
  // Could integrate with TensorFlow.js for client-side predictions
  // or call Python ML service for server-side predictions
  
  const mockHistoricalData = Array.from({ length: historicalDays }, (_, i) => ({
    date: new Date(Date.now() - (historicalDays - i) * 24 * 60 * 60 * 1000),
    sales: Math.floor(Math.random() * 50) + 20,
  }));

  // Simple moving average for demo
  const avgDailySales = mockHistoricalData.reduce((sum, day) => sum + day.sales, 0) / historicalDays;
  
  // Add trend factor
  const recentAvg = mockHistoricalData.slice(-30).reduce((sum, day) => sum + day.sales, 0) / 30;
  const trendFactor = recentAvg / avgDailySales;
  
  // Generate forecast
  const forecastedDemand = Array.from({ length: forecastDays }, (_, i) => {
    const baselineDemand = avgDailySales * trendFactor;
    const seasonalFactor = 1 + 0.2 * Math.sin((i / 7) * Math.PI); // Weekly seasonality
    const randomNoise = 1 + (Math.random() - 0.5) * 0.1;
    return Math.floor(baselineDemand * seasonalFactor * randomNoise);
  });

  const trend = trendFactor > 1.1 ? "increasing" : trendFactor < 0.9 ? "decreasing" : "stable";
  
  return {
    productId,
    sku: `SKU-${productId}`,
    forecastedDemand,
    confidence: 0.85,
    trend,
    seasonality: true,
  };
}

/**
 * Calculate Optimal Reorder Point
 * Uses Economic Order Quantity (EOQ) and safety stock calculations
 */
export async function calculateReorderPoint(
  productId: string,
  leadTimeDays: number = 14
): Promise<ReorderRecommendation> {
  const forecast = await forecastDemand(productId, 90, 30);
  
  // Average daily demand
  const avgDailyDemand = forecast.forecastedDemand.reduce((a, b) => a + b, 0) / forecast.forecastedDemand.length;
  
  // Safety stock (2 standard deviations for 95% service level)
  const stdDev = Math.sqrt(
    forecast.forecastedDemand.reduce((sum, val) => sum + Math.pow(val - avgDailyDemand, 2), 0) / forecast.forecastedDemand.length
  );
  const safetyStock = Math.ceil(2 * stdDev * Math.sqrt(leadTimeDays));
  
  // Reorder point = (Average daily demand × Lead time) + Safety stock
  const reorderPoint = Math.ceil(avgDailyDemand * leadTimeDays) + safetyStock;
  
  // Economic Order Quantity (EOQ)
  const annualDemand = avgDailyDemand * 365;
  const orderingCost = 50; // Fixed cost per order
  const holdingCostPerUnit = 2; // Annual holding cost per unit
  const eoq = Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit));
  
  // Current stock (mock)
  const currentStock = Math.floor(Math.random() * 200) + 50;
  
  // Days until stockout
  const daysUntilStockout = Math.floor(currentStock / avgDailyDemand);
  
  // Urgency level
  let urgency: "critical" | "high" | "medium" | "low";
  if (daysUntilStockout < 7) urgency = "critical";
  else if (daysUntilStockout < 14) urgency = "high";
  else if (daysUntilStockout < 30) urgency = "medium";
  else urgency = "low";
  
  return {
    productId,
    sku: `SKU-${productId}`,
    currentStock,
    reorderPoint,
    recommendedOrderQuantity: eoq,
    urgency,
    daysUntilStockout,
    estimatedCost: eoq * 25, // Mock unit cost of $25
  };
}

/**
 * Optimize Stock Allocation Across Warehouses
 */
export async function optimizeStockAllocation(
  productId: string,
  totalStock: number,
  warehouses: { id: string; demandWeight: number; capacity: number }[]
): Promise<StockAllocation> {
  // Allocate stock based on demand weight and capacity constraints
  const totalDemandWeight = warehouses.reduce((sum, wh) => sum + wh.demandWeight, 0);
  
  const allocations = warehouses.map((warehouse) => {
    const idealAllocation = Math.floor((warehouse.demandWeight / totalDemandWeight) * totalStock);
    const constrainedAllocation = Math.min(idealAllocation, warehouse.capacity);
    const utilizationRate = (constrainedAllocation / warehouse.capacity) * 100;
    
    return {
      warehouseId: warehouse.id,
      quantity: constrainedAllocation,
      utilizationRate,
    };
  });
  
  // Redistribute excess if any warehouse hit capacity
  const allocatedTotal = allocations.reduce((sum, a) => sum + a.quantity, 0);
  if (allocatedTotal < totalStock) {
    const excess = totalStock - allocatedTotal;
    // Distribute excess to warehouses with available capacity
    const availableWarehouses = allocations.filter(
      (a, i) => a.quantity < warehouses[i].capacity
    );
    if (availableWarehouses.length > 0) {
      const excessPerWarehouse = Math.floor(excess / availableWarehouses.length);
      availableWarehouses.forEach((a) => {
        a.quantity += excessPerWarehouse;
      });
    }
  }
  
  return {
    productId,
    sku: `SKU-${productId}`,
    totalStock,
    allocations,
  };
}

/**
 * Identify Slow-Moving Inventory
 */
export async function identifySlowMovingInventory(
  thresholdDays: number = 90
): Promise<{
  productId: string;
  sku: string;
  daysInStock: number;
  currentStock: number;
  estimatedValue: number;
  recommendation: string;
}[]> {
  // Mock data - in production, query from database
  return [
    {
      productId: "prod_123",
      sku: "SKU-123",
      daysInStock: 145,
      currentStock: 87,
      estimatedValue: 4350,
      recommendation: "Consider 30% discount or bundle promotion",
    },
    {
      productId: "prod_456",
      sku: "SKU-456",
      daysInStock: 112,
      currentStock: 43,
      estimatedValue: 2150,
      recommendation: "Flash sale or clearance event",
    },
    {
      productId: "prod_789",
      sku: "SKU-789",
      daysInStock: 98,
      currentStock: 156,
      estimatedValue: 7800,
      recommendation: "Bundle with popular items",
    },
  ];
}

/**
 * Calculate Inventory Turnover Ratio
 */
export async function calculateInventoryTurnover(
  productId: string,
  periodDays: number = 90
): Promise<{
  turnoverRatio: number;
  daysInventoryOutstanding: number;
  performance: "excellent" | "good" | "average" | "poor";
}> {
  // Mock calculation - in production, use actual sales and inventory data
  const costOfGoodsSold = 45000;
  const averageInventoryValue = 8500;
  
  const turnoverRatio = costOfGoodsSold / averageInventoryValue;
  const daysInventoryOutstanding = 365 / turnoverRatio;
  
  let performance: "excellent" | "good" | "average" | "poor";
  if (turnoverRatio > 8) performance = "excellent";
  else if (turnoverRatio > 6) performance = "good";
  else if (turnoverRatio > 4) performance = "average";
  else performance = "poor";
  
  return {
    turnoverRatio,
    daysInventoryOutstanding,
    performance,
  };
}

/**
 * Generate Automated Purchase Orders
 */
export async function generatePurchaseOrders(): Promise<{
  supplierId: string;
  items: {
    productId: string;
    sku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  urgency: "critical" | "high" | "medium" | "low";
}[]> {
  // Mock data - in production, generate based on reorder points
  return [
    {
      supplierId: "supplier_1",
      items: [
        {
          productId: "prod_123",
          sku: "SKU-123",
          quantity: 500,
          unitCost: 25,
          totalCost: 12500,
        },
        {
          productId: "prod_456",
          sku: "SKU-456",
          quantity: 300,
          unitCost: 35,
          totalCost: 10500,
        },
      ],
      totalCost: 23000,
      urgency: "high",
    },
    {
      supplierId: "supplier_2",
      items: [
        {
          productId: "prod_789",
          sku: "SKU-789",
          quantity: 200,
          unitCost: 50,
          totalCost: 10000,
        },
      ],
      totalCost: 10000,
      urgency: "medium",
    },
  ];
}

/**
 * ABC Analysis for Inventory Classification
 */
export async function performABCAnalysis(): Promise<{
  classA: { productId: string; sku: string; revenue: number; percentage: number }[];
  classB: { productId: string; sku: string; revenue: number; percentage: number }[];
  classC: { productId: string; sku: string; revenue: number; percentage: number }[];
}> {
  // Mock data - in production, calculate from actual sales data
  // Class A: Top 20% of products generating 80% of revenue
  // Class B: Next 30% of products generating 15% of revenue
  // Class C: Remaining 50% of products generating 5% of revenue
  
  return {
    classA: [
      { productId: "prod_1", sku: "SKU-001", revenue: 125000, percentage: 35 },
      { productId: "prod_2", sku: "SKU-002", revenue: 98000, percentage: 27.5 },
      { productId: "prod_3", sku: "SKU-003", revenue: 62000, percentage: 17.5 },
    ],
    classB: [
      { productId: "prod_4", sku: "SKU-004", revenue: 28000, percentage: 7.8 },
      { productId: "prod_5", sku: "SKU-005", revenue: 25000, percentage: 7.0 },
    ],
    classC: [
      { productId: "prod_6", sku: "SKU-006", revenue: 8000, percentage: 2.2 },
      { productId: "prod_7", sku: "SKU-007", revenue: 6000, percentage: 1.7 },
      { productId: "prod_8", sku: "SKU-008", revenue: 4000, percentage: 1.1 },
    ],
  };
}

/**
 * Inventory Health Score
 */
export async function calculateInventoryHealthScore(productId: string): Promise<{
  score: number;
  factors: {
    turnoverRate: { score: number; weight: number };
    stockoutRisk: { score: number; weight: number };
    overstockRisk: { score: number; weight: number };
    demandTrend: { score: number; weight: number };
  };
  recommendation: string;
}> {
  // Mock calculation - in production, use real metrics
  const factors = {
    turnoverRate: { score: 85, weight: 0.3 },
    stockoutRisk: { score: 70, weight: 0.3 },
    overstockRisk: { score: 90, weight: 0.2 },
    demandTrend: { score: 80, weight: 0.2 },
  };
  
  const score = Object.values(factors).reduce(
    (sum, factor) => sum + factor.score * factor.weight,
    0
  );
  
  let recommendation: string;
  if (score >= 90) recommendation = "Excellent inventory health. Maintain current strategy.";
  else if (score >= 75) recommendation = "Good inventory health. Monitor for changes.";
  else if (score >= 60) recommendation = "Fair inventory health. Consider optimization.";
  else recommendation = "Poor inventory health. Immediate action required.";
  
  return {
    score,
    factors,
    recommendation,
  };
}
