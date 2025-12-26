/**
 * Multi-Currency Support System
 * Real-time exchange rates, currency conversion, and localization
 */

interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

interface PriceLocalization {
  originalPrice: number;
  originalCurrency: string;
  localizedPrice: number;
  localizedCurrency: string;
  exchangeRate: number;
  formattedPrice: string;
}

/**
 * Supported Currencies
 */
export const CURRENCIES: Record<string, Currency> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", decimalPlaces: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", decimalPlaces: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", decimalPlaces: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", decimalPlaces: 0 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", decimalPlaces: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalPlaces: 2 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalPlaces: 2 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalPlaces: 2 },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", decimalPlaces: 2 },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimalPlaces: 2 },
  HKD: { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimalPlaces: 2 },
  NZD: { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimalPlaces: 2 },
  KRW: { code: "KRW", name: "South Korean Won", symbol: "₩", decimalPlaces: 0 },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "MX$", decimalPlaces: 2 },
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalPlaces: 2 },
};

/**
 * Fetch Real-Time Exchange Rates
 * In production, integrate with API like exchangerate-api.com or openexchangerates.org
 */
export async function fetchExchangeRates(baseCurrency: string = "USD"): Promise<Record<string, number>> {
  // Mock data - in production, fetch from exchange rate API
  // Example: https://api.exchangerate-api.com/v4/latest/USD
  
  const mockRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    AUD: 1.52,
    CAD: 1.36,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.12,
    SGD: 1.34,
    HKD: 7.83,
    NZD: 1.64,
    KRW: 1320.45,
    MXN: 17.08,
    BRL: 4.97,
  };

  console.log(`[Currency] Fetched exchange rates for base currency: ${baseCurrency}`);
  return mockRates;
}

/**
 * Convert Price Between Currencies
 */
export async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  fromCurrency: string;
  toCurrency: string;
}> {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      exchangeRate: 1.0,
      fromCurrency,
      toCurrency,
    };
  }

  const rates = await fetchExchangeRates("USD");
  
  // Convert to USD first, then to target currency
  const amountInUSD = fromCurrency === "USD" ? amount : amount / rates[fromCurrency];
  const convertedAmount = toCurrency === "USD" ? amountInUSD : amountInUSD * rates[toCurrency];
  
  const exchangeRate = rates[toCurrency] / rates[fromCurrency];

  return {
    originalAmount: amount,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    exchangeRate,
    fromCurrency,
    toCurrency,
  };
}

/**
 * Format Price with Currency Symbol
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }

  const roundedAmount = Math.round(amount * Math.pow(10, currency.decimalPlaces)) / Math.pow(10, currency.decimalPlaces);
  
  // Format based on currency conventions
  if (currencyCode === "JPY" || currencyCode === "KRW") {
    // No decimal places
    return `${currency.symbol}${Math.round(roundedAmount).toLocaleString()}`;
  }

  return `${currency.symbol}${roundedAmount.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  })}`;
}

/**
 * Localize Prices for User
 */
export async function localizePrices(
  prices: { productId: string; price: number }[],
  userCurrency: string,
  baseCurrency: string = "USD"
): Promise<Map<string, PriceLocalization>> {
  const localizedPrices = new Map<string, PriceLocalization>();

  for (const { productId, price } of prices) {
    const conversion = await convertPrice(price, baseCurrency, userCurrency);
    
    localizedPrices.set(productId, {
      originalPrice: price,
      originalCurrency: baseCurrency,
      localizedPrice: conversion.convertedAmount,
      localizedCurrency: userCurrency,
      exchangeRate: conversion.exchangeRate,
      formattedPrice: formatPrice(conversion.convertedAmount, userCurrency),
    });
  }

  return localizedPrices;
}

/**
 * Detect User Currency from IP/Location
 */
export async function detectUserCurrency(ipAddress: string): Promise<string> {
  // Mock implementation - in production, use IP geolocation API
  // Example: https://ipapi.co/{ip}/currency/
  
  const mockCurrencyByIP: Record<string, string> = {
    "US": "USD",
    "GB": "GBP",
    "EU": "EUR",
    "JP": "JPY",
    "AU": "AUD",
    "CA": "CAD",
    "CN": "CNY",
    "IN": "INR",
    "SG": "SGD",
    "HK": "HKD",
  };

  // Default to USD
  return "USD";
}

/**
 * Calculate Currency Conversion Fees
 */
export function calculateConversionFee(
  amount: number,
  feePercentage: number = 2.5
): {
  originalAmount: number;
  fee: number;
  totalAmount: number;
} {
  const fee = Math.round(amount * (feePercentage / 100) * 100) / 100;
  const totalAmount = amount + fee;

  return {
    originalAmount: amount,
    fee,
    totalAmount,
  };
}

/**
 * Get Historical Exchange Rates
 */
export async function getHistoricalRates(
  fromCurrency: string,
  toCurrency: string,
  days: number = 30
): Promise<{ date: Date; rate: number }[]> {
  // Mock data - in production, fetch from API
  const currentRate = 0.92; // EUR/USD example
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    
    // Simulate rate fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.02;
    const rate = currentRate * (1 + fluctuation);
    
    return {
      date,
      rate: Math.round(rate * 10000) / 10000,
    };
  });
}

/**
 * Calculate Best Time to Convert
 */
export async function calculateBestConversionTime(
  fromCurrency: string,
  toCurrency: string
): Promise<{
  currentRate: number;
  avgRate30Days: number;
  recommendation: "convert_now" | "wait" | "neutral";
  potentialSavings: number;
}> {
  const historicalRates = await getHistoricalRates(fromCurrency, toCurrency, 30);
  const currentRate = historicalRates[historicalRates.length - 1].rate;
  const avgRate = historicalRates.reduce((sum, r) => sum + r.rate, 0) / historicalRates.length;

  const difference = ((currentRate - avgRate) / avgRate) * 100;
  
  let recommendation: "convert_now" | "wait" | "neutral";
  if (difference > 2) recommendation = "convert_now";
  else if (difference < -2) recommendation = "wait";
  else recommendation = "neutral";

  return {
    currentRate,
    avgRate30Days: Math.round(avgRate * 10000) / 10000,
    recommendation,
    potentialSavings: Math.abs(difference),
  };
}

/**
 * Multi-Currency Checkout
 */
export async function processMultiCurrencyCheckout(
  cartTotal: number,
  baseCurrency: string,
  userCurrency: string,
  paymentMethod: string
): Promise<{
  originalAmount: number;
  originalCurrency: string;
  chargedAmount: number;
  chargedCurrency: string;
  exchangeRate: number;
  conversionFee: number;
  totalCharged: number;
}> {
  // Convert cart total to user currency
  const conversion = await convertPrice(cartTotal, baseCurrency, userCurrency);
  
  // Calculate conversion fee
  const feeCalc = calculateConversionFee(conversion.convertedAmount);

  return {
    originalAmount: cartTotal,
    originalCurrency: baseCurrency,
    chargedAmount: conversion.convertedAmount,
    chargedCurrency: userCurrency,
    exchangeRate: conversion.exchangeRate,
    conversionFee: feeCalc.fee,
    totalCharged: feeCalc.totalAmount,
  };
}

/**
 * Currency Preference Management
 */
export async function updateUserCurrencyPreference(
  userId: string,
  preferredCurrency: string
): Promise<{ success: boolean; currency: string }> {
  console.log(`[Currency] Updated currency preference for user ${userId}: ${preferredCurrency}`);
  
  return {
    success: true,
    currency: preferredCurrency,
  };
}

/**
 * Get Currency Symbol Position
 */
export function getCurrencySymbolPosition(currencyCode: string): "before" | "after" {
  // Most currencies have symbol before amount
  const symbolAfter = ["EUR"]; // Some European countries
  
  return symbolAfter.includes(currencyCode) ? "after" : "before";
}

/**
 * Round to Currency-Specific Precision
 */
export function roundToCurrencyPrecision(amount: number, currencyCode: string): number {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return Math.round(amount * 100) / 100;
  
  const multiplier = Math.pow(10, currency.decimalPlaces);
  return Math.round(amount * multiplier) / multiplier;
}

/**
 * Get Popular Currencies by Region
 */
export function getPopularCurrenciesByRegion(region: string): string[] {
  const regionCurrencies: Record<string, string[]> = {
    "North America": ["USD", "CAD", "MXN"],
    "Europe": ["EUR", "GBP", "CHF"],
    "Asia": ["JPY", "CNY", "INR", "SGD", "HKD", "KRW"],
    "Oceania": ["AUD", "NZD"],
    "South America": ["BRL"],
  };

  return regionCurrencies[region] || ["USD"];
}
