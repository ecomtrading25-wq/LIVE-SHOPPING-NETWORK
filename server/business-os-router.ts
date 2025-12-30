import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { db } from "./db";
import { 
  orgUnits, agents, goals, plans, tasks, actions, events,
  stateSnapshots, outcomes, policies, approvals, incidents,
  experiments, banditArms, banditRewards, modelRegistry,
  n8nWorkflows, n8nExecutions, n8nWebhooks
} from "../drizzle/business-os-schema";
import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Business Superintelligence OS Router
 * 
 * Provides APIs for:
 * - Organization & agent management
 * - Goal & plan tracking
 * - Task & workflow execution
 * - Policy enforcement & approvals
 * - Learning & optimization
 * - n8n integration
 */

export const businessOsRouter = router({
  // ============================================================================
  // Organization Units & Agents
  // ============================================================================

  getOrgUnits: protectedProcedure
    .query(async () => {
      return await db.select().from(orgUnits).orderBy(orgUnits.name);
    }),

  createOrgUnit: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["business", "department", "team"]),
      parentId: z.string().optional(),
      settings: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(orgUnits).values({
        id,
        ...input,
      });
      return { id };
    }),

  getAgents: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      status: z.enum(["active", "disabled"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(agents);
      
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(agents.orgUnitId, input.orgUnitId));
      if (input.status) conditions.push(eq(agents.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query;
    }),

  createAgent: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["orchestrator", "cfo", "coo", "cmo", "cto", "legal", "support", "creator_ops", "worker"]),
      capabilities: z.array(z.string()),
      toolPermissions: z.array(z.string()),
      orgUnitId: z.string(),
      config: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(agents).values({
        id,
        ...input,
      });
      return { id };
    }),

  // ============================================================================
  // Goals & Plans
  // ============================================================================

  getGoals: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(goals);
      
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(goals.orgUnitId, input.orgUnitId));
      if (input.status) conditions.push(eq(goals.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(desc(goals.priority));
    }),

  createGoal: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["okr", "constraint", "target"]),
      priority: z.number().default(5),
      targetValue: z.string().optional(),
      unit: z.string().optional(),
      deadline: z.date().optional(),
      parentGoalId: z.string().optional(),
      constraints: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(goals).values({
        id,
        ...input,
        currentValue: "0",
      });
      return { id };
    }),

  updateGoalProgress: protectedProcedure
    .input(z.object({
      goalId: z.string(),
      currentValue: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.update(goals)
        .set({ currentValue: input.currentValue })
        .where(eq(goals.id, input.goalId));
      return { success: true };
    }),

  getPlans: protectedProcedure
    .input(z.object({
      goalId: z.string().optional(),
      status: z.enum(["draft", "approved", "active", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(plans);
      
      const conditions = [];
      if (input.goalId) conditions.push(eq(plans.goalId, input.goalId));
      if (input.status) conditions.push(eq(plans.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(desc(plans.createdAt));
    }),

  createPlan: protectedProcedure
    .input(z.object({
      goalId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      strategy: z.string(),
      steps: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        dependencies: z.array(z.string()),
        estimatedDuration: z.number(),
      })),
      createdBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      
      // Get the next version number for this goal
      const existingPlans = await db.select()
        .from(plans)
        .where(eq(plans.goalId, input.goalId))
        .orderBy(desc(plans.version));
      
      const version = existingPlans.length > 0 ? existingPlans[0].version + 1 : 1;
      
      await db.insert(plans).values({
        id,
        version,
        ...input,
      });
      return { id, version };
    }),

  approvePlan: protectedProcedure
    .input(z.object({
      planId: z.string(),
      approvedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.update(plans)
        .set({ 
          status: "approved",
          approvedBy: input.approvedBy,
          approvedAt: new Date(),
        })
        .where(eq(plans.id, input.planId));
      return { success: true };
    }),

  // ============================================================================
  // Tasks & Actions
  // ============================================================================

  getTasks: protectedProcedure
    .input(z.object({
      planId: z.string().optional(),
      workflowId: z.string().optional(),
      status: z.enum(["pending", "assigned", "in_progress", "blocked", "completed", "failed", "cancelled"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(tasks);
      
      const conditions = [];
      if (input.planId) conditions.push(eq(tasks.planId, input.planId));
      if (input.workflowId) conditions.push(eq(tasks.workflowId, input.workflowId));
      if (input.status) conditions.push(eq(tasks.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query
        .orderBy(desc(tasks.priority), desc(tasks.createdAt))
        .limit(input.limit);
    }),

  createTask: protectedProcedure
    .input(z.object({
      planId: z.string().optional(),
      workflowId: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["manual", "automated", "approval"]),
      priority: z.number().default(5),
      ownerAgentId: z.string().optional(),
      assignedTo: z.string().optional(),
      dependencies: z.array(z.string()).optional(),
      inputs: z.record(z.any()).optional(),
      scheduledFor: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(tasks).values({
        id,
        ...input,
      });
      return { id };
    }),

  updateTaskStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(["pending", "assigned", "in_progress", "blocked", "completed", "failed", "cancelled"]),
      outputs: z.record(z.any()).optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = {
        status: input.status,
      };
      
      if (input.status === "in_progress" && !input.outputs) {
        updateData.startedAt = new Date();
      }
      
      if (input.status === "completed" || input.status === "failed") {
        updateData.completedAt = new Date();
      }
      
      if (input.outputs) {
        updateData.outputs = input.outputs;
      }
      
      if (input.errorMessage) {
        updateData.errorMessage = input.errorMessage;
      }
      
      await db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, input.taskId));
      
      return { success: true };
    }),

  getActions: protectedProcedure
    .input(z.object({
      taskId: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.select()
        .from(actions)
        .where(eq(actions.taskId, input.taskId))
        .orderBy(actions.createdAt);
    }),

  logAction: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      agentId: z.string(),
      toolName: z.string(),
      actionType: z.string(),
      args: z.record(z.any()),
      result: z.record(z.any()).optional(),
      status: z.enum(["success", "failure", "blocked"]),
      latencyMs: z.number().optional(),
      cost: z.string().optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(actions).values({
        id,
        ...input,
        createdAt: new Date(),
      });
      return { id };
    }),

  // ============================================================================
  // Events & State Snapshots
  // ============================================================================

  ingestEvent: publicProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      eventType: z.string(),
      source: z.string(),
      payload: z.record(z.any()),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(events).values({
        id,
        ...input,
      });
      return { id };
    }),

  getEvents: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      eventType: z.string().optional(),
      status: z.enum(["pending", "processing", "processed", "failed"]).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(events);
      
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(events.orgUnitId, input.orgUnitId));
      if (input.eventType) conditions.push(eq(events.eventType, input.eventType));
      if (input.status) conditions.push(eq(events.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query
        .orderBy(desc(events.createdAt))
        .limit(input.limit);
    }),

  createStateSnapshot: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      snapshotType: z.enum(["hourly", "daily", "weekly", "monthly"]),
      metrics: z.record(z.any()),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(stateSnapshots).values({
        id,
        ...input,
        timestamp: new Date(),
      });
      return { id };
    }),

  getStateSnapshots: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      snapshotType: z.enum(["hourly", "daily", "weekly", "monthly"]),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return await db.select()
        .from(stateSnapshots)
        .where(
          and(
            eq(stateSnapshots.orgUnitId, input.orgUnitId),
            eq(stateSnapshots.snapshotType, input.snapshotType),
            gte(stateSnapshots.timestamp, input.startDate),
            lte(stateSnapshots.timestamp, input.endDate)
          )
        )
        .orderBy(stateSnapshots.timestamp);
    }),

  // ============================================================================
  // Policies & Approvals
  // ============================================================================

  getPolicies: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(["active", "disabled", "testing"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(policies);
      
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(policies.orgUnitId, input.orgUnitId));
      if (input.category) conditions.push(eq(policies.category, input.category));
      if (input.status) conditions.push(eq(policies.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(desc(policies.priority));
    }),

  createPolicy: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      category: z.string(),
      priority: z.number().default(0),
      policyDsl: z.object({
        conditions: z.array(z.object({
          field: z.string(),
          operator: z.string(),
          value: z.any(),
        })),
        actions: z.array(z.object({
          type: z.enum(["allow", "block", "require_approval"]),
          message: z.string().optional(),
        })),
      }),
      enforcement: z.enum(["hard", "soft", "advisory"]).default("hard"),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(policies).values({
        id,
        ...input,
      });
      return { id };
    }),

  evaluatePolicy: protectedProcedure
    .input(z.object({
      policyId: z.string(),
      context: z.record(z.any()),
    }))
    .mutation(async ({ input }) => {
      const policy = await db.select()
        .from(policies)
        .where(eq(policies.id, input.policyId))
        .limit(1);
      
      if (policy.length === 0) {
        throw new Error("Policy not found");
      }
      
      const policyData = policy[0];
      const { conditions, actions } = policyData.policyDsl as any;
      
      // Simple policy evaluation logic
      let conditionsMet = true;
      for (const condition of conditions) {
        const value = input.context[condition.field];
        switch (condition.operator) {
          case "eq":
            if (value !== condition.value) conditionsMet = false;
            break;
          case "gt":
            if (!(value > condition.value)) conditionsMet = false;
            break;
          case "lt":
            if (!(value < condition.value)) conditionsMet = false;
            break;
          case "gte":
            if (!(value >= condition.value)) conditionsMet = false;
            break;
          case "lte":
            if (!(value <= condition.value)) conditionsMet = false;
            break;
        }
      }
      
      if (conditionsMet) {
        // Update violation count
        await db.update(policies)
          .set({
            violationCount: sql`${policies.violationCount} + 1`,
            lastViolationAt: new Date(),
          })
          .where(eq(policies.id, input.policyId));
      }
      
      return {
        policyId: input.policyId,
        conditionsMet,
        actions: conditionsMet ? actions : [],
      };
    }),

  getApprovals: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
      approverRole: z.enum(["founder", "admin", "cfo", "coo", "legal"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(approvals);
      
      const conditions = [];
      if (input.status) conditions.push(eq(approvals.status, input.status));
      if (input.approverRole) conditions.push(eq(approvals.approverRole, input.approverRole));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query
        .orderBy(desc(approvals.requestedAt))
        .limit(input.limit);
    }),

  requestApproval: protectedProcedure
    .input(z.object({
      taskId: z.string().optional(),
      actionId: z.string().optional(),
      requestedBy: z.string(),
      approverRole: z.enum(["founder", "admin", "cfo", "coo", "legal"]),
      title: z.string(),
      description: z.string().optional(),
      context: z.record(z.any()),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(approvals).values({
        id,
        ...input,
      });
      return { id };
    }),

  respondToApproval: protectedProcedure
    .input(z.object({
      approvalId: z.string(),
      approvedBy: z.string(),
      status: z.enum(["approved", "rejected"]),
      decision: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(approvals)
        .set({
          status: input.status,
          approvedBy: input.approvedBy,
          decision: input.decision,
          respondedAt: new Date(),
        })
        .where(eq(approvals.id, input.approvalId));
      
      return { success: true };
    }),

  // ============================================================================
  // Incidents & Kill Switch
  // ============================================================================

  getIncidents: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      status: z.enum(["open", "investigating", "mitigating", "resolved", "closed"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(incidents);
      
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(incidents.orgUnitId, input.orgUnitId));
      if (input.severity) conditions.push(eq(incidents.severity, input.severity));
      if (input.status) conditions.push(eq(incidents.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query
        .orderBy(desc(incidents.detectedAt))
        .limit(input.limit);
    }),

  createIncident: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      title: z.string(),
      description: z.string().optional(),
      source: z.string(),
      affectedSystems: z.array(z.string()).optional(),
      killSwitchActivated: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(incidents).values({
        id,
        ...input,
      });
      return { id };
    }),

  updateIncident: protectedProcedure
    .input(z.object({
      incidentId: z.string(),
      status: z.enum(["open", "investigating", "mitigating", "resolved", "closed"]),
      rootCause: z.string().optional(),
      resolution: z.string().optional(),
      actionTaken: z.object({
        timestamp: z.number(),
        action: z.string(),
        result: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = {
        status: input.status,
      };
      
      if (input.rootCause) updateData.rootCause = input.rootCause;
      if (input.resolution) updateData.resolution = input.resolution;
      
      if (input.status === "resolved") {
        updateData.resolvedAt = new Date();
      }
      
      if (input.actionTaken) {
        // Append to actions taken array
        const incident = await db.select()
          .from(incidents)
          .where(eq(incidents.id, input.incidentId))
          .limit(1);
        
        if (incident.length > 0) {
          const existingActions = (incident[0].actionsTaken as any) || [];
          updateData.actionsTaken = [...existingActions, input.actionTaken];
        }
      }
      
      await db.update(incidents)
        .set(updateData)
        .where(eq(incidents.id, input.incidentId));
      
      return { success: true };
    }),

  activateKillSwitch: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      reason: z.string(),
      affectedSystems: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      // Create critical incident
      const incidentId = nanoid();
      await db.insert(incidents).values({
        id: incidentId,
        orgUnitId: input.orgUnitId,
        severity: "critical",
        title: "Kill Switch Activated",
        description: input.reason,
        source: "manual",
        affectedSystems: input.affectedSystems,
        killSwitchActivated: true,
      });
      
      // TODO: Implement actual kill switch logic
      // - Pause all active workflows
      // - Stop all autonomous agents
      // - Notify all stakeholders
      
      return { incidentId };
    }),

  // ============================================================================
  // n8n Workflow Integration
  // ============================================================================

  getN8nWorkflows: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      status: z.enum(["active", "disabled", "testing"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(n8nWorkflows);
      
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(n8nWorkflows.orgUnitId, input.orgUnitId));
      if (input.status) conditions.push(eq(n8nWorkflows.status, input.status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(n8nWorkflows.name);
    }),

  registerN8nWorkflow: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      n8nWorkflowId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
      autonomyLevel: z.enum(["A0", "A1", "A2", "A3", "A4"]).default("A0"),
      triggerType: z.enum(["webhook", "cron", "event", "manual"]),
      config: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      await db.insert(n8nWorkflows).values({
        id,
        ...input,
      });
      return { id };
    }),

  logN8nExecution: publicProcedure
    .input(z.object({
      workflowId: z.string(),
      n8nExecutionId: z.string().optional(),
      taskId: z.string().optional(),
      status: z.enum(["running", "completed", "failed", "cancelled"]),
      input: z.record(z.any()).optional(),
      output: z.record(z.any()).optional(),
      errorMessage: z.string().optional(),
      durationMs: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const completedAt = input.status !== "running" ? new Date() : undefined;
      
      await db.insert(n8nExecutions).values({
        id,
        ...input,
        completedAt,
      });
      
      // Update workflow stats
      if (input.status === "completed") {
        await db.update(n8nWorkflows)
          .set({
            lastExecutedAt: new Date(),
            executionCount: sql`${n8nWorkflows.executionCount} + 1`,
            successCount: sql`${n8nWorkflows.successCount} + 1`,
          })
          .where(eq(n8nWorkflows.id, input.workflowId));
      } else if (input.status === "failed") {
        await db.update(n8nWorkflows)
          .set({
            lastExecutedAt: new Date(),
            executionCount: sql`${n8nWorkflows.executionCount} + 1`,
            failureCount: sql`${n8nWorkflows.failureCount} + 1`,
          })
          .where(eq(n8nWorkflows.id, input.workflowId));
      }
      
      return { id };
    }),

  // ============================================================================
  // Dashboard & Metrics
  // ============================================================================

  getDashboardMetrics: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Get task stats
      const taskStats = await db.select({
        status: tasks.status,
        count: sql<number>`count(*)`,
      })
        .from(tasks)
        .groupBy(tasks.status);
      
      // Get workflow stats
      const workflowStats = await db.select({
        status: n8nWorkflows.status,
        count: sql<number>`count(*)`,
      })
        .from(n8nWorkflows)
        .groupBy(n8nWorkflows.status);
      
      // Get pending approvals count
      const pendingApprovals = await db.select({
        count: sql<number>`count(*)`,
      })
        .from(approvals)
        .where(eq(approvals.status, "pending"));
      
      // Get open incidents count
      const openIncidents = await db.select({
        count: sql<number>`count(*)`,
      })
        .from(incidents)
        .where(eq(incidents.status, "open"));
      
      return {
        tasks: taskStats,
        workflows: workflowStats,
        pendingApprovals: pendingApprovals[0]?.count || 0,
        openIncidents: openIncidents[0]?.count || 0,
      };
    }),
});
