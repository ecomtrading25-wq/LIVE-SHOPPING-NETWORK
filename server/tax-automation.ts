/**
 * Automated Tax Calculation System
 * Global tax rules, VAT, GST, sales tax automation
 */

interface TaxRule {
  country: string;
  state?: string;
  taxType: "VAT" | "GST" | "SALES_TAX" | "CUSTOMS_DUTY";
  rate: number;
  threshold?: number; // Minimum order value for tax
  description: string;
}

interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxType: string;
  total: number;
  breakdown: {
    label: string;
    amount: number;
    rate: number;
  }[];
}

/**
 * Global Tax Rules Database
 */
export const TAX_RULES: Record<string, TaxRule[]> = {
  // United States - State Sales Tax
  "US": [
    { country: "US", state: "CA", taxType: "SALES_TAX", rate: 7.25, description: "California Sales Tax" },
    { country: "US", state: "NY", taxType: "SALES_TAX", rate: 4.0, description: "New York Sales Tax" },
    { country: "US", state: "TX", taxType: "SALES_TAX", rate: 6.25, description: "Texas Sales Tax" },
    { country: "US", state: "FL", taxType: "SALES_TAX", rate: 6.0, description: "Florida Sales Tax" },
    { country: "US", state: "IL", taxType: "SALES_TAX", rate: 6.25, description: "Illinois Sales Tax" },
    { country: "US", state: "WA", taxType: "SALES_TAX", rate: 6.5, description: "Washington Sales Tax" },
  ],
  
  // European Union - VAT
  "GB": [{ country: "GB", taxType: "VAT", rate: 20.0, description: "UK VAT" }],
  "DE": [{ country: "DE", taxType: "VAT", rate: 19.0, description: "Germany VAT" }],
  "FR": [{ country: "FR", taxType: "VAT", rate: 20.0, description: "France VAT" }],
  "IT": [{ country: "IT", taxType: "VAT", rate: 22.0, description: "Italy VAT" }],
  "ES": [{ country: "ES", taxType: "VAT", rate: 21.0, description: "Spain VAT" }],
  "NL": [{ country: "NL", taxType: "VAT", rate: 21.0, description: "Netherlands VAT" }],
  
  // Asia-Pacific - GST/VAT
  "AU": [{ country: "AU", taxType: "GST", rate: 10.0, description: "Australia GST" }],
  "NZ": [{ country: "NZ", taxType: "GST", rate: 15.0, description: "New Zealand GST" }],
  "SG": [{ country: "SG", taxType: "GST", rate: 9.0, description: "Singapore GST" }],
  "IN": [{ country: "IN", taxType: "GST", rate: 18.0, description: "India GST" }],
  "JP": [{ country: "JP", taxType: "VAT", rate: 10.0, description: "Japan Consumption Tax" }],
  "CN": [{ country: "CN", taxType: "VAT", rate: 13.0, description: "China VAT" }],
  
  // Canada - GST/HST
  "CA": [
    { country: "CA", state: "ON", taxType: "GST", rate: 13.0, description: "Ontario HST" },
    { country: "CA", state: "BC", taxType: "GST", rate: 12.0, description: "British Columbia GST+PST" },
    { country: "CA", state: "QC", taxType: "GST", rate: 14.975, description: "Quebec GST+QST" },
    { country: "CA", state: "AB", taxType: "GST", rate: 5.0, description: "Alberta GST" },
  ],
  
  // Other Countries
  "MX": [{ country: "MX", taxType: "VAT", rate: 16.0, description: "Mexico IVA" }],
  "BR": [{ country: "BR", taxType: "VAT", rate: 17.0, description: "Brazil ICMS" }],
  "CH": [{ country: "CH", taxType: "VAT", rate: 7.7, description: "Switzerland VAT" }],
  "NO": [{ country: "NO", taxType: "VAT", rate: 25.0, description: "Norway VAT" }],
  "SE": [{ country: "SE", taxType: "VAT", rate: 25.0, description: "Sweden VAT" }],
};

/**
 * Calculate Tax for Order
 */
export async function calculateTax(
  subtotal: number,
  shippingAddress: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  },
  productCategory?: string
): Promise<TaxCalculation> {
  const { country, state } = shippingAddress;
  
  // Get applicable tax rules
  const countryRules = TAX_RULES[country] || [];
  let applicableRule: TaxRule | null = null;

  if (state && countryRules.length > 1) {
    // Find state-specific rule
    applicableRule = countryRules.find((rule) => rule.state === state) || null;
  }

  if (!applicableRule && countryRules.length > 0) {
    // Use country-level rule
    applicableRule = countryRules[0];
  }

  if (!applicableRule) {
    // No tax applicable
    return {
      subtotal,
      taxAmount: 0,
      taxRate: 0,
      taxType: "NONE",
      total: subtotal,
      breakdown: [],
    };
  }

  // Check threshold
  if (applicableRule.threshold && subtotal < applicableRule.threshold) {
    return {
      subtotal,
      taxAmount: 0,
      taxRate: 0,
      taxType: applicableRule.taxType,
      total: subtotal,
      breakdown: [],
    };
  }

  // Calculate tax
  const taxAmount = Math.round(subtotal * (applicableRule.rate / 100) * 100) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    taxRate: applicableRule.rate,
    taxType: applicableRule.taxType,
    total,
    breakdown: [
      {
        label: applicableRule.description,
        amount: taxAmount,
        rate: applicableRule.rate,
      },
    ],
  };
}

/**
 * Validate Tax ID/VAT Number
 */
export async function validateTaxId(
  taxId: string,
  country: string
): Promise<{
  valid: boolean;
  format: string;
  message: string;
}> {
  // VAT number formats by country
  const vatFormats: Record<string, RegExp> = {
    GB: /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/,
    DE: /^DE\d{9}$/,
    FR: /^FR[A-Z0-9]{2}\d{9}$/,
    IT: /^IT\d{11}$/,
    ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    NL: /^NL\d{9}B\d{2}$/,
  };

  const format = vatFormats[country];
  if (!format) {
    return {
      valid: false,
      format: "Unknown format",
      message: `VAT validation not available for ${country}`,
    };
  }

  const valid = format.test(taxId);

  return {
    valid,
    format: format.source,
    message: valid ? "Valid VAT number" : "Invalid VAT number format",
  };
}

/**
 * Calculate Customs Duty for International Orders
 */
export async function calculateCustomsDuty(
  orderValue: number,
  fromCountry: string,
  toCountry: string,
  productCategory: string
): Promise<{
  dutyAmount: number;
  dutyRate: number;
  threshold: number;
  exempt: boolean;
}> {
  // Simplified customs duty calculation
  // In production, integrate with customs API or database
  
  const customsThresholds: Record<string, number> = {
    US: 800,
    GB: 135,
    EU: 150,
    AU: 1000,
    CA: 20,
  };

  const threshold = customsThresholds[toCountry] || 0;
  
  if (orderValue <= threshold) {
    return {
      dutyAmount: 0,
      dutyRate: 0,
      threshold,
      exempt: true,
    };
  }

  // Simplified duty rates by product category
  const dutyRates: Record<string, number> = {
    electronics: 5.0,
    clothing: 12.0,
    jewelry: 8.5,
    books: 0,
    toys: 6.8,
    default: 4.0,
  };

  const dutyRate = dutyRates[productCategory] || dutyRates.default;
  const dutyAmount = Math.round((orderValue - threshold) * (dutyRate / 100) * 100) / 100;

  return {
    dutyAmount,
    dutyRate,
    threshold,
    exempt: false,
  };
}

/**
 * Generate Tax Invoice
 */
export async function generateTaxInvoice(
  orderId: string,
  taxCalculation: TaxCalculation,
  customerInfo: {
    name: string;
    address: string;
    taxId?: string;
  },
  sellerInfo: {
    name: string;
    address: string;
    taxId: string;
  }
): Promise<{
  invoiceNumber: string;
  invoiceDate: Date;
  taxInvoice: string; // HTML content
}> {
  const invoiceNumber = `INV-${Date.now()}-${orderId.slice(0, 8)}`;
  const invoiceDate = new Date();

  const taxInvoice = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TAX INVOICE</h1>
        <p>Invoice #: ${invoiceNumber}</p>
        <p>Date: ${invoiceDate.toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <p class="label">Seller:</p>
        <p>${sellerInfo.name}</p>
        <p>${sellerInfo.address}</p>
        <p>Tax ID: ${sellerInfo.taxId}</p>
      </div>
      
      <div class="section">
        <p class="label">Customer:</p>
        <p>${customerInfo.name}</p>
        <p>${customerInfo.address}</p>
        ${customerInfo.taxId ? `<p>Tax ID: ${customerInfo.taxId}</p>` : ""}
      </div>
      
      <table>
        <tr>
          <th>Description</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
        <tr>
          <td>Subtotal</td>
          <td>-</td>
          <td>$${taxCalculation.subtotal.toFixed(2)}</td>
        </tr>
        ${taxCalculation.breakdown
          .map(
            (item) => `
          <tr>
            <td>${item.label}</td>
            <td>${item.rate}%</td>
            <td>$${item.amount.toFixed(2)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="total">
          <td colspan="2">Total</td>
          <td>$${taxCalculation.total.toFixed(2)}</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    invoiceNumber,
    invoiceDate,
    taxInvoice,
  };
}

/**
 * Check Tax Exemption Eligibility
 */
export async function checkTaxExemption(
  customerType: "individual" | "business",
  exemptionCertificate?: string,
  country?: string
): Promise<{
  exempt: boolean;
  reason: string;
}> {
  // Business customers with valid exemption certificates may be tax-exempt
  if (customerType === "business" && exemptionCertificate) {
    // In production, validate certificate with tax authority API
    return {
      exempt: true,
      reason: "Valid business exemption certificate",
    };
  }

  // Certain countries have tax-free thresholds
  const taxFreeCountries = ["AE", "BH", "KW", "OM", "QA", "SA"]; // Gulf countries
  if (country && taxFreeCountries.includes(country)) {
    return {
      exempt: true,
      reason: "Tax-free jurisdiction",
    };
  }

  return {
    exempt: false,
    reason: "No exemption applicable",
  };
}

/**
 * Calculate Reverse Charge VAT (B2B EU transactions)
 */
export async function calculateReverseChargeVAT(
  subtotal: number,
  sellerCountry: string,
  buyerCountry: string,
  buyerVATNumber: string
): Promise<{
  reverseCharge: boolean;
  vatAmount: number;
  explanation: string;
}> {
  const euCountries = ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "SE", "DK", "FI", "IE", "PT", "GR", "PL", "CZ", "HU", "RO"];

  const sellerInEU = euCountries.includes(sellerCountry);
  const buyerInEU = euCountries.includes(buyerCountry);

  // Reverse charge applies for B2B transactions between different EU countries
  if (sellerInEU && buyerInEU && sellerCountry !== buyerCountry && buyerVATNumber) {
    return {
      reverseCharge: true,
      vatAmount: 0,
      explanation: "Reverse charge mechanism applies. Buyer is responsible for VAT.",
    };
  }

  // Normal VAT calculation
  const taxCalc = await calculateTax(subtotal, { country: buyerCountry });

  return {
    reverseCharge: false,
    vatAmount: taxCalc.taxAmount,
    explanation: "Standard VAT applies.",
  };
}

/**
 * Get Tax Reporting Data
 */
export async function getTaxReportingData(
  startDate: Date,
  endDate: Date
): Promise<{
  totalSales: number;
  totalTaxCollected: number;
  byCountry: Record<string, { sales: number; tax: number }>;
  byTaxType: Record<string, { sales: number; tax: number }>;
}> {
  // Mock data - in production, query from database
  return {
    totalSales: 125000,
    totalTaxCollected: 18750,
    byCountry: {
      US: { sales: 75000, tax: 5250 },
      GB: { sales: 30000, tax: 6000 },
      AU: { sales: 20000, tax: 2000 },
    },
    byTaxType: {
      SALES_TAX: { sales: 75000, tax: 5250 },
      VAT: { sales: 30000, tax: 6000 },
      GST: { sales: 20000, tax: 2000 },
    },
  };
}
