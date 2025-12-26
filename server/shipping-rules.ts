import { db } from "./_core/db";
import { eq, and } from "drizzle-orm";
import { mysqlTable, varchar, decimal, int, text, timestamp } from "drizzle-orm/mysql-core";

// Shipping rules table
export const shippingRules = mysqlTable("shipping_rules", {
  id: varchar("id", { length: 255 }).primaryKey(),
  channelId: varchar("channel_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  priority: int("priority").notNull().default(0),
  conditions: text("conditions").notNull(), // JSON
  actions: text("actions").notNull(), // JSON
  enabled: int("enabled").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

interface ShippingRuleCondition {
  type: "order_value" | "weight" | "destination_country" | "destination_state" | "product_category" | "customer_tier";
  operator: ">" | "<" | "=" | ">=" | "<=" | "in" | "not_in";
  value: any;
}

interface ShippingRuleAction {
  type: "free_shipping" | "select_carrier" | "add_surcharge" | "require_signature" | "insurance";
  value: any;
}

interface ShippingRule {
  id: string;
  channelId: string;
  name: string;
  priority: number;
  conditions: ShippingRuleCondition[];
  actions: ShippingRuleAction[];
  enabled: boolean;
}

/**
 * Evaluate shipping rules for an order
 */
export async function evaluateShippingRules(order: {
  channelId: string;
  totalValue: number;
  weight: number;
  destinationCountry: string;
  destinationState: string;
  productCategories: string[];
  customerTier?: string;
}): Promise<{
  freeShipping: boolean;
  selectedCarrier?: string;
  surcharge: number;
  requireSignature: boolean;
  insurance: boolean;
  appliedRules: string[];
}> {
  const rules = await db
    .select()
    .from(shippingRules)
    .where(
      and(
        eq(shippingRules.channelId, order.channelId),
        eq(shippingRules.enabled, 1)
      )
    )
    .orderBy(shippingRules.priority);

  const result = {
    freeShipping: false,
    selectedCarrier: undefined as string | undefined,
    surcharge: 0,
    requireSignature: false,
    insurance: false,
    appliedRules: [] as string[],
  };

  for (const rule of rules) {
    const conditions: ShippingRuleCondition[] = JSON.parse(rule.conditions);
    const actions: ShippingRuleAction[] = JSON.parse(rule.actions);

    // Check if all conditions match
    const allConditionsMet = conditions.every((condition) =>
      evaluateCondition(condition, order)
    );

    if (allConditionsMet) {
      // Apply actions
      for (const action of actions) {
        applyAction(action, result);
      }
      result.appliedRules.push(rule.name);
    }
  }

  return result;
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: ShippingRuleCondition,
  order: any
): boolean {
  switch (condition.type) {
    case "order_value":
      return evaluateNumericCondition(order.totalValue, condition.operator, condition.value);
    
    case "weight":
      return evaluateNumericCondition(order.weight, condition.operator, condition.value);
    
    case "destination_country":
      return evaluateStringCondition(order.destinationCountry, condition.operator, condition.value);
    
    case "destination_state":
      return evaluateStringCondition(order.destinationState, condition.operator, condition.value);
    
    case "product_category":
      if (condition.operator === "in") {
        return order.productCategories.some((cat: string) =>
          condition.value.includes(cat)
        );
      }
      if (condition.operator === "not_in") {
        return !order.productCategories.some((cat: string) =>
          condition.value.includes(cat)
        );
      }
      return false;
    
    case "customer_tier":
      return evaluateStringCondition(order.customerTier || "bronze", condition.operator, condition.value);
    
    default:
      return false;
  }
}

/**
 * Evaluate numeric condition
 */
function evaluateNumericCondition(
  value: number,
  operator: string,
  target: number
): boolean {
  switch (operator) {
    case ">":
      return value > target;
    case "<":
      return value < target;
    case "=":
      return value === target;
    case ">=":
      return value >= target;
    case "<=":
      return value <= target;
    default:
      return false;
  }
}

/**
 * Evaluate string condition
 */
function evaluateStringCondition(
  value: string,
  operator: string,
  target: any
): boolean {
  switch (operator) {
    case "=":
      return value === target;
    case "in":
      return Array.isArray(target) && target.includes(value);
    case "not_in":
      return Array.isArray(target) && !target.includes(value);
    default:
      return false;
  }
}

/**
 * Apply action to result
 */
function applyAction(action: ShippingRuleAction, result: any): void {
  switch (action.type) {
    case "free_shipping":
      result.freeShipping = true;
      break;
    
    case "select_carrier":
      result.selectedCarrier = action.value;
      break;
    
    case "add_surcharge":
      result.surcharge += parseFloat(action.value);
      break;
    
    case "require_signature":
      result.requireSignature = true;
      break;
    
    case "insurance":
      result.insurance = true;
      break;
  }
}

/**
 * Create shipping rule
 */
export async function createShippingRule(rule: Omit<ShippingRule, "id">): Promise<string> {
  const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(shippingRules).values({
    id,
    channelId: rule.channelId,
    name: rule.name,
    priority: rule.priority,
    conditions: JSON.stringify(rule.conditions),
    actions: JSON.stringify(rule.actions),
    enabled: rule.enabled ? 1 : 0,
  });

  return id;
}

/**
 * Update shipping rule
 */
export async function updateShippingRule(
  id: string,
  updates: Partial<Omit<ShippingRule, "id">>
): Promise<void> {
  const updateData: any = {};

  if (updates.name) updateData.name = updates.name;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.conditions) updateData.conditions = JSON.stringify(updates.conditions);
  if (updates.actions) updateData.actions = JSON.stringify(updates.actions);
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled ? 1 : 0;
  updateData.updatedAt = new Date();

  await db
    .update(shippingRules)
    .set(updateData)
    .where(eq(shippingRules.id, id));
}

/**
 * Delete shipping rule
 */
export async function deleteShippingRule(id: string): Promise<void> {
  await db.delete(shippingRules).where(eq(shippingRules.id, id));
}

/**
 * Get all shipping rules for a channel
 */
export async function getShippingRules(channelId: string): Promise<ShippingRule[]> {
  const rules = await db
    .select()
    .from(shippingRules)
    .where(eq(shippingRules.channelId, channelId))
    .orderBy(shippingRules.priority);

  return rules.map((rule) => ({
    id: rule.id,
    channelId: rule.channelId,
    name: rule.name,
    priority: rule.priority,
    conditions: JSON.parse(rule.conditions),
    actions: JSON.parse(rule.actions),
    enabled: rule.enabled === 1,
  }));
}

/**
 * Test shipping rule against sample order
 */
export async function testShippingRule(
  rule: ShippingRule,
  sampleOrder: any
): Promise<any> {
  const conditions: ShippingRuleCondition[] = rule.conditions;
  const actions: ShippingRuleAction[] = rule.actions;

  const allConditionsMet = conditions.every((condition) =>
    evaluateCondition(condition, sampleOrder)
  );

  if (!allConditionsMet) {
    return {
      matched: false,
      reason: "Conditions not met",
    };
  }

  const result = {
    freeShipping: false,
    selectedCarrier: undefined as string | undefined,
    surcharge: 0,
    requireSignature: false,
    insurance: false,
  };

  for (const action of actions) {
    applyAction(action, result);
  }

  return {
    matched: true,
    appliedActions: result,
  };
}

/**
 * Get shipping cost savings from rules
 */
export async function calculateRuleSavings(
  channelId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalSavings: number;
  freeShippingOrders: number;
  averageSavingsPerOrder: number;
}> {
  // This would query orders and calculate actual savings
  // For now, return mock data
  return {
    totalSavings: 15420.50,
    freeShippingOrders: 342,
    averageSavingsPerOrder: 45.09,
  };
}

/**
 * Get most used shipping rules
 */
export async function getTopShippingRules(
  channelId: string,
  limit: number = 10
): Promise<Array<{ ruleName: string; timesApplied: number; totalSavings: number }>> {
  // This would query order logs
  // For now, return mock data
  return [
    { ruleName: "Free Shipping Over $50", timesApplied: 1250, totalSavings: 8750.00 },
    { ruleName: "UPS Ground for Heavy Items", timesApplied: 420, totalSavings: 2100.00 },
    { ruleName: "DHL Express for International", timesApplied: 180, totalSavings: 1800.00 },
    { ruleName: "Signature Required for High Value", timesApplied: 95, totalSavings: 0 },
    { ruleName: "Insurance for Fragile Items", timesApplied: 67, totalSavings: 0 },
  ];
}
