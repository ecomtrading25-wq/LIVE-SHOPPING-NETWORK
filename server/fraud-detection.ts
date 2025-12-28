/**
 * Fraud Detection Service
 * Handles order risk scoring, velocity checks, AVS/CVV verification, device fingerprinting, and blacklists
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  orders,
  fraudChecks,
  blacklistedEntities,
  velocityTracking,
  deviceFingerprints,
  manualReviews
} from '../drizzle/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import crypto from 'crypto';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudCheckType = 
  | 'VELOCITY' 
  | 'AVS' 
  | 'CVV' 
  | 'EMAIL_VALIDATION' 
  | 'PHONE_VALIDATION' 
  | 'DEVICE_FINGERPRINT' 
  | 'IP_GEOLOCATION' 
  | 'BLACKLIST' 
  | 'BEHAVIORAL';

export type BlacklistType = 'EMAIL' | 'IP' | 'CARD' | 'PHONE' | 'ADDRESS' | 'DEVICE';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';

export interface FraudCheck {
  checkId: string;
  orderId: string;
  checkType: FraudCheckType;
  riskScore: number;
  riskLevel: RiskLevel;
  passed: boolean;
  details: Record<string, any>;
  checkedAt: Date;
}

export interface RiskAssessment {
  orderId: string;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  checks: FraudCheck[];
  recommendations: string[];
  shouldBlock: boolean;
  shouldReview: boolean;
}

export interface VelocityCheck {
  identifier: string;
  identifierType: 'IP' | 'EMAIL' | 'CARD' | 'DEVICE';
  count: number;
  totalAmountCents: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface DeviceFingerprint {
  fingerprintId: string;
  userId?: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  plugins: string[];
  canvas: string;
  webgl: string;
  trustScore: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  orderCount: number;
  fraudCount: number;
}

/**
 * Perform comprehensive fraud check on order
 */
export async function performFraudCheck(
  orderId: string,
  orderData: {
    userId?: string;
    email: string;
    phone?: string;
    ipAddress: string;
    deviceId?: string;
    totalCents: number;
    shippingAddress: {
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    billingAddress: {
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: {
      last4: string;
      brand: string;
      avsResult?: string;
      cvvResult?: string;
    };
  }
): Promise<RiskAssessment> {
  const checks: FraudCheck[] = [];
  let totalRiskScore = 0;

  // 1. Blacklist check
  const blacklistCheck = await checkBlacklists(orderData);
  checks.push(blacklistCheck);
  totalRiskScore += blacklistCheck.riskScore;

  // 2. Velocity checks
  const velocityCheck = await checkVelocity(orderData);
  checks.push(velocityCheck);
  totalRiskScore += velocityCheck.riskScore;

  // 3. AVS check
  if (orderData.paymentMethod.avsResult) {
    const avsCheck = checkAVS(orderData.paymentMethod.avsResult);
    checks.push(avsCheck);
    totalRiskScore += avsCheck.riskScore;
  }

  // 4. CVV check
  if (orderData.paymentMethod.cvvResult) {
    const cvvCheck = checkCVV(orderData.paymentMethod.cvvResult);
    checks.push(cvvCheck);
    totalRiskScore += cvvCheck.riskScore;
  }

  // 5. Email validation
  const emailCheck = await validateEmail(orderData.email);
  checks.push(emailCheck);
  totalRiskScore += emailCheck.riskScore;

  // 6. Phone validation
  if (orderData.phone) {
    const phoneCheck = await validatePhone(orderData.phone);
    checks.push(phoneCheck);
    totalRiskScore += phoneCheck.riskScore;
  }

  // 7. Device fingerprint
  if (orderData.deviceId) {
    const deviceCheck = await checkDeviceFingerprint(orderData.deviceId, orderData.userId);
    checks.push(deviceCheck);
    totalRiskScore += deviceCheck.riskScore;
  }

  // 8. IP geolocation
  const ipCheck = await checkIPGeolocation(orderData.ipAddress, orderData.shippingAddress);
  checks.push(ipCheck);
  totalRiskScore += ipCheck.riskScore;

  // 9. Behavioral analysis
  if (orderData.userId) {
    const behavioralCheck = await analyzeBehavior(orderData.userId, orderData.totalCents);
    checks.push(behavioralCheck);
    totalRiskScore += behavioralCheck.riskScore;
  }

  // Calculate overall risk
  const overallRiskScore = Math.min(Math.round(totalRiskScore / checks.length), 100);
  const riskLevel = calculateRiskLevel(overallRiskScore);
  
  // Determine actions
  const shouldBlock = overallRiskScore >= 80 || checks.some(c => c.checkType === 'BLACKLIST' && !c.passed);
  const shouldReview = overallRiskScore >= 60 && overallRiskScore < 80;

  // Generate recommendations
  const recommendations = generateRecommendations(checks, overallRiskScore);

  // Store fraud checks
  for (const check of checks) {
    await db.insert(fraudChecks).values({
      orderId,
      checkType: check.checkType,
      riskScore: check.riskScore,
      riskLevel: check.riskLevel,
      passed: check.passed,
      details: check.details
    });
  }

  // Update order risk score
  await db.update(orders)
    .set({
      riskScore: overallRiskScore,
      riskLevel,
      fraudCheckStatus: shouldBlock ? 'BLOCKED' : shouldReview ? 'REVIEW' : 'PASSED'
    })
    .where(eq(orders.orderId, orderId));

  // Create manual review if needed
  if (shouldReview) {
    await createManualReview(orderId, overallRiskScore, recommendations);
  }

  // Track velocity
  await trackVelocity(orderData);

  return {
    orderId,
    overallRiskScore,
    riskLevel,
    checks,
    recommendations,
    shouldBlock,
    shouldReview
  };
}

/**
 * Check blacklists
 */
async function checkBlacklists(orderData: any): Promise<FraudCheck> {
  const blacklists = await db.query.blacklistedEntities.findMany({
    where: sql`
      (type = 'EMAIL' AND value = ${orderData.email}) OR
      (type = 'IP' AND value = ${orderData.ipAddress}) OR
      (type = 'CARD' AND value = ${orderData.paymentMethod.last4}) OR
      (type = 'PHONE' AND value = ${orderData.phone || ''}) OR
      (type = 'DEVICE' AND value = ${orderData.deviceId || ''})
    `
  });

  const isBlacklisted = blacklists.length > 0;
  
  return {
    checkId: crypto.randomUUID(),
    orderId: orderData.orderId,
    checkType: 'BLACKLIST',
    riskScore: isBlacklisted ? 100 : 0,
    riskLevel: isBlacklisted ? 'CRITICAL' : 'LOW',
    passed: !isBlacklisted,
    details: {
      blacklistedEntities: blacklists.map(b => ({ type: b.type, reason: b.reason }))
    },
    checkedAt: new Date()
  };
}

/**
 * Check velocity (orders per IP/email/card in time window)
 */
async function checkVelocity(orderData: any): Promise<FraudCheck> {
  const timeWindow = 60 * 60 * 1000; // 1 hour
  const since = new Date(Date.now() - timeWindow);

  // Check IP velocity
  const ipOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.ipAddress, orderData.ipAddress),
      gte(orders.createdAt, since)
    )
  });

  // Check email velocity
  const emailOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.email, orderData.email),
      gte(orders.createdAt, since)
    )
  });

  const ipCount = ipOrders.length;
  const emailCount = emailOrders.length;
  const ipTotalCents = ipOrders.reduce((sum, o) => sum + o.totalCents, 0);

  // Risk scoring
  let riskScore = 0;
  if (ipCount > 5) riskScore += 40;
  else if (ipCount > 3) riskScore += 25;
  else if (ipCount > 1) riskScore += 10;

  if (emailCount > 3) riskScore += 30;
  else if (emailCount > 1) riskScore += 15;

  if (ipTotalCents > 500000) riskScore += 30; // $5000+

  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: orderData.orderId,
    checkType: 'VELOCITY',
    riskScore,
    riskLevel,
    passed: riskScore < 60,
    details: {
      ipOrderCount: ipCount,
      emailOrderCount: emailCount,
      ipTotalCents,
      timeWindowMinutes: 60
    },
    checkedAt: new Date()
  };
}

/**
 * Check Address Verification System (AVS)
 */
function checkAVS(avsResult: string): FraudCheck {
  // AVS result codes: Y (match), N (no match), A (partial), etc.
  const riskScores: Record<string, number> = {
    'Y': 0,   // Full match
    'A': 20,  // Address match only
    'Z': 20,  // ZIP match only
    'N': 60,  // No match
    'U': 40,  // Unavailable
    'R': 50   // Retry
  };

  const riskScore = riskScores[avsResult] || 40;
  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'AVS',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: { avsResult },
    checkedAt: new Date()
  };
}

/**
 * Check CVV verification
 */
function checkCVV(cvvResult: string): FraudCheck {
  // CVV result codes: M (match), N (no match), P (not processed), etc.
  const riskScores: Record<string, number> = {
    'M': 0,   // Match
    'N': 70,  // No match
    'P': 30,  // Not processed
    'U': 40   // Unavailable
  };

  const riskScore = riskScores[cvvResult] || 40;
  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'CVV',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: { cvvResult },
    checkedAt: new Date()
  };
}

/**
 * Validate email address
 */
async function validateEmail(email: string): Promise<FraudCheck> {
  let riskScore = 0;

  // Check for disposable email domains
  const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com'];
  const domain = email.split('@')[1];
  
  if (disposableDomains.includes(domain)) {
    riskScore += 50;
  }

  // Check for suspicious patterns
  if (/\d{5,}/.test(email)) riskScore += 20; // Many numbers
  if (email.length > 50) riskScore += 10; // Very long
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) riskScore += 30; // Invalid format

  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'EMAIL_VALIDATION',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: { email, domain, isDisposable: disposableDomains.includes(domain) },
    checkedAt: new Date()
  };
}

/**
 * Validate phone number
 */
async function validatePhone(phone: string): Promise<FraudCheck> {
  let riskScore = 0;

  // Remove formatting
  const digits = phone.replace(/\D/g, '');

  // Check length
  if (digits.length < 10 || digits.length > 15) riskScore += 30;

  // Check for suspicious patterns
  if (/^(\d)\1+$/.test(digits)) riskScore += 50; // All same digit
  if (digits === '0000000000') riskScore += 50;

  // In production, use phone validation API (Twilio Lookup)
  // const twilioClient = require('twilio')(accountSid, authToken);
  // const result = await twilioClient.lookups.v1.phoneNumbers(phone).fetch();

  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'PHONE_VALIDATION',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: { phone, digitsOnly: digits },
    checkedAt: new Date()
  };
}

/**
 * Check device fingerprint
 */
async function checkDeviceFingerprint(deviceId: string, userId?: string): Promise<FraudCheck> {
  const device = await db.query.deviceFingerprints.findFirst({
    where: eq(deviceFingerprints.deviceId, deviceId)
  });

  let riskScore = 0;

  if (!device) {
    // New device
    riskScore += 15;
  } else {
    // Check device history
    if (device.fraudCount > 0) {
      riskScore += Math.min(device.fraudCount * 30, 80);
    }

    // Check if device used by multiple users
    if (device.orderCount > 10 && userId && device.userId !== userId) {
      riskScore += 40;
    }

    // Use trust score
    riskScore += (100 - device.trustScore) * 0.5;
  }

  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'DEVICE_FINGERPRINT',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: {
      deviceId,
      isNewDevice: !device,
      orderCount: device?.orderCount || 0,
      fraudCount: device?.fraudCount || 0,
      trustScore: device?.trustScore || 50
    },
    checkedAt: new Date()
  };
}

/**
 * Check IP geolocation vs shipping address
 */
async function checkIPGeolocation(ipAddress: string, shippingAddress: any): Promise<FraudCheck> {
  // In production, use IP geolocation API (MaxMind, IPStack)
  // const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
  // const ipData = await response.json();

  // Simulated IP data
  const ipData = {
    country: 'US',
    region: 'California',
    city: 'San Francisco'
  };

  let riskScore = 0;

  // Check if IP country matches shipping country
  if (ipData.country !== shippingAddress.country) {
    riskScore += 40;
  }

  // Check if IP is from known VPN/proxy
  // const isVPN = await checkVPN(ipAddress);
  // if (isVPN) riskScore += 30;

  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'IP_GEOLOCATION',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: {
      ipAddress,
      ipCountry: ipData.country,
      shippingCountry: shippingAddress.country,
      countryMismatch: ipData.country !== shippingAddress.country
    },
    checkedAt: new Date()
  };
}

/**
 * Analyze user behavior
 */
async function analyzeBehavior(userId: string, orderAmountCents: number): Promise<FraudCheck> {
  // Get user's order history
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: desc(orders.createdAt),
    limit: 10
  });

  let riskScore = 0;

  if (userOrders.length === 0) {
    // First order
    if (orderAmountCents > 50000) riskScore += 30; // First order > $500
  } else {
    // Calculate average order value
    const avgOrderCents = userOrders.reduce((sum, o) => sum + o.totalCents, 0) / userOrders.length;
    
    // Check if current order is significantly higher
    if (orderAmountCents > avgOrderCents * 3) {
      riskScore += 40;
    }

    // Check for rapid successive orders
    const lastOrder = userOrders[0];
    const timeSinceLastOrder = Date.now() - lastOrder.createdAt.getTime();
    if (timeSinceLastOrder < 5 * 60 * 1000) { // Less than 5 minutes
      riskScore += 25;
    }
  }

  const riskLevel = calculateRiskLevel(riskScore);

  return {
    checkId: crypto.randomUUID(),
    orderId: '',
    checkType: 'BEHAVIORAL',
    riskScore,
    riskLevel,
    passed: riskScore < 40,
    details: {
      userId,
      orderCount: userOrders.length,
      isFirstOrder: userOrders.length === 0,
      orderAmountCents
    },
    checkedAt: new Date()
  };
}

/**
 * Calculate risk level from score
 */
function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate recommendations based on checks
 */
function generateRecommendations(checks: FraudCheck[], overallScore: number): string[] {
  const recommendations: string[] = [];

  if (overallScore >= 80) {
    recommendations.push('BLOCK ORDER - Critical fraud risk detected');
  } else if (overallScore >= 60) {
    recommendations.push('MANUAL REVIEW REQUIRED - High fraud risk');
  }

  const failedChecks = checks.filter(c => !c.passed);
  
  for (const check of failedChecks) {
    switch (check.checkType) {
      case 'BLACKLIST':
        recommendations.push('Entity is blacklisted - Auto-block recommended');
        break;
      case 'VELOCITY':
        recommendations.push('High velocity detected - Review for card testing');
        break;
      case 'AVS':
        recommendations.push('Address verification failed - Verify shipping address');
        break;
      case 'CVV':
        recommendations.push('CVV check failed - Request new payment method');
        break;
      case 'EMAIL_VALIDATION':
        recommendations.push('Suspicious email detected - Verify customer identity');
        break;
      case 'DEVICE_FINGERPRINT':
        recommendations.push('Device has fraud history - Extra verification needed');
        break;
      case 'IP_GEOLOCATION':
        recommendations.push('IP/shipping mismatch - Confirm customer location');
        break;
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Order appears legitimate - Proceed with fulfillment');
  }

  return recommendations;
}

/**
 * Track velocity metrics
 */
async function trackVelocity(orderData: any): Promise<void> {
  const identifiers = [
    { type: 'IP', value: orderData.ipAddress },
    { type: 'EMAIL', value: orderData.email },
    { type: 'CARD', value: orderData.paymentMethod.last4 }
  ];

  if (orderData.deviceId) {
    identifiers.push({ type: 'DEVICE', value: orderData.deviceId });
  }

  for (const { type, value } of identifiers) {
    const existing = await db.query.velocityTracking.findFirst({
      where: and(
        eq(velocityTracking.identifierType, type),
        eq(velocityTracking.identifier, value)
      )
    });

    if (existing) {
      await db.update(velocityTracking)
        .set({
          count: existing.count + 1,
          totalAmountCents: existing.totalAmountCents + orderData.totalCents,
          lastSeenAt: new Date()
        })
        .where(eq(velocityTracking.trackingId, existing.trackingId));
    } else {
      await db.insert(velocityTracking).values({
        identifier: value,
        identifierType: type,
        count: 1,
        totalAmountCents: orderData.totalCents,
        firstSeenAt: new Date(),
        lastSeenAt: new Date()
      });
    }
  }
}

/**
 * Add entity to blacklist
 */
export async function addToBlacklist(
  type: BlacklistType,
  value: string,
  reason: string,
  addedBy: string
): Promise<void> {
  await db.insert(blacklistedEntities).values({
    type,
    value,
    reason,
    addedBy,
    addedAt: new Date()
  });
}

/**
 * Remove from blacklist
 */
export async function removeFromBlacklist(
  type: BlacklistType,
  value: string
): Promise<void> {
  await db.delete(blacklistedEntities)
    .where(and(
      eq(blacklistedEntities.type, type),
      eq(blacklistedEntities.value, value)
    ));
}

/**
 * Create manual review
 */
async function createManualReview(
  orderId: string,
  riskScore: number,
  recommendations: string[]
): Promise<void> {
  await db.insert(manualReviews).values({
    orderId,
    riskScore,
    status: 'PENDING',
    recommendations: recommendations.join('; '),
    createdAt: new Date()
  });
}

/**
 * Process manual review
 */
export async function processManualReview(
  reviewId: string,
  reviewerId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes: string
): Promise<void> {
  const review = await db.query.manualReviews.findFirst({
    where: eq(manualReviews.reviewId, reviewId)
  });

  if (!review) {
    throw new Error('Review not found');
  }

  await db.update(manualReviews)
    .set({
      status: decision,
      reviewedBy: reviewerId,
      reviewNotes: notes,
      reviewedAt: new Date()
    })
    .where(eq(manualReviews.reviewId, reviewId));

  // Update order status
  await db.update(orders)
    .set({
      status: decision === 'APPROVED' ? 'CONFIRMED' : 'CANCELLED',
      fraudCheckStatus: decision === 'APPROVED' ? 'PASSED' : 'BLOCKED'
    })
    .where(eq(orders.orderId, review.orderId));

  // If rejected, add to blacklist
  if (decision === 'REJECTED') {
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderId, review.orderId)
    });

    if (order) {
      await addToBlacklist('EMAIL', order.email, `Manual review rejection: ${notes}`, reviewerId);
      if (order.ipAddress) {
        await addToBlacklist('IP', order.ipAddress, `Manual review rejection: ${notes}`, reviewerId);
      }
    }
  }
}

/**
 * Record device fingerprint
 */
export async function recordDeviceFingerprint(
  deviceData: {
    deviceId: string;
    userId?: string;
    userAgent: string;
    ipAddress: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    plugins: string[];
    canvas: string;
    webgl: string;
  }
): Promise<void> {
  const existing = await db.query.deviceFingerprints.findFirst({
    where: eq(deviceFingerprints.deviceId, deviceData.deviceId)
  });

  if (existing) {
    await db.update(deviceFingerprints)
      .set({
        lastSeenAt: new Date(),
        orderCount: existing.orderCount + 1
      })
      .where(eq(deviceFingerprints.fingerprintId, existing.fingerprintId));
  } else {
    await db.insert(deviceFingerprints).values({
      ...deviceData,
      userId: deviceData.userId || null,
      trustScore: 50, // Start with neutral score
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      orderCount: 1,
      fraudCount: 0
    });
  }
}

/**
 * Update device trust score
 */
export async function updateDeviceTrustScore(
  deviceId: string,
  isFraud: boolean
): Promise<void> {
  const device = await db.query.deviceFingerprints.findFirst({
    where: eq(deviceFingerprints.deviceId, deviceId)
  });

  if (!device) return;

  const newTrustScore = isFraud 
    ? Math.max(device.trustScore - 20, 0)
    : Math.min(device.trustScore + 5, 100);

  const newFraudCount = isFraud ? device.fraudCount + 1 : device.fraudCount;

  await db.update(deviceFingerprints)
    .set({
      trustScore: newTrustScore,
      fraudCount: newFraudCount
    })
    .where(eq(deviceFingerprints.fingerprintId, device.fingerprintId));
}

/**
 * Predict chargeback risk
 */
export async function predictChargebackRisk(orderId: string): Promise<{
  chargebackProbability: number;
  riskFactors: string[];
}> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderId, orderId)
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const riskFactors: string[] = [];
  let probability = 0;

  // High-risk indicators
  if (order.riskScore >= 60) {
    probability += 0.3;
    riskFactors.push('High fraud risk score');
  }

  if (order.totalCents > 100000) { // $1000+
    probability += 0.15;
    riskFactors.push('High order value');
  }

  // Check shipping vs billing mismatch
  // if (order.shippingAddress !== order.billingAddress) {
  //   probability += 0.2;
  //   riskFactors.push('Shipping/billing address mismatch');
  // }

  // Check user history
  if (order.userId) {
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, order.userId)
    });

    if (userOrders.length === 1) {
      probability += 0.1;
      riskFactors.push('First-time customer');
    }
  }

  return {
    chargebackProbability: Math.min(probability, 1),
    riskFactors
  };
}
