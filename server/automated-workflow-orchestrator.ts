/**
 * Automated Workflow Orchestrator
 * 
 * Intelligent automation engine for inventory reordering, fulfillment routing,
 * customer service, marketing campaigns, and business process automation.
 */

import { invokeLLM } from './_core/llm';
import { db } from './_core/db';
import { products, orders, inventory, suppliers, customers, fulfillmentTasks } from '../drizzle/schema';
import { eq, sql, lt, and, gte } from 'drizzle-orm';
import { generateDemandForecast } from './ai-business-intelligence';

// ============================================================================
// SMART INVENTORY REORDERING
// ============================================================================

interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  recommendedQuantity: number;
  estimatedCost: number;
  supplierId: string;
  supplierName: string;
  leadTimeDays: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
}

export async function generateReorderRecommendations(): Promise<ReorderRecommendation[]> {
  const recommendations: ReorderRecommendation[] = [];

  // Get all products with low stock
  const lowStockProducts = await db
    .select({
      productId: products.id,
      productName: products.name,
      currentStock: inventory.quantity,
      reorderPoint: products.reorderPoint,
      unitCost: products.cost,
      supplierId: products.supplierId,
      supplierName: suppliers.name,
      leadTime: suppliers.leadTimeDays
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(lt(inventory.quantity, products.reorderPoint));

  for (const product of lowStockProducts) {
    // Get demand forecast
    const forecast = await generateDemandForecast(product.productId);

    // Calculate Economic Order Quantity (EOQ)
    // EOQ = sqrt((2 * D * S) / H)
    // D = annual demand, S = ordering cost, H = holding cost per unit per year
    const annualDemand = forecast.averageDailySales * 365;
    const orderingCost = 50; // Fixed cost per order
    const holdingCostRate = 0.25; // 25% of unit cost per year
    const holdingCost = product.unitCost * holdingCostRate;

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);

    // Adjust for lead time and safety stock
    const leadTimeDemand = forecast.averageDailySales * product.leadTime;
    const safetyStock = leadTimeDemand * 1.5; // 50% buffer
    const recommendedQuantity = Math.max(eoq, leadTimeDemand + safetyStock);

    // Determine urgency
    const daysUntilStockout = product.currentStock / forecast.averageDailySales;
    let urgency: ReorderRecommendation['urgency'];
    if (daysUntilStockout <= 3) urgency = 'critical';
    else if (daysUntilStockout <= 7) urgency = 'high';
    else if (daysUntilStockout <= 14) urgency = 'medium';
    else urgency = 'low';

    recommendations.push({
      productId: product.productId,
      productName: product.productName,
      currentStock: product.currentStock,
      reorderPoint: product.reorderPoint,
      economicOrderQuantity: Math.round(eoq),
      recommendedQuantity: Math.round(recommendedQuantity),
      estimatedCost: recommendedQuantity * product.unitCost,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      leadTimeDays: product.leadTime,
      urgency,
      reasoning: `Stock will last ${daysUntilStockout.toFixed(1)} days at current sales rate. EOQ analysis suggests ordering ${Math.round(recommendedQuantity)} units to optimize costs.`
    });
  }

  return recommendations.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
  totalCost: number;
  expectedDeliveryDate: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received';
  notes: string;
}

export async function generatePurchaseOrder(recommendations: ReorderRecommendation[]): Promise<PurchaseOrder> {
  // Group recommendations by supplier
  const supplierGroups = recommendations.reduce((acc, rec) => {
    if (!acc[rec.supplierId]) acc[rec.supplierId] = [];
    acc[rec.supplierId].push(rec);
    return acc;
  }, {} as Record<string, ReorderRecommendation[]>);

  // Generate PO for the supplier with most urgent items
  const urgentSupplier = Object.entries(supplierGroups)
    .sort(([, a], [, b]) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a[0].urgency] - urgencyOrder[b[0].urgency];
    })[0];

  const [supplierId, items] = urgentSupplier;
  const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const maxLeadTime = Math.max(...items.map(i => i.leadTimeDays));
  const expectedDeliveryDate = new Date(Date.now() + maxLeadTime * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `PO-${Date.now()}`,
    supplierId,
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.recommendedQuantity,
      unitCost: item.estimatedCost / item.recommendedQuantity
    })),
    totalCost,
    expectedDeliveryDate,
    status: 'draft',
    notes: `Auto-generated purchase order based on demand forecast and EOQ analysis. ${items.filter(i => i.urgency === 'critical').length} critical items included.`
  };
}

// ============================================================================
// SMART FULFILLMENT ROUTING
// ============================================================================

interface FulfillmentRoute {
  orderId: string;
  warehouseId: string;
  warehouseName: string;
  distance: number;
  estimatedShippingCost: number;
  estimatedDeliveryDays: number;
  carrierId: string;
  carrierName: string;
  score: number; // Overall routing score (lower is better)
  reasoning: string;
}

export async function calculateOptimalFulfillmentRoute(orderId: string): Promise<FulfillmentRoute> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true }
  });

  if (!order) throw new Error('Order not found');

  // Get all warehouses with available inventory
  const warehouses = await db.query.warehouses.findMany({
    with: { inventory: true }
  });

  // Calculate routing scores for each warehouse
  const routes: FulfillmentRoute[] = [];

  for (const warehouse of warehouses) {
    // Check if warehouse has all items in stock
    const hasAllItems = order.items.every(item => {
      const warehouseInventory = warehouse.inventory.find(inv => inv.productId === item.productId);
      return warehouseInventory && warehouseInventory.quantity >= item.quantity;
    });

    if (!hasAllItems) continue;

    // Calculate distance (mock - in production use actual geocoding)
    const distance = Math.random() * 500 + 50; // 50-550 miles

    // Estimate shipping cost based on distance and weight
    const totalWeight = order.items.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0);
    const baseRate = 5.99;
    const perMileRate = 0.05;
    const perPoundRate = 0.50;
    const estimatedShippingCost = baseRate + (distance * perMileRate) + (totalWeight * perPoundRate);

    // Estimate delivery time
    const estimatedDeliveryDays = Math.ceil(distance / 200); // ~200 miles per day

    // Calculate routing score (lower is better)
    // Factors: cost (40%), speed (40%), distance (20%)
    const costScore = estimatedShippingCost / 50; // Normalize to ~1
    const speedScore = estimatedDeliveryDays / 3; // Normalize to ~1
    const distanceScore = distance / 500; // Normalize to ~1
    const score = (costScore * 0.4) + (speedScore * 0.4) + (distanceScore * 0.2);

    routes.push({
      orderId,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      distance,
      estimatedShippingCost,
      estimatedDeliveryDays,
      carrierId: 'carrier_1',
      carrierName: 'FastShip Express',
      score,
      reasoning: `${warehouse.name} is ${distance.toFixed(0)} miles away. Estimated cost: $${estimatedShippingCost.toFixed(2)}, delivery: ${estimatedDeliveryDays} days.`
    });
  }

  // Return best route (lowest score)
  return routes.sort((a, b) => a.score - b.score)[0];
}

export async function autoAssignFulfillmentTasks(): Promise<number> {
  // Get all pending orders without fulfillment tasks
  const pendingOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, 'confirmed'),
        sql`NOT EXISTS (SELECT 1 FROM ${fulfillmentTasks} WHERE ${fulfillmentTasks.orderId} = ${orders.id})`
      )
    );

  let assignedCount = 0;

  for (const order of pendingOrders) {
    try {
      const route = await calculateOptimalFulfillmentRoute(order.id);

      // Create fulfillment task
      await db.insert(fulfillmentTasks).values({
        orderId: order.id,
        warehouseId: route.warehouseId,
        type: 'pick',
        status: 'pending',
        priority: order.priority || 'normal',
        assignedTo: null,
        createdAt: new Date()
      });

      assignedCount++;
    } catch (error) {
      console.error(`Failed to assign fulfillment for order ${order.id}:`, error);
    }
  }

  return assignedCount;
}

// ============================================================================
// AI CUSTOMER SERVICE CHATBOT
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatbotResponse {
  message: string;
  intent: 'order_status' | 'return_request' | 'product_inquiry' | 'complaint' | 'general';
  confidence: number;
  suggestedActions: string[];
  requiresHumanEscalation: boolean;
}

export async function handleCustomerInquiry(
  customerId: string,
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatbotResponse> {
  // Get customer context
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId)
  });

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  // Build context for AI
  const systemPrompt = `You are a helpful customer service assistant for Live Shopping Network.

Customer Information:
- Name: ${customer?.name}
- Email: ${customer?.email}
- Total Orders: ${customerOrders.length}
- Recent Orders: ${customerOrders.map(o => `#${o.id} (${o.status})`).join(', ')}

Guidelines:
- Be friendly, professional, and empathetic
- Provide accurate information about orders and products
- Offer proactive solutions
- Escalate to human agent if: complaint, refund request, or complex issue
- Use customer's name when appropriate`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'chatbot_response',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            intent: { type: 'string', enum: ['order_status', 'return_request', 'product_inquiry', 'complaint', 'general'] },
            confidence: { type: 'number' },
            suggestedActions: { type: 'array', items: { type: 'string' } },
            requiresHumanEscalation: { type: 'boolean' }
          },
          required: ['message', 'intent', 'confidence', 'suggestedActions', 'requiresHumanEscalation'],
          additionalProperties: false
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content);
}

// ============================================================================
// EMAIL MARKETING AUTOMATION
// ============================================================================

interface EmailCampaign {
  id: string;
  name: string;
  type: 'welcome' | 'abandoned_cart' | 'post_purchase' | 'win_back' | 'promotional';
  trigger: string;
  subject: string;
  content: string;
  targetSegment: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'sent';
}

export async function generateWelcomeEmail(customerId: string): Promise<EmailCampaign> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId)
  });

  const subject = `Welcome to Live Shopping Network, ${customer?.name}! 🎉`;
  const content = `
Hi ${customer?.name},

Welcome to Live Shopping Network! We're thrilled to have you join our community of savvy shoppers.

Here's what you can look forward to:
✨ Exclusive live shopping events with amazing deals
🎁 Special welcome discount: Use code WELCOME15 for 15% off your first order
🔥 Early access to new product launches
💎 Loyalty rewards with every purchase

Ready to start shopping? Check out our live shows happening now!

Happy Shopping,
The Live Shopping Network Team
  `;

  return {
    id: `email_${Date.now()}`,
    name: `Welcome - ${customer?.name}`,
    type: 'welcome',
    trigger: 'new_customer_signup',
    subject,
    content,
    targetSegment: `customer_${customerId}`,
    status: 'draft'
  };
}

export async function generateAbandonedCartEmail(customerId: string, cartItems: any[]): Promise<EmailCampaign> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId)
  });

  const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountCode = `CART${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const subject = `Don't forget your items! Plus 10% off 🛒`;
  const content = `
Hi ${customer?.name},

You left some great items in your cart! We've saved them for you:

${cartItems.map(item => `• ${item.name} (${item.quantity}x) - $${item.price.toFixed(2)}`).join('\n')}

Total: $${totalValue.toFixed(2)}

Complete your purchase now and get 10% off with code: ${discountCode}

This offer expires in 24 hours!

[Complete Your Purchase]

Happy Shopping,
The Live Shopping Network Team
  `;

  return {
    id: `email_${Date.now()}`,
    name: `Abandoned Cart - ${customer?.name}`,
    type: 'abandoned_cart',
    trigger: 'cart_abandoned_24h',
    subject,
    content,
    targetSegment: `customer_${customerId}`,
    status: 'draft'
  };
}

export async function generatePostPurchaseEmail(orderId: string): Promise<EmailCampaign> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { customer: true, items: true }
  });

  if (!order) throw new Error('Order not found');

  const subject = `Thanks for your order! #${orderId} 📦`;
  const content = `
Hi ${order.customer.name},

Thank you for your order! We're preparing your items for shipment.

Order #${orderId}
${order.items.map(item => `• ${item.name} (${item.quantity}x) - $${item.price.toFixed(2)}`).join('\n')}

Total: $${order.total.toFixed(2)}

You'll receive a tracking number once your order ships (usually within 1-2 business days).

Love your purchase? Leave a review and earn 100 loyalty points!

[Track Your Order] [Leave a Review]

Happy Shopping,
The Live Shopping Network Team
  `;

  return {
    id: `email_${Date.now()}`,
    name: `Post Purchase - Order ${orderId}`,
    type: 'post_purchase',
    trigger: 'order_confirmed',
    subject,
    content,
    targetSegment: `customer_${order.customerId}`,
    status: 'draft'
  };
}

// ============================================================================
// AUTOMATED DISPUTE RESOLUTION
// ============================================================================

interface DisputeResolution {
  disputeId: string;
  resolution: 'full_refund' | 'partial_refund' | 'replacement' | 'store_credit' | 'escalate';
  amount?: number;
  reasoning: string;
  confidence: number;
  requiresApproval: boolean;
}

export async function analyzeAndResolveDispute(disputeId: string): Promise<DisputeResolution> {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.id, disputeId),
    with: { order: true, customer: true }
  });

  if (!dispute) throw new Error('Dispute not found');

  // Get customer history
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, dispute.customerId));

  const lifetimeValue = customerOrders.reduce((sum, order) => sum + order.total, 0);
  const disputeRate = customerOrders.filter(o => o.hasDispute).length / customerOrders.length;

  // Use AI to analyze dispute
  const analysisPrompt = `Analyze this customer dispute and recommend a resolution:

Dispute Details:
- Reason: ${dispute.reason}
- Description: ${dispute.description}
- Order Total: $${dispute.order.total}
- Customer Lifetime Value: $${lifetimeValue.toFixed(2)}
- Customer Dispute Rate: ${(disputeRate * 100).toFixed(1)}%
- Order Count: ${customerOrders.length}

Provide a JSON recommendation with:
1. Resolution type (full_refund/partial_refund/replacement/store_credit/escalate)
2. Amount (if applicable)
3. Reasoning
4. Confidence level (0-100)
5. Whether it requires manager approval

Consider customer value, dispute history, and company policy.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert customer service manager specializing in dispute resolution.' },
      { role: 'user', content: analysisPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'dispute_resolution',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            resolution: { type: 'string', enum: ['full_refund', 'partial_refund', 'replacement', 'store_credit', 'escalate'] },
            amount: { type: 'number' },
            reasoning: { type: 'string' },
            confidence: { type: 'number' },
            requiresApproval: { type: 'boolean' }
          },
          required: ['resolution', 'reasoning', 'confidence', 'requiresApproval'],
          additionalProperties: false
        }
      }
    }
  });

  const recommendation = JSON.parse(response.choices[0].message.content);

  return {
    disputeId,
    ...recommendation
  };
}

// Export all workflow functions
export const AutomatedWorkflowOrchestrator = {
  generateReorderRecommendations,
  generatePurchaseOrder,
  calculateOptimalFulfillmentRoute,
  autoAssignFulfillmentTasks,
  handleCustomerInquiry,
  generateWelcomeEmail,
  generateAbandonedCartEmail,
  generatePostPurchaseEmail,
  analyzeAndResolveDispute
};
