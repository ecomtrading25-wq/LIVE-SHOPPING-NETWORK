import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

const connection = mysql.createPool(process.env.DATABASE_URL!);
const db = drizzle(connection);
import { inventory, products, appSettings } from "../drizzle/schema";
import { eq, lt, and } from "drizzle-orm";
import { sendEmail } from "./email";

/**
 * Inventory Alerts System
 * Automated low-stock notifications and reorder suggestions
 */

interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  reorderQuantity: number;
  salesVelocity: number; // units per day
  daysUntilStockout: number;
}

interface InventoryAlertSettings {
  lowStockThreshold: number; // Default threshold (e.g., 10 units)
  criticalStockThreshold: number; // Critical threshold (e.g., 5 units)
  alertEmails: string[]; // Email addresses to notify
  checkInterval: number; // Hours between checks
  salesVelocityDays: number; // Days to calculate sales velocity
}

/**
 * Get inventory alert settings
 */
export async function getInventoryAlertSettings(): Promise<InventoryAlertSettings> {
  const settings = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.settingKey, "inventory_alerts"))
    .limit(1);

  if (settings.length > 0 && settings[0].settingValue) {
    return JSON.parse(settings[0].settingValue as string);
  }

  // Default settings
  return {
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    alertEmails: ["ops@liveshoppingnetwork.com"],
    checkInterval: 24,
    salesVelocityDays: 7,
  };
}

/**
 * Update inventory alert settings
 */
export async function updateInventoryAlertSettings(
  settings: Partial<InventoryAlertSettings>
): Promise<void> {
  const currentSettings = await getInventoryAlertSettings();
  const newSettings = { ...currentSettings, ...settings };

  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.settingKey, "inventory_alerts"))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(appSettings)
      .set({ settingValue: JSON.stringify(newSettings) })
      .where(eq(appSettings.settingKey, "inventory_alerts"));
  } else {
    await db.insert(appSettings).values({
      id: nanoid(),
      settingKey: "inventory_alerts",
      settingValue: JSON.stringify(newSettings),
    });
  }
}

/**
 * Calculate sales velocity for a product
 * Returns average units sold per day
 */
export async function calculateSalesVelocity(
  productId: string,
  days: number = 7
): Promise<number> {
  // In production, query orders table for actual sales data
  // For now, return mock data
  const mockSalesPerDay = Math.floor(Math.random() * 5) + 1;
  return mockSalesPerDay;
}

/**
 * Calculate suggested reorder quantity
 * Based on sales velocity and lead time
 */
export function calculateReorderQuantity(
  salesVelocity: number,
  leadTimeDays: number = 14,
  safetyStock: number = 7
): number {
  // Reorder quantity = (sales velocity * lead time) + (sales velocity * safety stock days)
  const reorderQty = salesVelocity * leadTimeDays + salesVelocity * safetyStock;
  return Math.ceil(reorderQty);
}

/**
 * Get low stock items
 */
export async function getLowStockItems(): Promise<LowStockItem[]> {
  const settings = await getInventoryAlertSettings();

  // Get all inventory items below threshold
  const lowStockInventory = await db
    .select({
      productId: inventory.productId,
      available: inventory.available,
      onHand: inventory.onHand,
    })
    .from(inventory)
    .where(lt(inventory.available, settings.lowStockThreshold));

  const lowStockItems: LowStockItem[] = [];

  for (const inv of lowStockInventory) {
    // Get product details
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, inv.productId))
      .limit(1);

    if (product.length === 0) continue;

    const salesVelocity = await calculateSalesVelocity(
      inv.productId,
      settings.salesVelocityDays
    );

    const daysUntilStockout =
      salesVelocity > 0 ? Math.floor(inv.available / salesVelocity) : 999;

    const reorderQuantity = calculateReorderQuantity(salesVelocity);

    lowStockItems.push({
      productId: inv.productId,
      productName: product[0].name,
      sku: product[0].sku,
      currentStock: inv.available,
      threshold: settings.lowStockThreshold,
      reorderQuantity,
      salesVelocity,
      daysUntilStockout,
    });
  }

  // Sort by days until stockout (most urgent first)
  return lowStockItems.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/**
 * Get critical stock items (below critical threshold)
 */
export async function getCriticalStockItems(): Promise<LowStockItem[]> {
  const settings = await getInventoryAlertSettings();
  const allLowStock = await getLowStockItems();

  return allLowStock.filter(
    (item) => item.currentStock <= settings.criticalStockThreshold
  );
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(items: LowStockItem[]): Promise<void> {
  const settings = await getInventoryAlertSettings();

  if (items.length === 0) return;

  const criticalItems = items.filter(
    (item) => item.currentStock <= settings.criticalStockThreshold
  );
  const warningItems = items.filter(
    (item) => item.currentStock > settings.criticalStockThreshold
  );

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-critical { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .product-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .product-name { font-weight: bold; color: #1f2937; }
        .product-details { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .reorder-btn { background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate action required for ${items.length} product${items.length > 1 ? "s" : ""}</p>
        </div>
        
        <div class="content">
          ${
            criticalItems.length > 0
              ? `
          <div class="alert-critical">
            <h2 style="margin: 0 0 15px 0; color: #dc2626;">🚨 Critical Stock (${criticalItems.length} items)</h2>
            ${criticalItems
              .map(
                (item) => `
              <div class="product-item">
                <div class="product-name">${item.productName}</div>
                <div class="product-details">
                  SKU: ${item.sku} | Current Stock: <strong>${item.currentStock} units</strong><br/>
                  Sales Velocity: ${item.salesVelocity} units/day | Days Until Stockout: <strong>${item.daysUntilStockout} days</strong><br/>
                  Suggested Reorder: <strong>${item.reorderQuantity} units</strong>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }
          
          ${
            warningItems.length > 0
              ? `
          <div class="alert-warning">
            <h2 style="margin: 0 0 15px 0; color: #d97706;">⚠️ Low Stock Warning (${warningItems.length} items)</h2>
            ${warningItems
              .map(
                (item) => `
              <div class="product-item">
                <div class="product-name">${item.productName}</div>
                <div class="product-details">
                  SKU: ${item.sku} | Current Stock: <strong>${item.currentStock} units</strong><br/>
                  Sales Velocity: ${item.salesVelocity} units/day | Days Until Stockout: <strong>${item.daysUntilStockout} days</strong><br/>
                  Suggested Reorder: <strong>${item.reorderQuantity} units</strong>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.VITE_APP_URL || "https://liveshoppingnetwork.com"}/admin/products" class="reorder-btn">
              View Products & Reorder
            </a>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">📊 Inventory Summary</h3>
            <p style="margin: 5px 0; color: #6b7280;">
              Total Low Stock Items: <strong>${items.length}</strong><br/>
              Critical Items: <strong style="color: #dc2626;">${criticalItems.length}</strong><br/>
              Warning Items: <strong style="color: #d97706;">${warningItems.length}</strong>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated alert from Live Shopping Network Inventory Management System</p>
          <p>To adjust alert thresholds, visit Admin Dashboard → Settings → Inventory Alerts</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all configured email addresses
  for (const email of settings.alertEmails) {
    await sendEmail(
      email,
      {
        subject: `🚨 Low Stock Alert: ${items.length} Product${items.length > 1 ? "s" : ""} Need Attention`,
        body: emailHtml,
      },
      { type: "inventory_alert", itemCount: items.length }
    );
  }
}

/**
 * Check inventory and send alerts if needed
 * This should be called by a cron job
 */
export async function checkInventoryAndAlert(): Promise<{
  lowStockItems: LowStockItem[];
  criticalStockItems: LowStockItem[];
  alertSent: boolean;
}> {
  const lowStockItems = await getLowStockItems();
  const criticalStockItems = await getCriticalStockItems();

  let alertSent = false;

  if (lowStockItems.length > 0) {
    await sendLowStockAlert(lowStockItems);
    alertSent = true;
  }

  return {
    lowStockItems,
    criticalStockItems,
    alertSent,
  };
}

/**
 * Get inventory health dashboard data
 */
export async function getInventoryHealthDashboard(): Promise<{
  totalProducts: number;
  lowStockCount: number;
  criticalStockCount: number;
  healthyStockCount: number;
  topUrgentItems: LowStockItem[];
}> {
  const settings = await getInventoryAlertSettings();

  // Get all inventory
  const allInventory = await db.select().from(inventory);

  const lowStockItems = await getLowStockItems();
  const criticalStockItems = await getCriticalStockItems();

  const lowStockCount = lowStockItems.length;
  const criticalStockCount = criticalStockItems.length;
  const healthyStockCount = allInventory.length - lowStockCount;

  return {
    totalProducts: allInventory.length,
    lowStockCount,
    criticalStockCount,
    healthyStockCount,
    topUrgentItems: lowStockItems.slice(0, 10), // Top 10 most urgent
  };
}
