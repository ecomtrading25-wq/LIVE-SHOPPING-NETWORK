import { nanoid } from "nanoid";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import {
  disputes,
  orders,
  orderItems,
  reviewQueueItems,
  auditLog,
  products,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Live Shopping Network - AI Agents System
 * Autonomous agents for dispute resolution, customer support, and operations
 */

export interface DisputeAnalysis {
  disputeId: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  suggestedAction: "refund" | "replacement" | "partial_refund" | "reject" | "escalate";
  confidence: number;
  reasoning: string;
  evidenceRequired: string[];
  responseTemplate: string;
}

export interface CustomerSupportResponse {
  query: string;
  response: string;
  confidence: number;
  requiresHuman: boolean;
  suggestedActions: string[];
}

/**
 * AI Agents Service
 */
export class AIAgentsService {
  /**
   * Analyze dispute and generate resolution recommendation
   */
  static async analyzeDispute(disputeId: string): Promise<DisputeAnalysis> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get dispute details
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Get order details
    const [order] = await db.select().from(orders).where(eq(orders.id, dispute.orderId)).limit(1);

    if (!order) {
      throw new Error("Order not found for dispute");
    }

    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    // Prepare context for LLM
    const context = {
      dispute: {
        type: dispute.type,
        reason: dispute.reason,
        description: dispute.description,
        amount: dispute.amount,
        status: dispute.status,
      },
      order: {
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt,
      },
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    };

    // Call LLM for analysis
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert dispute resolution analyst for an e-commerce platform. Analyze disputes and provide actionable recommendations.

Your response must be valid JSON matching this schema:
{
  "severity": "low" | "medium" | "high" | "critical",
  "category": string (e.g., "not_received", "damaged", "wrong_item", "quality_issue"),
  "suggestedAction": "refund" | "replacement" | "partial_refund" | "reject" | "escalate",
  "confidence": number (0-1),
  "reasoning": string (detailed explanation),
  "evidenceRequired": string[] (list of evidence needed),
  "responseTemplate": string (professional response to customer)
}`,
        },
        {
          role: "user",
          content: `Analyze this dispute and provide a recommendation:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dispute_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
              },
              category: {
                type: "string",
                description: "Category of the dispute",
              },
              suggestedAction: {
                type: "string",
                enum: ["refund", "replacement", "partial_refund", "reject", "escalate"],
              },
              confidence: {
                type: "number",
                description: "Confidence level from 0 to 1",
              },
              reasoning: {
                type: "string",
                description: "Detailed reasoning for the recommendation",
              },
              evidenceRequired: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "List of evidence needed to resolve",
              },
              responseTemplate: {
                type: "string",
                description: "Professional response template for the customer",
              },
            },
            required: [
              "severity",
              "category",
              "suggestedAction",
              "confidence",
              "reasoning",
              "evidenceRequired",
              "responseTemplate",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    // Store analysis in dispute metadata
    await db
      .update(disputes)
      .set({
        metadata: {
          ...(dispute.metadata as any),
          aiAnalysis: analysis,
          analyzedAt: new Date().toISOString(),
        },
      })
      .where(eq(disputes.id, disputeId));

    // Create review queue item if escalation needed
    if (analysis.suggestedAction === "escalate" || analysis.confidence < 0.7) {
      await db.insert(reviewQueueItems).values({
        id: nanoid(),
        channelId: order.channelId,
        type: "dispute_review",
        severity: analysis.severity,
        status: "open",
        refType: "dispute",
        refId: disputeId,
        title: `Dispute Review: ${dispute.type}`,
        summary: `AI recommends ${analysis.suggestedAction} with ${(analysis.confidence * 100).toFixed(0)}% confidence. ${analysis.reasoning}`,
        metadata: {
          disputeId,
          orderId: order.id,
          analysis,
        },
      });
    }

    // Log analysis
    await db.insert(auditLog).values({
      id: nanoid(),
      channelId: order.channelId,
      actorType: "system",
      actorId: "ai_agent",
      actorLabel: "AI Dispute Analyzer",
      action: "dispute_analyzed",
      severity: "info",
      refType: "dispute",
      refId: disputeId,
      entryHash: nanoid(),
      metadata: {
        suggestedAction: analysis.suggestedAction,
        confidence: analysis.confidence,
        severity: analysis.severity,
      },
    });

    return {
      disputeId,
      ...analysis,
    };
  }

  /**
   * Auto-resolve simple disputes based on AI analysis
   */
  static async autoResolveDisputes(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let resolved = 0;

    // Get open disputes
    const openDisputes = await db
      .select()
      .from(disputes)
      .where(and(eq(disputes.status, "open")))
      .limit(50);

    for (const dispute of openDisputes) {
      try {
        // Analyze dispute
        const analysis = await this.analyzeDispute(dispute.id);

        // Auto-resolve if high confidence and simple action
        if (
          analysis.confidence > 0.85 &&
          (analysis.suggestedAction === "refund" || analysis.suggestedAction === "partial_refund")
        ) {
          // Update dispute status
          await db
            .update(disputes)
            .set({
              status: "resolved",
              resolution: analysis.responseTemplate,
              resolvedAt: new Date(),
              metadata: {
                ...(dispute.metadata as any),
                autoResolved: true,
                resolvedBy: "ai_agent",
              },
            })
            .where(eq(disputes.id, dispute.id));

          // Log resolution
          await db.insert(auditLog).values({
            id: nanoid(),
            channelId: (dispute.metadata as any)?.channelId || "",
            actorType: "system",
            actorId: "ai_agent",
            actorLabel: "AI Dispute Resolver",
            action: "dispute_auto_resolved",
            severity: "info",
            refType: "dispute",
            refId: dispute.id,
            entryHash: nanoid(),
            metadata: {
              action: analysis.suggestedAction,
              confidence: analysis.confidence,
            },
          });

          resolved++;
        }
      } catch (error) {
        console.error(`Failed to analyze dispute ${dispute.id}:`, error);
      }
    }

    return resolved;
  }

  /**
   * Generate customer support response
   */
  static async generateSupportResponse(query: string, context?: any): Promise<CustomerSupportResponse> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a helpful customer support agent for a live shopping e-commerce platform. Provide professional, empathetic, and actionable responses.

Your response must be valid JSON matching this schema:
{
  "response": string (professional customer support response),
  "confidence": number (0-1),
  "requiresHuman": boolean (true if human intervention needed),
  "suggestedActions": string[] (list of actions customer or support should take)
}`,
        },
        {
          role: "user",
          content: context
            ? `Customer query: ${query}\n\nContext: ${JSON.stringify(context, null, 2)}`
            : `Customer query: ${query}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "support_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              response: {
                type: "string",
                description: "Professional customer support response",
              },
              confidence: {
                type: "number",
                description: "Confidence level from 0 to 1",
              },
              requiresHuman: {
                type: "boolean",
                description: "Whether human intervention is needed",
              },
              suggestedActions: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "List of suggested actions",
              },
            },
            required: ["response", "confidence", "requiresHuman", "suggestedActions"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      query,
      ...result,
    };
  }

  /**
   * Generate product descriptions from images and basic info
   */
  static async generateProductDescription(
    productName: string,
    imageUrl?: string,
    additionalInfo?: string
  ): Promise<string> {
    const messages: any[] = [
      {
        role: "system",
        content:
          "You are an expert e-commerce copywriter. Generate compelling, SEO-friendly product descriptions that highlight features, benefits, and use cases.",
      },
    ];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate a detailed product description for: ${productName}${additionalInfo ? `\n\nAdditional info: ${additionalInfo}` : ""}`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Generate a detailed product description for: ${productName}${additionalInfo ? `\n\nAdditional info: ${additionalInfo}` : ""}`,
      });
    }

    const response = await invokeLLM({ messages });

    return response.choices[0].message.content || "";
  }

  /**
   * Analyze order patterns for fraud detection
   */
  static async detectFraudulentOrders(orderId: string): Promise<{
    isFraudulent: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get order details
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new Error("Order not found");
    }

    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    const context = {
      order: {
        total: order.total,
        status: order.status,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        createdAt: order.createdAt,
      },
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a fraud detection expert. Analyze orders for suspicious patterns.

Your response must be valid JSON matching this schema:
{
  "isFraudulent": boolean,
  "riskScore": number (0-1, where 1 is highest risk),
  "reasons": string[] (list of red flags or concerns)
}`,
        },
        {
          role: "user",
          content: `Analyze this order for fraud:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "fraud_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              isFraudulent: {
                type: "boolean",
                description: "Whether the order appears fraudulent",
              },
              riskScore: {
                type: "number",
                description: "Risk score from 0 to 1",
              },
              reasons: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "List of red flags or concerns",
              },
            },
            required: ["isFraudulent", "riskScore", "reasons"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Create review queue item if high risk
    if (result.riskScore > 0.7) {
      await db.insert(reviewQueueItems).values({
        id: nanoid(),
        channelId: order.channelId,
        type: "fraud_review",
        severity: result.riskScore > 0.9 ? "critical" : "high",
        status: "open",
        refType: "order",
        refId: orderId,
        title: `Potential Fraud: Order #${order.orderNumber}`,
        summary: `AI detected ${(result.riskScore * 100).toFixed(0)}% fraud risk. Reasons: ${result.reasons.join(", ")}`,
        metadata: {
          orderId,
          fraudAnalysis: result,
        },
      });
    }

    return result;
  }
}
