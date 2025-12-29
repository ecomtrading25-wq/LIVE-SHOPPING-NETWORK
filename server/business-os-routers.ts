/**
 * Business OS tRPC Routers
 * 
 * API endpoints for the Ops Console and autonomous operations
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./business-os/db-wrapper";
import {
  workflows,
  workflowRuns,
  approvals,
  incidents,
  decisions,
  stateSnapshots,
  tasks,
  agents,
  goals,
  experiments,
  banditArms,
} from "../drizzle/business-os-schema";
import { eq, desc, and } from "drizzle-orm";
import { workflowEngine } from "./business-os/workflow-engine";
import { decisionEngine } from "./business-os/decision-engine";
import { digitalTwin } from "./business-os/digital-twin";
import { governor } from "./business-os/governor";
import { evaluator } from "./business-os/evaluator";

export const businessOSRouter = router({
  // ============================================================================
  // Dashboard & Metrics
  // ============================================================================

  getDashboard: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
    }))
    .query(async ({ input }) => {
      // Get latest state snapshot
      const latestState = await (await getDb()).query.stateSnapshots.findFirst({
        where: eq(stateSnapshots.orgUnitId, input.orgUnitId),
        orderBy: [desc(stateSnapshots.timestamp)],
      });

      // Get active workflows count
      const activeWorkflows = await (await getDb()).query.workflows.findMany({
        where: and(
          eq(workflows.orgUnitId, input.orgUnitId),
          eq(workflows.status, "active")
        ),
      });

      // Get pending approvals count
      const pendingApprovals = await (await getDb()).query.approvals.findMany({
        where: eq(approvals.status, "pending"),
      });

      // Get open incidents
      const openIncidents = await (await getDb()).query.incidents.findMany({
        where: and(
          eq(incidents.orgUnitId, input.orgUnitId),
          eq(incidents.status, "open")
        ),
      });

      // Get recent decisions
      const recentDecisions = await (await getDb()).query.decisions.findMany({
        where: eq(decisions.orgUnitId, input.orgUnitId),
        orderBy: [desc(decisions.createdAt)],
        limit: 10,
      });

      return {
        metrics: latestState?.metrics || {},
        activeWorkflowsCount: activeWorkflows.length,
        pendingApprovalsCount: pendingApprovals.length,
        openIncidentsCount: openIncidents.length,
        recentDecisions,
      };
    }),

  // ============================================================================
  // Workflows
  // ============================================================================

  listWorkflows: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      status: z.enum(["active", "paused", "disabled"]).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(workflows.orgUnitId, input.orgUnitId)];
      if (input.status) {
        conditions.push(eq(workflows.status, input.status));
      }

      return await (await getDb()).query.workflows.findMany({
        where: and(...conditions),
        orderBy: [desc(workflows.createdAt)],
      });
    }),

  getWorkflowRuns: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return await (await getDb()).query.workflowRuns.findMany({
        where: eq(workflowRuns.workflowId, input.workflowId),
        orderBy: [desc(workflowRuns.startedAt)],
        limit: input.limit,
      });
    }),

  replayWorkflow: protectedProcedure
    .input(z.object({
      runId: z.string(),
    }))
    .query(async ({ input }) => {
      return await workflowEngine.replayWorkflow(input.runId);
    }),

  updateWorkflowAutonomy: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      autonomyLevel: z.enum(["a0_manual", "a1_assisted", "a2_supervised", "a3_autonomous", "a4_self_optimizing"]),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(workflows)
        .set({
          autonomyLevel: input.autonomyLevel,
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, input.workflowId));

      return { success: true };
    }),

  // ============================================================================
  // Approvals
  // ============================================================================

  listApprovals: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [];
      if (input.status) {
        conditions.push(eq(approvals.status, input.status));
      }

      return await (await getDb()).query.approvals.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(approvals.createdAt)],
        limit: input.limit,
      });
    }),

  approveAction: protectedProcedure
    .input(z.object({
      approvalId: z.string(),
      approved: z.boolean(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(approvals)
        .set({
          status: input.approved ? "approved" : "rejected",
          approvedBy: ctx.user.openId,
          approvedAt: new Date(),
          reason: input.reason,
        })
        .where(eq(approvals.id, input.approvalId));

      return { success: true };
    }),

  // ============================================================================
  // Incidents
  // ============================================================================

  listIncidents: protectedProcedure
    .input(z.object({
      orgUnitId: z.string().optional(),
      status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [];
      if (input.orgUnitId) conditions.push(eq(incidents.orgUnitId, input.orgUnitId));
      if (input.status) conditions.push(eq(incidents.status, input.status));
      if (input.severity) conditions.push(eq(incidents.severity, input.severity));

      return await (await getDb()).query.incidents.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(incidents.createdAt)],
        limit: input.limit,
      });
    }),

  updateIncident: protectedProcedure
    .input(z.object({
      incidentId: z.string(),
      status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
      assignedTo: z.string().optional(),
      rootCause: z.string().optional(),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates: any = {
        updatedAt: new Date(),
      };

      if (input.status) updates.status = input.status;
      if (input.assignedTo) updates.assignedTo = input.assignedTo;
      if (input.rootCause) updates.rootCause = input.rootCause;
      if (input.resolution) {
        updates.resolution = input.resolution;
        updates.resolvedAt = new Date();
      }

      await db
        .update(incidents)
        .set(updates)
        .where(eq(incidents.id, input.incidentId));

      return { success: true };
    }),

  // ============================================================================
  // Decisions
  // ============================================================================

  listDecisions: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      type: z.string().optional(),
      status: z.enum(["proposed", "approved", "executed", "rejected", "rolled_back"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(decisions.orgUnitId, input.orgUnitId)];
      if (input.type) conditions.push(eq(decisions.type, input.type));
      if (input.status) conditions.push(eq(decisions.status, input.status));

      return await (await getDb()).query.decisions.findMany({
        where: and(...conditions),
        orderBy: [desc(decisions.createdAt)],
        limit: input.limit,
      });
    }),

  makeDecision: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      decisionType: z.string(),
      context: z.record(z.number()),
    }))
    .mutation(async ({ input }) => {
      const result = await decisionEngine.makeDecision(input.decisionType, {
        orgUnitId: input.orgUnitId,
        currentState: input.context,
        constraints: {},
      });

      return result;
    }),

  recordDecisionOutcome: protectedProcedure
    .input(z.object({
      decisionId: z.string(),
      actualImpact: z.record(z.number()),
      reward: z.number(),
    }))
    .mutation(async ({ input }) => {
      await decisionEngine.recordOutcome(
        input.decisionId,
        input.actualImpact,
        input.reward
      );

      return { success: true };
    }),

  // ============================================================================
  // Simulations
  // ============================================================================

  runSimulation: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      scenario: z.object({
        changes: z.record(z.number()),
        duration: z.number(),
        description: z.string(),
      }),
      modelTypes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const prediction = await digitalTwin.simulate(
        input.orgUnitId,
        input.scenario,
        input.modelTypes
      );

      return prediction;
    }),

  // ============================================================================
  // Agents & Goals
  // ============================================================================

  listAgents: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
    }))
    .query(async ({ input }) => {
      return await (await getDb()).query.agents.findMany({
        where: eq(agents.orgUnitId, input.orgUnitId),
      });
    }),

  listGoals: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(goals.orgUnitId, input.orgUnitId)];
      if (input.status) conditions.push(eq(goals.status, input.status));

      return await (await getDb()).query.goals.findMany({
        where: and(...conditions),
        orderBy: [desc(goals.createdAt)],
      });
    }),

  createGoal: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["okr", "constraint", "target"]),
      priority: z.number().default(5),
      targetValue: z.string().optional(),
      deadline: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await (await getDb()).insert(goals).values({
        id: goalId,
        orgUnitId: input.orgUnitId,
        title: input.title,
        description: input.description || null,
        type: input.type,
        priority: input.priority,
        targetValue: input.targetValue || null,
        deadline: input.deadline || null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { goalId };
    }),

  // ============================================================================
  // Experiments & Bandits
  // ============================================================================

  listExperiments: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      status: z.enum(["draft", "running", "paused", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(experiments.orgUnitId, input.orgUnitId)];
      if (input.status) conditions.push(eq(experiments.status, input.status));

      return await (await getDb()).query.experiments.findMany({
        where: and(...conditions),
        orderBy: [desc(experiments.createdAt)],
      });
    }),

  getExperimentArms: protectedProcedure
    .input(z.object({
      experimentId: z.string(),
    }))
    .query(async ({ input }) => {
      return await (await getDb()).query.banditArms.findMany({
        where: eq(banditArms.experimentId, input.experimentId),
        orderBy: [desc(banditArms.avgReward)],
      });
    }),

  // ============================================================================
  // State Snapshots
  // ============================================================================

  getStateHistory: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      limit: z.number().default(168), // 1 week of hourly snapshots
    }))
    .query(async ({ input }) => {
      return await (await getDb()).query.stateSnapshots.findMany({
        where: eq(stateSnapshots.orgUnitId, input.orgUnitId),
        orderBy: [desc(stateSnapshots.timestamp)],
        limit: input.limit,
      });
    }),

  // ============================================================================
  // Kill Switch
  // ============================================================================

  killSwitch: protectedProcedure
    .input(z.object({
      orgUnitId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Pause all workflows
      await db
        .update(workflows)
        .set({
          status: "paused",
          updatedAt: new Date(),
        })
        .where(eq(workflows.orgUnitId, input.orgUnitId));

      // Create critical incident
      await (await getDb()).insert(incidents).values({
        id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: "critical",
        type: "kill_switch_activated",
        title: "Kill Switch Activated",
        description: input.reason,
        orgUnitId: input.orgUnitId,
        status: "open",
        detectedBy: ctx.user.openId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, message: "All autonomous operations paused" };
    }),
});
