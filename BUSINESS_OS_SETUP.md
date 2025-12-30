# Business Superintelligence OS - Setup Guide

## 🎯 Overview

The Business Superintelligence OS is a **verifiable, self-improving, simulation-driven operating system** that can run multiple companies end-to-end, safely, 24/7, with founder-only override.

This system transforms your LSN platform into an autonomous business operating system with:

- **Verifiable Governance**: Machine-enforced invariants and policy gates
- **Digital Twin Simulation**: Predict impact before executing actions
- **Closed-Loop Learning**: Contextual bandits optimize decisions over time
- **Event-Driven Workflows**: Deterministic, replayable execution via n8n
- **Multi-Business Management**: One kernel runs LSN, TikTok Arbitrage, SISAR, DATES, and future ventures
- **Autonomy Levels A0-A4**: Gradual rollout from manual to self-optimizing

## 🏗️ Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│                    GOVERNANCE PLANE                          │
│  Policy DSL • Approval System • Audit Trail • Kill Switch   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE PLANE                         │
│  State Snapshots • Digital Twin • Decision Engine • Eval    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION PLANE                           │
│  n8n Workflows • Tool Router • Agents • Connectors          │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

The Business OS extends your existing LSN database with these core tables:

### Kernel Tables
- `org_units` - Multi-level hierarchy (CEO → Business Units → Departments)
- `agents` - AI workforce with capabilities and permissions
- `goals` - OKRs, constraints, and targets
- `plans` - Versioned plan trees with dependencies
- `tasks` - Atomic executable steps
- `actions` - Tool calls with args, results, latency, cost
- `events` - System and external triggers
- `state_snapshots` - Hourly/daily business metrics
- `outcomes` - Task results with reward signals
- `policies` - Machine-readable constraints (Policy DSL)
- `approvals` - Founder gates for critical decisions
- `incidents` - Issues, resolutions, kill switch

### Finance Safety Layer
- `bos_ledger_accounts` - Double-entry accounting
- `bos_ledger_entries` - All financial transactions
- `reconciliations` - Payment matching
- `disputes_v2` - Enhanced dispute lifecycle

### Learning Loop
- `experiments` - A/B tests, pricing tests, creative tests
- `bandit_arms` - Decision choices
- `bandit_rewards` - Outcome results
- `model_registry` - Prompt/policy versions with eval scores

### n8n Integration
- `n8n_workflows` - Workflow registry
- `n8n_executions` - Execution tracking
- `n8n_webhooks` - Webhook endpoints

## 🚀 Quick Start

### 1. Access the Control Room

Navigate to: **https://your-domain.com/business-os**

This is your central command center for all autonomous operations.

### 2. Set Up Organization Structure

```typescript
// Example: Create your CEO enterprise structure
{
  "CEO Office": {
    type: "ceo",
    children: [
      "Live Shopping Network",
      "TikTok Arbitrage",
      "SISAR",
      "DATES"
    ]
  }
}
```

### 3. Deploy AI Agents

Create agents for each business function:

- **CFO Agent**: Financial operations, payouts, reconciliation
- **COO Agent**: Operations management, inventory, fulfillment
- **CMO Agent**: Marketing, content, creator allocation
- **CTO Agent**: Technical operations, integrations
- **Legal Agent**: Compliance, risk, dispute handling
- **Creator Ops Agent**: Creator onboarding, scheduling, performance

### 4. Define Policies

Create machine-enforceable rules:

```json
{
  "name": "Payout Safety Gate",
  "category": "finance",
  "priority": 10,
  "enforcement": "hard",
  "policyDsl": {
    "conditions": [
      { "field": "amount", "operator": "gt", "value": 1000 },
      { "field": "reconciliation_status", "operator": "eq", "value": "matched" },
      { "field": "risk_score", "operator": "lt", "value": 50 }
    ],
    "actions": [
      { "type": "require_approval", "message": "High-value payout requires founder approval" }
    ]
  }
}
```

### 5. Connect n8n Workflows

#### Install n8n (if not already installed)

```bash
npm install -g n8n
n8n start
```

#### Register Workflows

Use the Business OS Control Room to register your n8n workflows:

1. Go to **Workflows** tab
2. Click **Register n8n Workflow**
3. Provide:
   - n8n Workflow ID
   - Name and description
   - Autonomy level (A0-A4)
   - Trigger type (webhook, cron, event, manual)

#### Example n8n Workflow Integration

```javascript
// In your n8n workflow, call the Business OS API
const response = await fetch('https://your-domain.com/api/trpc/businessOs.ingestEvent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgUnitId: 'lsn',
    eventType: 'order.placed',
    source: 'shopify',
    payload: {
      orderId: '12345',
      amount: 299.99,
      customerId: 'cust_abc'
    }
  })
});
```

## 🎚️ Autonomy Levels

Gradually increase autonomy as confidence grows:

### A0 - Manual (Drafts Only)
- System drafts plans and actions
- Human reviews and executes everything
- **Use for**: New workflows, testing

### A1 - Assisted (Asks Approval for Risky Steps)
- Runs automatically for low-risk actions
- Requests approval for anything above threshold
- **Use for**: Financial operations, compliance

### A2 - Supervised (Auto-runs Within Policy Envelope)
- Fully autonomous within defined policy boundaries
- Blocked if policy violation detected
- **Use for**: Content production, creator scheduling

### A3 - Autonomous (Full Autopilot with Monitoring)
- Runs 24/7 without human intervention
- Continuous monitoring and rollback capability
- **Use for**: Proven workflows with strong safety rails

### A4 - Self-Optimizing (Launches Experiments + Updates Policies)
- Creates and runs experiments automatically
- Updates decision policies based on outcomes
- **Use for**: Mature systems with extensive historical data

## 🔒 Safety Mechanisms

### 1. Policy Gates

Every action passes through policy evaluation:

```
Action Request → Policy Evaluator → [Allow | Block | Require Approval]
```

### 2. Approval Workflow

Critical decisions route to founder:

- High-value payouts
- Contract commitments
- Policy changes
- Risk threshold breaches

### 3. Kill Switch

Emergency stop for all autonomous operations:

1. Navigate to **Incidents** tab
2. Click **Activate Kill Switch**
3. All workflows pause immediately
4. Manual review required to resume

### 4. Audit Trail

Every action is logged with:
- Timestamp
- Agent/workflow responsible
- Inputs and outputs
- Latency and cost
- Success/failure reason

## 📈 Key Workflows to Implement

### 1. Content Factory

**Purpose**: Automate content creation for multi-platform publishing

**Trigger**: Hourly cron job

**Steps**:
1. Analyze performance of recent content
2. Generate new content briefs using creative bandit
3. Create content variations
4. Schedule publishing across platforms
5. Track performance and feed back to bandit

**Autonomy Level**: A2 (supervised)

### 2. Payout Processor

**Purpose**: Safe, automated creator/vendor payouts

**Trigger**: Daily at 2 AM

**Steps**:
1. Calculate payouts based on performance
2. Check reconciliation status
3. Evaluate risk scores
4. Request approval if needed (policy gate)
5. Execute payouts via Stripe/PayPal/Wise
6. Log to ledger
7. Send notifications

**Autonomy Level**: A1 (assisted) → A3 (autonomous after validation)

### 3. Dispute Handler

**Purpose**: Automated dispute evidence collection and submission

**Trigger**: Webhook from payment processor

**Steps**:
1. Receive dispute notification
2. Gather evidence (order details, tracking, communication)
3. Build evidence pack
4. Submit to payment processor
5. Update dispute status
6. Escalate to human if complex

**Autonomy Level**: A2 (supervised)

### 4. Creator Scheduler

**Purpose**: Optimize creator allocation and scheduling

**Trigger**: Event-driven (new stream request)

**Steps**:
1. Analyze creator performance history
2. Check availability and preferences
3. Use bandit to allocate best creator
4. Schedule stream
5. Send notifications
6. Track outcome and update bandit

**Autonomy Level**: A2 (supervised)

### 5. Inventory Replenishment

**Purpose**: Automated purchase order creation

**Trigger**: Daily inventory check

**Steps**:
1. Calculate stock cover days
2. Forecast demand
3. Check supplier lead times
4. Generate PO if below threshold
5. Request approval for large orders (policy gate)
6. Send PO to supplier
7. Track delivery

**Autonomy Level**: A1 (assisted)

## 🧠 Decision Engine Setup

### Contextual Bandits

The Decision Engine uses contextual bandits to optimize key decisions:

#### 1. Ad Spend Allocation

**Context**: ROAS, cash runway, competitor activity

**Arms**: 
- Increase 10%
- Increase 20%
- Maintain
- Decrease 10%
- Decrease 20%

**Reward**: Revenue impact / cost

#### 2. Creator Allocation

**Context**: Product category, time slot, audience demographics

**Arms**: Available creators

**Reward**: Stream revenue * creator quality score

#### 3. Pricing Optimization

**Context**: Inventory level, demand signals, competitor prices

**Arms**: 
- Price +5%
- Price +3%
- Maintain
- Price -3%
- Price -5%

**Reward**: Profit margin * conversion rate

#### 4. Content Selection

**Context**: Platform, audience segment, time of day

**Arms**: Content angles from library

**Reward**: Engagement rate * conversion rate

### Setting Up a Bandit

```typescript
// 1. Create experiment
const experiment = await trpc.businessOs.createExperiment.mutate({
  orgUnitId: 'lsn',
  name: 'Creator Allocation Optimization',
  type: 'workflow',
  hypothesis: 'Allocating creators based on historical performance will increase revenue',
  successMetric: 'stream_revenue',
  config: {
    variants: [
      { id: 'creator_a', name: 'Creator A', config: { creatorId: 'a' } },
      { id: 'creator_b', name: 'Creator B', config: { creatorId: 'b' } },
      { id: 'creator_c', name: 'Creator C', config: { creatorId: 'c' } }
    ],
    allocation: { creator_a: 0.33, creator_b: 0.33, creator_c: 0.34 }
  }
});

// 2. Create bandit arms
for (const variant of experiment.config.variants) {
  await trpc.businessOs.createBanditArm.mutate({
    experimentId: experiment.id,
    decisionType: 'creator_allocation',
    armName: variant.name,
    config: variant.config
  });
}

// 3. In your workflow, select arm and log reward
const selectedArm = await selectBanditArm('creator_allocation', context);
const outcome = await executeWithArm(selectedArm);
await trpc.businessOs.logBanditReward.mutate({
  armId: selectedArm.id,
  reward: outcome.revenue,
  context: context
});
```

## 🔗 n8n Webhook Endpoints

### Event Ingest

**URL**: `POST /api/trpc/businessOs.ingestEvent`

**Body**:
```json
{
  "orgUnitId": "lsn",
  "eventType": "order.placed",
  "source": "shopify",
  "payload": {
    "orderId": "12345",
    "amount": 299.99
  }
}
```

### Task Status Update

**URL**: `POST /api/trpc/businessOs.updateTaskStatus`

**Body**:
```json
{
  "taskId": "task_abc",
  "status": "completed",
  "outputs": {
    "result": "success"
  }
}
```

### Log Workflow Execution

**URL**: `POST /api/trpc/businessOs.logN8nExecution`

**Body**:
```json
{
  "workflowId": "wf_123",
  "n8nExecutionId": "exec_456",
  "status": "completed",
  "durationMs": 2340
}
```

## 📊 Monitoring & Observability

### Key Metrics to Track

1. **Workflow Health**
   - Execution count
   - Success rate
   - Average latency
   - Error rate

2. **Agent Performance**
   - Tasks completed
   - Success rate
   - Average task duration
   - Cost per task

3. **Policy Enforcement**
   - Violations prevented
   - Approvals requested
   - Approval response time

4. **Learning Progress**
   - Experiment count
   - Bandit arm performance
   - Model eval scores
   - Decision accuracy

5. **Financial Safety**
   - Reconciliation match rate
   - Payout holds
   - Dispute win rate
   - Fraud prevention saves

### Dashboards

Access these dashboards in the Control Room:

- **System Health**: Real-time operational status
- **Workflow Queue**: Active and pending tasks
- **Approvals Inbox**: Pending founder decisions
- **Incidents**: Open issues and resolutions
- **Goals & OKRs**: Progress tracking
- **Learning Dashboard**: Experiment results and bandit performance

## 🚨 Incident Response

### Incident Severity Levels

- **Low**: Minor issues, no business impact
- **Medium**: Degraded performance, workaround available
- **High**: Significant impact, requires immediate attention
- **Critical**: System-wide failure, activate kill switch

### Response Workflow

1. **Detection**: Automated monitoring or manual report
2. **Triage**: Assess severity and impact
3. **Mitigation**: Apply immediate fixes or workarounds
4. **Investigation**: Determine root cause
5. **Resolution**: Implement permanent fix
6. **Post-Mortem**: Document learnings and update policies

### Kill Switch Protocol

When to activate:

- Runaway spending (ads, payouts)
- Data integrity issues
- Security breach detected
- Regulatory compliance violation
- Unexpected system behavior

What happens:

1. All autonomous workflows pause
2. Incident created with severity=critical
3. Notifications sent to founder
4. Manual review required to resume
5. Root cause analysis mandatory

## 🔄 Rollout Strategy

### Phase 1: Foundation (Week 1-2)

- [ ] Set up organization structure
- [ ] Deploy AI agents
- [ ] Define core policies
- [ ] Register n8n workflows
- [ ] Test event ingestion

### Phase 2: Money Safety (Week 3-4)

- [ ] Implement payout workflow (A1)
- [ ] Set up reconciliation matcher
- [ ] Configure financial policy gates
- [ ] Test approval workflow
- [ ] Validate ledger entries

### Phase 3: Content & Growth (Week 5-6)

- [ ] Deploy content factory (A2)
- [ ] Implement creator scheduler (A2)
- [ ] Set up creative bandit
- [ ] Test multi-platform publishing

### Phase 4: Optimization (Week 7-8)

- [ ] Launch pricing experiments
- [ ] Deploy ad spend optimizer
- [ ] Implement inventory replenishment
- [ ] Set up decision engine

### Phase 5: Scale & Harden (Week 9-12)

- [ ] Increase autonomy levels
- [ ] Add more business units
- [ ] Expand policy library
- [ ] Implement self-evolution (A4)

## 📚 API Reference

### tRPC Procedures

All procedures are available under `trpc.businessOs.*`:

#### Organization & Agents

- `getOrgUnits()` - List all organization units
- `createOrgUnit(input)` - Create new org unit
- `getAgents(input)` - List agents with filters
- `createAgent(input)` - Deploy new AI agent

#### Goals & Plans

- `getGoals(input)` - List goals with filters
- `createGoal(input)` - Create new goal/OKR
- `updateGoalProgress(input)` - Update goal metrics
- `getPlans(input)` - List plans
- `createPlan(input)` - Create execution plan
- `approvePlan(input)` - Approve plan for execution

#### Tasks & Actions

- `getTasks(input)` - List tasks with filters
- `createTask(input)` - Create new task
- `updateTaskStatus(input)` - Update task status
- `getActions(input)` - List actions for a task
- `logAction(input)` - Log tool execution

#### Events & State

- `ingestEvent(input)` - Receive external event
- `getEvents(input)` - List events
- `createStateSnapshot(input)` - Log business metrics
- `getStateSnapshots(input)` - Query historical metrics

#### Policies & Approvals

- `getPolicies(input)` - List policies
- `createPolicy(input)` - Define new policy
- `evaluatePolicy(input)` - Check policy against context
- `getApprovals(input)` - List pending approvals
- `requestApproval(input)` - Create approval request
- `respondToApproval(input)` - Approve/reject

#### Incidents

- `getIncidents(input)` - List incidents
- `createIncident(input)` - Report new incident
- `updateIncident(input)` - Update incident status
- `activateKillSwitch(input)` - Emergency stop

#### n8n Integration

- `getN8nWorkflows(input)` - List registered workflows
- `registerN8nWorkflow(input)` - Register new workflow
- `logN8nExecution(input)` - Log workflow execution

#### Dashboard

- `getDashboardMetrics(input)` - Get overview metrics

## 🎓 Best Practices

### 1. Start Conservative

- Begin with A0 (manual) or A1 (assisted)
- Validate outcomes before increasing autonomy
- Build confidence through repeated success

### 2. Policy-First Design

- Define policies before deploying workflows
- Test policy gates with edge cases
- Review policy violations regularly

### 3. Observability is Key

- Log every action with full context
- Enable workflow replay for debugging
- Monitor key metrics continuously

### 4. Gradual Rollout

- Deploy to one business unit first
- Validate before expanding to others
- Keep rollback plan ready

### 5. Human-in-the-Loop

- Maintain founder override capability
- Review approval requests promptly
- Conduct regular post-mortems

### 6. Continuous Learning

- Run experiments systematically
- Update policies based on learnings
- Evolve decision models over time

## 🆘 Troubleshooting

### Workflow Not Executing

**Check**:
1. Workflow status (active/disabled)
2. n8n connection status
3. Event ingestion logs
4. Policy gate blocks

### Approval Not Received

**Check**:
1. Approval routing configuration
2. Notification settings
3. Approval expiration time

### Policy Gate Blocking Incorrectly

**Check**:
1. Policy conditions and thresholds
2. Context data being passed
3. Policy priority and enforcement level

### Bandit Not Learning

**Check**:
1. Reward signals being logged
2. Sufficient sample size
3. Arm allocation balance

## 📞 Support

For issues or questions:

1. Check the Control Room **Incidents** tab
2. Review audit trail for recent actions
3. Consult this documentation
4. Reach out to the Manus team

## 🎉 Success Metrics

You'll know the Business OS is working when:

- ✅ 80%+ of routine operations run autonomously
- ✅ Policy violations prevented > 0 (safety working)
- ✅ Approval response time < 1 hour
- ✅ Workflow success rate > 95%
- ✅ Decision accuracy improving over time
- ✅ Founder time spent on approvals decreasing
- ✅ Zero financial safety incidents

---

**Welcome to the future of autonomous business operations!** 🚀

Your Business Superintelligence OS is ready to transform how you run LSN, TikTok Arbitrage, SISAR, DATES, and all future ventures.

Start with the Control Room at `/business-os` and begin your journey to A4 autonomy.
