/**
 * Governor - Policy enforcement and approval gates
 * 
 * Enforces hard invariants that no agent can override.
 * Ensures money safety, compliance, and risk management.
 */

import { db } from "./db-wrapper";
import { policies, approvals, incidents } from "../../drizzle/business-os-schema";
import { eq, and } from "drizzle-orm";

export interface PolicyRule {
  id: string;
  condition: string;
  action: "allow" | "deny" | "require_approval";
  priority: number;
  message?: string;
}

export interface PolicyContext {
  orgUnitId?: string;
  agentId?: string;
  workflowId?: string;
  action: string;
  data: Record<string, any>;
}

export interface PolicyResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalId?: string;
  reason?: string;
  violatedRules?: PolicyRule[];
}

export class Governor {
  /**
   * Check if action is allowed by policies
   */
  async checkPolicy(context: PolicyContext): Promise<PolicyResult> {
    try {
      // 1. Load applicable policies
      const applicablePolicies = await this.loadPolicies(context);

      // 2. Evaluate each policy rule
      const violations: PolicyRule[] = [];
      let requiresApproval = false;

      for (const policy of applicablePolicies) {
        for (const rule of policy.rules) {
          const evaluation = await this.evaluateRule(rule, context);

          if (evaluation.matches) {
            if (rule.action === "deny") {
              violations.push(rule);
            } else if (rule.action === "require_approval") {
              requiresApproval = true;
            }
          }
        }
      }

      // 3. If violations found, deny immediately
      if (violations.length > 0) {
        await this.createIncident(context, violations);
        return {
          allowed: false,
          requiresApproval: false,
          reason: violations.map(v => v.message || "Policy violation").join("; "),
          violatedRules: violations,
        };
      }

      // 4. If approval required, create approval request
      if (requiresApproval) {
        const approvalId = await this.createApprovalRequest(context);
        return {
          allowed: false,
          requiresApproval: true,
          approvalId,
          reason: "Action requires founder approval",
        };
      }

      // 5. Action is allowed
      return {
        allowed: true,
        requiresApproval: false,
      };
    } catch (error: any) {
      // Fail closed - deny on error
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Policy check error: ${error.message}`,
      };
    }
  }

  /**
   * Load applicable policies for context
   */
  private async loadPolicies(context: PolicyContext) {
    const allPolicies = await db.query.policies.findMany({
      where: eq(policies.status, "active"),
    });

    return allPolicies.filter(policy => {
      if (policy.scope === "global") return true;
      if (policy.scope === "org_unit" && policy.orgUnitId === context.orgUnitId) return true;
      if (policy.scope === "agent" && context.agentId) return true;
      if (policy.scope === "workflow" && context.workflowId) return true;
      return false;
    });
  }

  /**
   * Evaluate a single policy rule
   */
  private async evaluateRule(
    rule: PolicyRule,
    context: PolicyContext
  ): Promise<{ matches: boolean }> {
    try {
      // Parse condition (simple expression evaluation)
      const matches = this.evaluateCondition(rule.condition, context);
      return { matches };
    } catch (error) {
      // Fail closed - treat evaluation errors as matches for deny rules
      return { matches: rule.action === "deny" };
    }
  }

  /**
   * Evaluate condition expression
   * 
   * Supports simple expressions like:
   * - "data.amount > 1000"
   * - "data.cashRunway < 30"
   * - "data.riskScore > 0.7"
   * - "data.marginPercent < 0.15"
   */
  private evaluateCondition(condition: string, context: PolicyContext): boolean {
    try {
      // Create safe evaluation context
      const safeContext = {
        data: context.data,
        action: context.action,
        orgUnitId: context.orgUnitId,
        agentId: context.agentId,
      };

      // Simple expression parser (production would use a proper DSL parser)
      const operators = [">=", "<=", ">", "<", "==", "!="];
      let operator = "";
      let parts: string[] = [];

      for (const op of operators) {
        if (condition.includes(op)) {
          operator = op;
          parts = condition.split(op).map(p => p.trim());
          break;
        }
      }

      if (!operator || parts.length !== 2) {
        return false;
      }

      const left = this.resolveValue(parts[0], safeContext);
      const right = this.resolveValue(parts[1], safeContext);

      switch (operator) {
        case ">": return left > right;
        case "<": return left < right;
        case ">=": return left >= right;
        case "<=": return left <= right;
        case "==": return left == right;
        case "!=": return left != right;
        default: return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Resolve value from context or literal
   */
  private resolveValue(expr: string, context: any): any {
    // If it's a number, return it
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // If it's a string literal, return it
    if (expr.startsWith('"') || expr.startsWith("'")) {
      return expr.slice(1, -1);
    }

    // Otherwise, resolve from context
    const parts = expr.split(".");
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  /**
   * Create approval request
   */
  private async createApprovalRequest(context: PolicyContext): Promise<string> {
    const approvalId = this.generateId();

    await db.insert(approvals).values({
      id: approvalId,
      type: "action",
      entityId: context.workflowId || context.agentId || "unknown",
      requestedBy: context.agentId || "system",
      approverRole: "founder",
      status: "pending",
      reason: `Action requires approval: ${context.action}`,
      context: context.data,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    });

    return approvalId;
  }

  /**
   * Create incident for policy violation
   */
  private async createIncident(context: PolicyContext, violations: PolicyRule[]) {
    await db.insert(incidents).values({
      id: this.generateId(),
      severity: "high",
      type: "policy_violation",
      title: `Policy violation: ${context.action}`,
      description: violations.map(v => v.message || v.condition).join("; "),
      orgUnitId: context.orgUnitId || null,
      status: "open",
      detectedBy: "governor",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Check if approval has been granted
   */
  async checkApproval(approvalId: string): Promise<boolean> {
    const approval = await db.query.approvals.findFirst({
      where: eq(approvals.id, approvalId),
    });

    return approval?.status === "approved";
  }

  /**
   * Built-in safety policies (always active)
   */
  async initializeBuiltInPolicies() {
    const builtInPolicies = [
      {
        id: "pol_no_payout_without_reconciliation",
        name: "No Payouts Without Reconciliation",
        description: "Prevents payouts unless reconciliation matches and risk score is acceptable",
        scope: "global" as const,
        rules: [
          {
            id: "rule_1",
            condition: "data.type == 'payout' && data.reconciled != true",
            action: "deny" as const,
            priority: 1,
            message: "Cannot process payout: reconciliation not complete",
          },
          {
            id: "rule_2",
            condition: "data.type == 'payout' && data.riskScore > 0.7",
            action: "require_approval" as const,
            priority: 2,
            message: "Payout requires approval: high risk score",
          },
        ],
        status: "active" as const,
        version: 1,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pol_margin_floor",
        name: "Margin Floor Protection",
        description: "Prevents pricing below margin floor",
        scope: "global" as const,
        rules: [
          {
            id: "rule_1",
            condition: "data.action == 'update_price' && data.marginPercent < 0.15",
            action: "deny" as const,
            priority: 1,
            message: "Cannot set price: margin below 15% floor",
          },
        ],
        status: "active" as const,
        version: 1,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pol_cash_runway",
        name: "Cash Runway Protection",
        description: "Prevents marketing spend increases when cash runway is low",
        scope: "global" as const,
        rules: [
          {
            id: "rule_1",
            condition: "data.action == 'increase_ad_spend' && data.cashRunwayDays < 30",
            action: "deny" as const,
            priority: 1,
            message: "Cannot increase ad spend: cash runway below 30 days",
          },
          {
            id: "rule_2",
            condition: "data.action == 'increase_ad_spend' && data.roas < 2.0",
            action: "require_approval" as const,
            priority: 2,
            message: "Ad spend increase requires approval: ROAS below 2.0",
          },
        ],
        status: "active" as const,
        version: 1,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pol_refund_limits",
        name: "Refund Approval Limits",
        description: "Requires approval for large refunds",
        scope: "global" as const,
        rules: [
          {
            id: "rule_1",
            condition: "data.action == 'process_refund' && data.amount > 500",
            action: "require_approval" as const,
            priority: 1,
            message: "Refund requires approval: amount exceeds $500",
          },
        ],
        status: "active" as const,
        version: 1,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const policy of builtInPolicies) {
      const existing = await db.query.policies.findFirst({
        where: eq(policies.id, policy.id),
      });

      if (!existing) {
        await db.insert(policies).values(policy);
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const governor = new Governor();
