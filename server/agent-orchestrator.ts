/**
 * Agent Orchestrator
 * 
 * Manages autonomous agents, enforces policies, and provides
 * approval workflows for high-risk actions.
 */

import { sendAlertEmail } from './email-service';
import { recordMetric } from './monitoring-service';

export type AgentAction =
  | 'process_payout'
  | 'refund_order'
  | 'cancel_order'
  | 'reorder_inventory'
  | 'update_pricing'
  | 'block_customer'
  | 'resolve_dispute'
  | 'send_marketing_email';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';

export interface AgentTask {
  id: string;
  action: AgentAction;
  priority: TaskPriority;
  status: TaskStatus;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  error?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface PolicyRule {
  action: AgentAction;
  requiresApproval: (data: Record<string, any>) => boolean;
  invariantChecks: Array<(data: Record<string, any>) => { valid: boolean; reason?: string }>;
  maxRetries: number;
}

export interface ApprovalRequest {
  taskId: string;
  action: AgentAction;
  data: Record<string, any>;
  reason: string;
  requestedAt: Date;
  expiresAt: Date;
}

class AgentOrchestrator {
  private tasks: Map<string, AgentTask> = new Map();
  private policies: Map<AgentAction, PolicyRule> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private killSwitchActive: boolean = false;
  private killSwitchReason: string = '';
  private taskQueue: AgentTask[] = [];
  private processing: boolean = false;

  constructor() {
    this.initializePolicies();
    this.startTaskProcessor();
  }

  /**
   * Initialize policy rules for different actions
   */
  private initializePolicies() {
    // Payout policy
    this.addPolicy({
      action: 'process_payout',
      requiresApproval: (data) => {
        const amount = data.amount || 0;
        const dailyLimit = parseFloat(process.env.DAILY_PAYOUT_LIMIT || '5000');
        const singleLimit = parseFloat(process.env.SINGLE_PAYOUT_LIMIT || '1000');
        return amount > singleLimit || this.getDailyPayoutTotal() + amount > dailyLimit;
      },
      invariantChecks: [
        (data) => ({
          valid: data.amount > 0,
          reason: 'Payout amount must be positive',
        }),
        (data) => ({
          valid: data.recipientId != null,
          reason: 'Recipient ID is required',
        }),
        (data) => ({
          valid: data.amount <= parseFloat(process.env.SINGLE_PAYOUT_LIMIT || '1000') * 10,
          reason: 'Payout amount exceeds maximum allowed',
        }),
      ],
      maxRetries: 3,
    });

    // Refund policy
    this.addPolicy({
      action: 'refund_order',
      requiresApproval: (data) => {
        const amount = data.amount || 0;
        return amount > 500; // Require approval for refunds > $500
      },
      invariantChecks: [
        (data) => ({
          valid: data.orderId != null,
          reason: 'Order ID is required',
        }),
        (data) => ({
          valid: data.amount > 0,
          reason: 'Refund amount must be positive',
        }),
      ],
      maxRetries: 2,
    });

    // Inventory reorder policy
    this.addPolicy({
      action: 'reorder_inventory',
      requiresApproval: (data) => {
        const totalCost = data.totalCost || 0;
        return totalCost > 5000; // Require approval for orders > $5000
      },
      invariantChecks: [
        (data) => ({
          valid: data.productId != null,
          reason: 'Product ID is required',
        }),
        (data) => ({
          valid: data.quantity > 0,
          reason: 'Quantity must be positive',
        }),
        (data) => ({
          valid: data.supplierId != null,
          reason: 'Supplier ID is required',
        }),
      ],
      maxRetries: 1,
    });

    // Pricing update policy
    this.addPolicy({
      action: 'update_pricing',
      requiresApproval: (data) => {
        const priceChange = Math.abs((data.newPrice - data.oldPrice) / data.oldPrice);
        return priceChange > 0.2; // Require approval for >20% price changes
      },
      invariantChecks: [
        (data) => ({
          valid: data.productId != null,
          reason: 'Product ID is required',
        }),
        (data) => ({
          valid: data.newPrice > 0,
          reason: 'New price must be positive',
        }),
      ],
      maxRetries: 1,
    });

    // Block customer policy
    this.addPolicy({
      action: 'block_customer',
      requiresApproval: (data) => true, // Always require approval
      invariantChecks: [
        (data) => ({
          valid: data.customerId != null,
          reason: 'Customer ID is required',
        }),
        (data) => ({
          valid: data.reason != null && data.reason.length > 10,
          reason: 'Block reason must be provided (min 10 characters)',
        }),
      ],
      maxRetries: 1,
    });
  }

  /**
   * Add a policy rule
   */
  addPolicy(policy: PolicyRule) {
    this.policies.set(policy.action, policy);
    console.log(`[Agent] Added policy for action: ${policy.action}`);
  }

  /**
   * Create a new agent task
   */
  async createTask(
    action: AgentAction,
    data: Record<string, any>,
    priority: TaskPriority = 'medium'
  ): Promise<string> {
    if (this.killSwitchActive) {
      throw new Error(`Kill switch is active: ${this.killSwitchReason}`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const policy = this.policies.get(action);

    if (!policy) {
      throw new Error(`No policy defined for action: ${action}`);
    }

    // Run invariant checks
    for (const check of policy.invariantChecks) {
      const result = check(data);
      if (!result.valid) {
        throw new Error(`Policy violation: ${result.reason}`);
      }
    }

    // Check if approval is required
    const requiresApproval = policy.requiresApproval(data);

    const task: AgentTask = {
      id: taskId,
      action,
      priority,
      status: requiresApproval ? 'pending' : 'approved',
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresApproval,
    };

    this.tasks.set(taskId, task);
    this.taskQueue.push(task);

    // Sort queue by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    console.log(`[Agent] Created task ${taskId}: ${action} (priority: ${priority}, approval: ${requiresApproval})`);

    // If requires approval, create approval request
    if (requiresApproval) {
      await this.createApprovalRequest(task);
    }

    return taskId;
  }

  /**
   * Create an approval request
   */
  private async createApprovalRequest(task: AgentTask) {
    const request: ApprovalRequest = {
      taskId: task.id,
      action: task.action,
      data: task.data,
      reason: `High-risk action requires approval: ${task.action}`,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    this.approvalRequests.set(task.id, request);

    // Send notification to founder
    const message = `
      Action: ${task.action}
      Priority: ${task.priority}
      Data: ${JSON.stringify(task.data, null, 2)}
      
      Please review and approve/reject this action in the admin dashboard.
      Task ID: ${task.id}
    `;

    await sendAlertEmail('Approval Required for Autonomous Action', message, 'warning');
    console.log(`[Agent] Approval request created for task ${task.id}`);
  }

  /**
   * Approve a task
   */
  async approveTask(taskId: string, approvedBy: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'pending') {
      throw new Error(`Task ${taskId} is not pending approval (status: ${task.status})`);
    }

    task.status = 'approved';
    task.approvedBy = approvedBy;
    task.approvedAt = new Date();
    task.updatedAt = new Date();

    this.approvalRequests.delete(taskId);

    console.log(`[Agent] Task ${taskId} approved by ${approvedBy}`);
    return true;
  }

  /**
   * Reject a task
   */
  async rejectTask(taskId: string, reason: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = 'rejected';
    task.error = reason;
    task.updatedAt = new Date();

    this.approvalRequests.delete(taskId);

    // Remove from queue
    this.taskQueue = this.taskQueue.filter((t) => t.id !== taskId);

    console.log(`[Agent] Task ${taskId} rejected: ${reason}`);
    return true;
  }

  /**
   * Execute a task
   */
  private async executeTask(task: AgentTask): Promise<void> {
    if (this.killSwitchActive) {
      throw new Error(`Kill switch is active: ${this.killSwitchReason}`);
    }

    task.status = 'executing';
    task.executedAt = new Date();
    task.updatedAt = new Date();

    console.log(`[Agent] Executing task ${task.id}: ${task.action}`);

    try {
      // This is where you would integrate with actual business logic
      // For now, we'll simulate execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      task.status = 'completed';
      task.completedAt = new Date();
      task.updatedAt = new Date();

      // Record metric
      recordMetric('order_count', 1, { action: task.action });

      console.log(`[Agent] Task ${task.id} completed successfully`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();

      console.error(`[Agent] Task ${task.id} failed:`, error);

      // Send alert on failure
      await sendAlertEmail(
        `Task Execution Failed: ${task.action}`,
        `Task ID: ${task.id}\nAction: ${task.action}\nError: ${task.error}`,
        'warning'
      );
    }
  }

  /**
   * Start the task processor
   */
  private startTaskProcessor() {
    setInterval(async () => {
      if (this.processing || this.killSwitchActive) return;

      this.processing = true;

      try {
        // Process approved tasks
        const approvedTasks = this.taskQueue.filter((t) => t.status === 'approved');

        for (const task of approvedTasks.slice(0, 5)) {
          // Process up to 5 tasks at a time
          await this.executeTask(task);
          this.taskQueue = this.taskQueue.filter((t) => t.id !== task.id);
        }
      } catch (error) {
        console.error('[Agent] Task processor error:', error);
      } finally {
        this.processing = false;
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Activate kill switch
   */
  async activateKillSwitch(reason: string) {
    this.killSwitchActive = true;
    this.killSwitchReason = reason;

    console.log(`[Agent] 🛑 KILL SWITCH ACTIVATED: ${reason}`);

    await sendAlertEmail(
      '🛑 KILL SWITCH ACTIVATED',
      `All autonomous operations have been halted.\n\nReason: ${reason}\n\nTime: ${new Date().toLocaleString()}`,
      'critical'
    );

    // Record metric
    recordMetric('error_rate', 100, { reason: 'kill_switch_activated' });
  }

  /**
   * Deactivate kill switch
   */
  async deactivateKillSwitch() {
    this.killSwitchActive = false;
    this.killSwitchReason = '';

    console.log('[Agent] ✅ Kill switch deactivated');

    await sendAlertEmail(
      '✅ Kill Switch Deactivated',
      `Autonomous operations have been resumed.\n\nTime: ${new Date().toLocaleString()}`,
      'info'
    );
  }

  /**
   * Get kill switch status
   */
  getKillSwitchStatus() {
    return {
      active: this.killSwitchActive,
      reason: this.killSwitchReason,
    };
  }

  /**
   * Get pending approval requests
   */
  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getTasks(status?: TaskStatus, limit: number = 100): AgentTask[] {
    let tasks = Array.from(this.tasks.values());
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    return tasks.slice(-limit).reverse();
  }

  /**
   * Get daily payout total
   */
  private getDailyPayoutTotal(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payoutTasks = Array.from(this.tasks.values()).filter(
      (t) =>
        t.action === 'process_payout' &&
        t.status === 'completed' &&
        t.completedAt &&
        t.completedAt >= today
    );

    return payoutTasks.reduce((sum, t) => sum + (t.data.amount || 0), 0);
  }

  /**
   * Get orchestrator statistics
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      pendingApprovals: this.approvalRequests.size,
      queuedTasks: this.taskQueue.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      failedTasks: tasks.filter((t) => t.status === 'failed').length,
      killSwitchActive: this.killSwitchActive,
      dailyPayoutTotal: this.getDailyPayoutTotal(),
    };
  }
}

// Singleton instance
let orchestrator: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
  }
  return orchestrator;
}

// Convenience functions
export async function createAgentTask(
  action: AgentAction,
  data: Record<string, any>,
  priority: TaskPriority = 'medium'
): Promise<string> {
  return getOrchestrator().createTask(action, data, priority);
}

export function getAgentStats() {
  return getOrchestrator().getStats();
}
