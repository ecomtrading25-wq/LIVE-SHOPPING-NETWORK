/**
 * UPS Integration Module
 * Complete UPS API integration for shipping, tracking, and logistics
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

const UPS_API_BASE = process.env.UPS_MODE === 'live'
  ? 'https://onlinetools.ups.com/api'
  : 'https://wwwcie.ups.com/api';

const UPS_CLIENT_ID = process.env.UPS_CLIENT_ID;
const UPS_CLIENT_SECRET = process.env.UPS_CLIENT_SECRET;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getUPSToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${UPS_CLIENT_ID}:${UPS_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${UPS_API_BASE}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'UPS auth failed' });

  const data: any = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

async function upsRequest<T>(endpoint: string, body: any, method = 'POST'): Promise<T> {
  const token = await getUPSToken();
  
  const response = await fetch(`${UPS_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.response?.errors?.[0]?.message || 'UPS API failed' });
  }

  return response.json();
}

export const upsSchemas = {
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
    serviceCode: z.string().default('03'), // Ground
  }),
  trackShipment: z.object({
    trackingNumber: z.string(),
  }),
};

export async function getUPSRates(input: z.infer<typeof upsSchemas.getRates>) {
  const result = await upsRequest<any>('/rating/v1/Rate', {
    RateRequest: {
      Request: {
        TransactionReference: { CustomerContext: 'Rate Request' },
      },
      Shipment: {
        Shipper: {
          Address: {
            PostalCode: input.fromZip,
            CountryCode: 'US',
          },
        },
        ShipTo: {
          Address: {
            PostalCode: input.toZip,
            CountryCode: 'US',
          },
        },
        Package: [{
          PackagingType: { Code: '02' }, // Customer Supplied
          Dimensions: {
            UnitOfMeasurement: { Code: 'IN' },
            Length: input.length.toString(),
            Width: input.width.toString(),
            Height: input.height.toString(),
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: 'LBS' },
            Weight: input.weight.toString(),
          },
        }],
      },
    },
  });

  return {
    rates: result.RateResponse.RatedShipment.map((rate: any) => ({
      service: rate.Service.Code,
      serviceName: rate.Service.Name || 'UPS Service',
      totalCharge: parseFloat(rate.TotalCharges.MonetaryValue),
      currency: rate.TotalCharges.CurrencyCode,
      deliveryDate: rate.TimeInTransit?.ServiceSummary?.EstimatedArrival?.Arrival?.Date,
    })),
  };
}

export async function createUPSShipment(input: z.infer<typeof upsSchemas.createShipment>) {
  const result = await upsRequest<any>('/shipments/v1/ship', {
    ShipmentRequest: {
      Shipment: {
        Shipper: {
          Name: input.fromAddress.name,
          Address: {
            AddressLine: [input.fromAddress.street],
            City: input.fromAddress.city,
            StateProvinceCode: input.fromAddress.state,
            PostalCode: input.fromAddress.zip,
            CountryCode: input.fromAddress.country,
          },
        },
        ShipTo: {
          Name: input.toAddress.name,
          Address: {
            AddressLine: [input.toAddress.street],
            City: input.toAddress.city,
            StateProvinceCode: input.toAddress.state,
            PostalCode: input.toAddress.zip,
            CountryCode: input.toAddress.country,
          },
        },
        Service: {
          Code: input.serviceCode,
        },
        Package: [{
          Packaging: { Code: '02' },
          Dimensions: {
            UnitOfMeasurement: { Code: 'IN' },
            Length: input.package.length.toString(),
            Width: input.package.width.toString(),
            Height: input.package.height.toString(),
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: 'LBS' },
            Weight: input.package.weight.toString(),
          },
        }],
        PaymentInformation: {
          ShipmentCharge: [{
            Type: '01', // Transportation
            BillShipper: { AccountNumber: process.env.UPS_ACCOUNT_NUMBER },
          }],
        },
      },
      LabelSpecification: {
        LabelImageFormat: { Code: 'PDF' },
        LabelStockSize: { Height: '6', Width: '4' },
      },
    },
  });

  const shipment = result.ShipmentResponse.ShipmentResults;
  
  return {
    trackingNumber: shipment.PackageResults[0].TrackingNumber,
    labelUrl: shipment.PackageResults[0].ShippingLabel.GraphicImage, // Base64 encoded
  };
}

export async function trackUPSShipment(input: z.infer<typeof upsSchemas.trackShipment>) {
  const result = await upsRequest<any>(
    `/track/v1/details/${input.trackingNumber}`,
    {},
    'GET'
  );

  const tracking = result.trackResponse.shipment[0];
  
  return {
    trackingNumber: input.trackingNumber,
    status: tracking.package[0].currentStatus.description,
    estimatedDelivery: tracking.deliveryDate?.[0]?.date,
    events: tracking.package[0].activity?.map((e: any) => ({
      date: e.date,
      time: e.time,
      description: e.status.description,
      location: `${e.location?.address?.city}, ${e.location?.address?.stateProvince}`,
    })) || [],
  };
}

export default {
  getUPSRates,
  createUPSShipment,
  trackUPSShipment,
};
