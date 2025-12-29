/**
 * Tool Router - Permission-based tool execution with precondition checks
 * 
 * Ensures agents can only execute tools they have permission for,
 * validates preconditions, and provides structured logging.
 */

import { db } from "./db-wrapper";
import { agents, actions, auditLog } from "../../drizzle/business-os-schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface ToolDefinition {
  name: string;
  description: string;
  requiredPermissions: string[];
  preconditions?: (args: any, context: ToolContext) => Promise<boolean | string>;
  execute: (args: any, context: ToolContext) => Promise<any>;
  retryable?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface ToolContext {
  agentId: string;
  taskId: string;
  orgUnitId: string;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  actionId: string;
  latencyMs: number;
  costUsd?: number;
}

export class ToolRouter {
  private tools: Map<string, ToolDefinition> = new Map();
  private actionCache: Map<string, any> = new Map();

  /**
   * Register a tool with the router
   */
  registerTool(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute a tool with full permission and precondition checks
   */
  async executeTool(
    toolName: string,
    operation: string,
    args: Record<string, any>,
    context: ToolContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const actionId = this.generateActionId();

    try {
      // 1. Get tool definition
      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found`);
      }

      // 2. Check agent permissions
      const hasPermission = await this.checkPermissions(context.agentId, tool.requiredPermissions);
      if (!hasPermission) {
        throw new Error(`Agent ${context.agentId} lacks permission for tool '${toolName}'`);
      }

      // 3. Validate preconditions
      if (tool.preconditions) {
        const preconditionResult = await tool.preconditions(args, context);
        if (preconditionResult !== true) {
          throw new Error(
            typeof preconditionResult === "string"
              ? preconditionResult
              : "Precondition check failed"
          );
        }
      }

      // 4. Log action start
      await this.logActionStart(actionId, context.taskId, context.agentId, toolName, operation, args);

      // 5. Execute tool with timeout
      const timeoutMs = tool.timeoutMs || 30000;
      const result = await this.executeWithTimeout(
        () => tool.execute(args, context),
        timeoutMs
      );

      // 6. Log action completion
      const latencyMs = Date.now() - startTime;
      await this.logActionComplete(actionId, result, latencyMs);

      // 7. Create audit trail
      await this.createAuditEntry(
        "action",
        actionId,
        "execute",
        context.agentId,
        { tool: toolName, operation, args, result }
      );

      return {
        success: true,
        result,
        actionId,
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      await this.logActionFailed(actionId, error.message, latencyMs);

      // Check if retryable
      const tool = this.tools.get(toolName);
      if (tool?.retryable) {
        const retryCount = await this.getRetryCount(actionId);
        const maxRetries = tool.maxRetries || 3;
        
        if (retryCount < maxRetries) {
          // Retry with exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          return this.executeTool(toolName, operation, args, context);
        }
      }

      return {
        success: false,
        error: error.message,
        actionId,
        latencyMs,
      };
    }
  }

  /**
   * Check if agent has required permissions
   */
  private async checkPermissions(agentId: string, requiredPermissions: string[]): Promise<boolean> {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });

    if (!agent || agent.status !== "active") {
      return false;
    }

    const agentPermissions = agent.toolPermissions || [];
    return requiredPermissions.every(perm => agentPermissions.includes(perm));
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Tool execution timeout")), timeoutMs)
      ),
    ]);
  }

  /**
   * Log action start
   */
  private async logActionStart(
    actionId: string,
    taskId: string,
    agentId: string,
    toolName: string,
    operation: string,
    args: Record<string, any>
  ) {
    await db.insert(actions).values({
      id: actionId,
      taskId,
      agentId,
      toolName,
      operation,
      arguments: args,
      status: "running",
      startedAt: new Date(),
      createdAt: new Date(),
    });
  }

  /**
   * Log action completion
   */
  private async logActionComplete(actionId: string, result: any, latencyMs: number) {
    await db
      .update(actions)
      .set({
        status: "completed",
        result,
        latencyMs,
        completedAt: new Date(),
      })
      .where(eq(actions.id, actionId));
  }

  /**
   * Log action failure
   */
  private async logActionFailed(actionId: string, errorMessage: string, latencyMs: number) {
    await db
      .update(actions)
      .set({
        status: "failed",
        errorMessage,
        latencyMs,
        completedAt: new Date(),
      })
      .where(eq(actions.id, actionId));
  }

  /**
   * Get retry count for action
   */
  private async getRetryCount(actionId: string): Promise<number> {
    const action = await db.query.actions.findFirst({
      where: eq(actions.id, actionId),
    });
    return action?.retryCount || 0;
  }

  /**
   * Create audit trail entry
   */
  private async createAuditEntry(
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    changes: Record<string, any>
  ) {
    const timestamp = new Date();
    const previousHash = await this.getLatestHash();
    const currentHash = this.generateHash(entityType, entityId, action, timestamp, previousHash);

    await db.insert(auditLog).values({
      id: this.generateId(),
      entityType,
      entityId,
      action,
      actorType: "agent",
      actorId,
      changes,
      previousHash,
      currentHash,
      timestamp,
      createdAt: timestamp,
    });
  }

  /**
   * Get latest audit hash for chain verification
   */
  private async getLatestHash(): Promise<string | null> {
    const latest = await db.query.auditLog.findFirst({
      orderBy: (auditLog, { desc }) => [desc(auditLog.timestamp)],
    });
    return latest?.currentHash || null;
  }

  /**
   * Generate tamper-evident hash
   */
  private generateHash(...parts: any[]): string {
    const data = parts.map(p => JSON.stringify(p)).join("|");
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate unique IDs
   */
  private generateActionId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const toolRouter = new ToolRouter();
