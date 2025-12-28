/**
 * Comprehensive Email and Notification Templates System
 * Template engine, 20+ email templates, SMS notifications, push notifications, in-app notifications
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'system';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  variables: string[];
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface NotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: Array<'email' | 'sms' | 'push' | 'in_app'>;
  priority?: 'low' | 'normal' | 'high';
}

// ============================================================================
// TEMPLATE ENGINE
// ============================================================================

class TemplateEngine {
  // Render template with variables
  render(template: string, variables: Record<string, any>): string {
    let rendered = template;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Handle conditionals {{#if variable}}...{{/if}}
    rendered = this.handleConditionals(rendered, variables);

    // Handle loops {{#each items}}...{{/each}}
    rendered = this.handleLoops(rendered, variables);

    return rendered;
  }

  // Handle conditional blocks
  private handleConditionals(template: string, variables: Record<string, any>): string {
    const regex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return template.replace(regex, (match, variable, content) => {
      return variables[variable] ? content : '';
    });
  }

  // Handle loop blocks
  private handleLoops(template: string, variables: Record<string, any>): string {
    const regex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    
    return template.replace(regex, (match, variable, content) => {
      const items = variables[variable];
      if (!Array.isArray(items)) return '';

      return items.map(item => {
        let itemContent = content;
        for (const [key, value] of Object.entries(item)) {
          const itemRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          itemContent = itemContent.replace(itemRegex, String(value));
        }
        return itemContent;
      }).join('');
    });
  }

  // Escape HTML
  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

class EmailTemplates {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  // Initialize all email templates
  private initializeTemplates() {
    // Welcome email
    this.templates.set('welcome', {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to Live Shopping Network!',
      htmlTemplate: this.getWelcomeHtml(),
      textTemplate: this.getWelcomeText(),
      variables: ['user_name', 'login_url'],
      category: 'transactional'
    });

    // Order confirmation
    this.templates.set('order_confirmation', {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      subject: 'Order Confirmed - #{{order_number}}',
      htmlTemplate: this.getOrderConfirmationHtml(),
      textTemplate: this.getOrderConfirmationText(),
      variables: ['user_name', 'order_number', 'order_date', 'total_amount', 'items', 'shipping_address'],
      category: 'transactional'
    });

    // Order shipped
    this.templates.set('order_shipped', {
      id: 'order_shipped',
      name: 'Order Shipped',
      subject: 'Your order has shipped! - #{{order_number}}',
      htmlTemplate: this.getOrderShippedHtml(),
      textTemplate: this.getOrderShippedText(),
      variables: ['user_name', 'order_number', 'tracking_number', 'tracking_url', 'carrier'],
      category: 'transactional'
    });

    // Order delivered
    this.templates.set('order_delivered', {
      id: 'order_delivered',
      name: 'Order Delivered',
      subject: 'Your order has been delivered! - #{{order_number}}',
      htmlTemplate: this.getOrderDeliveredHtml(),
      textTemplate: this.getOrderDeliveredText(),
      variables: ['user_name', 'order_number', 'review_url'],
      category: 'transactional'
    });

    // Password reset
    this.templates.set('password_reset', {
      id: 'password_reset',
      name: 'Password Reset',
      subject: 'Reset your password',
      htmlTemplate: this.getPasswordResetHtml(),
      textTemplate: this.getPasswordResetText(),
      variables: ['user_name', 'reset_url', 'expiry_time'],
      category: 'transactional'
    });

    // Email verification
    this.templates.set('email_verification', {
      id: 'email_verification',
      name: 'Email Verification',
      subject: 'Verify your email address',
      htmlTemplate: this.getEmailVerificationHtml(),
      textTemplate: this.getEmailVerificationText(),
      variables: ['user_name', 'verification_url', 'verification_code'],
      category: 'transactional'
    });

    // Live show starting
    this.templates.set('show_starting', {
      id: 'show_starting',
      name: 'Live Show Starting',
      subject: '🔴 LIVE NOW: {{show_title}}',
      htmlTemplate: this.getShowStartingHtml(),
      textTemplate: this.getShowStartingText(),
      variables: ['user_name', 'show_title', 'host_name', 'show_url', 'thumbnail_url'],
      category: 'marketing'
    });

    // Show reminder
    this.templates.set('show_reminder', {
      id: 'show_reminder',
      name: 'Show Reminder',
      subject: 'Reminder: {{show_title}} starts in 15 minutes',
      htmlTemplate: this.getShowReminderHtml(),
      textTemplate: this.getShowReminderText(),
      variables: ['user_name', 'show_title', 'host_name', 'start_time', 'show_url'],
      category: 'marketing'
    });

    // Cart abandonment
    this.templates.set('cart_abandonment', {
      id: 'cart_abandonment',
      name: 'Cart Abandonment',
      subject: 'You left items in your cart!',
      htmlTemplate: this.getCartAbandonmentHtml(),
      textTemplate: this.getCartAbandonmentText(),
      variables: ['user_name', 'cart_items', 'cart_total', 'cart_url', 'discount_code'],
      category: 'marketing'
    });

    // Product back in stock
    this.templates.set('back_in_stock', {
      id: 'back_in_stock',
      name: 'Back in Stock',
      subject: '{{product_name}} is back in stock!',
      htmlTemplate: this.getBackInStockHtml(),
      textTemplate: this.getBackInStockText(),
      variables: ['user_name', 'product_name', 'product_url', 'product_image', 'product_price'],
      category: 'marketing'
    });

    // Price drop alert
    this.templates.set('price_drop', {
      id: 'price_drop',
      name: 'Price Drop Alert',
      subject: 'Price drop on {{product_name}}!',
      htmlTemplate: this.getPriceDropHtml(),
      textTemplate: this.getPriceDropText(),
      variables: ['user_name', 'product_name', 'old_price', 'new_price', 'savings', 'product_url'],
      category: 'marketing'
    });

    // Weekly digest
    this.templates.set('weekly_digest', {
      id: 'weekly_digest',
      name: 'Weekly Digest',
      subject: 'Your weekly shopping digest',
      htmlTemplate: this.getWeeklyDigestHtml(),
      textTemplate: this.getWeeklyDigestText(),
      variables: ['user_name', 'trending_products', 'upcoming_shows', 'personalized_picks'],
      category: 'marketing'
    });

    // Referral invitation
    this.templates.set('referral_invitation', {
      id: 'referral_invitation',
      name: 'Referral Invitation',
      subject: '{{referrer_name}} invited you to Live Shopping Network!',
      htmlTemplate: this.getReferralInvitationHtml(),
      textTemplate: this.getReferralInvitationText(),
      variables: ['referrer_name', 'signup_url', 'bonus_amount'],
      category: 'marketing'
    });

    // Reward earned
    this.templates.set('reward_earned', {
      id: 'reward_earned',
      name: 'Reward Earned',
      subject: 'You earned {{points}} points!',
      htmlTemplate: this.getRewardEarnedHtml(),
      textTemplate: this.getRewardEarnedText(),
      variables: ['user_name', 'points', 'total_points', 'rewards_url', 'reason'],
      category: 'transactional'
    });

    // Subscription confirmation
    this.templates.set('subscription_confirmation', {
      id: 'subscription_confirmation',
      name: 'Subscription Confirmation',
      subject: 'Welcome to {{plan_name}}!',
      htmlTemplate: this.getSubscriptionConfirmationHtml(),
      textTemplate: this.getSubscriptionConfirmationText(),
      variables: ['user_name', 'plan_name', 'price', 'billing_cycle', 'next_billing_date', 'benefits'],
      category: 'transactional'
    });

    // Subscription renewal
    this.templates.set('subscription_renewal', {
      id: 'subscription_renewal',
      name: 'Subscription Renewal',
      subject: 'Your subscription will renew soon',
      htmlTemplate: this.getSubscriptionRenewalHtml(),
      textTemplate: this.getSubscriptionRenewalText(),
      variables: ['user_name', 'plan_name', 'price', 'renewal_date', 'manage_url'],
      category: 'transactional'
    });

    // Payment failed
    this.templates.set('payment_failed', {
      id: 'payment_failed',
      name: 'Payment Failed',
      subject: 'Payment failed for your order',
      htmlTemplate: this.getPaymentFailedHtml(),
      textTemplate: this.getPaymentFailedText(),
      variables: ['user_name', 'order_number', 'amount', 'retry_url', 'support_url'],
      category: 'transactional'
    });

    // Refund processed
    this.templates.set('refund_processed', {
      id: 'refund_processed',
      name: 'Refund Processed',
      subject: 'Refund processed for order #{{order_number}}',
      htmlTemplate: this.getRefundProcessedHtml(),
      textTemplate: this.getRefundProcessedText(),
      variables: ['user_name', 'order_number', 'refund_amount', 'refund_method', 'processing_days'],
      category: 'transactional'
    });

    // Account security alert
    this.templates.set('security_alert', {
      id: 'security_alert',
      name: 'Security Alert',
      subject: 'Security alert for your account',
      htmlTemplate: this.getSecurityAlertHtml(),
      textTemplate: this.getSecurityAlertText(),
      variables: ['user_name', 'alert_type', 'timestamp', 'location', 'ip_address', 'secure_url'],
      category: 'system'
    });

    // System maintenance
    this.templates.set('maintenance_notice', {
      id: 'maintenance_notice',
      name: 'Maintenance Notice',
      subject: 'Scheduled maintenance notification',
      htmlTemplate: this.getMaintenanceNoticeHtml(),
      textTemplate: this.getMaintenanceNoticeText(),
      variables: ['user_name', 'start_time', 'end_time', 'duration', 'affected_services'],
      category: 'system'
    });
  }

  // Get template by ID
  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  // Get all templates
  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  // Template HTML implementations
  private getWelcomeHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 40px 20px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Live Shopping Network!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>We're thrilled to have you join our community! Get ready to experience shopping like never before with live shows, exclusive deals, and interactive hosts.</p>
    <p><strong>What you can do:</strong></p>
    <ul>
      <li>Watch live shopping shows</li>
      <li>Get exclusive deals available only during shows</li>
      <li>Interact with hosts in real-time</li>
      <li>Earn rewards with every purchase</li>
    </ul>
    <center>
      <a href="{{login_url}}" class="button">Start Shopping</a>
    </center>
  </div>
  <div class="footer">
    <p>© 2024 Live Shopping Network. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  private getWelcomeText(): string {
    return `
Welcome to Live Shopping Network!

Hi {{user_name}},

We're thrilled to have you join our community! Get ready to experience shopping like never before with live shows, exclusive deals, and interactive hosts.

What you can do:
- Watch live shopping shows
- Get exclusive deals available only during shows
- Interact with hosts in real-time
- Earn rewards with every purchase

Start shopping: {{login_url}}

© 2024 Live Shopping Network. All rights reserved.
    `;
  }

  private getOrderConfirmationHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 30px 20px; text-align: center; }
    .order-details { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .item { border-bottom: 1px solid #e5e7eb; padding: 15px 0; }
    .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✓ Order Confirmed!</h1>
    <p>Order #{{order_number}}</p>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Thank you for your order! We've received your order and will start processing it soon.</p>
    
    <div class="order-details">
      <h3>Order Details</h3>
      <p><strong>Order Date:</strong> {{order_date}}</p>
      <p><strong>Order Number:</strong> {{order_number}}</p>
      
      <h4>Items:</h4>
      {{#each items}}
      <div class="item">
        <p><strong>{{name}}</strong></p>
        <p>Quantity: {{quantity}} × ${{price}}</p>
      </div>
      {{/each}}
      
      <div class="total">
        Total: ${{total_amount}}
      </div>
      
      <h4>Shipping Address:</h4>
      <p>{{shipping_address}}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getOrderConfirmationText(): string {
    return `
Order Confirmed!

Hi {{user_name}},

Thank you for your order! We've received your order and will start processing it soon.

Order Number: {{order_number}}
Order Date: {{order_date}}

Items:
{{#each items}}
- {{name}} ({{quantity}} × ${{price}})
{{/each}}

Total: ${{total_amount}}

Shipping Address:
{{shipping_address}}
    `;
  }

  private getOrderShippedHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; }
    .tracking { background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Your Order Has Shipped!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Great news! Your order #{{order_number}} is on its way!</p>
    
    <div class="tracking">
      <h3>Tracking Information</h3>
      <p><strong>Carrier:</strong> {{carrier}}</p>
      <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
      <center>
        <a href="{{tracking_url}}" class="button">Track Your Package</a>
      </center>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getOrderShippedText(): string {
    return `
Your Order Has Shipped!

Hi {{user_name}},

Great news! Your order #{{order_number}} is on its way!

Tracking Information:
Carrier: {{carrier}}
Tracking Number: {{tracking_number}}

Track your package: {{tracking_url}}
    `;
  }

  private getOrderDeliveredHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 30px 20px; text-align: center; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Order Delivered!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Your order #{{order_number}} has been delivered! We hope you love your purchase.</p>
    <p>We'd love to hear your feedback!</p>
    <center>
      <a href="{{review_url}}" class="button">Leave a Review</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getOrderDeliveredText(): string {
    return `
Order Delivered!

Hi {{user_name}},

Your order #{{order_number}} has been delivered! We hope you love your purchase.

We'd love to hear your feedback!
Leave a review: {{review_url}}
    `;
  }

  private getPasswordResetHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px 20px; text-align: center; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 Reset Your Password</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <center>
      <a href="{{reset_url}}" class="button">Reset Password</a>
    </center>
    <p>This link will expire in {{expiry_time}}.</p>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPasswordResetText(): string {
    return `
Reset Your Password

Hi {{user_name}},

We received a request to reset your password. Click the link below to create a new password:

{{reset_url}}

This link will expire in {{expiry_time}}.

⚠️ Security Notice: If you didn't request this password reset, please ignore this email and your password will remain unchanged.
    `;
  }

  private getEmailVerificationHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px 20px; text-align: center; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .code { background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✉️ Verify Your Email</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Please verify your email address to complete your registration.</p>
    <center>
      <a href="{{verification_url}}" class="button">Verify Email</a>
    </center>
    <p>Or enter this code:</p>
    <div class="code">{{verification_code}}</div>
  </div>
</body>
</html>
    `;
  }

  private getEmailVerificationText(): string {
    return `
Verify Your Email

Hi {{user_name}},

Please verify your email address to complete your registration.

Verification link: {{verification_url}}

Or enter this code: {{verification_code}}
    `;
  }

  private getShowStartingHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: white; padding: 30px 20px; text-align: center; }
    .live-badge { background: #dc2626; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
    .button { display: inline-block; background: #f43f5e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .thumbnail { width: 100%; max-width: 500px; border-radius: 10px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <span class="live-badge">🔴 LIVE NOW</span>
    <h1>{{show_title}}</h1>
    <p>with {{host_name}}</p>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>The show you've been waiting for is LIVE NOW! Join us for exclusive deals and interactive shopping.</p>
    <center>
      <img src="{{thumbnail_url}}" alt="Show thumbnail" class="thumbnail">
      <br>
      <a href="{{show_url}}" class="button">Join Live Show</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getShowStartingText(): string {
    return `
🔴 LIVE NOW: {{show_title}}

Hi {{user_name}},

The show you've been waiting for is LIVE NOW! Join us for exclusive deals and interactive shopping.

Host: {{host_name}}

Join the show: {{show_url}}
    `;
  }

  private getShowReminderHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Show Starting Soon!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p><strong>{{show_title}}</strong> with {{host_name}} starts in 15 minutes!</p>
    <p>Start time: {{start_time}}</p>
    <center>
      <a href="{{show_url}}" class="button">Set Reminder</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getShowReminderText(): string {
    return `
⏰ Show Starting Soon!

Hi {{user_name}},

{{show_title}} with {{host_name}} starts in 15 minutes!

Start time: {{start_time}}

Join here: {{show_url}}
    `;
  }

  private getCartAbandonmentHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 30px 20px; text-align: center; }
    .discount { background: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛒 You Left Items in Your Cart!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>We noticed you left some items in your cart. Complete your purchase now!</p>
    
    <div class="discount">
      <h3>🎁 Special Offer Just For You!</h3>
      <p>Use code <strong>{{discount_code}}</strong> for 10% off</p>
    </div>
    
    <p><strong>Cart Total:</strong> ${{cart_total}}</p>
    
    <center>
      <a href="{{cart_url}}" class="button">Complete Purchase</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getCartAbandonmentText(): string {
    return `
You Left Items in Your Cart!

Hi {{user_name}},

We noticed you left some items in your cart. Complete your purchase now!

Special Offer: Use code {{discount_code}} for 10% off

Cart Total: ${{cart_total}}

Complete purchase: {{cart_url}}
    `;
  }

  private getBackInStockHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; }
    .product { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
    .product-image { width: 100%; max-width: 300px; border-radius: 10px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✨ Back in Stock!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Great news! The item you wanted is back in stock!</p>
    
    <div class="product">
      <img src="{{product_image}}" alt="{{product_name}}" class="product-image">
      <h2>{{product_name}}</h2>
      <p class="price">${{product_price}}</p>
      <a href="{{product_url}}" class="button">Shop Now</a>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBackInStockText(): string {
    return `
Back in Stock!

Hi {{user_name}},

Great news! The item you wanted is back in stock!

{{product_name}}
Price: ${{product_price}}

Shop now: {{product_url}}
    `;
  }

  private getPriceDropHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
    .savings { background: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
    .old-price { text-decoration: line-through; color: #666; }
    .new-price { font-size: 32px; font-weight: bold; color: #dc2626; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 Price Drop Alert!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>The price just dropped on <strong>{{product_name}}</strong>!</p>
    
    <div class="savings">
      <p class="old-price">${{old_price}}</p>
      <p class="new-price">${{new_price}}</p>
      <p><strong>Save ${{savings}}!</strong></p>
    </div>
    
    <center>
      <a href="{{product_url}}" class="button">Get It Now</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getPriceDropText(): string {
    return `
Price Drop Alert!

Hi {{user_name}},

The price just dropped on {{product_name}}!

Was: ${{old_price}}
Now: ${{new_price}}
Save: ${{savings}}!

Get it now: {{product_url}}
    `;
  }

  private getWeeklyDigestHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .section { margin: 30px 0; }
    .item { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Your Weekly Digest</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Here's what's trending this week!</p>
    
    <div class="section">
      <h2>🔥 Trending Products</h2>
      {{#each trending_products}}
      <div class="item">
        <h3>{{name}}</h3>
        <p>${{price}}</p>
      </div>
      {{/each}}
    </div>
    
    <div class="section">
      <h2>📺 Upcoming Shows</h2>
      {{#each upcoming_shows}}
      <div class="item">
        <h3>{{title}}</h3>
        <p>{{date}} with {{host}}</p>
      </div>
      {{/each}}
    </div>
  </div>
</body>
</html>
    `;
  }

  private getWeeklyDigestText(): string {
    return `
Your Weekly Digest

Hi {{user_name}},

Here's what's trending this week!

Trending Products:
{{#each trending_products}}
- {{name}} (${{price}})
{{/each}}

Upcoming Shows:
{{#each upcoming_shows}}
- {{title}} on {{date}} with {{host}}
{{/each}}
    `;
  }

  private getReferralInvitationHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 30px 20px; text-align: center; }
    .bonus { background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎁 You're Invited!</h1>
  </div>
  <div class="content">
    <p>{{referrer_name}} thinks you'll love Live Shopping Network!</p>
    <p>Join now and get a special welcome bonus:</p>
    
    <div class="bonus">
      ${{bonus_amount}} OFF
    </div>
    
    <center>
      <a href="{{signup_url}}" class="button">Claim Your Bonus</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getReferralInvitationText(): string {
    return `
You're Invited!

{{referrer_name}} thinks you'll love Live Shopping Network!

Join now and get a special welcome bonus: ${{bonus_amount}} OFF

Claim your bonus: {{signup_url}}
    `;
  }

  private getRewardEarnedHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; }
    .points { font-size: 48px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 You Earned Points!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Congratulations! You earned:</p>
    
    <div class="points">+{{points}} points</div>
    
    <p><strong>Reason:</strong> {{reason}}</p>
    <p><strong>Total Points:</strong> {{total_points}}</p>
    
    <center>
      <a href="{{rewards_url}}" class="button">View Rewards</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getRewardEarnedText(): string {
    return `
You Earned Points!

Hi {{user_name}},

Congratulations! You earned +{{points}} points

Reason: {{reason}}
Total Points: {{total_points}}

View rewards: {{rewards_url}}
    `;
  }

  private getSubscriptionConfirmationHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px 20px; text-align: center; }
    .plan-details { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✓ Subscription Confirmed!</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Welcome to <strong>{{plan_name}}</strong>!</p>
    
    <div class="plan-details">
      <h3>Plan Details</h3>
      <p><strong>Price:</strong> ${{price}}/{{billing_cycle}}</p>
      <p><strong>Next Billing Date:</strong> {{next_billing_date}}</p>
      
      <h4>Benefits:</h4>
      <ul>
        {{#each benefits}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getSubscriptionConfirmationText(): string {
    return `
Subscription Confirmed!

Hi {{user_name}},

Welcome to {{plan_name}}!

Plan Details:
Price: ${{price}}/{{billing_cycle}}
Next Billing Date: {{next_billing_date}}

Benefits:
{{#each benefits}}
- {{this}}
{{/each}}
    `;
  }

  private getSubscriptionRenewalHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 30px 20px; text-align: center; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔄 Subscription Renewal</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Your <strong>{{plan_name}}</strong> subscription will renew on {{renewal_date}}.</p>
    <p><strong>Amount:</strong> ${{price}}</p>
    <center>
      <a href="{{manage_url}}" class="button">Manage Subscription</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getSubscriptionRenewalText(): string {
    return `
Subscription Renewal

Hi {{user_name}},

Your {{plan_name}} subscription will renew on {{renewal_date}}.

Amount: ${{price}}

Manage subscription: {{manage_url}}
    `;
  }

  private getPaymentFailedHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px 20px; text-align: center; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Payment Failed</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>We were unable to process your payment for order #{{order_number}}.</p>
    <p><strong>Amount:</strong> ${{amount}}</p>
    <center>
      <a href="{{retry_url}}" class="button">Retry Payment</a>
    </center>
    <p>Need help? <a href="{{support_url}}">Contact Support</a></p>
  </div>
</body>
</html>
    `;
  }

  private getPaymentFailedText(): string {
    return `
Payment Failed

Hi {{user_name}},

We were unable to process your payment for order #{{order_number}}.

Amount: ${{amount}}

Retry payment: {{retry_url}}
Need help? {{support_url}}
    `;
  }

  private getRefundProcessedHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✓ Refund Processed</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>Your refund for order #{{order_number}} has been processed.</p>
    <p><strong>Refund Amount:</strong> ${{refund_amount}}</p>
    <p><strong>Method:</strong> {{refund_method}}</p>
    <p>Please allow {{processing_days}} business days for the refund to appear.</p>
  </div>
</body>
</html>
    `;
  }

  private getRefundProcessedText(): string {
    return `
Refund Processed

Hi {{user_name}},

Your refund for order #{{order_number}} has been processed.

Refund Amount: ${{refund_amount}}
Method: {{refund_method}}

Please allow {{processing_days}} business days for the refund to appear.
    `;
  }

  private getSecurityAlertHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
    .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 Security Alert</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>We detected unusual activity on your account.</p>
    
    <div class="alert">
      <p><strong>Activity:</strong> {{alert_type}}</p>
      <p><strong>Time:</strong> {{timestamp}}</p>
      <p><strong>Location:</strong> {{location}}</p>
      <p><strong>IP Address:</strong> {{ip_address}}</p>
    </div>
    
    <p>If this was you, no action is needed. Otherwise, please secure your account immediately.</p>
    <center>
      <a href="{{secure_url}}" class="button">Secure My Account</a>
    </center>
  </div>
</body>
</html>
    `;
  }

  private getSecurityAlertText(): string {
    return `
Security Alert

Hi {{user_name}},

We detected unusual activity on your account.

Activity: {{alert_type}}
Time: {{timestamp}}
Location: {{location}}
IP Address: {{ip_address}}

If this was you, no action is needed. Otherwise, please secure your account immediately.

Secure account: {{secure_url}}
    `;
  }

  private getMaintenanceNoticeHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; }
    .notice { background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔧 Scheduled Maintenance</h1>
  </div>
  <div class="content">
    <p>Hi {{user_name}},</p>
    <p>We'll be performing scheduled maintenance to improve our services.</p>
    
    <div class="notice">
      <p><strong>Start Time:</strong> {{start_time}}</p>
      <p><strong>End Time:</strong> {{end_time}}</p>
      <p><strong>Duration:</strong> {{duration}}</p>
      <p><strong>Affected Services:</strong> {{affected_services}}</p>
    </div>
    
    <p>We apologize for any inconvenience.</p>
  </div>
</body>
</html>
    `;
  }

  private getMaintenanceNoticeText(): string {
    return `
Scheduled Maintenance

Hi {{user_name}},

We'll be performing scheduled maintenance to improve our services.

Start Time: {{start_time}}
End Time: {{end_time}}
Duration: {{duration}}
Affected Services: {{affected_services}}

We apologize for any inconvenience.
    `;
  }
}

// ============================================================================
// NOTIFICATION MANAGER
// ============================================================================

class NotificationManager {
  private templateEngine: TemplateEngine;
  private emailTemplates: EmailTemplates;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.emailTemplates = new EmailTemplates();
  }

  // Send email notification
  async sendEmail(templateId: string, to: string, variables: Record<string, any>): Promise<boolean> {
    const template = this.emailTemplates.getTemplate(templateId);
    if (!template) {
      console.error(`Email template not found: ${templateId}`);
      return false;
    }

    const html = this.templateEngine.render(template.htmlTemplate, variables);
    const text = this.templateEngine.render(template.textTemplate, variables);
    const subject = this.templateEngine.render(template.subject, variables);

    // In production, this would send via email service (SendGrid, AWS SES, etc.)
    console.log(`[Email] Sending ${templateId} to ${to}`);
    console.log(`Subject: ${subject}`);
    
    return true;
  }

  // Send notification to multiple channels
  async sendNotification(options: NotificationOptions): Promise<boolean> {
    const channels = options.channels || ['in_app'];
    const results: boolean[] = [];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          // Would send email
          console.log(`[Email] Notification to user ${options.userId}`);
          results.push(true);
          break;

        case 'sms':
          // Would send SMS
          console.log(`[SMS] Notification to user ${options.userId}`);
          results.push(true);
          break;

        case 'push':
          // Would send push notification
          console.log(`[Push] Notification to user ${options.userId}`);
          results.push(true);
          break;

        case 'in_app':
          // Would create in-app notification
          console.log(`[InApp] Notification to user ${options.userId}`);
          results.push(true);
          break;
      }
    }

    return results.every(r => r);
  }

  // Get all available templates
  getAvailableTemplates(): EmailTemplate[] {
    return this.emailTemplates.getAllTemplates();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const templateEngine = new TemplateEngine();
export const emailTemplates = new EmailTemplates();
export const notificationManager = new NotificationManager();

// Helper functions
export async function sendEmail(templateId: string, to: string, variables: Record<string, any>): Promise<boolean> {
  return await notificationManager.sendEmail(templateId, to, variables);
}

export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  return await notificationManager.sendNotification(options);
}

export function renderTemplate(template: string, variables: Record<string, any>): string {
  return templateEngine.render(template, variables);
}
