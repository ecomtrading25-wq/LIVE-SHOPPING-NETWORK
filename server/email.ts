import { notifyOwner } from "./_core/notification";

/**
 * Email Notification System
 * Order confirmations, shipment tracking, dispute resolution, creator payouts
 */

interface EmailTemplate {
  subject: string;
  body: string;
}

// Email Templates
const templates = {
  orderConfirmation: (data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: string;
  }): EmailTemplate => ({
    subject: `Order Confirmation #${data.orderNumber}`,
    body: `
Hi ${data.customerName},

Thank you for your order! We've received your order and will begin processing it shortly.

Order Number: #${data.orderNumber}
Order Total: $${data.total.toFixed(2)}

Items:
${data.items.map(item => `- ${item.name} (x${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}

Shipping Address:
${data.shippingAddress}

You'll receive another email with tracking information once your order ships.

Thank you for shopping with Live Shopping Network!

Best regards,
Live Shopping Network Team
    `.trim(),
  }),

  shipmentTracking: (data: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery?: string;
  }): EmailTemplate => ({
    subject: `Your Order #${data.orderNumber} Has Shipped!`,
    body: `
Hi ${data.customerName},

Great news! Your order has been shipped and is on its way to you.

Order Number: #${data.orderNumber}
Carrier: ${data.carrier}
Tracking Number: ${data.trackingNumber}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ''}

You can track your package using the tracking number above.

Thank you for your purchase!

Best regards,
Live Shopping Network Team
    `.trim(),
  }),

  disputeUpdate: (data: {
    disputeId: string;
    orderNumber: string;
    customerName: string;
    status: string;
    message: string;
  }): EmailTemplate => ({
    subject: `Update on Your Dispute #${data.disputeId}`,
    body: `
Hi ${data.customerName},

We have an update regarding your dispute for Order #${data.orderNumber}.

Dispute ID: #${data.disputeId}
Status: ${data.status}

${data.message}

If you have any questions, please don't hesitate to contact our support team.

Best regards,
Live Shopping Network Team
    `.trim(),
  }),

  creatorPayout: (data: {
    creatorName: string;
    amount: number;
    period: string;
    payoutDate: string;
    method: string;
  }): EmailTemplate => ({
    subject: `Your Payout of $${data.amount.toFixed(2)} is Ready`,
    body: `
Hi ${data.creatorName},

Your payout for ${data.period} is ready!

Amount: $${data.amount.toFixed(2)}
Payout Date: ${data.payoutDate}
Payment Method: ${data.method}

The funds should arrive in your account within 2-3 business days.

Keep up the great work!

Best regards,
Live Shopping Network Team
    `.trim(),
  }),

  lowStockAlert: (data: {
    productName: string;
    sku: string;
    currentStock: number;
    threshold: number;
  }): EmailTemplate => ({
    subject: `Low Stock Alert: ${data.productName}`,
    body: `
ALERT: Low Stock Warning

Product: ${data.productName}
SKU: ${data.sku}
Current Stock: ${data.currentStock}
Threshold: ${data.threshold}

Please reorder inventory to avoid stockouts.

Best regards,
Live Shopping Network System
    `.trim(),
  }),

  disputeResolved: (data: {
    disputeId: string;
    orderNumber: string;
    customerName: string;
    resolution: string;
    refundAmount?: number;
  }): EmailTemplate => ({
    subject: `Your Dispute #${data.disputeId} Has Been Resolved`,
    body: `
Hi ${data.customerName},

Your dispute for Order #${data.orderNumber} has been resolved.

Dispute ID: #${data.disputeId}
Resolution: ${data.resolution}
${data.refundAmount ? `Refund Amount: $${data.refundAmount.toFixed(2)}` : ''}

${data.refundAmount ? 'Your refund will be processed within 5-7 business days.' : ''}

Thank you for your patience.

Best regards,
Live Shopping Network Team
    `.trim(),
  }),
};

/**
 * Send email notification
 * Uses the built-in notification system to alert the owner
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    // For now, notify the owner about the email that would be sent
    // In production, replace this with actual email service integration
    await notifyOwner({
      title: `Email: ${template.subject}`,
      content: `To: ${to}\n\n${template.body}`,
    });

    // Log the email for debugging
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${template.subject}`);
    console.log(`[EMAIL] Body:\n${template.body}`);
    if (metadata) {
      console.log(`[EMAIL] Metadata:`, metadata);
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    return false;
  }
}

// Convenience functions for common email types
export const emailService = {
  sendOrderConfirmation: async (
    email: string,
    data: Parameters<typeof templates.orderConfirmation>[0]
  ) => {
    return sendEmail(email, templates.orderConfirmation(data), {
      type: "order_confirmation",
      orderNumber: data.orderNumber,
    });
  },

  sendShipmentTracking: async (
    email: string,
    data: Parameters<typeof templates.shipmentTracking>[0]
  ) => {
    return sendEmail(email, templates.shipmentTracking(data), {
      type: "shipment_tracking",
      orderNumber: data.orderNumber,
      trackingNumber: data.trackingNumber,
    });
  },

  sendDisputeUpdate: async (
    email: string,
    data: Parameters<typeof templates.disputeUpdate>[0]
  ) => {
    return sendEmail(email, templates.disputeUpdate(data), {
      type: "dispute_update",
      disputeId: data.disputeId,
    });
  },

  sendCreatorPayout: async (
    email: string,
    data: Parameters<typeof templates.creatorPayout>[0]
  ) => {
    return sendEmail(email, templates.creatorPayout(data), {
      type: "creator_payout",
      amount: data.amount,
    });
  },

  sendLowStockAlert: async (
    email: string,
    data: Parameters<typeof templates.lowStockAlert>[0]
  ) => {
    return sendEmail(email, templates.lowStockAlert(data), {
      type: "low_stock_alert",
      sku: data.sku,
    });
  },

  sendDisputeResolved: async (
    email: string,
    data: Parameters<typeof templates.disputeResolved>[0]
  ) => {
    return sendEmail(email, templates.disputeResolved(data), {
      type: "dispute_resolved",
      disputeId: data.disputeId,
    });
  },
};

// Export templates for testing and customization
export { templates };
