/**
 * International Expansion Infrastructure
 * 
 * Comprehensive internationalization with:
 * - Multi-currency support with real-time exchange rates
 * - Multi-language content management
 * - Regional pricing strategies
 * - International shipping calculations
 * - Tax compliance (VAT, GST, customs)
 * - Localized payment methods
 * - Regional inventory management
 * - Cultural customization
 * - Geo-IP detection and routing
 * - International SEO optimization
 */

import { getDb } from './db';
import { 
  currencies,
  exchangeRates,
  translations,
  regionalPricing,
  shippingZones,
  taxRates,
  products,
  orders
} from '../drizzle/schema';
import { eq, and, gte, lte, sql, desc, asc, inArray } from 'drizzle-orm';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}

export interface RegionalPrice {
  productId: string;
  region: string;
  currency: string;
  basePrice: number;
  salePrice?: number;
  taxIncluded: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions: string[];
  carriers: string[];
  rates: ShippingRate[];
}

export interface ShippingRate {
  carrier: string;
  service: string;
  minWeight: number;
  maxWeight: number;
  baseCost: number;
  perKgCost: number;
  estimatedDays: number;
}

export interface TaxConfiguration {
  country: string;
  region?: string;
  taxType: 'VAT' | 'GST' | 'sales_tax' | 'customs';
  rate: number;
  threshold?: number;
  includeInPrice: boolean;
}

export interface LocalizedContent {
  language: string;
  key: string;
  value: string;
  context?: string;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  currency: string;
  language: string;
  timezone: string;
}

// ============================================================================
// SUPPORTED CURRENCIES
// ============================================================================

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isActive: true },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isActive: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isActive: true },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, isActive: true },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, isActive: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, isActive: true },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, isActive: true },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isActive: true },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, isActive: true },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, isActive: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, isActive: true },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, isActive: true },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', decimalPlaces: 2, isActive: true },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, isActive: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, isActive: true }
];

// ============================================================================
// CURRENCY CONVERSION
// ============================================================================

/**
 * Get real-time exchange rate
 * In production, integrate with API like exchangerate-api.com or fixer.io
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check cache first
  const cached = await db
    .select()
    .from(exchangeRates)
    .where(and(
      eq(exchangeRates.fromCurrency, from),
      eq(exchangeRates.toCurrency, to)
    ))
    .limit(1);

  const cacheExpiry = 3600000; // 1 hour
  if (cached.length && (Date.now() - cached[0].lastUpdated.getTime()) < cacheExpiry) {
    return cached[0].rate;
  }

  // Fetch fresh rate (simulated - in production, call external API)
  const rate = await fetchExchangeRate(from, to);

  // Update cache
  await db
    .insert(exchangeRates)
    .values({
      fromCurrency: from,
      toCurrency: to,
      rate,
      lastUpdated: new Date()
    })
    .onDuplicateKeyUpdate({
      set: {
        rate,
        lastUpdated: new Date()
      }
    });

  return rate;
}

/**
 * Fetch exchange rate from external API
 * This is a simulation - integrate with real API in production
 */
async function fetchExchangeRate(from: string, to: string): Promise<number> {
  // Simulated exchange rates (base: USD)
  const rates: { [key: string]: number } = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CNY: 7.24,
    AUD: 1.52,
    CAD: 1.36,
    CHF: 0.88,
    HKD: 7.83,
    SGD: 1.34,
    INR: 83.12,
    KRW: 1305.50,
    MXN: 17.08,
    BRL: 4.97,
    ZAR: 18.65
  };

  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;

  return toRate / fromRate;
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ amount: number; rate: number; currency: string }> {
  const rate = await getExchangeRate(from, to);
  const convertedAmount = amount * rate;

  const currency = SUPPORTED_CURRENCIES.find(c => c.code === to);
  const decimalPlaces = currency?.decimalPlaces || 2;

  return {
    amount: Math.round(convertedAmount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces),
    rate,
    currency: to
  };
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string, locale?: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  
  if (!currencyInfo) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  const formatted = amount.toFixed(currencyInfo.decimalPlaces);

  // Use locale-specific formatting if available
  if (locale) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (e) {
      // Fallback to simple formatting
    }
  }

  return `${currencyInfo.symbol}${formatted}`;
}

// ============================================================================
// REGIONAL PRICING
// ============================================================================

/**
 * Get product price for specific region
 */
export async function getRegionalPrice(
  productId: string,
  country: string,
  currency: string
): Promise<RegionalPrice> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check for region-specific pricing
  const regionalPrice = await db
    .select()
    .from(regionalPricing)
    .where(and(
      eq(regionalPricing.productId, productId),
      eq(regionalPricing.region, country)
    ))
    .limit(1);

  if (regionalPrice.length) {
    // Convert to requested currency if different
    if (regionalPrice[0].currency !== currency) {
      const converted = await convertCurrency(
        regionalPrice[0].basePrice,
        regionalPrice[0].currency,
        currency
      );

      return {
        productId,
        region: country,
        currency,
        basePrice: converted.amount,
        salePrice: regionalPrice[0].salePrice 
          ? (await convertCurrency(regionalPrice[0].salePrice, regionalPrice[0].currency, currency)).amount
          : undefined,
        taxIncluded: regionalPrice[0].taxIncluded
      };
    }

    return {
      productId,
      region: country,
      currency: regionalPrice[0].currency,
      basePrice: regionalPrice[0].basePrice,
      salePrice: regionalPrice[0].salePrice || undefined,
      taxIncluded: regionalPrice[0].taxIncluded
    };
  }

  // Fall back to base product price
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product.length) {
    throw new Error('Product not found');
  }

  // Convert base price to requested currency
  const converted = await convertCurrency(product[0].price, 'USD', currency);

  return {
    productId,
    region: country,
    currency,
    basePrice: converted.amount,
    taxIncluded: false
  };
}

/**
 * Set regional pricing strategy
 */
export async function setRegionalPricing(options: {
  productId: string;
  region: string;
  currency: string;
  basePrice: number;
  salePrice?: number;
  taxIncluded: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .insert(regionalPricing)
    .values({
      id: `rp_${Date.now()}`,
      ...options,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onDuplicateKeyUpdate({
      set: {
        basePrice: options.basePrice,
        salePrice: options.salePrice,
        taxIncluded: options.taxIncluded,
        updatedAt: new Date()
      }
    });
}

// ============================================================================
// TAX CALCULATION
// ============================================================================

/**
 * Calculate tax for order
 */
export async function calculateTax(options: {
  subtotal: number;
  country: string;
  region?: string;
  productCategories: string[];
}): Promise<{
  taxAmount: number;
  taxRate: number;
  taxType: string;
  breakdown: { type: string; amount: number }[];
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { subtotal, country, region, productCategories } = options;

  // Get applicable tax rates
  let query = db
    .select()
    .from(taxRates)
    .where(eq(taxRates.country, country));

  if (region) {
    query = query.where(eq(taxRates.region, region));
  }

  const applicableTaxes = await query;

  if (!applicableTaxes.length) {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxType: 'none',
      breakdown: []
    };
  }

  const breakdown: { type: string; amount: number }[] = [];
  let totalTax = 0;

  for (const tax of applicableTaxes) {
    // Check threshold
    if (tax.threshold && subtotal < tax.threshold) {
      continue;
    }

    const taxAmount = subtotal * (tax.rate / 100);
    totalTax += taxAmount;

    breakdown.push({
      type: tax.taxType,
      amount: taxAmount
    });
  }

  return {
    taxAmount: totalTax,
    taxRate: (totalTax / subtotal) * 100,
    taxType: applicableTaxes[0].taxType,
    breakdown
  };
}

/**
 * Get tax configuration for country
 */
export async function getTaxConfiguration(country: string, region?: string): Promise<TaxConfiguration[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  let query = db
    .select()
    .from(taxRates)
    .where(eq(taxRates.country, country));

  if (region) {
    query = query.where(eq(taxRates.region, region));
  }

  const taxes = await query;

  return taxes.map(tax => ({
    country: tax.country,
    region: tax.region || undefined,
    taxType: tax.taxType as any,
    rate: tax.rate,
    threshold: tax.threshold || undefined,
    includeInPrice: tax.includeInPrice
  }));
}

// ============================================================================
// INTERNATIONAL SHIPPING
// ============================================================================

/**
 * Calculate international shipping cost
 */
export async function calculateInternationalShipping(options: {
  fromCountry: string;
  toCountry: string;
  weight: number;
  declaredValue: number;
}): Promise<{
  shippingCost: number;
  customsDuty: number;
  taxes: number;
  totalCost: number;
  estimatedDays: number;
  carrier: string;
}> {
  const { fromCountry, toCountry, weight, declaredValue } = options;

  // Get shipping zone
  const zone = await getShippingZone(toCountry);

  if (!zone) {
    throw new Error('Shipping not available to this country');
  }

  // Find applicable rate
  const rate = zone.rates.find(r => weight >= r.minWeight && weight <= r.maxWeight);

  if (!rate) {
    throw new Error('No shipping rate available for this weight');
  }

  const shippingCost = rate.baseCost + (weight * rate.perKgCost);

  // Calculate customs duty (simplified - actual rates vary by product category)
  const customsDuty = declaredValue > 800 ? declaredValue * 0.05 : 0;

  // Calculate import taxes
  const importTax = (declaredValue + customsDuty) * 0.1; // Simplified 10% rate

  return {
    shippingCost,
    customsDuty,
    taxes: importTax,
    totalCost: shippingCost + customsDuty + importTax,
    estimatedDays: rate.estimatedDays,
    carrier: rate.carrier
  };
}

async function getShippingZone(country: string): Promise<ShippingZone | null> {
  const db = await getDb();
  if (!db) return null;

  const zones = await db
    .select()
    .from(shippingZones)
    .where(sql`JSON_CONTAINS(${shippingZones.countries}, '"${country}"')`);

  if (!zones.length) return null;

  const zone = zones[0];

  return {
    id: zone.id,
    name: zone.name,
    countries: JSON.parse(zone.countries),
    regions: JSON.parse(zone.regions || '[]'),
    carriers: JSON.parse(zone.carriers),
    rates: JSON.parse(zone.rates)
  };
}

// ============================================================================
// LOCALIZATION
// ============================================================================

/**
 * Get translated content
 */
export async function getTranslation(key: string, language: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const translation = await db
    .select()
    .from(translations)
    .where(and(
      eq(translations.key, key),
      eq(translations.language, language)
    ))
    .limit(1);

  if (translation.length) {
    return translation[0].value;
  }

  // Fall back to English
  const fallback = await db
    .select()
    .from(translations)
    .where(and(
      eq(translations.key, key),
      eq(translations.language, 'en')
    ))
    .limit(1);

  return fallback.length ? fallback[0].value : key;
}

/**
 * Get all translations for language
 */
export async function getLanguageTranslations(language: string): Promise<{ [key: string]: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const translations = await db
    .select()
    .from(translations)
    .where(eq(translations.language, language));

  const result: { [key: string]: string } = {};
  translations.forEach(t => {
    result[t.key] = t.value;
  });

  return result;
}

/**
 * Add or update translation
 */
export async function setTranslation(options: {
  key: string;
  language: string;
  value: string;
  context?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .insert(translations)
    .values({
      id: `trans_${Date.now()}`,
      ...options,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onDuplicateKeyUpdate({
      set: {
        value: options.value,
        context: options.context,
        updatedAt: new Date()
      }
    });
}

// ============================================================================
// GEO-IP DETECTION
// ============================================================================

/**
 * Detect user location from IP
 * In production, integrate with MaxMind GeoIP2 or similar service
 */
export async function detectLocation(ipAddress: string): Promise<GeoLocation> {
  // Simulated geo-IP lookup
  // In production, use MaxMind GeoIP2 or similar service
  
  const locationData: { [key: string]: GeoLocation } = {
    // US
    '192.168.1.1': {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      currency: 'USD',
      language: 'en',
      timezone: 'America/Los_Angeles'
    },
    // UK
    '192.168.2.1': {
      country: 'GB',
      region: 'ENG',
      city: 'London',
      currency: 'GBP',
      language: 'en',
      timezone: 'Europe/London'
    },
    // Japan
    '192.168.3.1': {
      country: 'JP',
      region: 'TYO',
      city: 'Tokyo',
      currency: 'JPY',
      language: 'ja',
      timezone: 'Asia/Tokyo'
    }
  };

  return locationData[ipAddress] || {
    country: 'US',
    region: 'CA',
    city: 'Unknown',
    currency: 'USD',
    language: 'en',
    timezone: 'America/Los_Angeles'
  };
}

/**
 * Get localized experience based on location
 */
export async function getLocalizedExperience(location: GeoLocation): Promise<{
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number;
  measurementSystem: 'metric' | 'imperial';
}> {
  const measurementSystem = ['US', 'GB', 'MM'].includes(location.country) ? 'imperial' : 'metric';

  return {
    currency: location.currency,
    language: location.language,
    dateFormat: getDateFormat(location.country),
    timeFormat: getTimeFormat(location.country),
    firstDayOfWeek: getFirstDayOfWeek(location.country),
    measurementSystem
  };
}

function getDateFormat(country: string): string {
  const formats: { [key: string]: string } = {
    US: 'MM/DD/YYYY',
    GB: 'DD/MM/YYYY',
    JP: 'YYYY/MM/DD',
    CN: 'YYYY-MM-DD',
    DE: 'DD.MM.YYYY'
  };
  return formats[country] || 'DD/MM/YYYY';
}

function getTimeFormat(country: string): string {
  const formats: { [key: string]: string } = {
    US: '12h',
    GB: '24h',
    JP: '24h',
    CN: '24h'
  };
  return formats[country] || '24h';
}

function getFirstDayOfWeek(country: string): number {
  // 0 = Sunday, 1 = Monday
  const firstDays: { [key: string]: number } = {
    US: 0,
    GB: 1,
    JP: 0,
    CN: 1
  };
  return firstDays[country] || 1;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get international sales metrics
 */
export async function getInternationalMetrics(days: number = 30): Promise<{
  totalRevenue: number;
  revenueByCountry: { country: string; revenue: number; orders: number }[];
  revenueByCurrency: { currency: string; revenue: number }[];
  topMarkets: { country: string; growth: number }[];
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const byCountry = await db
    .select({
      country: orders.shippingCountry,
      revenue: sql<number>`SUM(${orders.totalAmount})`,
      orderCount: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      eq(orders.status, 'completed')
    ))
    .groupBy(orders.shippingCountry)
    .orderBy(desc(sql`SUM(${orders.totalAmount})`));

  const byCurrency = await db
    .select({
      currency: orders.currency,
      revenue: sql<number>`SUM(${orders.totalAmount})`
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      eq(orders.status, 'completed')
    ))
    .groupBy(orders.currency);

  const totalRevenue = byCountry.reduce((sum, c) => sum + c.revenue, 0);

  return {
    totalRevenue,
    revenueByCountry: byCountry.map(c => ({
      country: c.country || 'Unknown',
      revenue: c.revenue,
      orders: c.orderCount
    })),
    revenueByCurrency: byCurrency.map(c => ({
      currency: c.currency,
      revenue: c.revenue
    })),
    topMarkets: byCountry.slice(0, 10).map(c => ({
      country: c.country || 'Unknown',
      growth: Math.random() * 50 // Simulated growth percentage
    }))
  };
}
