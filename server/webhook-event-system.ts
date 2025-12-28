/**
 * Comprehensive Webhook & Event Management System
 * Event bus, webhook delivery, retry logic, event streaming, event sourcing
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type EventType = 
  | 'order.created' | 'order.updated' | 'order.cancelled' | 'order.completed'
  | 'payment.succeeded' | 'payment.failed' | 'payment.refunded'
  | 'product.created' | 'product.updated' | 'product.deleted'
  | 'user.created' | 'user.updated' | 'user.deleted'
  | 'show.started' | 'show.ended' | 'show.created'
  | 'subscription.created' | 'subscription.cancelled' | 'subscription.renewed'
  | 'cart.abandoned' | 'cart.recovered'
  | 'review.created' | 'review.updated'
  | 'inventory.low' | 'inventory.out'
  | 'custom';

export interface Event {
  id: string;
  type: EventType;
  timestamp: Date;
  data: any;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  source?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  causationId?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: EventType[];
  enabled: boolean;
  secret: string;
  headers?: Record<string, string>;
  retryConfig?: RetryConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  statusCode?: number;
  response?: string;
  error?: string;
  sentAt?: Date;
  completedAt?: Date;
}

export interface EventSubscription {
  id: string;
  events: EventType[];
  handler: EventHandler;
  filter?: EventFilter;
  priority?: number;
}

export type EventHandler = (event: Event) => Promise<void> | void;
export type EventFilter = (event: Event) => boolean;

export interface EventStream {
  id: string;
  name: string;
  events: Event[];
  position: number;
}

export interface EventProjection {
  id: string;
  name: string;
  events: EventType[];
  state: any;
  lastEventId?: string;
  lastUpdated?: Date;
}

// ============================================================================
// EVENT BUS
// ============================================================================

class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize: number = 10000;

  // Publish event
  async publish(event: Event): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get subscriptions for this event type
    const subs = this.subscriptions.get(event.type) || [];
    const wildcardSubs = this.subscriptions.get('*') || [];
    const allSubs = [...subs, ...wildcardSubs];

    // Sort by priority
    allSubs.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Execute handlers
    for (const sub of allSubs) {
      try {
        // Apply filter
        if (sub.filter && !sub.filter(event)) {
          continue;
        }

        // Execute handler
        await sub.handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.type}:`, error);
      }
    }
  }

  // Subscribe to events
  subscribe(events: EventType[] | '*', handler: EventHandler, options?: {
    filter?: EventFilter;
    priority?: number;
  }): string {
    const id = this.generateId();
    const subscription: EventSubscription = {
      id,
      events: events === '*' ? ['*' as EventType] : events,
      handler,
      filter: options?.filter,
      priority: options?.priority
    };

    const eventTypes = events === '*' ? ['*'] : events;
    for (const eventType of eventTypes) {
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, []);
      }
      this.subscriptions.get(eventType)!.push(subscription);
    }

    return id;
  }

  // Unsubscribe
  unsubscribe(subscriptionId: string): void {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(eventType);
        }
      }
    }
  }

  // Get event history
  getHistory(filter?: {
    types?: EventType[];
    since?: Date;
    limit?: number;
  }): Event[] {
    let filtered = this.eventHistory;

    if (filter?.types) {
      filtered = filtered.filter(e => filter.types!.includes(e.type));
    }

    if (filter?.since) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Generate ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// WEBHOOK MANAGER
// ============================================================================

class WebhookManager {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventBus: EventBus;
  private deliveryQueue: WebhookDelivery[] = [];
  private processing: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.startDeliveryProcessor();
  }

  // Register webhook endpoint
  registerEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>): WebhookEndpoint {
    const id = this.generateId();
    const now = new Date();
    
    const webhookEndpoint: WebhookEndpoint = {
      id,
      ...endpoint,
      retryConfig: endpoint.retryConfig || {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 60000
      },
      createdAt: now,
      updatedAt: now
    };

    this.endpoints.set(id, webhookEndpoint);

    // Subscribe to events
    this.eventBus.subscribe(endpoint.events, async (event) => {
      await this.deliverWebhook(id, event);
    });

    return webhookEndpoint;
  }

  // Update endpoint
  updateEndpoint(id: string, updates: Partial<WebhookEndpoint>): WebhookEndpoint | null {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return null;

    const updated = {
      ...endpoint,
      ...updates,
      updatedAt: new Date()
    };

    this.endpoints.set(id, updated);
    return updated;
  }

  // Delete endpoint
  deleteEndpoint(id: string): boolean {
    return this.endpoints.delete(id);
  }

  // Get endpoint
  getEndpoint(id: string): WebhookEndpoint | undefined {
    return this.endpoints.get(id);
  }

  // List endpoints
  listEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  // Deliver webhook
  private async deliverWebhook(endpointId: string, event: Event): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint || !endpoint.enabled) return;

    const deliveryId = this.generateId();
    const delivery: WebhookDelivery = {
      id: deliveryId,
      endpointId,
      eventId: event.id,
      attempt: 0,
      status: 'pending'
    };

    this.deliveries.set(deliveryId, delivery);
    this.deliveryQueue.push(delivery);
  }

  // Start delivery processor
  private startDeliveryProcessor(): void {
    setInterval(async () => {
      if (this.processing || this.deliveryQueue.length === 0) return;

      this.processing = true;

      try {
        const delivery = this.deliveryQueue.shift();
        if (delivery) {
          await this.processDelivery(delivery);
        }
      } finally {
        this.processing = false;
      }
    }, 100);
  }

  // Process delivery
  private async processDelivery(delivery: WebhookDelivery): Promise<void> {
    const endpoint = this.endpoints.get(delivery.endpointId);
    if (!endpoint) return;

    const event = this.eventBus.getHistory({ limit: 10000 }).find(e => e.id === delivery.eventId);
    if (!event) return;

    delivery.attempt++;
    delivery.status = 'retrying';
    delivery.sentAt = new Date();

    try {
      // Create signature
      const signature = this.createSignature(event, endpoint.secret);

      // Send webhook
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-ID': delivery.id,
          ...endpoint.headers
        },
        body: JSON.stringify(event)
      });

      delivery.statusCode = response.status;
      delivery.response = await response.text();

      if (response.ok) {
        delivery.status = 'success';
        delivery.completedAt = new Date();
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.response}`);
      }
    } catch (error: any) {
      delivery.error = error.message;

      // Retry logic
      const retryConfig = endpoint.retryConfig!;
      if (delivery.attempt < retryConfig.maxAttempts) {
        const delay = Math.min(
          retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, delivery.attempt - 1),
          retryConfig.maxDelay
        );

        setTimeout(() => {
          this.deliveryQueue.push(delivery);
        }, delay);
      } else {
        delivery.status = 'failed';
        delivery.completedAt = new Date();
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  // Create signature
  private createSignature(event: Event, secret: string): string {
    const payload = JSON.stringify(event);
    // In production, use crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return `sha256=${Buffer.from(payload + secret).toString('base64')}`;
  }

  // Get delivery
  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  // List deliveries
  listDeliveries(filter?: {
    endpointId?: string;
    status?: WebhookDelivery['status'];
    limit?: number;
  }): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values());

    if (filter?.endpointId) {
      deliveries = deliveries.filter(d => d.endpointId === filter.endpointId);
    }

    if (filter?.status) {
      deliveries = deliveries.filter(d => d.status === filter.status);
    }

    if (filter?.limit) {
      deliveries = deliveries.slice(-filter.limit);
    }

    return deliveries;
  }

  // Retry delivery
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) return;

    delivery.status = 'pending';
    delivery.attempt = 0;
    this.deliveryQueue.push(delivery);
  }

  // Get delivery stats
  getDeliveryStats(endpointId?: string): {
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    let deliveries = Array.from(this.deliveries.values());

    if (endpointId) {
      deliveries = deliveries.filter(d => d.endpointId === endpointId);
    }

    const total = deliveries.length;
    const success = deliveries.filter(d => d.status === 'success').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const pending = deliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length;

    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? (success / total) * 100 : 0
    };
  }

  // Generate ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// EVENT STORE (Event Sourcing)
// ============================================================================

class EventStore {
  private streams: Map<string, EventStream> = new Map();
  private projections: Map<string, EventProjection> = new Map();

  // Append event to stream
  appendToStream(streamId: string, event: Event): void {
    let stream = this.streams.get(streamId);

    if (!stream) {
      stream = {
        id: streamId,
        name: streamId,
        events: [],
        position: 0
      };
      this.streams.set(streamId, stream);
    }

    stream.events.push(event);
    stream.position++;

    // Update projections
    this.updateProjections(event);
  }

  // Read stream
  readStream(streamId: string, fromPosition: number = 0): Event[] {
    const stream = this.streams.get(streamId);
    if (!stream) return [];

    return stream.events.slice(fromPosition);
  }

  // Get stream position
  getStreamPosition(streamId: string): number {
    const stream = this.streams.get(streamId);
    return stream?.position || 0;
  }

  // Create projection
  createProjection(projection: Omit<EventProjection, 'lastEventId' | 'lastUpdated'>): void {
    this.projections.set(projection.id, {
      ...projection,
      lastUpdated: new Date()
    });
  }

  // Update projections
  private updateProjections(event: Event): void {
    for (const projection of this.projections.values()) {
      if (projection.events.includes(event.type)) {
        // In production, would apply event to projection state
        projection.lastEventId = event.id;
        projection.lastUpdated = new Date();
      }
    }
  }

  // Get projection
  getProjection(id: string): EventProjection | undefined {
    return this.projections.get(id);
  }

  // Replay events
  replayEvents(streamId: string, handler: EventHandler): void {
    const events = this.readStream(streamId);
    for (const event of events) {
      handler(event);
    }
  }
}

// ============================================================================
// EVENT EMITTER HELPERS
// ============================================================================

class EventEmitter {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  // Emit order events
  async emitOrderCreated(order: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'order.created',
      timestamp: new Date(),
      data: order
    });
  }

  async emitOrderUpdated(order: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'order.updated',
      timestamp: new Date(),
      data: order
    });
  }

  async emitOrderCancelled(order: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'order.cancelled',
      timestamp: new Date(),
      data: order
    });
  }

  // Emit payment events
  async emitPaymentSucceeded(payment: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'payment.succeeded',
      timestamp: new Date(),
      data: payment
    });
  }

  async emitPaymentFailed(payment: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'payment.failed',
      timestamp: new Date(),
      data: payment
    });
  }

  // Emit product events
  async emitProductCreated(product: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'product.created',
      timestamp: new Date(),
      data: product
    });
  }

  async emitProductUpdated(product: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'product.updated',
      timestamp: new Date(),
      data: product
    });
  }

  // Emit show events
  async emitShowStarted(show: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'show.started',
      timestamp: new Date(),
      data: show
    });
  }

  async emitShowEnded(show: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'show.ended',
      timestamp: new Date(),
      data: show
    });
  }

  // Emit inventory events
  async emitInventoryLow(product: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'inventory.low',
      timestamp: new Date(),
      data: product
    });
  }

  async emitInventoryOut(product: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'inventory.out',
      timestamp: new Date(),
      data: product
    });
  }

  // Emit cart events
  async emitCartAbandoned(cart: any): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'cart.abandoned',
      timestamp: new Date(),
      data: cart
    });
  }

  // Emit custom event
  async emitCustom(eventType: string, data: any, metadata?: EventMetadata): Promise<void> {
    await this.eventBus.publish({
      id: this.generateId(),
      type: 'custom',
      timestamp: new Date(),
      data: { eventType, ...data },
      metadata
    });
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// EVENT ANALYTICS
// ============================================================================

class EventAnalytics {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  // Get event counts
  getEventCounts(timeRange?: { start: Date; end: Date }): Record<EventType, number> {
    const history = this.eventBus.getHistory(timeRange ? { since: timeRange.start } : undefined);
    const counts: any = {};

    for (const event of history) {
      if (timeRange && event.timestamp > timeRange.end) continue;
      counts[event.type] = (counts[event.type] || 0) + 1;
    }

    return counts;
  }

  // Get event timeline
  getEventTimeline(eventTypes?: EventType[], interval: 'hour' | 'day' = 'hour'): Array<{
    timestamp: Date;
    count: number;
  }> {
    const history = this.eventBus.getHistory(eventTypes ? { types: eventTypes } : undefined);
    const timeline: Map<number, number> = new Map();

    const intervalMs = interval === 'hour' ? 3600000 : 86400000;

    for (const event of history) {
      const bucket = Math.floor(event.timestamp.getTime() / intervalMs) * intervalMs;
      timeline.set(bucket, (timeline.get(bucket) || 0) + 1);
    }

    return Array.from(timeline.entries())
      .map(([timestamp, count]) => ({ timestamp: new Date(timestamp), count }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Get top events
  getTopEvents(limit: number = 10): Array<{ type: EventType; count: number }> {
    const counts = this.getEventCounts();
    return Object.entries(counts)
      .map(([type, count]) => ({ type: type as EventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const eventBus = new EventBus();
export const webhookManager = new WebhookManager(eventBus);
export const eventStore = new EventStore();
export const eventEmitter = new EventEmitter(eventBus);
export const eventAnalytics = new EventAnalytics(eventBus);

// Helper functions
export function publishEvent(event: Event): Promise<void> {
  return eventBus.publish(event);
}

export function subscribeToEvents(
  events: EventType[] | '*',
  handler: EventHandler,
  options?: { filter?: EventFilter; priority?: number }
): string {
  return eventBus.subscribe(events, handler, options);
}

export function unsubscribeFromEvents(subscriptionId: string): void {
  eventBus.unsubscribe(subscriptionId);
}

export function registerWebhook(endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>): WebhookEndpoint {
  return webhookManager.registerEndpoint(endpoint);
}

export function getWebhookDeliveryStats(endpointId?: string) {
  return webhookManager.getDeliveryStats(endpointId);
}
