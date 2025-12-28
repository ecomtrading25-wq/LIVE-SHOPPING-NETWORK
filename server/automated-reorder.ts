import { getDb } from "./db"
const db = await getDb();
import { inventory, products, suppliers, supplierProducts, purchaseOrders, purchaseOrderItems, appSettings } from "../drizzle/schema";
import { eq, lt, and, sql, desc } from "drizzle-orm";
import { sendEmail } from "./email";

/**
 * Automated Reorder Point System
 * 
 * This system monitors inventory levels and automatically creates purchase orders
 * when products hit their reorder thresholds. It uses:
 * - Sales velocity analysis (units sold per day)
 * - Economic Order Quantity (EOQ) calculations
 * - Lead time considerations
 * - Safety stock buffers
 */

interface ReorderCandidate {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  salesVelocity: number; // units per day
  leadTimeDays: number;
  suggestedOrderQty: number;
  supplierId: string;
  supplierName: string;
  unitCost: number;
  totalCost: number;
}

interface EOQParams {
  annualDemand: number;
  orderingCost: number;
  holdingCost: number;
}

/**
 * Calculate Economic Order Quantity (EOQ)
 * EOQ = √((2 × D × S) / H)
 * where:
 * D = Annual demand
 * S = Ordering cost per order
 * H = Annual holding cost per unit
 */
function calculateEOQ(params: EOQParams): number {
  const { annualDemand, orderingCost, holdingCost } = params;
  
  if (annualDemand <= 0 || holdingCost <= 0) {
    return 0;
  }
  
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
  return Math.ceil(eoq);
}

/**
 * Calculate reorder point
 * ROP = (Average daily usage × Lead time) + Safety stock
 */
function calculateReorderPoint(
  salesVelocity: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  return Math.ceil(salesVelocity * (leadTimeDays + safetyStockDays));
}

/**
 * Analyze sales velocity for a product
 * Returns average units sold per day over the last 30 days
 */
async function analyzeSalesVelocity(productId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Query order items for this product in the last 30 days
  const salesData = await db
    .select({
      totalQuantity: sql<number>`SUM(${sql.identifier("quantity")})`,
    })
    .from(sql.identifier("orderItems"))
    .where(
      and(
        eq(sql.identifier("productId"), productId),
        sql`${sql.identifier("createdAt")} >= ${thirtyDaysAgo.toISOString()}`
      )
    );

  const totalSold = salesData[0]?.totalQuantity || 0;
  const velocity = totalSold / 30; // units per day
  
  return velocity;
}

/**
 * Get supplier information for a product
 */
async function getSupplierForProduct(productId: string) {
  const supplierProduct = await db
    .select({
      supplierId: supplierProducts.supplierId,
      supplierName: suppliers.name,
      unitCost: supplierProducts.cost,
      leadTimeDays: supplierProducts.leadTimeDays,
    })
    .from(supplierProducts)
    .innerJoin(suppliers, eq(supplierProducts.supplierId, suppliers.id))
    .where(eq(supplierProducts.productId, productId))
    .orderBy(desc(supplierProducts.cost)) // Prefer lower cost suppliers
    .limit(1);

  return supplierProduct[0] || null;
}

/**
 * Find products that need reordering
 */
export async function findReorderCandidates(): Promise<ReorderCandidate[]> {
  const candidates: ReorderCandidate[] = [];

  // Get all products with low inventory
  const lowStockProducts = await db
    .select({
      productId: inventory.productId,
      productName: products.name,
      sku: products.sku,
      currentStock: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .where(lt(inventory.quantity, 50)); // Threshold for initial check

  for (const product of lowStockProducts) {
    // Analyze sales velocity
    const salesVelocity = await analyzeSalesVelocity(product.productId);
    
    // Skip products with no recent sales
    if (salesVelocity < 0.1) continue;

    // Get supplier info
    const supplier = await getSupplierForProduct(product.productId);
    if (!supplier) continue;

    // Calculate reorder point
    const reorderPoint = calculateReorderPoint(
      salesVelocity,
      supplier.leadTimeDays || 14,
      7 // 7 days safety stock
    );

    // Check if current stock is below reorder point
    if (product.currentStock >= reorderPoint) continue;

    // Calculate suggested order quantity using EOQ
    const annualDemand = salesVelocity * 365;
    const orderingCost = 50; // Fixed cost per order
    const holdingCost = supplier.unitCost * 0.25; // 25% of unit cost per year

    const eoq = calculateEOQ({
      annualDemand,
      orderingCost,
      holdingCost,
    });

    // Ensure we order at least enough to reach reorder point + EOQ
    const suggestedOrderQty = Math.max(
      eoq,
      reorderPoint - product.currentStock + Math.ceil(salesVelocity * 30) // 30 days buffer
    );

    candidates.push({
      productId: product.productId,
      productName: product.productName,
      sku: product.sku,
      currentStock: product.currentStock,
      reorderPoint,
      salesVelocity,
      leadTimeDays: supplier.leadTimeDays || 14,
      suggestedOrderQty,
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      unitCost: supplier.unitCost,
      totalCost: suggestedOrderQty * supplier.unitCost,
    });
  }

  return candidates;
}

/**
 * Create purchase orders for reorder candidates
 */
export async function createAutomatedPurchaseOrders(
  candidates: ReorderCandidate[],
  autoApprove: boolean = false
): Promise<string[]> {
  const createdPOIds: string[] = [];

  // Group candidates by supplier
  const supplierGroups = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.supplierId]) {
      acc[candidate.supplierId] = [];
    }
    acc[candidate.supplierId].push(candidate);
    return acc;
  }, {} as Record<string, ReorderCandidate[]>);

  // Create one PO per supplier
  for (const [supplierId, items] of Object.entries(supplierGroups)) {
    const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
    const supplierName = items[0].supplierName;

    // Create purchase order
    const poId = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(purchaseOrders).values({
      id: poId,
      supplierId,
      status: autoApprove ? "approved" : "pending",
      totalAmount,
      expectedDeliveryDate: new Date(
        Date.now() + items[0].leadTimeDays * 24 * 60 * 60 * 1000
      ).toISOString(),
      notes: `Automated reorder based on inventory analysis. ${items.length} product(s) below reorder point.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create purchase order items
    for (const item of items) {
      await db.insert(purchaseOrderItems).values({
        id: `POI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseOrderId: poId,
        productId: item.productId,
        quantity: item.suggestedOrderQty,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    createdPOIds.push(poId);

    // Send email notification to supplier
    await sendEmail({
      to: `supplier-${supplierId}@example.com`, // Replace with actual supplier email
      subject: `New Purchase Order: ${poId}`,
      html: `
        <h2>New Purchase Order</h2>
        <p>Dear ${supplierName},</p>
        <p>We have created a new purchase order for the following items:</p>
        <table border="1" cellpadding="10">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.sku}</td>
                <td>${item.suggestedOrderQty}</td>
                <td>$${item.unitCost.toFixed(2)}</td>
                <td>$${item.totalCost.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p><strong>Total Order Amount: $${totalAmount.toFixed(2)}</strong></p>
        <p>Expected Delivery: ${items[0].leadTimeDays} days</p>
        <p>Please confirm receipt of this order.</p>
      `,
    });
  }

  return createdPOIds;
}

/**
 * Generate reorder report
 */
export async function generateReorderReport(
  candidates: ReorderCandidate[]
): Promise<string> {
  if (candidates.length === 0) {
    return "No products currently need reordering. All inventory levels are healthy.";
  }

  const totalValue = candidates.reduce((sum, c) => sum + c.totalCost, 0);
  const totalUnits = candidates.reduce((sum, c) => sum + c.suggestedOrderQty, 0);

  let report = `
# Automated Reorder Report
Generated: ${new Date().toLocaleString()}

## Summary
- **Products Needing Reorder:** ${candidates.length}
- **Total Units to Order:** ${totalUnits}
- **Total Order Value:** $${totalValue.toFixed(2)}

## Reorder Candidates

| Product | SKU | Current Stock | Reorder Point | Sales Velocity | Suggested Qty | Supplier | Total Cost |
|---------|-----|---------------|---------------|----------------|---------------|----------|------------|
`;

  for (const candidate of candidates) {
    report += `| ${candidate.productName} | ${candidate.sku} | ${candidate.currentStock} | ${candidate.reorderPoint} | ${candidate.salesVelocity.toFixed(2)}/day | ${candidate.suggestedOrderQty} | ${candidate.supplierName} | $${candidate.totalCost.toFixed(2)} |\n`;
  }

  report += `\n## Recommendations\n\n`;
  
  for (const candidate of candidates) {
    const daysUntilStockout = candidate.currentStock / candidate.salesVelocity;
    const urgency = daysUntilStockout < 7 ? "🔴 URGENT" : daysUntilStockout < 14 ? "🟡 SOON" : "🟢 NORMAL";
    
    report += `- ${urgency} **${candidate.productName}** will run out in ${Math.ceil(daysUntilStockout)} days at current sales velocity\n`;
  }

  return report;
}

/**
 * Main cron job function - runs daily
 */
export async function runDailyReorderCheck(): Promise<void> {
  console.log("[Automated Reorder] Starting daily inventory check...");

  try {
    // Find products that need reordering
    const candidates = await findReorderCandidates();
    
    console.log(`[Automated Reorder] Found ${candidates.length} products below reorder point`);

    if (candidates.length === 0) {
      console.log("[Automated Reorder] No action needed. All inventory levels are healthy.");
      return;
    }

    // Generate report
    const report = await generateReorderReport(candidates);
    console.log(report);

    // Check if auto-approval is enabled
    const settings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "auto_approve_reorders"))
      .limit(1);

    const autoApprove = settings[0]?.value === "true";

    // Create purchase orders
    const poIds = await createAutomatedPurchaseOrders(candidates, autoApprove);
    
    console.log(`[Automated Reorder] Created ${poIds.length} purchase orders: ${poIds.join(", ")}`);

    // Send notification email to admin
    await sendEmail({
      to: "admin@example.com", // Replace with actual admin email
      subject: `Automated Reorder Alert: ${candidates.length} Products Need Restocking`,
      html: `
        <h2>Automated Reorder Report</h2>
        <p>${candidates.length} products have fallen below their reorder points.</p>
        <p><strong>${poIds.length} purchase orders have been ${autoApprove ? "created and approved" : "created for your review"}.</strong></p>
        <h3>Summary</h3>
        <ul>
          <li>Total Units to Order: ${candidates.reduce((sum, c) => sum + c.suggestedOrderQty, 0)}</li>
          <li>Total Order Value: $${candidates.reduce((sum, c) => sum + c.totalCost, 0).toFixed(2)}</li>
        </ul>
        <h3>Purchase Orders Created</h3>
        <ul>
          ${poIds.map((id) => `<li>${id}</li>`).join("")}
        </ul>
        <p>Please review these orders in the admin dashboard.</p>
        <pre>${report}</pre>
      `,
    });

    console.log("[Automated Reorder] Daily check completed successfully");
  } catch (error) {
    console.error("[Automated Reorder] Error during daily check:", error);
    
    // Send error notification
    await sendEmail({
      to: "admin@example.com",
      subject: "Automated Reorder System Error",
      html: `
        <h2>Error in Automated Reorder System</h2>
        <p>An error occurred during the daily reorder check:</p>
        <pre>${error}</pre>
        <p>Please investigate and resolve this issue.</p>
      `,
    });
  }
}

// Schedule daily check at 2 AM
// In production, use a cron job scheduler like node-cron or a cloud scheduler
// Example: cron.schedule('0 2 * * *', runDailyReorderCheck);
