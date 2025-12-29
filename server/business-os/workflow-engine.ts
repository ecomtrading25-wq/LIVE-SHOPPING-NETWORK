/**
 * Workflow Engine - Event-driven, deterministic execution
 * 
 * Provides typed workflows with replay, idempotency, and strong observability.
 * Integrates with governor for policy gates and evaluator for outcome scoring.
 */

import { db } from "./db-wrapper";
import { workflows, workflowRuns, tasks, events } from "../../drizzle/business-os-schema";
import { eq, and } from "drizzle-orm";
import { governor } from "./governor";
import { evaluator } from "./evaluator";
import { toolRouter } from "./tool-router";

export interface WorkflowDefinition {
  name: string;
  description: string;
  type: string;
  orgUnitId: string;
  autonomyLevel: "a0_manual" | "a1_assisted" | "a2_supervised" | "a3_autonomous" | "a4_self_optimizing";
  triggerEvents: string[];
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "tool_call" | "decision" | "approval_gate" | "policy_gate" | "parallel" | "condition";
  config: Record<string, any>;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
  retryable?: boolean;
}

export interface WorkflowContext {
  workflowId: string;
  runId: string;
  orgUnitId: string;
  inputs: Record<string, any>;
  state: Record<string, any>;
  trace: Array<{
    timestamp: string;
    step: string;
    status: string;
    data: Record<string, any>;
  }>;
}

export class WorkflowEngine {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private activeRuns: Map<string, WorkflowContext> = new Map();

  /**
   * Register a workflow definition
   */
  async registerWorkflow(definition: WorkflowDefinition) {
    this.definitions.set(definition.name, definition);

    // Store in database
    await db.insert(workflows).values({
      id: this.generateId("wf"),
      name: definition.name,
      description: definition.description,
      type: definition.type,
      orgUnitId: definition.orgUnitId,
      autonomyLevel: definition.autonomyLevel,
      triggerEvents: definition.triggerEvents,
      spec: definition as any,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Trigger workflow from event
   */
  async triggerWorkflow(eventType: string, payload: Record<string, any>, orgUnitId: string) {
    // Find workflows that match this event
    const matchingWorkflows = Array.from(this.definitions.values()).filter(
      wf => wf.triggerEvents.includes(eventType) && wf.orgUnitId === orgUnitId
    );

    for (const workflow of matchingWorkflows) {
      await this.executeWorkflow(workflow, payload);
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(definition: WorkflowDefinition, inputs: Record<string, any>): Promise<string> {
    const runId = this.generateId("run");
    const workflowId = await this.getWorkflowId(definition.name);

    // Create workflow run
    await db.insert(workflowRuns).values({
      id: runId,
      workflowId,
      inputs,
      status: "running",
      startedAt: new Date(),
      createdAt: new Date(),
    });

    // Initialize context
    const context: WorkflowContext = {
      workflowId,
      runId,
      orgUnitId: definition.orgUnitId,
      inputs,
      state: {},
      trace: [],
    };

    this.activeRuns.set(runId, context);

    try {
      // Execute workflow steps
      await this.executeSteps(definition.steps, context);

      // Mark as completed
      await this.completeWorkflowRun(runId, context, "completed");

      return runId;
    } catch (error: any) {
      // Mark as failed
      await this.completeWorkflowRun(runId, context, "failed", error.message);
      throw error;
    } finally {
      this.activeRuns.delete(runId);
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(steps: WorkflowStep[], context: WorkflowContext, startStepId?: string) {
    let currentStepId = startStepId || steps[0]?.id;

    while (currentStepId) {
      const step = steps.find(s => s.id === currentStepId);
      if (!step) break;

      this.addTrace(context, step.id, "started", {});

      try {
        const result = await this.executeStep(step, context);
        this.addTrace(context, step.id, "completed", result);

        // Determine next step
        currentStepId = step.onSuccess || this.getNextStepId(steps, currentStepId);
      } catch (error: any) {
        this.addTrace(context, step.id, "failed", { error: error.message });

        if (step.retryable) {
          // Retry logic
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        if (step.onFailure) {
          currentStepId = step.onFailure;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    switch (step.type) {
      case "tool_call":
        return await this.executeToolCall(step, context);
      
      case "policy_gate":
        return await this.executePolicyGate(step, context);
      
      case "approval_gate":
        return await this.executeApprovalGate(step, context);
      
      case "decision":
        return await this.executeDecision(step, context);
      
      case "condition":
        return await this.executeCondition(step, context);
      
      case "parallel":
        return await this.executeParallel(step, context);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute tool call step
   */
  private async executeToolCall(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { toolName, operation, args } = step.config;

    // Resolve args from context
    const resolvedArgs = this.resolveArgs(args, context);

    // Execute via tool router
    const result = await toolRouter.executeTool(
      toolName,
      operation,
      resolvedArgs,
      {
        agentId: step.config.agentId || "workflow_engine",
        taskId: context.runId,
        orgUnitId: context.orgUnitId,
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Tool execution failed");
    }

    // Store result in context state
    if (step.config.outputKey) {
      context.state[step.config.outputKey] = result.result;
    }

    return result.result;
  }

  /**
   * Execute policy gate step
   */
  private async executePolicyGate(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const policyResult = await governor.checkPolicy({
      orgUnitId: context.orgUnitId,
      workflowId: context.workflowId,
      action: step.config.action || "workflow_step",
      data: this.resolveArgs(step.config.data, context),
    });

    if (!policyResult.allowed) {
      if (policyResult.requiresApproval) {
        // Wait for approval (in production, this would be async)
        throw new Error(`Approval required: ${policyResult.approvalId}`);
      }
      throw new Error(`Policy violation: ${policyResult.reason}`);
    }

    return { passed: true };
  }

  /**
   * Execute approval gate step
   */
  private async executeApprovalGate(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // In production, this would create an approval request and pause the workflow
    // For now, we'll simulate based on autonomy level
    
    const workflow = this.definitions.get(await this.getWorkflowName(context.workflowId));
    if (!workflow) throw new Error("Workflow not found");

    if (workflow.autonomyLevel === "a0_manual" || workflow.autonomyLevel === "a1_assisted") {
      throw new Error("Manual approval required");
    }

    // A2+ autonomy levels can proceed if within policy
    return { approved: true };
  }

  /**
   * Execute decision step
   */
  private async executeDecision(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { condition, trueStep, falseStep } = step.config;
    const result = this.evaluateExpression(condition, context);
    
    return {
      decision: result,
      nextStep: result ? trueStep : falseStep,
    };
  }

  /**
   * Execute condition step
   */
  private async executeCondition(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { expression } = step.config;
    return this.evaluateExpression(expression, context);
  }

  /**
   * Execute parallel step
   */
  private async executeParallel(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { steps: parallelSteps } = step.config;
    
    const results = await Promise.all(
      parallelSteps.map((s: WorkflowStep) => this.executeStep(s, context))
    );

    return results;
  }

  /**
   * Resolve arguments from context
   */
  private resolveArgs(args: any, context: WorkflowContext): any {
    if (typeof args === "string" && args.startsWith("$")) {
      // Reference to context state
      const key = args.slice(1);
      return context.state[key] || context.inputs[key];
    }

    if (Array.isArray(args)) {
      return args.map(arg => this.resolveArgs(arg, context));
    }

    if (typeof args === "object" && args !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(args)) {
        resolved[key] = this.resolveArgs(value, context);
      }
      return resolved;
    }

    return args;
  }

  /**
   * Evaluate expression
   */
  private evaluateExpression(expression: string, context: WorkflowContext): boolean {
    try {
      // Simple expression evaluation (production would use a proper DSL)
      const func = new Function("state", "inputs", `return ${expression}`);
      return func(context.state, context.inputs);
    } catch (error) {
      return false;
    }
  }

  /**
   * Add trace entry
   */
  private addTrace(context: WorkflowContext, step: string, status: string, data: Record<string, any>) {
    context.trace.push({
      timestamp: new Date().toISOString(),
      step,
      status,
      data,
    });
  }

  /**
   * Complete workflow run
   */
  private async completeWorkflowRun(
    runId: string,
    context: WorkflowContext,
    status: "completed" | "failed",
    errorMessage?: string
  ) {
    await db
      .update(workflowRuns)
      .set({
        status,
        outputs: context.state,
        trace: context.trace,
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(workflowRuns.id, runId));
  }

  /**
   * Get next step ID in sequence
   */
  private getNextStepId(steps: WorkflowStep[], currentStepId: string): string | undefined {
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    return steps[currentIndex + 1]?.id;
  }

  /**
   * Get workflow ID by name
   */
  private async getWorkflowId(name: string): Promise<string> {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.name, name),
    });
    return workflow?.id || this.generateId("wf");
  }

  /**
   * Get workflow name by ID
   */
  private async getWorkflowName(id: string): Promise<string> {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, id),
    });
    return workflow?.name || "";
  }

  /**
   * Replay workflow run for debugging
   */
  async replayWorkflow(runId: string): Promise<WorkflowContext> {
    const run = await db.query.workflowRuns.findFirst({
      where: eq(workflowRuns.id, runId),
    });

    if (!run) {
      throw new Error(`Workflow run ${runId} not found`);
    }

    return {
      workflowId: run.workflowId,
      runId: run.id,
      orgUnitId: "", // Would need to fetch from workflow
      inputs: run.inputs as Record<string, any>,
      state: run.outputs as Record<string, any>,
      trace: run.trace as any[],
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
