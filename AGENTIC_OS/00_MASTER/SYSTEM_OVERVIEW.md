# Post-Agentic AI Operating System - System Overview

## Vision

Transform Live Shopping Network from a traditional e-commerce platform into a **self-optimizing, autonomous business** that learns, predicts, verifies, and evolves without manual intervention.

## Architecture Layers

### Layer A: Mission Control (Decision Engine)
**Purpose:** Determines "what to do next" across the entire business

**Components:**
- **Orchestrator** - The brain that picks goals, decomposes into tasks, assigns to agents, tracks progress
- **Planner** - Converts quarterly/weekly goals into executable work orders
- **Scheduler** - Runs recurring routines (daily product scan, hourly order sync, nightly reconciliation)
- **Approval Gate** - Enforces founder-only actions for risky steps (payouts, refunds, supplier payments, policy changes)

### Layer B: Agent Mesh (Execution Layer)
**Purpose:** Specialized agents that execute work through tools + permissions

**Agent Categories:**
1. **Executive Agents** - CEO, COO, CFO, CPO (strategic decisions)
2. **Growth & Content Agents** - Trend Scout, Offer Architect, Creative Director, UGC Producer, Ads Optimizer, CRO
3. **Product & Merch Agents** - Product Research, Supplier Sourcing, Sampling & QA, Listing Publisher, Catalog Integrity
4. **Operations Agents** - Order Ops, 3PL Coordinator, Returns & Refunds, Customer Support Lead, Quality & Risk
5. **Platform/Engineering Agents** - Architecture, Backend Builder, Frontend Builder, Automation Builder, Security/Compliance

### Layer C: Tool & Integration Gateway (External Interface)
**Purpose:** Unified gateway for all external actions with proof-carrying execution

**Integrations:**
- **E-commerce Platforms** - Shopify, TikTok Shop, YouTube, Amazon, eBay, Etsy
- **Fulfillment** - ShipBob, AU 3PLs, shipping labels
- **Payments** - Stripe, PayPal, Wise
- **Accounting** - Xero, QuickBooks Online
- **Advertising** - TikTok Ads, Meta Ads, Google Ads
- **Support** - Gorgias, Zendesk, email
- **Research** - Scraping tools, trend APIs
- **Internal** - Database, queues, file storage, analytics

### Layer D: Data & Memory Platform (Knowledge Layer)
**Purpose:** What the system knows and learns

**Data Stores:**
- **Operational DB** - Orders, products, listings, payouts, tickets
- **Knowledge Base (RAG)** - Suppliers, SOPs, brand rules, platform policies, creative playbooks
- **Event Store** - Every action/event for audit + replay
- **Metrics Store** - CAC, ROAS, contribution margin, delivery SLAs, refund rates
- **Long-term Memory** - Decisions + learnings (what creatives worked, suppliers that failed, etc.)

## Beyond Agentic: Post-Agentic Capabilities

### 1. Proof-Carrying Actions (Formal Verification)
**What it is:** Actions must come with machine-checkable proofs they won't violate business invariants

**Invariants:**
- Never scale ad set if projected contribution margin < 15%
- Never publish listing copy that violates banned-claim patterns
- Never approve refunds above $X without founder approval
- Never reorder if cashflow runway < N days

**How it works:**
```
Action Packet = {
  proposed_action: "scale_ad_set",
  evidence: {...},
  proof: {
    invariant_checks: [
      {id: "margin_floor", status: "PASS", value: 18.2},
      {id: "budget_cap", status: "PASS", remaining: 2400}
    ]
  }
}
```

### 2. World Model + Counterfactual Engine
**What it is:** Simulates "what if" scenarios before executing

**Capabilities:**
- "If we raise price 7%, what happens to conversion and refunds?"
- "If we switch suppliers, what happens to delivery SLA and chargebacks?"
- "If TikTok CPM spikes 30% tomorrow, how should we re-allocate budget tonight?"

**How it works:**
- Causal graph: traffic → conversion → fulfillment → refunds → chargebacks → payout holds
- Counterfactual evaluator runs candidate actions through model
- Decision rule: "only deploy actions that beat baseline by X with risk under Y"

### 3. Policy Learning Layer (Self-Improving)
**What it is:** System learns optimal decisions from outcomes, not prompts

**Components:**
- **State Snapshots** - Hourly business state capture
- **Action Log** - Every decision with context
- **Reward Model** - Profit - penalties (refunds, chargebacks, policy violations)
- **Policy Service** - Outputs actions with confidence + explanations
- **Learning Loop** - Human overrides become training labels

**How it works:**
```
State → Policy → Action → Outcome → Reward → Update Policy
```

### 4. Enterprise Compiler (Goal → Execution)
**What it is:** Converts business goals into executable programs

**Input:**
```json
{
  "goal": "Increase net profit 18% over 30 days while keeping refund rate < 3.5% and SLA < 2.2 days",
  "constraints": {
    "max_risk": "medium",
    "approval_required": true
  }
}
```

**Output:**
- New reward function weights
- New policy constraints
- New experiments (A/B tests)
- Code changes + migrations (behind feature flags)
- Monitoring + rollback plans

### 5. Adversarial Self-Play (Robustness Testing)
**What it is:** Opponent agents try to break the system

**Red Team Agents:**
- Try to get listings banned
- Cause chargebacks
- Exploit refund policies
- Trigger fulfillment failures
- Detect compliance holes

**How it works:**
- Ops policy only ships if it beats adversary in simulation
- Continuous red-teaming in shadow mode
- Automatic policy hardening

## Risk Levels (Autonomy with Safety)

### L0: Safe (Fully Autonomous)
- Draft copy
- Generate reports
- Analyze data
- Create recommendations

### L1: Operational (Autonomous with Guardrails)
- Publish listings (after policy check)
- Respond to support tickets
- Adjust ad budgets (within caps)
- Process standard refunds

### L2: Money Movement (Approval Required)
- Refunds > $X
- Supplier payments
- Ad budget increases > Y%
- Price changes > Z%

### L3: Irreversible/High Risk (Founder-Only)
- Creator payouts
- Policy changes
- Account access modifications
- Platform integrations

## Standard Task Object

Every agent task follows this contract:

```json
{
  "task_id": "uuid",
  "goal_id": "uuid",
  "owner_agent": "agent_name",
  "inputs": {
    "links": [],
    "files": [],
    "records": []
  },
  "required_tools": ["tool1", "tool2"],
  "constraints": {
    "budget": 1000,
    "time_limit": "2h",
    "policy": "refund_policy_v3"
  },
  "risk_level": "L1",
  "done_definition": "Acceptance criteria",
  "outputs": {
    "records_created": [],
    "records_updated": [],
    "files": [],
    "messages": []
  },
  "audit_log": [
    {
      "timestamp": "2024-12-29T10:00:00Z",
      "tool": "stripe_api",
      "action": "create_refund",
      "result": "success"
    }
  ]
}
```

## Event Bus Architecture

Everything emits events for coordination:

### Commerce Events
- `OrderPlaced`, `PaymentFailed`, `PaymentCaptured`
- `RefundRequested`, `RefundApproved`, `RefundProcessed`
- `StockLow`, `StockOut`, `StockReplenished`

### Live Shopping Events
- `LiveShowScheduled`, `LiveShowStarted`, `LiveShowEnded`
- `ProductPinned`, `PriceDropped`, `ViewerJoined`

### Creator Events
- `CreatorOnboarded`, `PayoutEligible`, `PayoutProcessed`
- `CommissionEarned`, `TierUpgraded`

### Operations Events
- `DisputeOpened`, `EvidenceSubmitted`, `DisputeResolved`
- `ListingPublished`, `ListingBanned`, `ListingUpdated`

### Financial Events
- `SettlementReceived`, `ReconciliationMismatch`, `ChargebackOpened`
- `LedgerEntryCreated`, `PayoutApproved`

### Marketing Events
- `CreativeApproved`, `AdSetPaused`, `AdSetScaled`
- `CampaignLaunched`, `BudgetExhausted`

## Core Workflows (Autonomous Loops)

### Workflow A: Product → Profit Loop
**Purpose:** TikTok arbitrage engine - find products, source, launch, optimize

**Steps:**
1. Trend Scout finds opportunities
2. Product Research scores (margin + demand + policy risk)
3. Supplier Sourcing gets quotes + lead times
4. Offer Architect creates bundle + pricing
5. Creative Director generates creative plan
6. Listing Publisher pushes listings
7. Ads Optimizer launches tests
8. Order Ops + 3PL Coordinator fulfill + monitor SLA
9. CFO Agent reconciles + updates true margin
10. System writes learnings to memory + updates scoring model

### Workflow B: Live Shopping Network Loop
**Purpose:** LSN core - creator → live show → orders → payouts

**Steps:**
1. Creator onboarding + verification
2. Product ingestion + compliance checks
3. Live event scheduling + multichannel streaming setup
4. Live order capture + payment + fraud checks
5. Post-live follow-up (replay clips, retargeting, email/SMS)
6. Creator payouts + brand settlement + disputes

### Workflow C: Support → Retention Loop
**Purpose:** Customer service with churn prevention

**Steps:**
1. Tickets triaged (sentiment + urgency)
2. Auto-resolve common issues with policy + order context
3. Escalate exceptions (L2/L3)
4. Detect repeated product faults → notify QA + pause ads/listing if needed

### Workflow D: Finance Ops Loop
**Purpose:** Reconciliation and payout management

**Steps:**
1. Ingest all transactions (orders, fees, refunds, payouts)
2. Create ledger entries
3. Match payout settlements to order-level detail
4. Flag mismatches
5. Approve payouts & creator payments (founder-only)

## Deployment Architecture

### Services (Microservices)
- **Event Ingestor** (:7101) - Receives all business events
- **Tool Gateway** (:7102) - Enforces proof + approvals + idempotency
- **Verifier Service** (:7103) - Checks invariants before execution
- **Policy Service** (:7104) - Generates actions using learned policy
- **World Model** (:7105) - Counterfactual evaluation
- **Compiler Service** (:7106) - Goals → executable programs
- **Ops Console** (:7107) - Real-time monitoring dashboard

### Infrastructure
- **PostgreSQL** - Event store + ledger + operational data
- **Redis** - BullMQ queues for workers
- **Docker Compose** - Local development
- **Railway** - Production deployment

### Workers (Background Jobs)
- **Snapshotter** - Hourly state capture
- **Pipeline Tick** - Decide → Evaluate → Verify → Execute loop
- **Policy Learner** - Updates policy from outcomes
- **Reconciliation** - Nightly settlement matching

## Guardrails (Autonomous but Safe)

### Budget Controls
- Daily ad spend caps
- Kill-switch rules for ROAS < threshold
- Budget reallocation limits

### Margin Rules
- Don't scale anything below X% contribution margin
- Auto-pause products with negative margin
- Supplier cost increase alerts

### Platform Policy Checks
- Listing compliance preflight before publish
- Banned claim pattern detection
- Image/video content moderation

### Fraud Rules
- Velocity checks (orders per IP/device)
- Mismatched address detection
- Chargeback risk scoring
- High-value first-order holds

### Change Management
- L2/L3 actions require approval
- All actions logged + reversible where possible
- Shadow mode for new policies
- Canary deployment for changes

### Observability
- Business Health Dashboard
- Alerts: stockouts, refund spikes, ROAS drops
- Real-time metric monitoring
- Anomaly detection

## Success Metrics

### System Performance
- **Autonomy Rate** - % of decisions made without human intervention
- **Proof Pass Rate** - % of actions that pass invariant checks
- **Prediction Accuracy** - World model counterfactual accuracy
- **Policy Improvement** - Week-over-week reward increase
- **Rollback Rate** - % of deployments that need rollback

### Business Impact
- **Profit per Decision** - Average profit impact of autonomous decisions
- **Time to Market** - Product idea → live listing time
- **Operational Efficiency** - Cost per order processed
- **Risk Reduction** - Chargebacks, refunds, policy violations
- **Scale Velocity** - GMV growth rate with same team size

## Next Steps

1. **Implement Foundation** - Registries + contracts + event bus
2. **Build Core Services** - Event Ingestor, Tool Gateway, Verifier
3. **Add Policy Learning** - State snapshots + reward model
4. **Implement World Model** - Counterfactual evaluation
5. **Wire Workflows** - Product→Profit, Live→Settlement
6. **Deploy Shadow Mode** - Validate before full autonomy
7. **Enable Canary** - Gradual rollout with monitoring
8. **Full Autonomy** - Let the system run itself

---

**Document Version:** 1.0  
**Last Updated:** December 29, 2024  
**Owner:** Founder + AI Engineering Team
