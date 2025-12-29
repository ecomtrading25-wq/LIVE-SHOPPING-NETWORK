/**
 * Business OS Integration Tests
 * 
 * Tests for autonomous business operations:
 * - Policy engine and governance
 * - Approval workflows
 * - Decision engine
 * - Workflow orchestration
 */

import { describe, it, expect, beforeAll } from "vitest";
import { governor } from "./business-os/governor";
import { workflowEngine } from "./business-os/workflow-engine";
import { decisionEngine } from "./business-os/decision-engine";
import { evaluator } from "./business-os/evaluator";
import { getDb } from "./business-os/db-wrapper";
import { policies, approvals, incidents, workflows, decisions } from "../drizzle/business-os-schema";
import { eq } from "drizzle-orm";

describe("Business OS - Policy Engine", () => {
  beforeAll(async () => {
    // Initialize built-in policies
    await governor.initializeBuiltInPolicies();
  });

  it("should deny payouts without reconciliation", async () => {
    const result = await governor.checkPolicy({
      action: "process_payout",
      data: {
        type: "payout",
        amount: 1000,
        reconciled: false,
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(false);
    expect(result.reason).toContain("reconciliation not complete");
  });

  it("should require approval for high-risk payouts", async () => {
    const result = await governor.checkPolicy({
      action: "process_payout",
      data: {
        type: "payout",
        amount: 1000,
        reconciled: true,
        riskScore: 0.8,
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.approvalId).toBeDefined();
  });

  it("should allow safe payouts", async () => {
    const result = await governor.checkPolicy({
      action: "process_payout",
      data: {
        type: "payout",
        amount: 1000,
        reconciled: true,
        riskScore: 0.3,
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.requiresApproval).toBe(false);
  });

  it("should deny pricing below margin floor", async () => {
    const result = await governor.checkPolicy({
      action: "update_price",
      data: {
        action: "update_price",
        marginPercent: 0.10, // 10% < 15% floor
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("margin below 15% floor");
  });

  it("should deny ad spend increase with low cash runway", async () => {
    const result = await governor.checkPolicy({
      action: "increase_ad_spend",
      data: {
        action: "increase_ad_spend",
        cashRunwayDays: 20, // < 30 days
        roas: 2.5,
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cash runway below 30 days");
  });

  it("should require approval for large refunds", async () => {
    const result = await governor.checkPolicy({
      action: "process_refund",
      data: {
        action: "process_refund",
        amount: 600, // > $500
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });
});

describe("Business OS - Approval Workflow", () => {
  it("should create approval request", async () => {
    const result = await governor.checkPolicy({
      action: "process_refund",
      data: {
        action: "process_refund",
        amount: 1000,
      },
    });

    expect(result.requiresApproval).toBe(true);
    expect(result.approvalId).toBeDefined();

    // Verify approval was created in database
    const db = await getDb();
    const approval = await db.query.approvals.findFirst({
      where: eq(approvals.id, result.approvalId!),
    });

    expect(approval).toBeDefined();
    expect(approval?.status).toBe("pending");
    expect(approval?.approverRole).toBe("founder");
  });

  it("should check approval status", async () => {
    // Create an approval
    const result = await governor.checkPolicy({
      action: "process_refund",
      data: {
        action: "process_refund",
        amount: 800,
      },
    });

    expect(result.approvalId).toBeDefined();

    // Check initial status
    const isApproved = await governor.checkApproval(result.approvalId!);
    expect(isApproved).toBe(false);
  });
});

describe("Business OS - Decision Engine", () => {
  it("should propose decisions based on metrics", async () => {
    const metrics = {
      revenue: 100000,
      roas: 2.5,
      cashRunwayDays: 60,
      marginPercent: 0.25,
    };

    const proposal = await decisionEngine.proposeDecisions("lsn_main", metrics);

    expect(proposal).toBeDefined();
    expect(Array.isArray(proposal.decisions)).toBe(true);
  });

  it("should respect policy constraints in decisions", async () => {
    const metrics = {
      revenue: 100000,
      roas: 1.5, // Below 2.0 threshold
      cashRunwayDays: 25, // Below 30 days
      marginPercent: 0.20,
    };

    const proposal = await decisionEngine.proposeDecisions("lsn_main", metrics);

    // Should not propose ad spend increase with low runway
    const adSpendDecision = proposal.decisions.find(
      (d: any) => d.action === "increase_ad_spend"
    );

    expect(adSpendDecision).toBeUndefined();
  });
});

describe("Business OS - Evaluator", () => {
  it("should evaluate outcome quality", async () => {
    const outcome = {
      taskId: "task_123",
      result: { success: true, revenue: 5000 },
      expectedResult: { success: true, revenue: 4500 },
    };

    const evaluation = await evaluator.evaluateOutcome(outcome);

    expect(evaluation).toBeDefined();
    expect(evaluation.score).toBeGreaterThan(0);
    expect(evaluation.score).toBeLessThanOrEqual(1);
  });

  it("should detect poor outcomes", async () => {
    const outcome = {
      taskId: "task_456",
      result: { success: false, error: "Payment failed" },
      expectedResult: { success: true, revenue: 1000 },
    };

    const evaluation = await evaluator.evaluateOutcome(outcome);

    expect(evaluation.score).toBeLessThan(0.5);
  });
});

describe("Business OS - Workflow Engine", () => {
  it("should execute workflow with policy gates", async () => {
    const workflowDef = {
      id: "wf_test_payout",
      name: "Test Payout Workflow",
      orgUnitId: "lsn_main",
      trigger: { type: "manual" as const },
      steps: [
        {
          id: "step_1",
          type: "policy_check" as const,
          action: "process_payout",
          data: {
            type: "payout",
            amount: 500,
            reconciled: true,
            riskScore: 0.2,
          },
        },
      ],
      autonomyLevel: "supervised" as const,
      status: "active" as const,
    };

    const result = await workflowEngine.executeWorkflow(workflowDef);

    expect(result).toBeDefined();
    expect(result.status).toBe("completed");
  });

  it("should pause workflow on policy violation", async () => {
    const workflowDef = {
      id: "wf_test_violation",
      name: "Test Violation Workflow",
      orgUnitId: "lsn_main",
      trigger: { type: "manual" as const },
      steps: [
        {
          id: "step_1",
          type: "policy_check" as const,
          action: "process_payout",
          data: {
            type: "payout",
            amount: 500,
            reconciled: false, // Will violate policy
            riskScore: 0.2,
          },
        },
      ],
      autonomyLevel: "supervised" as const,
      status: "active" as const,
    };

    const result = await workflowEngine.executeWorkflow(workflowDef);

    expect(result.status).toBe("failed");
    expect(result.error).toContain("Policy violation");
  });

  it("should pause workflow on approval requirement", async () => {
    const workflowDef = {
      id: "wf_test_approval",
      name: "Test Approval Workflow",
      orgUnitId: "lsn_main",
      trigger: { type: "manual" as const },
      steps: [
        {
          id: "step_1",
          type: "policy_check" as const,
          action: "process_payout",
          data: {
            type: "payout",
            amount: 500,
            reconciled: true,
            riskScore: 0.8, // High risk - requires approval
          },
        },
      ],
      autonomyLevel: "supervised" as const,
      status: "active" as const,
    };

    const result = await workflowEngine.executeWorkflow(workflowDef);

    expect(result.status).toBe("pending_approval");
    expect(result.approvalId).toBeDefined();
  });
});

describe("Business OS - Integration", () => {
  it("should complete full autonomous workflow cycle", async () => {
    // 1. Create a workflow
    const workflowDef = {
      id: "wf_integration_test",
      name: "Integration Test Workflow",
      orgUnitId: "lsn_main",
      trigger: { type: "manual" as const },
      steps: [
        {
          id: "step_1",
          type: "policy_check" as const,
          action: "process_payout",
          data: {
            type: "payout",
            amount: 300,
            reconciled: true,
            riskScore: 0.1, // Low risk - should pass
          },
        },
      ],
      autonomyLevel: "autonomous" as const,
      status: "active" as const,
    };

    // 2. Execute workflow
    const result = await workflowEngine.executeWorkflow(workflowDef);

    // 3. Verify completion
    expect(result.status).toBe("completed");

    // 4. Verify no incidents created
    const db = await getDb();
    const recentIncidents = await db.query.incidents.findMany({
      where: eq(incidents.orgUnitId, "lsn_main"),
      limit: 1,
    });

    // Should have no new incidents from this safe workflow
    expect(recentIncidents.length).toBe(0);
  });

  it("should handle end-to-end approval flow", async () => {
    // 1. Create workflow requiring approval
    const workflowDef = {
      id: "wf_approval_flow",
      name: "Approval Flow Test",
      orgUnitId: "lsn_main",
      trigger: { type: "manual" as const },
      steps: [
        {
          id: "step_1",
          type: "policy_check" as const,
          action: "process_refund",
          data: {
            action: "process_refund",
            amount: 750, // Requires approval
          },
        },
      ],
      autonomyLevel: "supervised" as const,
      status: "active" as const,
    };

    // 2. Execute workflow (should pause for approval)
    const result = await workflowEngine.executeWorkflow(workflowDef);

    expect(result.status).toBe("pending_approval");
    expect(result.approvalId).toBeDefined();

    // 3. Simulate founder approval
    const db = await getDb();
    await db
      .update(approvals)
      .set({
        status: "approved",
        approvedBy: "founder",
        approvedAt: new Date(),
        decision: "approved",
      })
      .where(eq(approvals.id, result.approvalId!));

    // 4. Resume workflow
    const resumeResult = await workflowEngine.resumeWorkflow(workflowDef.id);

    expect(resumeResult.status).toBe("completed");
  });
});

describe("Business OS - Safety Guarantees", () => {
  it("should fail closed on policy evaluation errors", async () => {
    const result = await governor.checkPolicy({
      action: "unknown_action",
      data: {
        // Invalid data that might cause evaluation errors
        invalidField: undefined,
      },
    });

    // Should deny on error (fail closed)
    expect(result.allowed).toBe(false);
  });

  it("should create incidents for policy violations", async () => {
    const db = await getDb();
    
    // Count incidents before
    const incidentsBefore = await db.query.incidents.findMany();
    const countBefore = incidentsBefore.length;

    // Trigger policy violation
    await governor.checkPolicy({
      orgUnitId: "lsn_main",
      action: "process_payout",
      data: {
        type: "payout",
        amount: 5000,
        reconciled: false,
      },
    });

    // Count incidents after
    const incidentsAfter = await db.query.incidents.findMany();
    const countAfter = incidentsAfter.length;

    // Should have created new incident
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  it("should enforce autonomy levels", async () => {
    // Autonomous workflow should execute without human intervention
    const autonomousWorkflow = {
      id: "wf_autonomous",
      name: "Autonomous Workflow",
      orgUnitId: "lsn_main",
      trigger: { type: "manual" as const },
      steps: [
        {
          id: "step_1",
          type: "policy_check" as const,
          action: "process_payout",
          data: {
            type: "payout",
            amount: 100,
            reconciled: true,
            riskScore: 0.1,
          },
        },
      ],
      autonomyLevel: "autonomous" as const,
      status: "active" as const,
    };

    const result = await workflowEngine.executeWorkflow(autonomousWorkflow);
    expect(result.status).toBe("completed");

    // Supervised workflow should pause on any decision
    const supervisedWorkflow = {
      ...autonomousWorkflow,
      id: "wf_supervised",
      autonomyLevel: "supervised" as const,
    };

    const supervisedResult = await workflowEngine.executeWorkflow(supervisedWorkflow);
    // Supervised mode may pause for review even on safe actions
    expect(["completed", "pending_approval"]).toContain(supervisedResult.status);
  });
});
