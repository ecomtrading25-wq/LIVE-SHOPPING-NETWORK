/**
 * Multi-Carrier Rate Shopping System
 * Compare rates across FedEx, UPS, and DHL to find best shipping options
 */

import { z } from "zod";
import { getFedExRates } from "./fedex-integration";
import { getUPSRates } from "./ups-integration";
import { getDHLRates } from "./dhl-integration";

export const rateShopperSchemas = {
  compareRates: z.object({
    fromAddress: z.object({
      zip: z.string(),
      city: z.string(),
      country: z.string().length(2).default('US'),
    }),
    toAddress: z.object({
      zip: z.string(),
      city: z.string(),
      country: z.string().length(2).default('US'),
    }),
    package: z.object({
      weight: z.number().positive(),
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    carriers: z.array(z.enum(['fedex', 'ups', 'dhl'])).default(['fedex', 'ups', 'dhl']),
  }),
};

export async function compareShippingRates(input: z.infer<typeof rateShopperSchemas.compareRates>) {
  const ratePromises: Promise<any>[] = [];

  // Fetch rates from selected carriers
  if (input.carriers.includes('fedex')) {
    ratePromises.push(
      getFedExRates({
        fromZip: input.fromAddress.zip,
        toZip: input.toAddress.zip,
        weight: input.package.weight,
        length: input.package.length,
        width: input.package.width,
        height: input.package.height,
      })
        .then(result => ({ carrier: 'FedEx', rates: result.rates }))
        .catch(err => ({ carrier: 'FedEx', error: err.message, rates: [] }))
    );
  }

  if (input.carriers.includes('ups')) {
    ratePromises.push(
      getUPSRates({
        fromZip: input.fromAddress.zip,
        toZip: input.toAddress.zip,
        weight: input.package.weight,
        length: input.package.length,
        width: input.package.width,
        height: input.package.height,
      })
        .then(result => ({ carrier: 'UPS', rates: result.rates }))
        .catch(err => ({ carrier: 'UPS', error: err.message, rates: [] }))
    );
  }

  if (input.carriers.includes('dhl')) {
    ratePromises.push(
      getDHLRates({
        fromCountry: input.fromAddress.country,
        fromCity: input.fromAddress.city,
        fromZip: input.fromAddress.zip,
        toCountry: input.toAddress.country,
        toCity: input.toAddress.city,
        toZip: input.toAddress.zip,
        weight: input.package.weight,
        length: input.package.length,
        width: input.package.width,
        height: input.package.height,
      })
        .then(result => ({ carrier: 'DHL', rates: result.rates }))
        .catch(err => ({ carrier: 'DHL', error: err.message, rates: [] }))
    );
  }

  const results = await Promise.all(ratePromises);

  // Flatten all rates
  const allRates = results.flatMap(result =>
    result.rates.map((rate: any) => ({
      carrier: result.carrier,
      service: rate.service,
      serviceName: rate.serviceName || rate.service,
      price: rate.totalCharge,
      currency: rate.currency,
      deliveryDate: rate.deliveryDate,
    }))
  );

  // Sort by price (cheapest first)
  allRates.sort((a, b) => a.price - b.price);

  // Find cheapest and fastest
  const cheapest = allRates[0];
  const fastest = allRates.reduce((fastest, current) => {
    if (!current.deliveryDate) return fastest;
    if (!fastest.deliveryDate) return current;
    return new Date(current.deliveryDate) < new Date(fastest.deliveryDate) ? current : fastest;
  }, allRates[0]);

  return {
    allRates,
    cheapest,
    fastest,
    summary: {
      totalOptions: allRates.length,
      priceRange: {
        min: allRates[0]?.price || 0,
        max: allRates[allRates.length - 1]?.price || 0,
      },
      carriers: results.map(r => ({
        name: r.carrier,
        available: r.rates.length > 0,
        error: r.error || null,
      })),
    },
  };
}

export default {
  compareShippingRates,
};
