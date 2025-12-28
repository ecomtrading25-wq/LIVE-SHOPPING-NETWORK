/**
 * DHL Integration Module
 * Complete DHL Express API integration for international shipping
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

const DHL_API_BASE = process.env.DHL_MODE === 'live'
  ? 'https://express.api.dhl.com'
  : 'https://express.api.dhl.com/mydhlapi/test';

const DHL_API_KEY = process.env.DHL_API_KEY;
const DHL_API_SECRET = process.env.DHL_API_SECRET;

async function dhlRequest<T>(endpoint: string, body: any, method = 'POST'): Promise<T> {
  const auth = Buffer.from(`${DHL_API_KEY}:${DHL_API_SECRET}`).toString('base64');
  
  const response = await fetch(`${DHL_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message || 'DHL API failed' });
  }

  return response.json();
}

export const dhlSchemas = {
  getRates: z.object({
    fromCountry: z.string().length(2),
    fromCity: z.string(),
    fromZip: z.string(),
    toCountry: z.string().length(2),
    toCity: z.string(),
    toZip: z.string(),
    weight: z.number().positive(),
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  createShipment: z.object({
    fromAddress: z.object({
      name: z.string(),
      company: z.string().optional(),
      street: z.string(),
      city: z.string(),
      zip: z.string(),
      country: z.string().length(2),
      phone: z.string(),
      email: z.string().email(),
    }),
    toAddress: z.object({
      name: z.string(),
      company: z.string().optional(),
      street: z.string(),
      city: z.string(),
      zip: z.string(),
      country: z.string().length(2),
      phone: z.string(),
      email: z.string().email(),
    }),
    package: z.object({
      weight: z.number(),
      length: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    productCode: z.string().default('P'), // Express Worldwide
    contentDescription: z.string(),
  }),
  trackShipment: z.object({
    trackingNumber: z.string(),
  }),
};

export async function getDHLRates(input: z.infer<typeof dhlSchemas.getRates>) {
  const result = await dhlRequest<any>('/rates', {
    customerDetails: {
      shipperDetails: {
        postalCode: input.fromZip,
        cityName: input.fromCity,
        countryCode: input.fromCountry,
      },
      receiverDetails: {
        postalCode: input.toZip,
        cityName: input.toCity,
        countryCode: input.toCountry,
      },
    },
    accounts: [{
      typeCode: 'shipper',
      number: process.env.DHL_ACCOUNT_NUMBER,
    }],
    productCode: 'P',
    localProductCode: 'P',
    valueAddedServices: [],
    productsAndServices: [{
      productCode: 'P',
      localProductCode: 'P',
    }],
    payerCountryCode: input.fromCountry,
    plannedShippingDateAndTime: new Date().toISOString(),
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: input.fromCountry !== input.toCountry,
    monetaryAmount: [{
      typeCode: 'declaredValue',
      value: 100,
      currency: 'USD',
    }],
    packages: [{
      typeCode: '2BP', // Customer Provided Box
      weight: input.weight,
      dimensions: {
        length: input.length,
        width: input.width,
        height: input.height,
      },
    }],
  });

  return {
    rates: result.products.map((product: any) => ({
      service: product.productCode,
      serviceName: product.productName,
      totalCharge: parseFloat(product.totalPrice[0].price),
      currency: product.totalPrice[0].priceCurrency,
      deliveryDate: product.deliveryCapabilities?.deliveryTypeCode,
    })),
  };
}

export async function createDHLShipment(input: z.infer<typeof dhlSchemas.createShipment>) {
  const result = await dhlRequest<any>('/shipments', {
    plannedShippingDateAndTime: new Date().toISOString(),
    pickup: {
      isRequested: false,
    },
    productCode: input.productCode,
    accounts: [{
      typeCode: 'shipper',
      number: process.env.DHL_ACCOUNT_NUMBER,
    }],
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: input.fromAddress.zip,
          cityName: input.fromAddress.city,
          countryCode: input.fromAddress.country,
          addressLine1: input.fromAddress.street,
        },
        contactInformation: {
          email: input.fromAddress.email,
          phone: input.fromAddress.phone,
          companyName: input.fromAddress.company || input.fromAddress.name,
          fullName: input.fromAddress.name,
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: input.toAddress.zip,
          cityName: input.toAddress.city,
          countryCode: input.toAddress.country,
          addressLine1: input.toAddress.street,
        },
        contactInformation: {
          email: input.toAddress.email,
          phone: input.toAddress.phone,
          companyName: input.toAddress.company || input.toAddress.name,
          fullName: input.toAddress.name,
        },
      },
    },
    content: {
      packages: [{
        typeCode: '2BP',
        weight: input.package.weight,
        dimensions: {
          length: input.package.length,
          width: input.package.width,
          height: input.package.height,
        },
      }],
      isCustomsDeclarable: input.fromAddress.country !== input.toAddress.country,
      declaredValue: 100,
      declaredValueCurrency: 'USD',
      exportDeclaration: input.fromAddress.country !== input.toAddress.country ? {
        lineItems: [{
          number: 1,
          description: input.contentDescription,
          price: 100,
          quantity: {
            value: 1,
            unitOfMeasurement: 'PCS',
          },
          commodityCodes: [{
            typeCode: 'outbound',
            value: '851713',
          }],
          exportReasonType: 'permanent',
          manufacturerCountry: input.fromAddress.country,
          weight: {
            netValue: input.package.weight,
            grossValue: input.package.weight,
          },
        }],
        invoice: {
          number: `INV-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
        },
      } : undefined,
      incoterm: 'DAP',
      unitOfMeasurement: 'metric',
    },
    outputImageProperties: {
      printerDPI: 300,
      encodingFormat: 'pdf',
      imageOptions: [{
        typeCode: 'label',
        templateName: 'ECOM26_84_001',
        isRequested: true,
      }],
    },
  });

  return {
    trackingNumber: result.shipmentTrackingNumber,
    labelUrl: result.documents[0].content, // Base64 encoded PDF
  };
}

export async function trackDHLShipment(input: z.infer<typeof dhlSchemas.trackShipment>) {
  const result = await dhlRequest<any>(
    `/shipments/${input.trackingNumber}/tracking`,
    {},
    'GET'
  );

  const shipment = result.shipments[0];
  
  return {
    trackingNumber: input.trackingNumber,
    status: shipment.status.statusCode,
    estimatedDelivery: shipment.estimatedDeliveryDate,
    events: shipment.events?.map((e: any) => ({
      date: e.timestamp,
      description: e.description,
      location: e.location?.address?.addressLocality,
    })) || [],
  };
}

export default {
  getDHLRates,
  createDHLShipment,
  trackDHLShipment,
};
