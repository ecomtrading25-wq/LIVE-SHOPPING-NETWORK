/**
 * FedEx Integration Module
 * Complete FedEx API integration for shipping, tracking, and logistics
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

const FEDEX_API_BASE = process.env.FEDEX_MODE === 'live'
  ? 'https://apis.fedex.com'
  : 'https://apis-sandbox.fedex.com';

const FEDEX_API_KEY = process.env.FEDEX_API_KEY;
const FEDEX_SECRET_KEY = process.env.FEDEX_SECRET_KEY;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getFedExToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const response = await fetch(`${FEDEX_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: FEDEX_API_KEY!,
      client_secret: FEDEX_SECRET_KEY!,
    }),
  });

  if (!response.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'FedEx auth failed' });

  const data: any = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

async function fedexRequest<T>(endpoint: string, body: any): Promise<T> {
  const token = await getFedExToken();
  
  const response = await fetch(`${FEDEX_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-locale': 'en_US',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.errors?.[0]?.message || 'FedEx API failed' });
  }

  return response.json();
}

export const fedexSchemas = {
  getRates: z.object({
    fromZip: z.string(),
    toZip: z.string(),
    weight: z.number().positive(),
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  createShipment: z.object({
    fromAddress: z.object({
      name: z.string(),
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    }),
    toAddress: z.object({
      name: z.string(),
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    }),
    package: z.object({
      weight: z.number(),
      length: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    serviceType: z.string(),
  }),
  trackShipment: z.object({
    trackingNumber: z.string(),
  }),
};

export async function getFedExRates(input: z.infer<typeof fedexSchemas.getRates>) {
  const result = await fedexRequest<any>('/rate/v1/rates/quotes', {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
    requestedShipment: {
      shipper: { address: { postalCode: input.fromZip, countryCode: 'US' } },
      recipient: { address: { postalCode: input.toZip, countryCode: 'US' } },
      pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
      rateRequestType: ['LIST', 'ACCOUNT'],
      requestedPackageLineItems: [{
        weight: { units: 'LB', value: input.weight },
        dimensions: {
          length: input.length,
          width: input.width,
          height: input.height,
          units: 'IN',
        },
      }],
    },
  });

  return {
    rates: result.output.rateReplyDetails.map((rate: any) => ({
      service: rate.serviceType,
      totalCharge: parseFloat(rate.ratedShipmentDetails[0].totalNetCharge),
      currency: rate.ratedShipmentDetails[0].currency,
      deliveryDate: rate.commit?.dateDetail?.dayFormat,
    })),
  };
}

export async function createFedExShipment(input: z.infer<typeof fedexSchemas.createShipment>) {
  const result = await fedexRequest<any>('/ship/v1/shipments', {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
    requestedShipment: {
      shipper: {
        contact: { personName: input.fromAddress.name },
        address: {
          streetLines: [input.fromAddress.street],
          city: input.fromAddress.city,
          stateOrProvinceCode: input.fromAddress.state,
          postalCode: input.fromAddress.zip,
          countryCode: input.fromAddress.country,
        },
      },
      recipients: [{
        contact: { personName: input.toAddress.name },
        address: {
          streetLines: [input.toAddress.street],
          city: input.toAddress.city,
          stateOrProvinceCode: input.toAddress.state,
          postalCode: input.toAddress.zip,
          countryCode: input.toAddress.country,
        },
      }],
      serviceType: input.serviceType,
      packagingType: 'YOUR_PACKAGING',
      pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
      requestedPackageLineItems: [{
        weight: { units: 'LB', value: input.package.weight },
        dimensions: {
          length: input.package.length,
          width: input.package.width,
          height: input.package.height,
          units: 'IN',
        },
      }],
      labelSpecification: {
        imageType: 'PDF',
        labelStockType: 'PAPER_4X6',
      },
      shippingChargesPayment: {
        paymentType: 'SENDER',
      },
    },
  });

  return {
    trackingNumber: result.output.transactionShipments[0].masterTrackingNumber,
    labelUrl: result.output.transactionShipments[0].pieceResponses[0].packageDocuments[0].url,
  };
}

export async function trackFedExShipment(input: z.infer<typeof fedexSchemas.trackShipment>) {
  const result = await fedexRequest<any>('/track/v1/trackingnumbers', {
    trackingInfo: [{
      trackingNumberInfo: { trackingNumber: input.trackingNumber },
    }],
    includeDetailedScans: true,
  });

  const tracking = result.output.completeTrackResults[0].trackResults[0];
  
  return {
    trackingNumber: input.trackingNumber,
    status: tracking.latestStatusDetail?.description,
    estimatedDelivery: tracking.dateAndTimes?.find((d: any) => d.type === 'ESTIMATED_DELIVERY')?.dateTime,
    events: tracking.scanEvents?.map((e: any) => ({
      date: e.date,
      description: e.eventDescription,
      location: e.scanLocation?.city,
    })) || [],
  };
}

export default {
  getFedExRates,
  createFedExShipment,
  trackFedExShipment,
};
