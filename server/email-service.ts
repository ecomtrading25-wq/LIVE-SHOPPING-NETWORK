/**
 * Email Service
 * 
 * Handles all email communications including transactional emails,
 * alerts, and notifications using SendGrid.
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@liveshopping.network';
const ALERT_EMAIL = process.env.ALERT_EMAIL || process.env.FOUNDER_EMAIL || '';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

/**
 * Send email with retry logic
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] SendGrid API key not configured, skipping email send');
    console.log('[Email] Would send:', options.subject, 'to', options.to);
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || FROM_EMAIL,
      subject: options.subject,
      text: options.text || '',
      html: options.html,
      attachments: options.attachments,
    };

    await sgMail.send(msg);
    console.log('[Email] Sent:', options.subject, 'to', options.to);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Send alert email to founder
 */
export async function sendAlertEmail(subject: string, message: string, severity: 'info' | 'warning' | 'critical' = 'info'): Promise<boolean> {
  if (!ALERT_EMAIL) {
    console.warn('[Email] Alert email not configured');
    return false;
  }

  const severityColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${severityColors[severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${severity.toUpperCase()}: ${subject}</h2>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; line-height: 1.6;">${message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Sent by Live Shopping Network Autonomous System<br>
          ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: ALERT_EMAIL,
    subject: `[LSN ${severity.toUpperCase()}] ${subject}`,
    html,
    text: `${severity.toUpperCase()}: ${subject}\n\n${message}`,
  });
}

/**
 * Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderData: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: string;
  }
): Promise<boolean> {
  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3b82f6; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Order Confirmed!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for your order, ${orderData.customerName}</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px;">
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #111827;">Order #${orderData.orderNumber}</h2>
          <p style="color: #6b7280; margin: 5px 0;">Order ID: ${orderData.orderId}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #111827;">Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span style="color: #111827;">$${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span style="color: #6b7280;">Shipping:</span>
              <span style="color: #111827;">$${orderData.shipping.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span style="color: #6b7280;">Tax:</span>
              <span style="color: #111827;">$${orderData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 15px 0 0 0; padding-top: 10px; border-top: 1px solid #e5e7eb;">
              <span style="color: #111827; font-weight: bold; font-size: 18px;">Total:</span>
              <span style="color: #3b82f6; font-weight: bold; font-size: 18px;">$${orderData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #111827;">Shipping Address</h3>
          <p style="color: #6b7280; line-height: 1.6; white-space: pre-line;">${orderData.shippingAddress}</p>
        </div>
      </div>

      <div style="background-color: #111827; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">Questions? Contact us at support@liveshopping.network</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Order Confirmation - #${orderData.orderNumber}`,
    html,
  });
}

/**
 * Shipping Notification Email
 */
export async function sendShippingNotificationEmail(
  to: string,
  shipmentData: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    carrier: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  }
): Promise<boolean> {
  const trackingLink = shipmentData.trackingUrl
    ? `<a href="${shipmentData.trackingUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Track Your Package</a>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #10b981; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">📦 Your Order Has Shipped!</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px;">
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <p style="color: #111827; font-size: 16px;">Hi ${shipmentData.customerName},</p>
          <p style="color: #6b7280; line-height: 1.6;">
            Great news! Your order #${shipmentData.orderNumber} has been shipped and is on its way to you.
          </p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Carrier:</strong> ${shipmentData.carrier}</p>
            <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${shipmentData.trackingNumber}</p>
            ${shipmentData.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${shipmentData.estimatedDelivery}</p>` : ''}
          </div>

          <div style="text-align: center;">
            ${trackingLink}
          </div>
        </div>
      </div>

      <div style="background-color: #111827; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">Questions? Contact us at support@liveshopping.network</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your Order Has Shipped - #${shipmentData.orderNumber}`,
    html,
  });
}

/**
 * Creator Payout Notification Email
 */
export async function sendPayoutNotificationEmail(
  to: string,
  payoutData: {
    creatorName: string;
    amount: number;
    currency: string;
    period: string;
    payoutId: string;
    expectedDate?: string;
  }
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #8b5cf6; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">💰 Payout Processed!</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px;">
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <p style="color: #111827; font-size: 16px;">Hi ${payoutData.creatorName},</p>
          <p style="color: #6b7280; line-height: 1.6;">
            Your payout for ${payoutData.period} has been processed!
          </p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Payout Amount</p>
            <p style="color: #8b5cf6; margin: 10px 0 0 0; font-size: 36px; font-weight: bold;">
              ${payoutData.currency} ${payoutData.amount.toFixed(2)}
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Payout ID:</strong> ${payoutData.payoutId}</p>
            <p style="margin: 5px 0;"><strong>Period:</strong> ${payoutData.period}</p>
            ${payoutData.expectedDate ? `<p style="margin: 5px 0;"><strong>Expected in Account:</strong> ${payoutData.expectedDate}</p>` : ''}
          </div>

          <p style="color: #6b7280; line-height: 1.6;">
            The funds should appear in your account within 3-5 business days.
          </p>
        </div>
      </div>

      <div style="background-color: #111827; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">Questions? Contact us at creator-support@liveshopping.network</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Payout Processed - ${payoutData.currency} ${payoutData.amount.toFixed(2)}`,
    html,
  });
}

/**
 * Abandoned Cart Recovery Email
 */
export async function sendAbandonedCartEmail(
  to: string,
  cartData: {
    customerName: string;
    items: Array<{ name: string; imageUrl?: string; price: number }>;
    cartTotal: number;
    cartUrl: string;
  }
): Promise<boolean> {
  const itemsHtml = cartData.items
    .slice(0, 3)
    .map(
      (item) => `
      <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;">` : ''}
        <div style="flex: 1;">
          <p style="margin: 0; color: #111827; font-weight: 500;">${item.name}</p>
          <p style="margin: 5px 0 0 0; color: #3b82f6; font-weight: bold;">$${item.price.toFixed(2)}</p>
        </div>
      </div>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f59e0b; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">🛒 You Left Something Behind!</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px;">
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <p style="color: #111827; font-size: 16px;">Hi ${cartData.customerName},</p>
          <p style="color: #6b7280; line-height: 1.6;">
            We noticed you left some items in your cart. Don't worry, we saved them for you!
          </p>
          
          ${itemsHtml}
          
          ${cartData.items.length > 3 ? `<p style="color: #6b7280; text-align: center;">...and ${cartData.items.length - 3} more item(s)</p>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #111827; font-size: 24px; font-weight: bold; margin: 0;">
              Cart Total: $${cartData.cartTotal.toFixed(2)}
            </p>
            <a href="${cartData.cartUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">
              Complete Your Purchase
            </a>
          </div>
        </div>
      </div>

      <div style="background-color: #111827; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">Questions? Contact us at support@liveshopping.network</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: '🛒 Complete Your Purchase - Items Still in Your Cart',
    html,
  });
}

/**
 * Daily Summary Email
 */
export async function sendDailySummaryEmail(
  to: string,
  summaryData: {
    date: string;
    revenue: number;
    orders: number;
    newCustomers: number;
    fraudAlerts: number;
    lowStockItems: number;
    pendingApprovals: number;
    topProducts: Array<{ name: string; sales: number }>;
    alerts: Array<{ severity: string; message: string }>;
  }
): Promise<boolean> {
  const topProductsHtml = summaryData.topProducts
    .map(
      (product, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}. ${product.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${product.sales} sales</td>
      </tr>
    `
    )
    .join('');

  const alertsHtml = summaryData.alerts
    .map(
      (alert) => `
      <div style="padding: 10px; margin: 10px 0; background-color: ${alert.severity === 'critical' ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}; border-radius: 4px;">
        <p style="margin: 0; color: #111827; font-size: 14px;">${alert.message}</p>
      </div>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background-color: #3b82f6; color: white; padding: 30px;">
        <h1 style="margin: 0;">📊 Daily Business Summary</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">${summaryData.date}</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px;">
        <!-- Key Metrics -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Revenue</p>
            <p style="margin: 10px 0 0 0; color: #10b981; font-size: 28px; font-weight: bold;">$${summaryData.revenue.toFixed(2)}</p>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Orders</p>
            <p style="margin: 10px 0 0 0; color: #3b82f6; font-size: 28px; font-weight: bold;">${summaryData.orders}</p>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">New Customers</p>
            <p style="margin: 10px 0 0 0; color: #8b5cf6; font-size: 28px; font-weight: bold;">${summaryData.newCustomers}</p>
          </div>
        </div>

        <!-- Alerts Section -->
        ${summaryData.alerts.length > 0 ? `
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #111827;">⚠️ Alerts</h2>
          ${alertsHtml}
        </div>
        ` : ''}

        <!-- Action Items -->
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #111827;">Action Items</h2>
          <div style="padding: 10px; background-color: #fef3c7; border-radius: 6px; margin: 10px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>${summaryData.fraudAlerts}</strong> fraud alerts require review
            </p>
          </div>
          <div style="padding: 10px; background-color: #fef3c7; border-radius: 6px; margin: 10px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>${summaryData.lowStockItems}</strong> items low on stock
            </p>
          </div>
          <div style="padding: 10px; background-color: #fef3c7; border-radius: 6px; margin: 10px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>${summaryData.pendingApprovals}</strong> pending approvals
            </p>
          </div>
        </div>

        <!-- Top Products -->
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0; color: #111827;">🏆 Top Products</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${topProductsHtml}
          </table>
        </div>
      </div>

      <div style="background-color: #111827; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">
          Generated by Live Shopping Network Autonomous System<br>
          ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `📊 Daily Summary - ${summaryData.date}`,
    html,
  });
}

// Export service status
export function getEmailServiceStatus() {
  return {
    configured: !!SENDGRID_API_KEY,
    fromEmail: FROM_EMAIL,
    alertEmail: ALERT_EMAIL,
  };
}
