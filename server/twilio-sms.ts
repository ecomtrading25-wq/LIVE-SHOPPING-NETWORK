/**
 * Twilio SMS Notification Service
 * 
 * Provides SMS notification functionality for:
 * - Order status updates
 * - Shipping notifications
 * - Delivery confirmations
 * - Customer service communications
 * - Marketing messages
 */

import twilio from 'twilio';
import { db } from './db.js';
import { smsMessages } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// TWILIO CLIENT SETUP
// ============================================================================

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
}

function getTwilioPhoneNumber(): string {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not configured');
  }
  return phoneNumber;
}

// ============================================================================
// SMS SENDING FUNCTIONS
// ============================================================================

export interface SendSMSOptions {
  to: string;
  message: string;
  orderId?: string;
  userId?: string;
  category?: 'ORDER' | 'SHIPPING' | 'DELIVERY' | 'SUPPORT' | 'MARKETING';
}

export async function sendSMS(options: SendSMSOptions): Promise<string> {
  const client = getTwilioClient();
  const fromNumber = getTwilioPhoneNumber();

  try {
    // Send SMS via Twilio
    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: options.to,
    });

    // Store SMS record in database
    const smsId = nanoid();
    await db.insert(smsMessages).values({
      id: smsId,
      twilioMessageSid: message.sid,
      toPhoneNumber: options.to,
      fromPhoneNumber: fromNumber,
      body: options.message,
      status: message.status,
      direction: 'OUTBOUND',
      category: options.category || 'SUPPORT',
      orderId: options.orderId || null,
      userId: options.userId || null,
      sentAt: new Date(),
      createdAt: new Date(),
    });

    console.log(`SMS sent: ${message.sid} to ${options.to}`);
    return message.sid;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}

// ============================================================================
// ORDER NOTIFICATION TEMPLATES
// ============================================================================

export async function sendOrderConfirmationSMS(
  phoneNumber: string,
  orderId: string,
  orderNumber: string,
  totalAmount: number,
  userId?: string
): Promise<string> {
  const message = `Order confirmed! Your order #${orderNumber} for $${(totalAmount / 100).toFixed(2)} has been received. Track your order at: [Your Domain]/orders/${orderId}`;

  return sendSMS({
    to: phoneNumber,
    message,
    orderId,
    userId,
    category: 'ORDER',
  });
}

export async function sendOrderShippedSMS(
  phoneNumber: string,
  orderId: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string,
  userId?: string
): Promise<string> {
  const message = `Your order #${orderNumber} has shipped! Track your package: ${carrier} tracking #${trackingNumber}`;

  return sendSMS({
    to: phoneNumber,
    message,
    orderId,
    userId,
    category: 'SHIPPING',
  });
}

export async function sendOrderDeliveredSMS(
  phoneNumber: string,
  orderId: string,
  orderNumber: string,
  userId?: string
): Promise<string> {
  const message = `Great news! Your order #${orderNumber} has been delivered. Enjoy your purchase!`;

  return sendSMS({
    to: phoneNumber,
    message,
    orderId,
    userId,
    category: 'DELIVERY',
  });
}

export async function sendOrderCancelledSMS(
  phoneNumber: string,
  orderId: string,
  orderNumber: string,
  userId?: string
): Promise<string> {
  const message = `Your order #${orderNumber} has been cancelled. If you didn't request this, please contact support immediately.`;

  return sendSMS({
    to: phoneNumber,
    message,
    orderId,
    userId,
    category: 'ORDER',
  });
}

export async function sendRefundProcessedSMS(
  phoneNumber: string,
  orderId: string,
  orderNumber: string,
  refundAmount: number,
  userId?: string
): Promise<string> {
  const message = `Refund processed for order #${orderNumber}. $${(refundAmount / 100).toFixed(2)} will be returned to your original payment method within 5-10 business days.`;

  return sendSMS({
    to: phoneNumber,
    message,
    orderId,
    userId,
    category: 'ORDER',
  });
}

// ============================================================================
// LIVE SHOW NOTIFICATIONS
// ============================================================================

export async function sendLiveShowStartingSMS(
  phoneNumber: string,
  showTitle: string,
  hostName: string,
  showUrl: string,
  userId?: string
): Promise<string> {
  const message = `🔴 LIVE NOW: ${hostName} is starting "${showTitle}"! Join here: ${showUrl}`;

  return sendSMS({
    to: phoneNumber,
    message,
    userId,
    category: 'MARKETING',
  });
}

// ============================================================================
// CUSTOMER SERVICE NOTIFICATIONS
// ============================================================================

export async function sendSupportTicketUpdateSMS(
  phoneNumber: string,
  ticketNumber: string,
  updateMessage: string,
  userId?: string
): Promise<string> {
  const message = `Support ticket #${ticketNumber} update: ${updateMessage}`;

  return sendSMS({
    to: phoneNumber,
    message,
    userId,
    category: 'SUPPORT',
  });
}

// ============================================================================
// WEBHOOK HANDLER FOR INCOMING SMS
// ============================================================================

export async function handleIncomingSMS(payload: any): Promise<void> {
  const messageSid = payload.MessageSid;
  const from = payload.From;
  const to = payload.To;
  const body = payload.Body;

  // Store incoming SMS
  const smsId = nanoid();
  await db.insert(smsMessages).values({
    id: smsId,
    twilioMessageSid: messageSid,
    toPhoneNumber: to,
    fromPhoneNumber: from,
    body,
    status: 'RECEIVED',
    direction: 'INBOUND',
    category: 'SUPPORT',
    receivedAt: new Date(),
    createdAt: new Date(),
  });

  console.log(`Incoming SMS received: ${messageSid} from ${from}`);

  // TODO: Implement auto-response logic or route to support system
}

// ============================================================================
// SMS STATUS WEBHOOK HANDLER
// ============================================================================

export async function handleSMSStatusUpdate(payload: any): Promise<void> {
  const messageSid = payload.MessageSid;
  const status = payload.MessageStatus;

  // Update SMS status in database
  await db
    .update(smsMessages)
    .set({ status })
    .where(eq(smsMessages.twilioMessageSid, messageSid));

  console.log(`SMS status updated: ${messageSid} -> ${status}`);
}
