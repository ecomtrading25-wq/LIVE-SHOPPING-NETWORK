/**
 * Customer Support Console Service
 * Handles ticket system, live chat, order actions, canned responses, SLA tracking, and agent metrics
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  supportTickets,
  supportMessages,
  supportAgents,
  cannedResponses,
  supportTags,
  slaViolations,
  agentMetrics,
  orders,
  users
} from '../drizzle/schema';
import { eq, and, desc, gte, lte, sql, isNull } from 'drizzle-orm';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'ORDER' | 'PAYMENT' | 'SHIPPING' | 'PRODUCT' | 'REFUND' | 'TECHNICAL' | 'ACCOUNT' | 'OTHER';
export type MessageType = 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'NOTE';
export type SLAMetric = 'FIRST_RESPONSE' | 'RESOLUTION' | 'RESPONSE_TIME';

export interface SupportTicket {
  ticketId: string;
  ticketNumber: number;
  channelId: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  orderId?: string;
  assignedTo?: string;
  tags: string[];
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  slaViolated: boolean;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportMessage {
  messageId: string;
  ticketId: string;
  type: MessageType;
  senderId: string;
  senderName: string;
  content: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: Date;
}

export interface CannedResponse {
  responseId: string;
  channelId: string;
  title: string;
  content: string;
  category: TicketCategory;
  tags: string[];
  usageCount: number;
  createdBy: string;
  isActive: boolean;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  satisfactionScore: number;
  slaViolations: number;
  activeTickets: number;
}

export interface SLAConfig {
  firstResponseMinutes: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  resolutionMinutes: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

const DEFAULT_SLA: SLAConfig = {
  firstResponseMinutes: {
    URGENT: 15,
    HIGH: 60,
    MEDIUM: 240,
    LOW: 480
  },
  resolutionMinutes: {
    URGENT: 240,
    HIGH: 480,
    MEDIUM: 1440,
    LOW: 2880
  }
};

/**
 * Create support ticket
 */
export async function createTicket(
  channelId: string,
  data: {
    userId?: string;
    customerEmail: string;
    customerName: string;
    subject: string;
    message: string;
    category: TicketCategory;
    orderId?: string;
    priority?: TicketPriority;
  }
): Promise<SupportTicket> {
  // Get next ticket number
  const lastTicket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.channelId, channelId),
    orderBy: desc(supportTickets.ticketNumber)
  });

  const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;

  // Auto-determine priority if not provided
  const priority = data.priority || determinePriority(data.subject, data.message, data.category);

  // Create ticket
  const [ticket] = await db.insert(supportTickets).values({
    channelId,
    ticketNumber,
    userId: data.userId || null,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    subject: data.subject,
    category: data.category,
    priority,
    status: 'OPEN',
    orderId: data.orderId || null,
    tags: [],
    slaViolated: false
  }).returning();

  // Create initial message
  await db.insert(supportMessages).values({
    ticketId: ticket.ticketId,
    type: 'CUSTOMER',
    senderId: data.userId || 'guest',
    senderName: data.customerName,
    content: data.message,
    isInternal: false
  });

  // Auto-assign to available agent
  await autoAssignTicket(ticket.ticketId);

  // Schedule SLA check
  await scheduleSLACheck(ticket.ticketId, priority);

  return ticket as SupportTicket;
}

/**
 * Determine ticket priority based on content
 */
function determinePriority(subject: string, message: string, category: TicketCategory): TicketPriority {
  const content = `${subject} ${message}`.toLowerCase();
  
  // Urgent keywords
  if (
    content.includes('urgent') ||
    content.includes('emergency') ||
    content.includes('fraud') ||
    content.includes('unauthorized') ||
    content.includes('hacked')
  ) {
    return 'URGENT';
  }

  // High priority keywords
  if (
    content.includes('refund') ||
    content.includes('not received') ||
    content.includes('wrong item') ||
    content.includes('damaged') ||
    category === 'PAYMENT' ||
    category === 'REFUND'
  ) {
    return 'HIGH';
  }

  // Medium priority
  if (category === 'ORDER' || category === 'SHIPPING') {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Auto-assign ticket to available agent
 */
async function autoAssignTicket(ticketId: string): Promise<void> {
  // Get all agents with their current workload
  const agents = await db.query.supportAgents.findMany({
    where: eq(supportAgents.isActive, true)
  });

  if (agents.length === 0) return;

  // Get active ticket counts for each agent
  const agentWorkloads = await Promise.all(
    agents.map(async (agent) => {
      const activeTickets = await db.query.supportTickets.findMany({
        where: and(
          eq(supportTickets.assignedTo, agent.agentId),
          sql`status IN ('OPEN', 'IN_PROGRESS', 'WAITING_INTERNAL')`
        )
      });

      return {
        agentId: agent.agentId,
        activeTickets: activeTickets.length
      };
    })
  );

  // Assign to agent with least workload
  const leastBusyAgent = agentWorkloads.reduce((min, agent) =>
    agent.activeTickets < min.activeTickets ? agent : min
  );

  await db.update(supportTickets)
    .set({
      assignedTo: leastBusyAgent.agentId,
      updatedAt: new Date()
    })
    .where(eq(supportTickets.ticketId, ticketId));

  // Create system message
  const agent = agents.find(a => a.agentId === leastBusyAgent.agentId);
  await db.insert(supportMessages).values({
    ticketId,
    type: 'SYSTEM',
    senderId: 'system',
    senderName: 'System',
    content: `Ticket assigned to ${agent?.name || 'agent'}`,
    isInternal: true
  });
}

/**
 * Add message to ticket
 */
export async function addMessage(
  ticketId: string,
  data: {
    type: MessageType;
    senderId: string;
    senderName: string;
    content: string;
    isInternal?: boolean;
    attachments?: string[];
  }
): Promise<SupportMessage> {
  const [message] = await db.insert(supportMessages).values({
    ticketId,
    type: data.type,
    senderId: data.senderId,
    senderName: data.senderName,
    content: data.content,
    isInternal: data.isInternal || false,
    attachments: data.attachments || null
  }).returning();

  // Update ticket
  const updates: any = { updatedAt: new Date() };

  // If agent response, mark first response time
  if (data.type === 'AGENT') {
    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.ticketId, ticketId)
    });

    if (ticket && !ticket.firstResponseAt) {
      updates.firstResponseAt = new Date();
      updates.status = 'IN_PROGRESS';
    }
  }

  // If customer response, change status
  if (data.type === 'CUSTOMER') {
    updates.status = 'IN_PROGRESS';
  }

  await db.update(supportTickets)
    .set(updates)
    .where(eq(supportTickets.ticketId, ticketId));

  return message as SupportMessage;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  agentId: string,
  note?: string
): Promise<void> {
  const updates: any = {
    status,
    updatedAt: new Date()
  };

  if (status === 'RESOLVED') {
    updates.resolvedAt = new Date();
  } else if (status === 'CLOSED') {
    updates.closedAt = new Date();
  }

  await db.update(supportTickets)
    .set(updates)
    .where(eq(supportTickets.ticketId, ticketId));

  // Add system message
  if (note) {
    await db.insert(supportMessages).values({
      ticketId,
      type: 'NOTE',
      senderId: agentId,
      senderName: 'Agent',
      content: note,
      isInternal: true
    });
  }
}

/**
 * Assign ticket to agent
 */
export async function assignTicket(
  ticketId: string,
  agentId: string,
  assignedBy: string
): Promise<void> {
  await db.update(supportTickets)
    .set({
      assignedTo: agentId,
      updatedAt: new Date()
    })
    .where(eq(supportTickets.ticketId, ticketId));

  const agent = await db.query.supportAgents.findFirst({
    where: eq(supportAgents.agentId, agentId)
  });

  await db.insert(supportMessages).values({
    ticketId,
    type: 'SYSTEM',
    senderId: 'system',
    senderName: 'System',
    content: `Ticket reassigned to ${agent?.name || 'agent'}`,
    isInternal: true
  });
}

/**
 * Add tags to ticket
 */
export async function addTicketTags(
  ticketId: string,
  tags: string[]
): Promise<void> {
  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.ticketId, ticketId)
  });

  if (!ticket) return;

  const existingTags = ticket.tags || [];
  const newTags = [...new Set([...existingTags, ...tags])];

  await db.update(supportTickets)
    .set({
      tags: newTags,
      updatedAt: new Date()
    })
    .where(eq(supportTickets.ticketId, ticketId));
}

/**
 * Get ticket with messages
 */
export async function getTicket(ticketId: string): Promise<{
  ticket: SupportTicket;
  messages: SupportMessage[];
  order?: any;
  customer?: any;
}> {
  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.ticketId, ticketId)
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const messages = await db.query.supportMessages.findMany({
    where: eq(supportMessages.ticketId, ticketId),
    orderBy: desc(supportMessages.createdAt)
  });

  let order = null;
  if (ticket.orderId) {
    order = await db.query.orders.findFirst({
      where: eq(orders.orderId, ticket.orderId),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    });
  }

  let customer = null;
  if (ticket.userId) {
    customer = await db.query.users.findFirst({
      where: eq(users.userId, ticket.userId)
    });
  }

  return {
    ticket: ticket as SupportTicket,
    messages: messages as SupportMessage[],
    order,
    customer
  };
}

/**
 * Search tickets
 */
export async function searchTickets(
  channelId: string,
  filters: {
    status?: TicketStatus[];
    priority?: TicketPriority[];
    category?: TicketCategory[];
    assignedTo?: string;
    customerId?: string;
    orderId?: string;
    tags?: string[];
    search?: string;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{
  tickets: SupportTicket[];
  total: number;
}> {
  let conditions = [eq(supportTickets.channelId, channelId)];

  if (filters.status && filters.status.length > 0) {
    conditions.push(sql`status IN (${sql.join(filters.status.map(s => sql`${s}`), sql`, `)})`);
  }

  if (filters.priority && filters.priority.length > 0) {
    conditions.push(sql`priority IN (${sql.join(filters.priority.map(p => sql`${p}`), sql`, `)})`);
  }

  if (filters.category && filters.category.length > 0) {
    conditions.push(sql`category IN (${sql.join(filters.category.map(c => sql`${c}`), sql`, `)})`);
  }

  if (filters.assignedTo) {
    conditions.push(eq(supportTickets.assignedTo, filters.assignedTo));
  }

  if (filters.customerId) {
    conditions.push(eq(supportTickets.userId, filters.customerId));
  }

  if (filters.orderId) {
    conditions.push(eq(supportTickets.orderId, filters.orderId));
  }

  if (filters.search) {
    conditions.push(sql`(subject LIKE ${`%${filters.search}%`} OR customer_email LIKE ${`%${filters.search}%`})`);
  }

  const tickets = await db.query.supportTickets.findMany({
    where: and(...conditions),
    orderBy: desc(supportTickets.createdAt),
    limit: pagination.limit,
    offset: (pagination.page - 1) * pagination.limit
  });

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(supportTickets)
    .where(and(...conditions));

  return {
    tickets: tickets as SupportTicket[],
    total: Number(count)
  };
}

/**
 * Create canned response
 */
export async function createCannedResponse(
  channelId: string,
  data: {
    title: string;
    content: string;
    category: TicketCategory;
    tags?: string[];
    createdBy: string;
  }
): Promise<CannedResponse> {
  const [response] = await db.insert(cannedResponses).values({
    channelId,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
    usageCount: 0,
    createdBy: data.createdBy,
    isActive: true
  }).returning();

  return response as CannedResponse;
}

/**
 * Get canned responses
 */
export async function getCannedResponses(
  channelId: string,
  category?: TicketCategory
): Promise<CannedResponse[]> {
  let query = db.query.cannedResponses.findMany({
    where: and(
      eq(cannedResponses.channelId, channelId),
      eq(cannedResponses.isActive, true)
    ),
    orderBy: desc(cannedResponses.usageCount)
  });

  const responses = await query;

  if (category) {
    return responses.filter(r => r.category === category) as CannedResponse[];
  }

  return responses as CannedResponse[];
}

/**
 * Use canned response
 */
export async function useCannedResponse(
  responseId: string,
  ticketId: string,
  agentId: string
): Promise<SupportMessage> {
  const response = await db.query.cannedResponses.findFirst({
    where: eq(cannedResponses.responseId, responseId)
  });

  if (!response) {
    throw new Error('Canned response not found');
  }

  // Increment usage count
  await db.update(cannedResponses)
    .set({ usageCount: response.usageCount + 1 })
    .where(eq(cannedResponses.responseId, responseId));

  // Add message to ticket
  const agent = await db.query.supportAgents.findFirst({
    where: eq(supportAgents.agentId, agentId)
  });

  return await addMessage(ticketId, {
    type: 'AGENT',
    senderId: agentId,
    senderName: agent?.name || 'Agent',
    content: response.content
  });
}

/**
 * Schedule SLA check
 */
async function scheduleSLACheck(ticketId: string, priority: TicketPriority): Promise<void> {
  // In production, use job scheduler (Bull, Agenda)
  // For now, just mark the SLA targets
  const firstResponseTarget = new Date(Date.now() + DEFAULT_SLA.firstResponseMinutes[priority] * 60 * 1000);
  const resolutionTarget = new Date(Date.now() + DEFAULT_SLA.resolutionMinutes[priority] * 60 * 1000);

  // Store SLA targets in ticket metadata
  await db.update(supportTickets)
    .set({
      metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.sla_first_response_target', ${firstResponseTarget.toISOString()}, '$.sla_resolution_target', ${resolutionTarget.toISOString()})`
    })
    .where(eq(supportTickets.ticketId, ticketId));
}

/**
 * Check SLA violations
 */
export async function checkSLAViolations(channelId: string): Promise<void> {
  const openTickets = await db.query.supportTickets.findMany({
    where: and(
      eq(supportTickets.channelId, channelId),
      sql`status IN ('OPEN', 'IN_PROGRESS', 'WAITING_INTERNAL')`
    )
  });

  for (const ticket of openTickets) {
    const now = new Date();
    const createdAt = ticket.createdAt;
    const firstResponseAt = ticket.firstResponseAt;
    const priority = ticket.priority;

    // Check first response SLA
    if (!firstResponseAt) {
      const firstResponseDeadline = new Date(
        createdAt.getTime() + DEFAULT_SLA.firstResponseMinutes[priority] * 60 * 1000
      );

      if (now > firstResponseDeadline && !ticket.slaViolated) {
        await recordSLAViolation(ticket.ticketId, 'FIRST_RESPONSE', priority);
        
        await db.update(supportTickets)
          .set({ slaViolated: true })
          .where(eq(supportTickets.ticketId, ticket.ticketId));
      }
    }

    // Check resolution SLA
    if (!ticket.resolvedAt) {
      const resolutionDeadline = new Date(
        createdAt.getTime() + DEFAULT_SLA.resolutionMinutes[priority] * 60 * 1000
      );

      if (now > resolutionDeadline && !ticket.slaViolated) {
        await recordSLAViolation(ticket.ticketId, 'RESOLUTION', priority);
        
        await db.update(supportTickets)
          .set({ slaViolated: true })
          .where(eq(supportTickets.ticketId, ticket.ticketId));
      }
    }
  }
}

/**
 * Record SLA violation
 */
async function recordSLAViolation(
  ticketId: string,
  metric: SLAMetric,
  priority: TicketPriority
): Promise<void> {
  await db.insert(slaViolations).values({
    ticketId,
    metric,
    priority,
    violatedAt: new Date()
  });
}

/**
 * Get agent metrics
 */
export async function getAgentMetrics(
  agentId: string,
  dateRange?: { from: Date; to: Date }
): Promise<AgentMetrics> {
  const agent = await db.query.supportAgents.findFirst({
    where: eq(supportAgents.agentId, agentId)
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  let conditions = [eq(supportTickets.assignedTo, agentId)];

  if (dateRange) {
    conditions.push(gte(supportTickets.createdAt, dateRange.from));
    conditions.push(lte(supportTickets.createdAt, dateRange.to));
  }

  const tickets = await db.query.supportTickets.findMany({
    where: and(...conditions)
  });

  const ticketsAssigned = tickets.length;
  const ticketsResolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  
  // Calculate average first response time
  const ticketsWithFirstResponse = tickets.filter(t => t.firstResponseAt);
  const avgFirstResponseMinutes = ticketsWithFirstResponse.length > 0
    ? ticketsWithFirstResponse.reduce((sum, t) => {
        const responseTime = t.firstResponseAt!.getTime() - t.createdAt.getTime();
        return sum + responseTime / 60000;
      }, 0) / ticketsWithFirstResponse.length
    : 0;

  // Calculate average resolution time
  const resolvedTickets = tickets.filter(t => t.resolvedAt);
  const avgResolutionMinutes = resolvedTickets.length > 0
    ? resolvedTickets.reduce((sum, t) => {
        const resolutionTime = t.resolvedAt!.getTime() - t.createdAt.getTime();
        return sum + resolutionTime / 60000;
      }, 0) / resolvedTickets.length
    : 0;

  // Calculate satisfaction score
  const ratedTickets = tickets.filter(t => t.satisfactionRating);
  const satisfactionScore = ratedTickets.length > 0
    ? ratedTickets.reduce((sum, t) => sum + (t.satisfactionRating || 0), 0) / ratedTickets.length
    : 0;

  // Count SLA violations
  const slaViolations = tickets.filter(t => t.slaViolated).length;

  // Count active tickets
  const activeTickets = tickets.filter(t => 
    t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_INTERNAL'
  ).length;

  return {
    agentId,
    agentName: agent.name,
    ticketsAssigned,
    ticketsResolved,
    avgFirstResponseMinutes: Math.round(avgFirstResponseMinutes),
    avgResolutionMinutes: Math.round(avgResolutionMinutes),
    satisfactionScore: Math.round(satisfactionScore * 10) / 10,
    slaViolations,
    activeTickets
  };
}

/**
 * Submit satisfaction rating
 */
export async function submitSatisfactionRating(
  ticketId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  await db.update(supportTickets)
    .set({
      satisfactionRating: rating,
      satisfactionFeedback: feedback || null,
      updatedAt: new Date()
    })
    .where(eq(supportTickets.ticketId, ticketId));

  if (feedback) {
    await db.insert(supportMessages).values({
      ticketId,
      type: 'SYSTEM',
      senderId: 'system',
      senderName: 'System',
      content: `Customer rated this ticket ${rating}/5: ${feedback}`,
      isInternal: true
    });
  }
}

/**
 * Escalate ticket
 */
export async function escalateTicket(
  ticketId: string,
  reason: string,
  escalatedBy: string
): Promise<void> {
  await db.update(supportTickets)
    .set({
      priority: 'URGENT',
      updatedAt: new Date()
    })
    .where(eq(supportTickets.ticketId, ticketId));

  await db.insert(supportMessages).values({
    ticketId,
    type: 'SYSTEM',
    senderId: escalatedBy,
    senderName: 'Agent',
    content: `Ticket escalated to URGENT. Reason: ${reason}`,
    isInternal: true
  });

  // TODO: Notify senior agents
}

/**
 * Merge tickets
 */
export async function mergeTickets(
  primaryTicketId: string,
  secondaryTicketIds: string[],
  mergedBy: string
): Promise<void> {
  for (const secondaryId of secondaryTicketIds) {
    // Move messages to primary ticket
    await db.update(supportMessages)
      .set({ ticketId: primaryTicketId })
      .where(eq(supportMessages.ticketId, secondaryId));

    // Close secondary ticket
    await db.update(supportTickets)
      .set({
        status: 'CLOSED',
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportTickets.ticketId, secondaryId));

    // Add merge note
    await db.insert(supportMessages).values({
      ticketId: primaryTicketId,
      type: 'SYSTEM',
      senderId: mergedBy,
      senderName: 'Agent',
      content: `Ticket #${secondaryId} merged into this ticket`,
      isInternal: true
    });
  }
}

/**
 * Get support dashboard stats
 */
export async function getSupportDashboard(
  channelId: string,
  dateRange?: { from: Date; to: Date }
): Promise<{
  totalTickets: number;
  openTickets: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  satisfactionScore: number;
  slaViolationRate: number;
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByCategory: Record<TicketCategory, number>;
}> {
  let conditions = [eq(supportTickets.channelId, channelId)];

  if (dateRange) {
    conditions.push(gte(supportTickets.createdAt, dateRange.from));
    conditions.push(lte(supportTickets.createdAt, dateRange.to));
  }

  const tickets = await db.query.supportTickets.findMany({
    where: and(...conditions)
  });

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

  // Calculate metrics (same as agent metrics)
  const ticketsWithFirstResponse = tickets.filter(t => t.firstResponseAt);
  const avgFirstResponseMinutes = ticketsWithFirstResponse.length > 0
    ? ticketsWithFirstResponse.reduce((sum, t) => {
        const responseTime = t.firstResponseAt!.getTime() - t.createdAt.getTime();
        return sum + responseTime / 60000;
      }, 0) / ticketsWithFirstResponse.length
    : 0;

  const resolvedTickets = tickets.filter(t => t.resolvedAt);
  const avgResolutionMinutes = resolvedTickets.length > 0
    ? resolvedTickets.reduce((sum, t) => {
        const resolutionTime = t.resolvedAt!.getTime() - t.createdAt.getTime();
        return sum + resolutionTime / 60000;
      }, 0) / resolvedTickets.length
    : 0;

  const ratedTickets = tickets.filter(t => t.satisfactionRating);
  const satisfactionScore = ratedTickets.length > 0
    ? ratedTickets.reduce((sum, t) => sum + (t.satisfactionRating || 0), 0) / ratedTickets.length
    : 0;

  const slaViolationRate = totalTickets > 0
    ? (tickets.filter(t => t.slaViolated).length / totalTickets) * 100
    : 0;

  // Group by status
  const ticketsByStatus: Record<TicketStatus, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_CUSTOMER: 0,
    WAITING_INTERNAL: 0,
    RESOLVED: 0,
    CLOSED: 0
  };
  tickets.forEach(t => ticketsByStatus[t.status]++);

  // Group by priority
  const ticketsByPriority: Record<TicketPriority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0
  };
  tickets.forEach(t => ticketsByPriority[t.priority]++);

  // Group by category
  const ticketsByCategory: Record<TicketCategory, number> = {
    ORDER: 0,
    PAYMENT: 0,
    SHIPPING: 0,
    PRODUCT: 0,
    REFUND: 0,
    TECHNICAL: 0,
    ACCOUNT: 0,
    OTHER: 0
  };
  tickets.forEach(t => ticketsByCategory[t.category]++);

  return {
    totalTickets,
    openTickets,
    avgFirstResponseMinutes: Math.round(avgFirstResponseMinutes),
    avgResolutionMinutes: Math.round(avgResolutionMinutes),
    satisfactionScore: Math.round(satisfactionScore * 10) / 10,
    slaViolationRate: Math.round(slaViolationRate * 10) / 10,
    ticketsByStatus,
    ticketsByPriority,
    ticketsByCategory
  };
}
