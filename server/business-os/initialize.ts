/**
 * Business OS Initialization
 * 
 * Sets up built-in policies, models, criteria, and workflows
 */

import { governor } from "./governor";
import { evaluator } from "./evaluator";
import { digitalTwin } from "./digital-twin";
import { decisionEngine } from "./decision-engine";
import { workflowEngine } from "./workflow-engine";

/**
 * Initialize all Business OS components
 */
export async function initializeBusinessOS() {
  console.log("[Business OS] Initializing...");

  try {
    // 1. Initialize governor with built-in policies
    console.log("[Business OS] Loading built-in policies...");
    await governor.initializeBuiltInPolicies();

    // 2. Initialize evaluator with built-in criteria
    console.log("[Business OS] Loading evaluation criteria...");
    evaluator.initializeBuiltInCriteria();

    // 3. Initialize digital twin with simulation models
    console.log("[Business OS] Loading simulation models...");
    digitalTwin.initializeBuiltInModels();

    // 4. Initialize decision engine with decision types
    console.log("[Business OS] Loading decision types...");
    decisionEngine.initializeBuiltInDecisions();

    // 5. Register example workflows
    console.log("[Business OS] Registering workflows...");
    await registerExampleWorkflows();

    console.log("[Business OS] ✓ Initialization complete");
  } catch (error) {
    console.error("[Business OS] Initialization failed:", error);
    throw error;
  }
}

/**
 * Register example workflows
 */
async function registerExampleWorkflows() {
  // Payout processing workflow
  await workflowEngine.registerWorkflow({
    name: "creator_payout_processing",
    description: "Automated creator payout with reconciliation and risk checks",
    type: "finance",
    orgUnitId: "lsn_main",
    autonomyLevel: "a2_supervised",
    triggerEvents: ["payout.due"],
    steps: [
      {
        id: "check_reconciliation",
        name: "Check Reconciliation",
        type: "policy_gate",
        config: {
          action: "process_payout",
          data: "$payoutData",
        },
        onSuccess: "process_payout",
        onFailure: "create_incident",
      },
      {
        id: "process_payout",
        name: "Process Payout",
        type: "tool_call",
        config: {
          toolName: "payment_processor",
          operation: "create_payout",
          args: "$payoutData",
          outputKey: "payoutResult",
        },
        onSuccess: "record_ledger",
      },
      {
        id: "record_ledger",
        name: "Record in Ledger",
        type: "tool_call",
        config: {
          toolName: "ledger",
          operation: "create_entry",
          args: "$payoutResult",
        },
      },
      {
        id: "create_incident",
        name: "Create Incident",
        type: "tool_call",
        config: {
          toolName: "incident_manager",
          operation: "create",
          args: {
            severity: "high",
            title: "Payout blocked by policy",
          },
        },
      },
    ],
  });

  // Pricing optimization workflow
  await workflowEngine.registerWorkflow({
    name: "pricing_optimization",
    description: "Autonomous pricing decisions with simulation and policy checks",
    type: "pricing",
    orgUnitId: "lsn_main",
    autonomyLevel: "a3_autonomous",
    triggerEvents: ["pricing.review_due"],
    steps: [
      {
        id: "make_decision",
        name: "Make Pricing Decision",
        type: "decision",
        config: {
          decisionType: "pricing",
          condition: "state.needsPricingReview",
          trueStep: "simulate_impact",
          falseStep: "end",
        },
      },
      {
        id: "simulate_impact",
        name: "Simulate Impact",
        type: "tool_call",
        config: {
          toolName: "digital_twin",
          operation: "simulate",
          args: "$decisionScenario",
          outputKey: "prediction",
        },
        onSuccess: "check_policy",
      },
      {
        id: "check_policy",
        name: "Check Policy Compliance",
        type: "policy_gate",
        config: {
          action: "update_price",
          data: "$prediction",
        },
        onSuccess: "apply_pricing",
        onFailure: "request_approval",
      },
      {
        id: "apply_pricing",
        name: "Apply New Pricing",
        type: "tool_call",
        config: {
          toolName: "pricing_engine",
          operation: "update_prices",
          args: "$prediction",
        },
      },
      {
        id: "request_approval",
        name: "Request Approval",
        type: "approval_gate",
        config: {},
      },
    ],
  });

  // Content generation workflow
  await workflowEngine.registerWorkflow({
    name: "content_generation",
    description: "AI-powered content creation with quality evaluation",
    type: "content",
    orgUnitId: "lsn_main",
    autonomyLevel: "a2_supervised",
    triggerEvents: ["content.generation_requested"],
    steps: [
      {
        id: "generate_content",
        name: "Generate Content",
        type: "tool_call",
        config: {
          toolName: "llm",
          operation: "generate",
          args: "$contentBrief",
          outputKey: "generatedContent",
        },
        onSuccess: "evaluate_quality",
        retryable: true,
      },
      {
        id: "evaluate_quality",
        name: "Evaluate Quality",
        type: "tool_call",
        config: {
          toolName: "evaluator",
          operation: "evaluate",
          args: "$generatedContent",
          outputKey: "evaluation",
        },
        onSuccess: "check_quality",
      },
      {
        id: "check_quality",
        name: "Check Quality Threshold",
        type: "condition",
        config: {
          expression: "state.evaluation.passed === true",
        },
        onSuccess: "publish_content",
        onFailure: "regenerate_or_escalate",
      },
      {
        id: "publish_content",
        name: "Publish Content",
        type: "tool_call",
        config: {
          toolName: "content_publisher",
          operation: "publish",
          args: "$generatedContent",
        },
      },
      {
        id: "regenerate_or_escalate",
        name: "Regenerate or Escalate",
        type: "decision",
        config: {
          condition: "state.retryCount < 3",
          trueStep: "generate_content",
          falseStep: "request_approval",
        },
      },
    ],
  });

  // Fraud detection workflow
  await workflowEngine.registerWorkflow({
    name: "fraud_detection",
    description: "Real-time fraud detection and response",
    type: "security",
    orgUnitId: "lsn_main",
    autonomyLevel: "a3_autonomous",
    triggerEvents: ["order.created", "payment.received"],
    steps: [
      {
        id: "analyze_risk",
        name: "Analyze Risk",
        type: "tool_call",
        config: {
          toolName: "fraud_detector",
          operation: "analyze",
          args: "$orderData",
          outputKey: "riskScore",
        },
        onSuccess: "check_risk_level",
      },
      {
        id: "check_risk_level",
        name: "Check Risk Level",
        type: "condition",
        config: {
          expression: "state.riskScore > 0.7",
        },
        onSuccess: "block_order",
        onFailure: "allow_order",
      },
      {
        id: "block_order",
        name: "Block High-Risk Order",
        type: "tool_call",
        config: {
          toolName: "order_manager",
          operation: "block",
          args: "$orderData",
        },
        onSuccess: "create_incident",
      },
      {
        id: "allow_order",
        name: "Allow Order",
        type: "tool_call",
        config: {
          toolName: "order_manager",
          operation: "approve",
          args: "$orderData",
        },
      },
      {
        id: "create_incident",
        name: "Create Fraud Incident",
        type: "tool_call",
        config: {
          toolName: "incident_manager",
          operation: "create",
          args: {
            severity: "high",
            type: "fraud_detected",
            data: "$orderData",
          },
        },
      },
    ],
  });
}
