/**
 * Customer Service & Support Platform
 * 
 * Comprehensive support system with:
 * - Multi-channel ticket management (email, chat, phone, social)
 * - AI-powered chatbot with intent recognition
 * - Knowledge base and FAQ management
 * - Automated ticket routing and prioritization
 * - SLA tracking and escalation
 * - Customer satisfaction (CSAT) surveys
 * - Agent performance metrics
 * - Live chat with co-browsing
 * - Sentiment analysis
 * - Macro responses and canned replies
 */

import { getDb } from './db';
import { 
  supportTickets,
  ticketMessages,
  supportAgents,
  knowledgeBase,
  macroResponses,
  customerSatisfaction,
  orders,
  users
} from '../drizzle/schema';
import { eq, and, gte, lte, sql, desc, asc, inArray, or, like } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Ticket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  channel: 'email' | 'chat' | 'phone' | 'social' | 'web';
  assignedTo?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  firstResponseTime?: number;
  resolutionTime?: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  attachments: string[];
  createdAt: Date;
  isInternal: boolean;
}

export interface ChatbotIntent {
  intent: string;
  confidence: number;
  entities: { [key: string]: string };
  suggestedResponse: string;
  requiresHuman: boolean;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  ticketsHandled: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  activeTickets: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TICKET MANAGEMENT
// ============================================================================

/**
 * Create new support ticket
 */
export async function createTicket(options: {
  customerId: string;
  subject: string;
  description: string;
  channel: string;
  orderId?: string;
}): Promise<Ticket> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { customerId, subject, description, channel, orderId } = options;

  // Analyze ticket content for categorization and priority
  const analysis = await analyzeTicketContent(subject, description);

  const ticketId = `ticket_${Date.now()}`;
  const now = new Date();

  // Auto-assign based on category and agent availability
  const assignedAgent = await findAvailableAgent(analysis.category);

  const ticket: Ticket = {
    id: ticketId,
    customerId,
    subject,
    description,
    status: 'open',
    priority: analysis.priority,
    category: analysis.category,
    channel: channel as any,
    assignedTo: assignedAgent?.id,
    tags: analysis.tags,
    createdAt: now,
    updatedAt: now
  };

  await db.insert(supportTickets).values({
    id: ticket.id,
    customerId: ticket.customerId,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    channel: ticket.channel,
    assignedTo: ticket.assignedTo,
    tags: JSON.stringify(ticket.tags),
    orderId,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt
  });

  // Create initial message
  await addTicketMessage({
    ticketId: ticket.id,
    senderId: customerId,
    senderType: 'customer',
    content: description,
    attachments: [],
    isInternal: false
  });

  // Send auto-acknowledgment
  await sendAutoAcknowledgment(ticket);

  return ticket;
}

/**
 * Analyze ticket content using AI
 */
async function analyzeTicketContent(subject: string, description: string): Promise<{
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}> {
  const prompt = `Analyze this customer support ticket and provide:
1. Category (one of: order_issue, product_question, shipping, refund, technical, account, other)
2. Priority (low, medium, high, or urgent)
3. Tags (comma-separated keywords)
4. Sentiment (positive, neutral, or negative)

Subject: ${subject}
Description: ${description}

Respond in JSON format:
{
  "category": "...",
  "priority": "...",
  "tags": ["tag1", "tag2"],
  "sentiment": "..."
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a customer support ticket analyzer.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ticket_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              priority: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              sentiment: { type: 'string' }
            },
            required: ['category', 'priority', 'tags', 'sentiment'],
            additionalProperties: false
          }
        }
      }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    return analysis;
  } catch (error) {
    // Fallback to default values
    return {
      category: 'other',
      priority: 'medium',
      tags: [],
      sentiment: 'neutral'
    };
  }
}

/**
 * Find available agent for ticket assignment
 */
async function findAvailableAgent(category: string): Promise<{ id: string; name: string } | null> {
  const db = await getDb();
  if (!db) return null;

  // Get agents with lowest current workload in relevant category
  const agents = await db
    .select({
      id: supportAgents.id,
      name: supportAgents.name,
      activeTickets: sql<number>`COUNT(${supportTickets.id})`
    })
    .from(supportAgents)
    .leftJoin(supportTickets, and(
      eq(supportTickets.assignedTo, supportAgents.id),
      inArray(supportTickets.status, ['open', 'pending'])
    ))
    .where(eq(supportAgents.status, 'available'))
    .groupBy(supportAgents.id, supportAgents.name)
    .orderBy(asc(sql`COUNT(${supportTickets.id})`))
    .limit(1);

  return agents.length ? { id: agents[0].id, name: agents[0].name } : null;
}

/**
 * Send auto-acknowledgment message
 */
async function sendAutoAcknowledgment(ticket: Ticket): Promise<void> {
  const message = `Thank you for contacting us! We've received your request about "${ticket.subject}". 

Ticket ID: ${ticket.id}
Priority: ${ticket.priority}

${ticket.assignedTo 
  ? `Your ticket has been assigned to one of our support specialists who will respond shortly.` 
  : `We'll assign a support specialist to your ticket as soon as possible.`}

Average response time: ${getExpectedResponseTime(ticket.priority)}

You can track your ticket status anytime using your ticket ID.`;

  await addTicketMessage({
    ticketId: ticket.id,
    senderId: 'system',
    senderType: 'system',
    content: message,
    attachments: [],
    isInternal: false
  });
}

function getExpectedResponseTime(priority: string): string {
  const times = {
    urgent: '1 hour',
    high: '4 hours',
    medium: '24 hours',
    low: '48 hours'
  };
  return times[priority as keyof typeof times] || '24 hours';
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(options: {
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  attachments: string[];
  isInternal: boolean;
}): Promise<TicketMessage> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const messageId = `msg_${Date.now()}`;
  const now = new Date();

  const message: TicketMessage = {
    id: messageId,
    ...options,
    createdAt: now
  };

  await db.insert(ticketMessages).values({
    id: message.id,
    ticketId: message.ticketId,
    senderId: message.senderId,
    senderType: message.senderType,
    content: message.content,
    attachments: JSON.stringify(message.attachments),
    isInternal: message.isInternal,
    createdAt: message.createdAt
  });

  // Update ticket timestamp
  await db
    .update(supportTickets)
    .set({ updatedAt: now })
    .where(eq(supportTickets.id, options.ticketId));

  // Calculate first response time if this is first agent response
  if (options.senderType === 'agent') {
    await updateFirstResponseTime(options.ticketId);
  }

  return message;
}

async function updateFirstResponseTime(ticketId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const ticket = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  if (!ticket.length || ticket[0].firstResponseTime) return;

  const firstResponseTime = Date.now() - ticket[0].createdAt.getTime();

  await db
    .update(supportTickets)
    .set({ firstResponseTime })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'pending' | 'resolved' | 'closed'
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const updates: any = {
    status,
    updatedAt: new Date()
  };

  if (status === 'resolved' || status === 'closed') {
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (ticket.length && !ticket[0].resolvedAt) {
      updates.resolvedAt = new Date();
      updates.resolutionTime = Date.now() - ticket[0].createdAt.getTime();
    }
  }

  await db
    .update(supportTickets)
    .set(updates)
    .where(eq(supportTickets.id, ticketId));

  // Send CSAT survey if resolved
  if (status === 'resolved') {
    await sendCSATSurvey(ticketId);
  }
}

// ============================================================================
// AI CHATBOT
// ============================================================================

/**
 * Process chatbot message and generate response
 */
export async function processChatbotMessage(options: {
  customerId: string;
  message: string;
  conversationHistory: { role: string; content: string }[];
}): Promise<{
  response: string;
  intent: ChatbotIntent;
  suggestedArticles: KnowledgeArticle[];
  createTicket: boolean;
}> {
  const { customerId, message, conversationHistory } = options;

  // Detect intent
  const intent = await detectIntent(message);

  // Search knowledge base
  const articles = await searchKnowledgeBase(message, 3);

  // Determine if human agent is needed
  const createTicket = intent.requiresHuman || intent.confidence < 0.7;

  // Generate response
  let response = '';

  if (createTicket) {
    response = `I understand you need help with ${intent.intent}. Let me connect you with a human agent who can better assist you. I'm creating a support ticket for you now.`;
  } else {
    // Generate contextual response using LLM
    const systemPrompt = `You are a helpful customer service chatbot for a live shopping e-commerce platform. 
Be friendly, concise, and helpful. If you're not sure about something, admit it and offer to connect the customer with a human agent.

Available knowledge base articles:
${articles.map(a => `- ${a.title}: ${a.content.substring(0, 200)}...`).join('\n')}`;

    try {
      const llmResponse = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role as any,
            content: msg.content
          })),
          { role: 'user', content: message }
        ]
      });

      response = llmResponse.choices[0].message.content;
    } catch (error) {
      response = intent.suggestedResponse;
    }
  }

  return {
    response,
    intent,
    suggestedArticles: articles,
    createTicket
  };
}

/**
 * Detect user intent from message
 */
async function detectIntent(message: string): Promise<ChatbotIntent> {
  const prompt = `Analyze this customer message and determine:
1. Intent (order_status, return_request, product_info, shipping_info, payment_issue, account_help, complaint, other)
2. Confidence (0-1)
3. Key entities (order_id, product_name, etc.)
4. Whether human agent is required

Message: "${message}"

Respond in JSON format.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an intent classifier for customer service.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'intent_detection',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              intent: { type: 'string' },
              confidence: { type: 'number' },
              entities: { type: 'object', additionalProperties: { type: 'string' } },
              requiresHuman: { type: 'boolean' },
              suggestedResponse: { type: 'string' }
            },
            required: ['intent', 'confidence', 'entities', 'requiresHuman', 'suggestedResponse'],
            additionalProperties: false
          }
        }
      }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    return {
      intent: 'other',
      confidence: 0.5,
      entities: {},
      suggestedResponse: 'I apologize, but I need more information to help you. Could you please provide more details?',
      requiresHuman: false
    };
  }
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

/**
 * Search knowledge base
 */
export async function searchKnowledgeBase(query: string, limit: number = 10): Promise<KnowledgeArticle[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Simple keyword search (in production, use full-text search or vector similarity)
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

  const articles = await db
    .select()
    .from(knowledgeBase)
    .where(
      or(
        ...keywords.map(keyword => 
          or(
            like(knowledgeBase.title, `%${keyword}%`),
            like(knowledgeBase.content, `%${keyword}%`)
          )
        )
      )
    )
    .orderBy(desc(knowledgeBase.views))
    .limit(limit);

  return articles.map(article => ({
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    tags: JSON.parse(article.tags || '[]'),
    views: article.views,
    helpful: article.helpful,
    notHelpful: article.notHelpful,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt
  }));
}

/**
 * Create knowledge base article
 */
export async function createKnowledgeArticle(options: {
  title: string;
  content: string;
  category: string;
  tags: string[];
}): Promise<KnowledgeArticle> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const articleId = `kb_${Date.now()}`;
  const now = new Date();

  const article: KnowledgeArticle = {
    id: articleId,
    ...options,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: now,
    updatedAt: now
  };

  await db.insert(knowledgeBase).values({
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    tags: JSON.stringify(article.tags),
    views: article.views,
    helpful: article.helpful,
    notHelpful: article.notHelpful,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt
  });

  return article;
}

/**
 * Track article feedback
 */
export async function trackArticleFeedback(articleId: string, helpful: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const field = helpful ? 'helpful' : 'notHelpful';

  await db
    .update(knowledgeBase)
    .set({ 
      [field]: sql`${knowledgeBase[field]} + 1` 
    })
    .where(eq(knowledgeBase.id, articleId));
}

// ============================================================================
// CSAT SURVEYS
// ============================================================================

/**
 * Send customer satisfaction survey
 */
async function sendCSATSurvey(ticketId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const ticket = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  if (!ticket.length) return;

  // In production, send email/SMS with survey link
  // For now, just create survey record
  await db.insert(customerSatisfaction).values({
    id: `csat_${Date.now()}`,
    ticketId,
    customerId: ticket[0].customerId,
    status: 'pending',
    sentAt: new Date()
  });
}

/**
 * Submit CSAT response
 */
export async function submitCSAT(options: {
  ticketId: string;
  rating: number;
  feedback?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { ticketId, rating, feedback } = options;

  await db
    .update(customerSatisfaction)
    .set({
      rating,
      feedback,
      status: 'completed',
      respondedAt: new Date()
    })
    .where(eq(customerSatisfaction.ticketId, ticketId));
}

// ============================================================================
// AGENT PERFORMANCE
// ============================================================================

/**
 * Get agent performance metrics
 */
export async function getAgentMetrics(agentId: string, days: number = 30): Promise<AgentMetrics> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get agent info
  const agent = await db
    .select()
    .from(supportAgents)
    .where(eq(supportAgents.id, agentId))
    .limit(1);

  if (!agent.length) throw new Error('Agent not found');

  // Get ticket metrics
  const tickets = await db
    .select({
      total: sql<number>`COUNT(*)`,
      resolved: sql<number>`SUM(CASE WHEN ${supportTickets.status} IN ('resolved', 'closed') THEN 1 ELSE 0 END)`,
      avgResponseTime: sql<number>`AVG(${supportTickets.firstResponseTime})`,
      avgResolutionTime: sql<number>`AVG(${supportTickets.resolutionTime})`
    })
    .from(supportTickets)
    .where(and(
      eq(supportTickets.assignedTo, agentId),
      gte(supportTickets.createdAt, startDate)
    ));

  // Get CSAT scores
  const csatScores = await db
    .select({
      avgRating: sql<number>`AVG(${customerSatisfaction.rating})`
    })
    .from(customerSatisfaction)
    .innerJoin(supportTickets, eq(customerSatisfaction.ticketId, supportTickets.id))
    .where(and(
      eq(supportTickets.assignedTo, agentId),
      eq(customerSatisfaction.status, 'completed')
    ));

  // Get active tickets
  const activeTickets = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(supportTickets)
    .where(and(
      eq(supportTickets.assignedTo, agentId),
      inArray(supportTickets.status, ['open', 'pending'])
    ));

  const total = tickets[0]?.total || 1;
  const resolved = tickets[0]?.resolved || 0;

  return {
    agentId,
    agentName: agent[0].name,
    ticketsHandled: total,
    avgResponseTime: tickets[0]?.avgResponseTime || 0,
    avgResolutionTime: tickets[0]?.avgResolutionTime || 0,
    satisfactionScore: csatScores[0]?.avgRating || 0,
    resolutionRate: (resolved / total) * 100,
    activeTickets: activeTickets[0]?.count || 0
  };
}

/**
 * Get overall support metrics
 */
export async function getSupportMetrics(days: number = 30): Promise<{
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  avgCSAT: number;
  ticketsByChannel: { channel: string; count: number }[];
  ticketsByCategory: { category: string; count: number }[];
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [overall, byChannel, byCategory, csat] = await Promise.all([
    db.select({
      total: sql<number>`COUNT(*)`,
      open: sql<number>`SUM(CASE WHEN ${supportTickets.status} = 'open' THEN 1 ELSE 0 END)`,
      resolved: sql<number>`SUM(CASE WHEN ${supportTickets.status} IN ('resolved', 'closed') THEN 1 ELSE 0 END)`,
      avgFirstResponse: sql<number>`AVG(${supportTickets.firstResponseTime})`,
      avgResolution: sql<number>`AVG(${supportTickets.resolutionTime})`
    })
    .from(supportTickets)
    .where(gte(supportTickets.createdAt, startDate)),

    db.select({
      channel: supportTickets.channel,
      count: sql<number>`COUNT(*)`
    })
    .from(supportTickets)
    .where(gte(supportTickets.createdAt, startDate))
    .groupBy(supportTickets.channel),

    db.select({
      category: supportTickets.category,
      count: sql<number>`COUNT(*)`
    })
    .from(supportTickets)
    .where(gte(supportTickets.createdAt, startDate))
    .groupBy(supportTickets.category),

    db.select({
      avgRating: sql<number>`AVG(${customerSatisfaction.rating})`
    })
    .from(customerSatisfaction)
    .where(and(
      gte(customerSatisfaction.respondedAt, startDate),
      eq(customerSatisfaction.status, 'completed')
    ))
  ]);

  return {
    totalTickets: overall[0]?.total || 0,
    openTickets: overall[0]?.open || 0,
    resolvedTickets: overall[0]?.resolved || 0,
    avgFirstResponseTime: overall[0]?.avgFirstResponse || 0,
    avgResolutionTime: overall[0]?.avgResolution || 0,
    avgCSAT: csat[0]?.avgRating || 0,
    ticketsByChannel: byChannel.map(c => ({ channel: c.channel, count: c.count })),
    ticketsByCategory: byCategory.map(c => ({ category: c.category, count: c.count }))
  };
}

/**
 * Get macro response templates
 */
export async function getMacroResponses(category?: string): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  let query = db.select().from(macroResponses);

  if (category) {
    query = query.where(eq(macroResponses.category, category));
  }

  return await query;
}

/**
 * Apply macro response to ticket
 */
export async function applyMacro(ticketId: string, macroId: string, agentId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const macro = await db
    .select()
    .from(macroResponses)
    .where(eq(macroResponses.id, macroId))
    .limit(1);

  if (!macro.length) throw new Error('Macro not found');

  // Add macro response as message
  await addTicketMessage({
    ticketId,
    senderId: agentId,
    senderType: 'agent',
    content: macro[0].content,
    attachments: [],
    isInternal: false
  });

  // Apply any status changes
  if (macro[0].autoClose) {
    await updateTicketStatus(ticketId, 'resolved');
  }
}
