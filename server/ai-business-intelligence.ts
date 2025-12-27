import { invokeLLM } from './_core/llm';
import { db } from './_core/db';
import { orders, products, customers, reviews } from '../drizzle/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';

/**
 * AI Business Intelligence Engine
 * 
 * Provides predictive analytics, ML-powered insights, and automated decision support
 * for business operations including demand forecasting, churn prediction, pricing
 * optimization, sentiment analysis, and revenue forecasting.
 */

// ============================================================================
// PREDICTIVE DEMAND FORECASTING
// ============================================================================

interface DemandForecast {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  forecastedDemand: {
    next7Days: number;
    next14Days: number;
    next30Days: number;
  };
  confidence: number;
  recommendedReorderQuantity: number;
  recommendedReorderDate: string;
  seasonalityFactor: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
}

export async function generateDemandForecast(productId: string): Promise<DemandForecast> {
  // Get historical sales data for the product
  const historicalSales = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      quantity: sql<number>`SUM(quantity)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.productId, productId),
        gte(orders.createdAt, sql`DATE_SUB(NOW(), INTERVAL 90 DAY)`)
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(desc(sql`DATE(${orders.createdAt})`));

  // Calculate basic statistics
  const totalSales = historicalSales.reduce((sum, day) => sum + day.quantity, 0);
  const averageDailySales = totalSales / 90;

  // Use AI to analyze trends and generate forecast
  const forecastPrompt = `Analyze the following sales data and provide a demand forecast:

Historical Sales (last 90 days):
${historicalSales.map(d => `${d.date}: ${d.quantity} units`).join('\n')}

Average Daily Sales: ${averageDailySales.toFixed(2)}

Provide a JSON forecast with:
1. Predicted demand for next 7, 14, and 30 days
2. Confidence level (0-100)
3. Seasonality factor (0.5-2.0, where 1.0 is normal)
4. Trend direction (increasing/stable/decreasing)
5. Recommended reorder quantity
6. Recommended reorder date

Consider seasonality, trends, and potential growth patterns.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert data scientist specializing in demand forecasting and inventory optimization.' },
      { role: 'user', content: forecastPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'demand_forecast',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            next7Days: { type: 'number' },
            next14Days: { type: 'number' },
            next30Days: { type: 'number' },
            confidence: { type: 'number' },
            seasonalityFactor: { type: 'number' },
            trendDirection: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
            recommendedReorderQuantity: { type: 'number' },
            recommendedReorderDate: { type: 'string' }
          },
          required: ['next7Days', 'next14Days', 'next30Days', 'confidence', 'seasonalityFactor', 'trendDirection', 'recommendedReorderQuantity', 'recommendedReorderDate'],
          additionalProperties: false
        }
      }
    }
  });

  const forecast = JSON.parse(response.choices[0].message.content);

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId)
  });

  return {
    productId,
    productName: product?.name || 'Unknown Product',
    currentStock: product?.stock || 0,
    averageDailySales,
    forecastedDemand: {
      next7Days: forecast.next7Days,
      next14Days: forecast.next14Days,
      next30Days: forecast.next30Days
    },
    confidence: forecast.confidence,
    recommendedReorderQuantity: forecast.recommendedReorderQuantity,
    recommendedReorderDate: forecast.recommendedReorderDate,
    seasonalityFactor: forecast.seasonalityFactor,
    trendDirection: forecast.trendDirection
  };
}

// ============================================================================
// CUSTOMER CHURN PREDICTION
// ============================================================================

interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  churnProbability: number;
  riskFactors: string[];
  recommendations: string[];
  lastOrderDate: string;
  daysSinceLastOrder: number;
  totalOrders: number;
  lifetimeValue: number;
  averageOrderValue: number;
}

export async function predictCustomerChurn(customerId: string): Promise<ChurnPrediction> {
  // Get customer data
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId)
  });

  // Get order history
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  const totalOrders = customerOrders.length;
  const lifetimeValue = customerOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = lifetimeValue / totalOrders;

  const lastOrder = customerOrders[0];
  const daysSinceLastOrder = lastOrder 
    ? Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Calculate purchase frequency
  const orderDates = customerOrders.map(o => new Date(o.createdAt).getTime());
  const averageDaysBetweenOrders = orderDates.length > 1
    ? orderDates.slice(0, -1).reduce((sum, date, i) => sum + (date - orderDates[i + 1]), 0) / (orderDates.length - 1) / (1000 * 60 * 60 * 24)
    : 30;

  // Use AI to analyze churn risk
  const churnPrompt = `Analyze this customer's behavior and predict churn risk:

Customer Profile:
- Total Orders: ${totalOrders}
- Lifetime Value: $${lifetimeValue.toFixed(2)}
- Average Order Value: $${averageOrderValue.toFixed(2)}
- Days Since Last Order: ${daysSinceLastOrder}
- Average Days Between Orders: ${averageDaysBetweenOrders.toFixed(1)}

Provide a JSON analysis with:
1. Churn probability (0-100)
2. Risk level (low/medium/high/critical)
3. List of risk factors
4. Actionable recommendations to retain this customer`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert in customer retention and churn prediction.' },
      { role: 'user', content: churnPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'churn_prediction',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            churnProbability: { type: 'number' },
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            riskFactors: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          },
          required: ['churnProbability', 'riskLevel', 'riskFactors', 'recommendations'],
          additionalProperties: false
        }
      }
    }
  });

  const prediction = JSON.parse(response.choices[0].message.content);

  return {
    customerId,
    customerName: customer?.name || 'Unknown Customer',
    churnRisk: prediction.riskLevel,
    churnProbability: prediction.churnProbability,
    riskFactors: prediction.riskFactors,
    recommendations: prediction.recommendations,
    lastOrderDate: lastOrder?.createdAt || 'Never',
    daysSinceLastOrder,
    totalOrders,
    lifetimeValue,
    averageOrderValue
  };
}

// ============================================================================
// AUTOMATED PRICING OPTIMIZATION
// ============================================================================

interface PricingRecommendation {
  productId: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  expectedImpact: {
    salesVolumeChange: number;
    revenueChange: number;
    profitChange: number;
  };
  competitorPrices: number[];
  elasticity: number;
  reasoning: string;
}

export async function optimizeProductPricing(productId: string): Promise<PricingRecommendation> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId)
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Get sales history at different price points
  const salesHistory = await db
    .select({
      price: orders.price,
      quantity: sql<number>`SUM(quantity)`,
      date: sql<string>`DATE(${orders.createdAt})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.productId, productId),
        gte(orders.createdAt, sql`DATE_SUB(NOW(), INTERVAL 90 DAY)`)
      )
    )
    .groupBy(orders.price, sql`DATE(${orders.createdAt})`);

  // Mock competitor prices (in production, fetch from competitor monitoring service)
  const competitorPrices = [
    product.price * 0.95,
    product.price * 1.05,
    product.price * 0.90,
    product.price * 1.10
  ];

  const pricingPrompt = `Analyze this product's pricing and provide optimization recommendations:

Product: ${product.name}
Current Price: $${product.price}
Cost: $${product.cost || product.price * 0.6}

Sales History (last 90 days):
${salesHistory.map(s => `${s.date}: $${s.price} - ${s.quantity} units sold`).join('\n')}

Competitor Prices: ${competitorPrices.map(p => `$${p.toFixed(2)}`).join(', ')}

Provide a JSON recommendation with:
1. Optimal price point
2. Expected sales volume change (%)
3. Expected revenue change (%)
4. Expected profit change (%)
5. Price elasticity estimate
6. Reasoning for the recommendation`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert in pricing strategy and revenue optimization.' },
      { role: 'user', content: pricingPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'pricing_recommendation',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            recommendedPrice: { type: 'number' },
            salesVolumeChange: { type: 'number' },
            revenueChange: { type: 'number' },
            profitChange: { type: 'number' },
            elasticity: { type: 'number' },
            reasoning: { type: 'string' }
          },
          required: ['recommendedPrice', 'salesVolumeChange', 'revenueChange', 'profitChange', 'elasticity', 'reasoning'],
          additionalProperties: false
        }
      }
    }
  });

  const recommendation = JSON.parse(response.choices[0].message.content);

  return {
    productId,
    productName: product.name,
    currentPrice: product.price,
    recommendedPrice: recommendation.recommendedPrice,
    priceChange: recommendation.recommendedPrice - product.price,
    priceChangePercent: ((recommendation.recommendedPrice - product.price) / product.price) * 100,
    expectedImpact: {
      salesVolumeChange: recommendation.salesVolumeChange,
      revenueChange: recommendation.revenueChange,
      profitChange: recommendation.profitChange
    },
    competitorPrices,
    elasticity: recommendation.elasticity,
    reasoning: recommendation.reasoning
  };
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

interface SentimentAnalysis {
  productId: string;
  productName: string;
  overallSentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  sentimentScore: number; // -100 to +100
  totalReviews: number;
  sentimentBreakdown: {
    veryPositive: number;
    positive: number;
    neutral: number;
    negative: number;
    veryNegative: number;
  };
  commonThemes: Array<{
    theme: string;
    sentiment: string;
    frequency: number;
  }>;
  actionableInsights: string[];
  trendDirection: 'improving' | 'stable' | 'declining';
}

export async function analyzeProductSentiment(productId: string): Promise<SentimentAnalysis> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId)
  });

  const productReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(100);

  const reviewTexts = productReviews.map(r => `Rating: ${r.rating}/5 - "${r.comment}"`).join('\n');

  const sentimentPrompt = `Analyze customer sentiment for this product based on reviews:

Product: ${product?.name}
Total Reviews: ${productReviews.length}

Reviews:
${reviewTexts}

Provide a JSON analysis with:
1. Overall sentiment (very_positive/positive/neutral/negative/very_negative)
2. Sentiment score (-100 to +100)
3. Breakdown by sentiment category (counts)
4. Common themes with sentiment and frequency
5. Actionable insights for improvement
6. Trend direction (improving/stable/declining)`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert in sentiment analysis and customer feedback interpretation.' },
      { role: 'user', content: sentimentPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'sentiment_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            overallSentiment: { type: 'string', enum: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'] },
            sentimentScore: { type: 'number' },
            veryPositive: { type: 'number' },
            positive: { type: 'number' },
            neutral: { type: 'number' },
            negative: { type: 'number' },
            veryNegative: { type: 'number' },
            commonThemes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  theme: { type: 'string' },
                  sentiment: { type: 'string' },
                  frequency: { type: 'number' }
                },
                required: ['theme', 'sentiment', 'frequency'],
                additionalProperties: false
              }
            },
            actionableInsights: { type: 'array', items: { type: 'string' } },
            trendDirection: { type: 'string', enum: ['improving', 'stable', 'declining'] }
          },
          required: ['overallSentiment', 'sentimentScore', 'veryPositive', 'positive', 'neutral', 'negative', 'veryNegative', 'commonThemes', 'actionableInsights', 'trendDirection'],
          additionalProperties: false
        }
      }
    }
  });

  const analysis = JSON.parse(response.choices[0].message.content);

  return {
    productId,
    productName: product?.name || 'Unknown Product',
    overallSentiment: analysis.overallSentiment,
    sentimentScore: analysis.sentimentScore,
    totalReviews: productReviews.length,
    sentimentBreakdown: {
      veryPositive: analysis.veryPositive,
      positive: analysis.positive,
      neutral: analysis.neutral,
      negative: analysis.negative,
      veryNegative: analysis.veryNegative
    },
    commonThemes: analysis.commonThemes,
    actionableInsights: analysis.actionableInsights,
    trendDirection: analysis.trendDirection
  };
}

// ============================================================================
// REVENUE FORECASTING
// ============================================================================

interface RevenueForecast {
  period: string;
  forecastedRevenue: {
    next7Days: number;
    next14Days: number;
    next30Days: number;
    next90Days: number;
  };
  confidence: {
    next7Days: number;
    next14Days: number;
    next30Days: number;
    next90Days: number;
  };
  breakdown: {
    newCustomers: number;
    returningCustomers: number;
    liveShows: number;
    regularSales: number;
  };
  growthRate: number;
  seasonalAdjustment: number;
  riskFactors: string[];
  opportunities: string[];
}

export async function generateRevenueForecast(): Promise<RevenueForecast> {
  // Get historical revenue data
  const historicalRevenue = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`SUM(${orders.total})`,
      orderCount: sql<number>`COUNT(*)`,
      newCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${orders.isFirstOrder} THEN ${orders.customerId} END)`
    })
    .from(orders)
    .where(gte(orders.createdAt, sql`DATE_SUB(NOW(), INTERVAL 90 DAY)`))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(desc(sql`DATE(${orders.createdAt})`));

  const totalRevenue = historicalRevenue.reduce((sum, day) => sum + day.revenue, 0);
  const averageDailyRevenue = totalRevenue / 90;

  const forecastPrompt = `Analyze historical revenue and generate a forecast:

Historical Revenue (last 90 days):
${historicalRevenue.slice(0, 30).map(d => `${d.date}: $${d.revenue.toFixed(2)} (${d.orderCount} orders, ${d.newCustomers} new customers)`).join('\n')}

Average Daily Revenue: $${averageDailyRevenue.toFixed(2)}
Total 90-Day Revenue: $${totalRevenue.toFixed(2)}

Provide a JSON forecast with:
1. Predicted revenue for next 7, 14, 30, and 90 days
2. Confidence levels for each period (0-100)
3. Breakdown by customer type and channel
4. Growth rate (%)
5. Seasonal adjustment factor
6. Risk factors to watch
7. Growth opportunities`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are an expert financial analyst specializing in revenue forecasting and business growth.' },
      { role: 'user', content: forecastPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'revenue_forecast',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            next7Days: { type: 'number' },
            next14Days: { type: 'number' },
            next30Days: { type: 'number' },
            next90Days: { type: 'number' },
            confidence7Days: { type: 'number' },
            confidence14Days: { type: 'number' },
            confidence30Days: { type: 'number' },
            confidence90Days: { type: 'number' },
            newCustomersRevenue: { type: 'number' },
            returningCustomersRevenue: { type: 'number' },
            liveShowsRevenue: { type: 'number' },
            regularSalesRevenue: { type: 'number' },
            growthRate: { type: 'number' },
            seasonalAdjustment: { type: 'number' },
            riskFactors: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array', items: { type: 'string' } }
          },
          required: ['next7Days', 'next14Days', 'next30Days', 'next90Days', 'confidence7Days', 'confidence14Days', 'confidence30Days', 'confidence90Days', 'newCustomersRevenue', 'returningCustomersRevenue', 'liveShowsRevenue', 'regularSalesRevenue', 'growthRate', 'seasonalAdjustment', 'riskFactors', 'opportunities'],
          additionalProperties: false
        }
      }
    }
  });

  const forecast = JSON.parse(response.choices[0].message.content);

  return {
    period: new Date().toISOString(),
    forecastedRevenue: {
      next7Days: forecast.next7Days,
      next14Days: forecast.next14Days,
      next30Days: forecast.next30Days,
      next90Days: forecast.next90Days
    },
    confidence: {
      next7Days: forecast.confidence7Days,
      next14Days: forecast.confidence14Days,
      next30Days: forecast.confidence30Days,
      next90Days: forecast.confidence90Days
    },
    breakdown: {
      newCustomers: forecast.newCustomersRevenue,
      returningCustomers: forecast.returningCustomersRevenue,
      liveShows: forecast.liveShowsRevenue,
      regularSales: forecast.regularSalesRevenue
    },
    growthRate: forecast.growthRate,
    seasonalAdjustment: forecast.seasonalAdjustment,
    riskFactors: forecast.riskFactors,
    opportunities: forecast.opportunities
  };
}

// ============================================================================
// RFM CUSTOMER SEGMENTATION
// ============================================================================

interface RFMSegment {
  segment: 'Champions' | 'Loyal' | 'Potential' | 'At Risk' | 'Lost' | 'New';
  customerId: string;
  customerName: string;
  recency: number; // days since last order
  frequency: number; // total orders
  monetary: number; // lifetime value
  rfmScore: string; // e.g., "555" (high recency, frequency, monetary)
  recommendations: string[];
}

export async function segmentCustomerRFM(customerId: string): Promise<RFMSegment> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId)
  });

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  const recency = customerOrders[0]
    ? Math.floor((Date.now() - new Date(customerOrders[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  const frequency = customerOrders.length;
  const monetary = customerOrders.reduce((sum, order) => sum + order.total, 0);

  // Calculate RFM scores (1-5 scale)
  const recencyScore = recency <= 7 ? 5 : recency <= 14 ? 4 : recency <= 30 ? 3 : recency <= 60 ? 2 : 1;
  const frequencyScore = frequency >= 20 ? 5 : frequency >= 10 ? 4 : frequency >= 5 ? 3 : frequency >= 2 ? 2 : 1;
  const monetaryScore = monetary >= 5000 ? 5 : monetary >= 2000 ? 4 : monetary >= 1000 ? 3 : monetary >= 500 ? 2 : 1;

  const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;

  // Determine segment
  let segment: RFMSegment['segment'];
  let recommendations: string[];

  if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
    segment = 'Champions';
    recommendations = ['Reward with exclusive offers', 'Request reviews and referrals', 'Early access to new products'];
  } else if (frequencyScore >= 4 && monetaryScore >= 4) {
    segment = 'Loyal';
    recommendations = ['Upsell premium products', 'Loyalty program benefits', 'VIP customer service'];
  } else if (recencyScore >= 4 && frequencyScore <= 2) {
    segment = 'New';
    recommendations = ['Welcome series', 'Product recommendations', 'First purchase discount'];
  } else if (recencyScore <= 2 && frequencyScore >= 3) {
    segment = 'At Risk';
    recommendations = ['Win-back campaign', 'Special discount offer', 'Survey for feedback'];
  } else if (recencyScore <= 2 && frequencyScore <= 2) {
    segment = 'Lost';
    recommendations = ['Aggressive win-back offer', 'Re-engagement campaign', 'Survey to understand churn'];
  } else {
    segment = 'Potential';
    recommendations = ['Targeted promotions', 'Product education', 'Increase engagement'];
  }

  return {
    segment,
    customerId,
    customerName: customer?.name || 'Unknown Customer',
    recency,
    frequency,
    monetary,
    rfmScore,
    recommendations
  };
}

// Export all functions
export const AIBusinessIntelligence = {
  generateDemandForecast,
  predictCustomerChurn,
  optimizeProductPricing,
  analyzeProductSentiment,
  generateRevenueForecast,
  segmentCustomerRFM
};
