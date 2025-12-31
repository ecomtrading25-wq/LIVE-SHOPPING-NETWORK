/**
 * Self-Healing Service
 * 
 * Provides retry mechanisms, circuit breakers, and automatic recovery
 * for external API calls and critical operations.
 */

import { recordMetric } from './monitoring-service';
import { sendAlertEmail } from './email-service';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing
  timeout: number; // milliseconds to wait before trying again
}

export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context?: string
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = [],
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 0) {
        console.log(`[SelfHealing] ${context || 'Operation'} succeeded after ${attempt} retries`);
        recordMetric('error_rate', 0, { context, attempt });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (retryableErrors.length > 0) {
        const isRetryable = retryableErrors.some((errMsg) =>
          lastError?.message.includes(errMsg)
        );
        if (!isRetryable) {
          throw lastError;
        }
      }

      if (attempt < maxRetries) {
        console.warn(
          `[SelfHealing] ${context || 'Operation'} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
          error
        );
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  console.error(`[SelfHealing] ${context || 'Operation'} failed after ${maxRetries + 1} attempts`);
  recordMetric('error_rate', 1, { context, maxRetries });
  
  throw lastError;
}

/**
 * Circuit Breaker
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private options: CircuitBreakerOptions;
  private name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000, // 1 minute
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        console.log(`[CircuitBreaker] ${this.name} is now HALF-OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess() {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
        console.log(`[CircuitBreaker] ${this.name} is now CLOSED`);
        recordMetric('error_rate', 0, { circuit: this.name, state: 'closed' });
      }
    }
  }

  /**
   * Handle failed execution
   */
  private async onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'half-open') {
      this.state = 'open';
      this.successCount = 0;
      console.error(`[CircuitBreaker] ${this.name} is now OPEN (failed in half-open state)`);
      await this.notifyCircuitOpen();
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
      console.error(`[CircuitBreaker] ${this.name} is now OPEN (threshold reached: ${this.failureCount} failures)`);
      await this.notifyCircuitOpen();
    }

    recordMetric('error_rate', 1, { circuit: this.name, state: this.state });
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.options.timeout;
  }

  /**
   * Notify when circuit opens
   */
  private async notifyCircuitOpen() {
    await sendAlertEmail(
      `Circuit Breaker Opened: ${this.name}`,
      `The circuit breaker for ${this.name} has been opened due to repeated failures.\n\nFailure count: ${this.failureCount}\nThreshold: ${this.options.failureThreshold}\n\nThe system will automatically attempt to recover after ${this.options.timeout}ms.`,
      'critical'
    );
  }

  /**
   * Get circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker stats
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    console.log(`[CircuitBreaker] ${this.name} manually reset to CLOSED`);
  }
}

/**
 * Dead Letter Queue for failed tasks
 */
export class DeadLetterQueue {
  private queue: Array<{
    id: string;
    task: any;
    error: string;
    timestamp: Date;
    retries: number;
  }> = [];

  /**
   * Add a failed task to the DLQ
   */
  add(task: any, error: string, retries: number = 0) {
    const id = `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.queue.push({
      id,
      task,
      error,
      timestamp: new Date(),
      retries,
    });

    // Keep only last 1000 items
    if (this.queue.length > 1000) {
      this.queue = this.queue.slice(-1000);
    }

    console.error(`[DLQ] Added task to dead letter queue: ${id}`, error);
    recordMetric('error_rate', 1, { dlq: true });
  }

  /**
   * Get all items in the DLQ
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Get a specific item
   */
  get(id: string) {
    return this.queue.find((item) => item.id === id);
  }

  /**
   * Remove an item from the DLQ
   */
  remove(id: string) {
    this.queue = this.queue.filter((item) => item.id !== id);
    console.log(`[DLQ] Removed item ${id} from dead letter queue`);
  }

  /**
   * Clear the DLQ
   */
  clear() {
    this.queue = [];
    console.log('[DLQ] Dead letter queue cleared');
  }

  /**
   * Get DLQ size
   */
  size() {
    return this.queue.length;
  }
}

/**
 * Graceful degradation handler
 */
export class GracefulDegradation {
  private fallbacks: Map<string, () => any> = new Map();

  /**
   * Register a fallback for a service
   */
  registerFallback(serviceName: string, fallback: () => any) {
    this.fallbacks.set(serviceName, fallback);
    console.log(`[GracefulDegradation] Registered fallback for ${serviceName}`);
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    serviceName: string,
    primaryFn: () => Promise<T>,
    fallbackValue?: T
  ): Promise<T> {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn(`[GracefulDegradation] ${serviceName} failed, using fallback`, error);
      recordMetric('error_rate', 1, { service: serviceName, fallback: true });

      const fallback = this.fallbacks.get(serviceName);
      if (fallback) {
        return fallback();
      }

      if (fallbackValue !== undefined) {
        return fallbackValue;
      }

      throw error;
    }
  }
}

/**
 * Database connection recovery
 */
export class DatabaseRecovery {
  private reconnecting: boolean = false;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;

  /**
   * Attempt to recover database connection
   */
  async recover(connectionFn: () => Promise<void>): Promise<boolean> {
    if (this.reconnecting) {
      console.log('[DatabaseRecovery] Already attempting to reconnect');
      return false;
    }

    this.reconnecting = true;
    console.log('[DatabaseRecovery] Attempting to recover database connection...');

    try {
      await retryWithBackoff(
        connectionFn,
        {
          maxRetries: this.maxReconnectAttempts,
          initialDelay: this.reconnectDelay,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
        'Database reconnection'
      );

      console.log('[DatabaseRecovery] Database connection recovered');
      await sendAlertEmail(
        'Database Connection Recovered',
        'The database connection has been successfully recovered.',
        'info'
      );
      
      this.reconnecting = false;
      return true;
    } catch (error) {
      console.error('[DatabaseRecovery] Failed to recover database connection', error);
      await sendAlertEmail(
        'Database Connection Recovery Failed',
        `Failed to recover database connection after ${this.maxReconnectAttempts} attempts.\n\nError: ${error}`,
        'critical'
      );
      
      this.reconnecting = false;
      return false;
    }
  }
}

// Global instances
const circuitBreakers = new Map<string, CircuitBreaker>();
const deadLetterQueue = new DeadLetterQueue();
const gracefulDegradation = new GracefulDegradation();
const databaseRecovery = new DatabaseRecovery();

/**
 * Get or create a circuit breaker
 */
export function getCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, options));
  }
  return circuitBreakers.get(name)!;
}

/**
 * Get the dead letter queue
 */
export function getDLQ(): DeadLetterQueue {
  return deadLetterQueue;
}

/**
 * Get graceful degradation handler
 */
export function getGracefulDegradation(): GracefulDegradation {
  return gracefulDegradation;
}

/**
 * Get database recovery handler
 */
export function getDatabaseRecovery(): DatabaseRecovery {
  return databaseRecovery;
}

/**
 * Get all circuit breaker stats
 */
export function getAllCircuitBreakerStats() {
  return Array.from(circuitBreakers.values()).map((cb) => cb.getStats());
}
