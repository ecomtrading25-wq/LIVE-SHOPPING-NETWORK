# AI Business OS - Deployment & Operations Guide

## 🤖 Overview

The **AI Business OS** is an autonomous operations layer built on top of the Live Shopping Network platform. It enables 24/7 business operations with founder-only manual override, policy enforcement, and self-optimizing decision making.

## 🏗️ Architecture

### Core Components

1. **Business Kernel** - Core primitives (goals, plans, tasks, actions, events, outcomes)
2. **Policy Engine & Governor** - Hard invariants that no agent can override
3. **Workflow Engine** - Event-driven automation with safety guarantees
4. **Decision Engine** - Contextual bandits for business optimization
5. **Evaluator** - Outcome scoring and learning loop
6. **Operations Console** - Central command center for monitoring and control

### Database Schema

**26 Business OS Tables** (in `drizzle/business-os-schema.ts`):

```
Kernel: orgUnits, agents, goals, plans, tasks, actions, events, stateSnapshots, outcomes
Governance: policies, approvals, incidents
Finance: ledgerAccounts, ledgerEntries, reconciliations, disputes
Learning: experiments, banditArms, banditRewards, modelRegistry
Workflows: workflows, workflowRuns
Intelligence: simulations, simulationRuns, decisions, auditLog
```

### API Endpoints

**20 tRPC Procedures** (in `server/business-os-routers.ts`):

```typescript
businessOS.getDashboard()          // Dashboard metrics
businessOS.listWorkflows()         // Active workflows
businessOS.getWorkflowRuns()       // Execution history
businessOS.replayWorkflow()        // Replay for debugging
businessOS.updateWorkflowAutonomy() // Change autonomy level
businessOS.listApprovals()         // Pending approvals
businessOS.approveAction()         // Approve/reject
businessOS.listIncidents()         // Policy violations
businessOS.updateIncident()        // Resolve incidents
businessOS.listDecisions()         // AI decisions
businessOS.makeDecision()          // Propose decision
businessOS.recordDecisionOutcome() // Track results
businessOS.runSimulation()         // Test scenarios
businessOS.listAgents()            // Agent registry
businessOS.listGoals()             // Business goals
businessOS.createGoal()            // Add new goal
businessOS.listExperiments()       // A/B tests
businessOS.getExperimentArms()     // Test variants
businessOS.getStateHistory()       // Metrics over time
businessOS.killSwitch()            // Emergency stop
```

## 🛡️ Policy Engine

### Built-in Policies

The system ships with 4 critical safety policies:

#### 1. No Payouts Without Reconciliation
```typescript
{
  condition: "data.type == 'payout' && data.reconciled != true",
  action: "deny",
  message: "Cannot process payout: reconciliation not complete"
}
```

#### 2. Margin Floor Protection
```typescript
{
  condition: "data.action == 'update_price' && data.marginPercent < 0.15",
  action: "deny",
  message: "Cannot set price: margin below 15% floor"
}
```

#### 3. Cash Runway Protection
```typescript
{
  condition: "data.action == 'increase_ad_spend' && data.cashRunwayDays < 30",
  action: "deny",
  message: "Cannot increase ad spend: cash runway below 30 days"
}
```

#### 4. Refund Approval Limits
```typescript
{
  condition: "data.action == 'process_refund' && data.amount > 500",
  action: "require_approval",
  message: "Refund requires approval: amount exceeds $500"
}
```

### Policy DSL

Policies use a simple expression language:

**Operators**: `>`, `<`, `>=`, `<=`, `==`, `!=`

**Context Variables**:
- `data.*` - Action-specific data
- `action` - Action type
- `orgUnitId` - Business unit
- `agentId` - Executing agent

**Examples**:
```typescript
"data.amount > 1000"
"data.riskScore >= 0.7"
"data.marginPercent < 0.15"
"data.cashRunwayDays <= 30"
```

### Adding Custom Policies

1. Go to Operations Console → Policies tab
2. Click "Add Policy"
3. Define policy rules with conditions and actions
4. Set scope (global, org_unit, agent, workflow)
5. Activate policy

## 🔄 Workflow Engine

### Autonomy Levels

**Manual** - Human-triggered, human-executed
- Use for: One-off operations, exploratory tasks
- Safety: Maximum human oversight

**Supervised** - Auto-triggered, human-approved
- Use for: Regular operations with risk
- Safety: Human approval required for each execution

**Autonomous** - Fully automated with monitoring
- Use for: Proven workflows with low risk
- Safety: Policy gates + post-execution review

**Self-optimizing** - Autonomous + launches experiments
- Use for: Mature workflows ready for optimization
- Safety: All of above + experiment approval gates

### Workflow Lifecycle

```
1. Event Trigger → Workflow starts
2. Policy Gate → Check if allowed
3. Execute Steps → Run actions
4. Outcome Logging → Record results
5. Evaluation → Score performance
6. Learning → Update models
```

### Creating Workflows

```typescript
const workflow = {
  name: "Creator Payout Processing",
  orgUnitId: "lsn_main",
  trigger: { type: "scheduled", cron: "0 0 * * 1" }, // Weekly
  steps: [
    {
      type: "policy_check",
      action: "process_payout",
      data: { /* payout details */ }
    },
    {
      type: "execute",
      action: "create_payout_batch",
      data: { /* batch config */ }
    }
  ],
  autonomyLevel: "supervised",
  status: "active"
};
```

## ✅ Approval Workflow

### Approval Flow

```
1. Action requires approval (policy gate)
2. Approval request created
3. Founder notified (optional: Slack/email)
4. Founder reviews context
5. Founder approves/rejects
6. Workflow resumes/fails
```

### Approval Interface

**Location**: `/admin/operations-console` → Approvals tab

**Information Shown**:
- Action type
- Requester (agent/workflow)
- Reason for approval
- Full context data
- Risk factors
- Policy that triggered approval

**Actions**:
- Approve (with optional notes)
- Reject (with reason)
- Request more information

### Approval Expiration

Approvals expire after **24 hours** if not acted upon. Expired approvals automatically reject the action for safety.

## 📊 Operations Console

### Access

**URL**: `/admin/operations-console`

**Required Role**: Admin or Founder

### Dashboard Overview

**Key Metrics**:
- Active workflows count
- Pending approvals count
- Open incidents count
- Decisions made today

### Tabs

**Workflows** - Monitor active workflows
- View execution status
- Toggle autonomy levels
- Replay workflows for debugging

**Approvals** - Founder inbox
- Review pending requests
- Approve/reject actions
- View approval history

**Incidents** - Policy violations
- View open incidents
- Investigate root causes
- Mark resolved

**Decisions** - AI decision log
- View proposed decisions
- Track outcomes
- Evaluate accuracy

**Policies** - Rule management
- View active policies
- Add custom policies
- Adjust thresholds

## 🧠 Decision Engine

### How It Works

1. **Read Metrics** - Hourly state snapshots
2. **Propose Actions** - Based on rules + ML
3. **Simulate Impact** - Forecast outcomes
4. **Policy Check** - Ensure compliance
5. **Select Action** - Contextual bandits
6. **Execute** - Via workflow engine
7. **Track Outcome** - Learn from results

### Contextual Bandits

The decision engine uses **contextual bandits** (a reinforcement learning algorithm) to optimize business decisions:

**Context**: Current business state (revenue, ROAS, inventory, etc.)  
**Arms**: Possible actions (increase ads, adjust pricing, etc.)  
**Reward**: Outcome quality (profit, conversion, etc.)

The algorithm balances:
- **Exploitation**: Choose best-known action
- **Exploration**: Try new actions to learn

### Decision Types

**Supported Decisions**:
- Ad spend adjustments
- Pricing changes
- Creator scheduling
- Inventory reordering
- Promotion timing

**Coming Soon**:
- Product sourcing
- Supplier selection
- Content strategy
- Customer targeting

## 🚨 Incident Management

### Incident Types

**Policy Violation** - Action blocked by policy
- Severity: High
- Action: Review policy or action

**System Error** - Technical failure
- Severity: Critical
- Action: Debug and fix

**Anomaly Detected** - Unusual pattern
- Severity: Medium
- Action: Investigate cause

**Approval Timeout** - No founder response
- Severity: Low
- Action: Re-trigger if needed

### Incident Response

1. **Detect** - Automatic creation
2. **Alert** - Notify relevant parties
3. **Investigate** - Review context
4. **Resolve** - Fix root cause
5. **Document** - Update policies/workflows
6. **Learn** - Prevent recurrence

### Kill Switch

**Purpose**: Emergency stop for runaway automation

**Trigger**: `/admin/operations-console` → Kill Switch button

**Effect**:
- Pause all autonomous workflows
- Require manual approval for all actions
- Create critical incident
- Notify founder immediately

**Recovery**:
1. Investigate cause
2. Fix issue
3. Test in supervised mode
4. Gradually restore autonomy

## 📈 Metrics & Monitoring

### Key Metrics

**Operational Efficiency**:
- Autonomous workflow completion rate
- Manual intervention rate
- Average decision latency

**Safety & Compliance**:
- Policy violation rate
- Incident resolution time
- Approval response time

**Business Impact**:
- Revenue per workflow
- Cost savings from automation
- Decision accuracy rate

**Learning Performance**:
- Experiment success rate
- Model prediction accuracy
- Reward signal quality

### Monitoring Tools

**Operations Console** - Real-time dashboard  
**State Snapshots** - Hourly metrics history  
**Audit Log** - Complete action trail  
**Workflow Runs** - Execution history  

## 🔐 Security & Safety

### Fail-Safe Design

The system is designed to **fail closed**:
- Policy errors → Deny action
- Database errors → Deny action
- Approval timeout → Deny action
- Unknown state → Deny action

### Audit Trail

Every action is logged with:
- Timestamp
- Actor (agent/user)
- Action type
- Input data
- Output result
- Policy checks
- Approval decisions

### Access Control

**Founder** - Full access, can override anything  
**Admin** - Can view all, approve most  
**Operator** - Can view, limited approval  
**Viewer** - Read-only access  

## 🚀 Deployment Checklist

### Initial Setup
- [x] Database schema deployed (26 tables)
- [x] Built-in policies initialized
- [x] Operations Console accessible
- [x] tRPC endpoints exposed

### Configuration
- [ ] Review default policy thresholds
- [ ] Add custom policies for your business
- [ ] Configure notification channels
- [ ] Set up approval escalation

### Testing
- [ ] Test policy enforcement
- [ ] Test approval workflow
- [ ] Test workflow execution
- [ ] Test kill switch

### Go-Live
- [ ] Start workflows in "Supervised" mode
- [ ] Monitor for 1 week
- [ ] Upgrade to "Autonomous" gradually
- [ ] Enable "Self-optimizing" after validation

## 📚 Best Practices

### Policy Management
1. Start with strict policies, relax gradually
2. Test policies in simulation before production
3. Document policy rationale
4. Review policy effectiveness monthly

### Workflow Development
1. Always start in "Manual" mode
2. Test thoroughly in "Supervised" mode
3. Monitor closely after "Autonomous" upgrade
4. Only enable "Self-optimizing" for proven workflows

### Approval Handling
1. Respond to approvals within 4 hours
2. Document approval decisions
3. Review approval patterns weekly
4. Adjust policies to reduce approval load

### Incident Response
1. Investigate all incidents within 24 hours
2. Document root causes
3. Update policies/workflows to prevent recurrence
4. Share learnings across team

## 🆘 Troubleshooting

### Workflow Stuck
**Symptom**: Workflow in "pending_approval" for hours  
**Cause**: Waiting for founder approval  
**Fix**: Check Approvals tab, approve/reject

### Policy Too Strict
**Symptom**: Many legitimate actions blocked  
**Cause**: Policy threshold too conservative  
**Fix**: Adjust policy condition or threshold

### Decision Not Proposing
**Symptom**: Decision engine silent  
**Cause**: Metrics don't meet policy constraints  
**Fix**: Review policy constraints, adjust if needed

### High Incident Rate
**Symptom**: Many policy violations  
**Cause**: Workflows not aligned with policies  
**Fix**: Update workflows or relax policies

## 🎓 Learning Resources

### Key Concepts
- **Policy DSL**: Expression language for business rules
- **Contextual Bandits**: RL algorithm for optimization
- **Digital Twin**: Simulation for impact forecasting
- **Autonomy Levels**: Progressive automation stages

### Further Reading
- Reinforcement Learning: An Introduction (Sutton & Barto)
- Contextual Bandits: A Practical Guide
- Policy-Based Governance in AI Systems
- Autonomous Business Operations: Best Practices

---

## 🎉 Summary

The AI Business OS enables:

✅ **24/7 Autonomous Operations** - Run your business while you sleep  
✅ **Policy-Enforced Safety** - Hard rules that can't be violated  
✅ **Founder-Only Override** - You're always in control  
✅ **Self-Optimizing Decisions** - AI learns and improves  
✅ **Complete Auditability** - Every action is logged  

**Welcome to the future of business operations.**
