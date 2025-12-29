import { mysqlTable, varchar, text, int, timestamp, boolean, json, mysqlEnum, decimal, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Business Superintelligence OS - Core Schema
 * 
 * This schema extends the LSN database with autonomous business operations:
 * - Verifiable governance with policy enforcement
 * - Digital twin simulation and decision engine
 * - Closed-loop learning with contextual bandits
 * - Event-driven workflow execution
 * - Self-evolution with safety guarantees
 */

// ============================================================================
// KERNEL: Core Business Operating System
// ============================================================================

export const orgUnits = mysqlTable("org_units", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["business", "department", "team"]).notNull(),
  parentId: varchar("parent_id", { length: 64 }),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  settings: json("settings").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const agents = mysqlTable("agents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["orchestrator", "cfo", "coo", "cmo", "cto", "legal", "support", "creator_ops", "worker"]).notNull(),
  capabilities: json("capabilities").$type<string[]>().notNull(),
  toolPermissions: json("tool_permissions").$type<string[]>().notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  config: json("config").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const goals = mysqlTable("goals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["okr", "constraint", "target"]).notNull(),
  priority: int("priority").notNull().default(5),
  targetValue: decimal("target_value", { precision: 20, scale: 4 }),
  currentValue: decimal("current_value", { precision: 20, scale: 4 }),
  unit: varchar("unit", { length: 50 }),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  parentGoalId: varchar("parent_goal_id", { length: 64 }),
  constraints: json("constraints").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgUnitIdx: index("org_unit_idx").on(table.orgUnitId),
  statusIdx: index("status_idx").on(table.status),
}));

export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  goalId: varchar("goal_id", { length: 64 }).notNull(),
  version: int("version").notNull().default(1),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  strategy: text("strategy").notNull(),
  steps: json("steps").$type<Array<{
    id: string;
    title: string;
    description: string;
    dependencies: string[];
    estimatedDuration: number;
  }>>().notNull(),
  status: mysqlEnum("status", ["draft", "approved", "active", "completed", "cancelled"]).default("draft").notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  goalVersionIdx: uniqueIndex("goal_version_idx").on(table.goalId, table.version),
}));

export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  planId: varchar("plan_id", { length: 64 }),
  workflowId: varchar("workflow_id", { length: 64 }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["manual", "automated", "approval"]).notNull(),
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "blocked", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: int("priority").notNull().default(5),
  ownerAgentId: varchar("owner_agent_id", { length: 64 }),
  assignedTo: varchar("assigned_to", { length: 64 }),
  dependencies: json("dependencies").$type<string[]>(),
  inputs: json("inputs").$type<Record<string, any>>(),
  outputs: json("outputs").$type<Record<string, any>>(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  ownerIdx: index("owner_idx").on(table.ownerAgentId),
  workflowIdx: index("workflow_idx").on(table.workflowId),
}));

export const actions = mysqlTable("actions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  taskId: varchar("task_id", { length: 64 }).notNull(),
  agentId: varchar("agent_id", { length: 64 }).notNull(),
  toolName: varchar("tool_name", { length: 255 }).notNull(),
  operation: varchar("operation", { length: 255 }).notNull(),
  arguments: json("arguments").$type<Record<string, any>>().notNull(),
  result: json("result").$type<Record<string, any>>(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  errorMessage: text("error_message"),
  latencyMs: int("latency_ms"),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }),
  retryCount: int("retry_count").default(0).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  taskIdx: index("task_idx").on(table.taskId),
  agentIdx: index("agent_idx").on(table.agentId),
  toolIdx: index("tool_idx").on(table.toolName),
  statusIdx: index("status_idx").on(table.status),
}));

export const events = mysqlTable("events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: varchar("type", { length: 255 }).notNull(),
  source: mysqlEnum("source", ["system", "external", "user", "agent"]).notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }),
  payload: json("payload").$type<Record<string, any>>().notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  orgUnitIdx: index("org_unit_idx").on(table.orgUnitId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export const stateSnapshots = mysqlTable("state_snapshots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  snapshotType: mysqlEnum("snapshot_type", ["hourly", "daily", "on_demand"]).notNull(),
  metrics: json("metrics").$type<{
    revenue: number;
    orders: number;
    cac: number;
    roas: number;
    refundRate: number;
    latency: number;
    stockCover: number;
    creatorQuality: number;
    disputeRate: number;
    cashPosition: number;
    [key: string]: number;
  }>().notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgUnitTimestampIdx: uniqueIndex("org_unit_timestamp_idx").on(table.orgUnitId, table.timestamp),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export const outcomes = mysqlTable("outcomes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  taskId: varchar("task_id", { length: 64 }).notNull(),
  goalId: varchar("goal_id", { length: 64 }),
  result: json("result").$type<Record<string, any>>().notNull(),
  rewardScore: decimal("reward_score", { precision: 10, scale: 4 }),
  metrics: json("metrics").$type<Record<string, number>>(),
  success: boolean("success").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  taskIdx: index("task_idx").on(table.taskId),
  goalIdx: index("goal_idx").on(table.goalId),
}));

// ============================================================================
// GOVERNANCE: Policies, Approvals, Incidents
// ============================================================================

export const policies = mysqlTable("policies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  orgUnitId: varchar("org_unit_id", { length: 64 }),
  scope: mysqlEnum("scope", ["global", "org_unit", "workflow", "agent"]).notNull(),
  rules: json("rules").$type<Array<{
    id: string;
    condition: string;
    action: "allow" | "deny" | "require_approval";
    priority: number;
    message?: string;
  }>>().notNull(),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  version: int("version").notNull().default(1),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scopeIdx: index("scope_idx").on(table.scope),
  statusIdx: index("status_idx").on(table.status),
}));

export const approvals = mysqlTable("approvals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: mysqlEnum("type", ["task", "action", "plan", "policy_change", "budget", "payout"]).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  requestedBy: varchar("requested_by", { length: 64 }).notNull(),
  approverRole: mysqlEnum("approver_role", ["founder", "admin", "ops"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  reason: text("reason"),
  context: json("context").$type<Record<string, any>>(),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  approverIdx: index("approver_idx").on(table.approverRole),
  entityIdx: index("entity_idx").on(table.entityId),
}));

export const incidents = mysqlTable("incidents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  orgUnitId: varchar("org_unit_id", { length: 64 }),
  taskId: varchar("task_id", { length: 64 }),
  workflowId: varchar("workflow_id", { length: 64 }),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "closed"]).default("open").notNull(),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  detectedBy: varchar("detected_by", { length: 64 }),
  assignedTo: varchar("assigned_to", { length: 64 }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  severityIdx: index("severity_idx").on(table.severity),
  statusIdx: index("status_idx").on(table.status),
  orgUnitIdx: index("org_unit_idx").on(table.orgUnitId),
}));

// ============================================================================
// FINANCE: Ledger, Reconciliation, Disputes
// ============================================================================

export const ledgerAccounts = mysqlTable("ledger_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["asset", "liability", "equity", "revenue", "expense"]).notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  balance: decimal("balance", { precision: 20, scale: 4 }).notNull().default("0"),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const ledgerEntries = mysqlTable("ledger_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  transactionId: varchar("transaction_id", { length: 64 }).notNull(),
  accountId: varchar("account_id", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["debit", "credit"]).notNull(),
  amount: decimal("amount", { precision: 20, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  description: text("description"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  transactionIdx: index("transaction_idx").on(table.transactionId),
  accountIdx: index("account_idx").on(table.accountId),
}));

export const reconciliations = mysqlTable("reconciliations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: mysqlEnum("type", ["payout", "payment", "refund", "chargeback"]).notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  ledgerEntryId: varchar("ledger_entry_id", { length: 64 }),
  status: mysqlEnum("status", ["pending", "matched", "unmatched", "disputed"]).default("pending").notNull(),
  matchedAt: timestamp("matched_at"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  externalIdIdx: uniqueIndex("external_id_idx").on(table.externalId),
  statusIdx: index("status_idx").on(table.status),
}));

export const disputes = mysqlTable("disputes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: mysqlEnum("type", ["chargeback", "refund", "quality", "delivery", "fraud"]).notNull(),
  orderId: varchar("order_id", { length: 64 }),
  customerId: varchar("customer_id", { length: 64 }),
  amount: decimal("amount", { precision: 20, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: mysqlEnum("status", ["open", "evidence_required", "submitted", "won", "lost", "cancelled"]).default("open").notNull(),
  reason: text("reason"),
  evidencePack: json("evidence_pack").$type<Record<string, any>>(),
  resolution: text("resolution"),
  dueDate: timestamp("due_date"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  orderIdx: index("order_idx").on(table.orderId),
}));

// ============================================================================
// LEARNING: Experiments, Bandits, Model Registry
// ============================================================================

export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["ab_test", "multivariate", "bandit"]).notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  hypothesis: text("hypothesis"),
  variants: json("variants").$type<Array<{
    id: string;
    name: string;
    config: Record<string, any>;
    allocation: number;
  }>>().notNull(),
  metrics: json("metrics").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed", "cancelled"]).default("draft").notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  results: json("results").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  orgUnitIdx: index("org_unit_idx").on(table.orgUnitId),
}));

export const banditArms = mysqlTable("bandit_arms", {
  id: varchar("id", { length: 64 }).primaryKey(),
  experimentId: varchar("experiment_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  config: json("config").$type<Record<string, any>>().notNull(),
  pulls: int("pulls").notNull().default(0),
  totalReward: decimal("total_reward", { precision: 20, scale: 4 }).notNull().default("0"),
  avgReward: decimal("avg_reward", { precision: 10, scale: 4 }),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  experimentIdx: index("experiment_idx").on(table.experimentId),
}));

export const banditRewards = mysqlTable("bandit_rewards", {
  id: varchar("id", { length: 64 }).primaryKey(),
  armId: varchar("arm_id", { length: 64 }).notNull(),
  experimentId: varchar("experiment_id", { length: 64 }).notNull(),
  context: json("context").$type<Record<string, any>>(),
  action: json("action").$type<Record<string, any>>().notNull(),
  reward: decimal("reward", { precision: 10, scale: 4 }).notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  armIdx: index("arm_idx").on(table.armId),
  experimentIdx: index("experiment_idx").on(table.experimentId),
}));

export const modelRegistry = mysqlTable("model_registry", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  type: mysqlEnum("type", ["prompt", "policy", "classifier", "forecaster"]).notNull(),
  config: json("config").$type<Record<string, any>>().notNull(),
  evalScores: json("eval_scores").$type<Record<string, number>>(),
  status: mysqlEnum("status", ["draft", "testing", "production", "deprecated"]).default("draft").notNull(),
  deployedAt: timestamp("deployed_at"),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nameVersionIdx: uniqueIndex("name_version_idx").on(table.name, table.version),
  statusIdx: index("status_idx").on(table.status),
}));

// ============================================================================
// WORKFLOWS: Event-Driven Execution
// ============================================================================

export const workflows = mysqlTable("workflows", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }).notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  autonomyLevel: mysqlEnum("autonomy_level", ["a0_manual", "a1_assisted", "a2_supervised", "a3_autonomous", "a4_self_optimizing"]).default("a0_manual").notNull(),
  triggerEvents: json("trigger_events").$type<string[]>().notNull(),
  spec: json("spec").$type<Record<string, any>>().notNull(),
  status: mysqlEnum("status", ["active", "paused", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  autonomyIdx: index("autonomy_idx").on(table.autonomyLevel),
}));

export const workflowRuns = mysqlTable("workflow_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 64 }).notNull(),
  eventId: varchar("event_id", { length: 64 }),
  status: mysqlEnum("status", ["pending", "running", "paused", "completed", "failed", "cancelled"]).default("pending").notNull(),
  inputs: json("inputs").$type<Record<string, any>>(),
  outputs: json("outputs").$type<Record<string, any>>(),
  trace: json("trace").$type<Array<{
    timestamp: string;
    step: string;
    status: string;
    data: Record<string, any>;
  }>>(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  workflowIdx: index("workflow_idx").on(table.workflowId),
  statusIdx: index("status_idx").on(table.status),
  startedAtIdx: index("started_at_idx").on(table.startedAt),
}));

// ============================================================================
// SIMULATION: Digital Twin
// ============================================================================

export const simulations = mysqlTable("simulations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["demand", "inventory", "creator", "payout", "fraud", "pricing"]).notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  modelConfig: json("model_config").$type<Record<string, any>>().notNull(),
  baselineState: json("baseline_state").$type<Record<string, any>>().notNull(),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  lastCalibrated: timestamp("last_calibrated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const simulationRuns = mysqlTable("simulation_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  simulationId: varchar("simulation_id", { length: 64 }).notNull(),
  scenario: json("scenario").$type<Record<string, any>>().notNull(),
  predictions: json("predictions").$type<Record<string, any>>().notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  runAt: timestamp("run_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  simulationIdx: index("simulation_idx").on(table.simulationId),
  runAtIdx: index("run_at_idx").on(table.runAt),
}));

// ============================================================================
// DECISION ENGINE: Autonomous Decision Making
// ============================================================================

export const decisions = mysqlTable("decisions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  orgUnitId: varchar("org_unit_id", { length: 64 }).notNull(),
  context: json("context").$type<Record<string, any>>().notNull(),
  options: json("options").$type<Array<{
    id: string;
    action: Record<string, any>;
    predictedImpact: Record<string, number>;
    confidence: number;
  }>>().notNull(),
  selectedOption: varchar("selected_option", { length: 64 }),
  reasoning: text("reasoning"),
  status: mysqlEnum("status", ["proposed", "approved", "executed", "rejected", "rolled_back"]).default("proposed").notNull(),
  executedAt: timestamp("executed_at"),
  actualImpact: json("actual_impact").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  statusIdx: index("status_idx").on(table.status),
  orgUnitIdx: index("org_unit_idx").on(table.orgUnitId),
}));

// ============================================================================
// AUDIT: Tamper-Evident Logging
// ============================================================================

export const auditLog = mysqlTable("audit_log", {
  id: varchar("id", { length: 64 }).primaryKey(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  actorType: mysqlEnum("actor_type", ["user", "agent", "system"]).notNull(),
  actorId: varchar("actor_id", { length: 64 }).notNull(),
  changes: json("changes").$type<Record<string, any>>(),
  metadata: json("metadata").$type<Record<string, any>>(),
  previousHash: varchar("previous_hash", { length: 64 }),
  currentHash: varchar("current_hash", { length: 64 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("entity_idx").on(table.entityType, table.entityId),
  actorIdx: index("actor_idx").on(table.actorType, table.actorId),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));
