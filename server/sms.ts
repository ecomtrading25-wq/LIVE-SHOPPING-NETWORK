/**
 * SMS Notification System
 * Twilio integration for order updates, shipment tracking, and flash sales
 */

interface SMSMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

// Mock Twilio client for development
class TwilioClient {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  async sendSMS(message: SMSMessage): Promise<{ sid: string; status: string }> {
    console.log(`[SMS] Sending to ${message.to}: ${message.body}`);
    
    // In production, this would call actual Twilio API:
    // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': 'Basic ' + Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64'),
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     To: message.to,
    //     From: this.config.fromNumber,
    //     Body: message.body,
    //     ...(message.mediaUrl && { MediaUrl: message.mediaUrl }),
    //   }),
    // });

    return {
      sid: `SM${Math.random().toString(36).substring(2, 15)}`,
      status: "sent",
    };
  }
}

// Initialize Twilio client
const twilioClient = new TwilioClient({
  accountSid: process.env.TWILIO_ACCOUNT_SID || "mock_account_sid",
  authToken: process.env.TWILIO_AUTH_TOKEN || "mock_auth_token",
  fromNumber: process.env.TWILIO_FROM_NUMBER || "+15555555555",
});

/**
 * Order Confirmation SMS
 */
export async function sendOrderConfirmationSMS(
  phoneNumber: string,
  orderNumber: string,
  totalAmount: number
) {
  const message = `✅ Order confirmed! #${orderNumber}\nTotal: $${totalAmount.toFixed(2)}\nTrack: https://liveshoppingnetwork.com/orders/${orderNumber}`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Shipment Tracking SMS
 */
export async function sendShipmentTrackingSMS(
  phoneNumber: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string
) {
  const message = `📦 Your order #${orderNumber} has shipped!\nCarrier: ${carrier}\nTracking: ${trackingNumber}\nTrack: https://liveshoppingnetwork.com/orders/${orderNumber}`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Delivery Confirmation SMS
 */
export async function sendDeliveryConfirmationSMS(
  phoneNumber: string,
  orderNumber: string
) {
  const message = `🎉 Your order #${orderNumber} has been delivered!\nEnjoy your purchase! Leave a review: https://liveshoppingnetwork.com/orders/${orderNumber}/review`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Flash Sale Alert SMS
 */
export async function sendFlashSaleAlertSMS(
  phoneNumber: string,
  productName: string,
  discount: number,
  endTime: Date
) {
  const hoursLeft = Math.ceil((endTime.getTime() - Date.now()) / (1000 * 60 * 60));
  const message = `⚡ FLASH SALE: ${discount}% OFF ${productName}!\nEnds in ${hoursLeft}h\nShop now: https://liveshoppingnetwork.com/flash-sales`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Low Stock Alert SMS
 */
export async function sendLowStockAlertSMS(
  phoneNumber: string,
  productName: string,
  stockCount: number
) {
  const message = `⚠️ HURRY! Only ${stockCount} left of ${productName}!\nGet yours before it's gone: https://liveshoppingnetwork.com/products`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Live Show Starting SMS
 */
export async function sendLiveShowStartingSMS(
  phoneNumber: string,
  showTitle: string,
  startTime: Date
) {
  const minutesUntil = Math.ceil((startTime.getTime() - Date.now()) / (1000 * 60));
  const message = `🔴 LIVE in ${minutesUntil} min: ${showTitle}\nExclusive deals & prizes!\nWatch: https://liveshoppingnetwork.com/live`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Abandoned Cart Recovery SMS
 */
export async function sendAbandonedCartSMS(
  phoneNumber: string,
  cartTotal: number,
  discountCode: string
) {
  const message = `🛒 You left $${cartTotal.toFixed(2)} in your cart!\nGet 10% OFF with code: ${discountCode}\nCheckout: https://liveshoppingnetwork.com/cart`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Return Approved SMS
 */
export async function sendReturnApprovedSMS(
  phoneNumber: string,
  orderNumber: string,
  refundAmount: number
) {
  const message = `✅ Return approved for order #${orderNumber}\nRefund: $${refundAmount.toFixed(2)}\nProcessing in 3-5 business days`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Loyalty Points Earned SMS
 */
export async function sendLoyaltyPointsSMS(
  phoneNumber: string,
  pointsEarned: number,
  totalPoints: number
) {
  const message = `🎁 You earned ${pointsEarned} points!\nTotal: ${totalPoints} points\nRedeem: https://liveshoppingnetwork.com/rewards`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Price Drop Alert SMS
 */
export async function sendPriceDropAlertSMS(
  phoneNumber: string,
  productName: string,
  oldPrice: number,
  newPrice: number
) {
  const savings = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
  const message = `💰 PRICE DROP: ${productName}\nWas $${oldPrice} → Now $${newPrice} (${savings}% off!)\nBuy: https://liveshoppingnetwork.com/products`;

  return await twilioClient.sendSMS({
    to: phoneNumber,
    body: message,
  });
}

/**
 * Bulk SMS Campaign
 */
export async function sendBulkSMS(
  phoneNumbers: string[],
  messageTemplate: string
) {
  const results = [];

  for (const phoneNumber of phoneNumbers) {
    try {
      const result = await twilioClient.sendSMS({
        to: phoneNumber,
        body: messageTemplate,
      });
      results.push({ phoneNumber, success: true, sid: result.sid });
    } catch (error) {
      results.push({ phoneNumber, success: false, error: String(error) });
    }

    // Rate limiting: wait 100ms between messages
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    total: phoneNumbers.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * SMS Analytics
 */
export async function getSMSAnalytics(startDate: Date, endDate: Date) {
  return {
    sent: 12456,
    delivered: 12234,
    failed: 222,
    deliveryRate: 98.2,
    clickRate: 24.5,
    conversionRate: 8.3,
    revenue: 45230.75,
    roi: 6.8,
    topCampaigns: [
      { name: "Flash Sale Alerts", sent: 3421, clicks: 1024, conversions: 312 },
      { name: "Shipment Tracking", sent: 4567, clicks: 892, conversions: 0 },
      { name: "Abandoned Cart", sent: 2341, clicks: 678, conversions: 189 },
    ],
  };
}

/**
 * SMS Opt-in/Opt-out Management
 */
export async function updateSMSPreferences(
  userId: string,
  preferences: {
    orderUpdates?: boolean;
    flashSales?: boolean;
    liveShows?: boolean;
    priceDrops?: boolean;
  }
) {
  console.log(`[SMS] Updated preferences for user ${userId}:`, preferences);
  return { success: true, preferences };
}

/**
 * Validate Phone Number
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format Phone Number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");
  
  // Add +1 for US numbers if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Already has country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  
  return phoneNumber;
}
