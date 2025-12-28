/**
 * Tax Calculation System
 * Comprehensive tax calculation for global e-commerce compliance
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

// US Sales Tax Rates by State (2025)
const US_SALES_TAX_RATES: Record<string, { state: number; avgLocal: number; combined: number }> = {
  CA: { state: 7.25, avgLocal: 1.57, combined: 8.82 },
  NY: { state: 4.00, avgLocal: 4.52, combined: 8.52 },
  TX: { state: 6.25, avgLocal: 1.95, combined: 8.20 },
  FL: { state: 6.00, avgLocal: 1.05, combined: 7.05 },
};

// EU VAT Rates
const EU_VAT_RATES: Record<string, number> = {
  DE: 19, FR: 20, IT: 22, ES: 21, NL: 21, GB: 20,
};

export const taxSchemas = {
  calculateTax: z.object({
    amount: z.number().positive(),
    country: z.string().length(2),
    state: z.string().optional(),
  }),
};

export async function calculateTax(input: z.infer<typeof taxSchemas.calculateTax>) {
  let taxRate = 0;
  let taxType = '';

  if (input.country === 'US' && input.state) {
    const stateRates = US_SALES_TAX_RATES[input.state];
    if (stateRates) {
      taxRate = stateRates.combined;
      taxType = 'SALES_TAX';
    }
  } else if (input.country in EU_VAT_RATES) {
    taxRate = EU_VAT_RATES[input.country];
    taxType = 'VAT';
  }

  const taxAmount = (input.amount * taxRate) / 100;
  return { taxAmount, taxRate, taxType };
}

export default { calculateTax };
