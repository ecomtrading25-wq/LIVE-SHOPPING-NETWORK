# n8n Setup Instructions for Business OS Integration

## 🚀 Quick Start

### 1. Access n8n Interface

Open your browser and navigate to:
**https://5678-idzpgzimbog6rjuz7mcn5-a949f156.sg1.manus.computer**

### 2. Initial Setup

On first access, you'll need to:
1. Create an owner account (email + password)
2. Complete the initial setup wizard

### 3. Configure Environment Variables

Before importing workflows, set up these environment variables in n8n:

1. Go to **Settings** → **Environments**
2. Add the following variable:
   - `BUSINESS_OS_URL`: Your Business OS URL (e.g., `https://your-domain.manus.space`)

### 4. Import Workflow Templates

Two workflow templates are provided in this directory:

#### A. Payout Processor (`payout-processor.json`)
**Purpose**: Automated creator/vendor payouts with safety gates

**Features**:
- Daily execution at 2 AM
- Calculates payouts based on performance
- Policy gate evaluation
- Approval workflow for high-value payouts
- Stripe/PayPal/Wise integration
- Double-entry ledger logging
- Owner notifications

**To Import**:
1. In n8n, click **Workflows** → **Add workflow**
2. Click the **⋮** menu → **Import from file**
3. Select `payout-processor.json`
4. Click **Save**

#### B. Content Factory (`content-factory.json`)
**Purpose**: Automated content creation and multi-platform publishing

**Features**:
- Hourly execution
- Performance analysis
- Contextual bandit for creative selection
- AI content generation
- Multi-platform scheduling (TikTok, Instagram, YouTube)
- Performance tracking and feedback loop

**To Import**:
1. In n8n, click **Workflows** → **Add workflow**
2. Click the **⋮** menu → **Import from file**
3. Select `content-factory.json`
4. Click **Save**

### 5. Configure Workflow Connections

After importing, you need to configure the HTTP authentication for Business OS API calls:

1. Open each workflow
2. Click on any HTTP Request node
3. Under **Authentication**, select **Header Auth**
4. Add credentials:
   - **Name**: `Business-OS-Auth`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_API_KEY` (get this from your Business OS settings)

### 6. Register Workflows in Business OS

Once workflows are imported and configured in n8n:

1. Navigate to your Business OS Control Room: `https://your-domain.manus.space/business-os`
2. Go to the **Workflows** tab
3. Click **Register n8n Workflow**
4. For each workflow, provide:
   - **n8n Workflow ID**: (found in n8n workflow URL)
   - **Name**: "Payout Processor" or "Content Factory"
   - **Description**: Brief description of what it does
   - **Autonomy Level**: 
     - Payout Processor: Start with **A1 (Assisted)**
     - Content Factory: Start with **A2 (Supervised)**
   - **Trigger Type**: 
     - Payout Processor: **cron**
     - Content Factory: **cron**

### 7. Test Workflows

Before enabling automatic execution:

1. In n8n, open each workflow
2. Click **Execute Workflow** (play button)
3. Monitor the execution in the workflow view
4. Check the Business OS Control Room for:
   - Event logs
   - Action logs
   - Approval requests (for Payout Processor)
   - Content generation results (for Content Factory)

### 8. Enable Automatic Execution

Once testing is successful:

1. In n8n, activate each workflow by toggling the **Active** switch
2. In Business OS, set the appropriate autonomy level:
   - **A0**: Manual (drafts only) - for initial testing
   - **A1**: Assisted (asks approval for risky steps) - for Payout Processor
   - **A2**: Supervised (auto-runs within policy) - for Content Factory
   - **A3**: Autonomous (full autopilot) - after validation period
   - **A4**: Self-optimizing (launches experiments) - for mature workflows

## 🔒 Safety Configuration

### Policy Gates

Before running the Payout Processor, ensure these policies are configured in Business OS:

1. Navigate to **Policies** tab in Business OS
2. Create "Payout Safety Gate" policy:

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
      { 
        "type": "require_approval", 
        "message": "High-value payout requires founder approval" 
      }
    ]
  }
}
```

### Approval Workflow

For payouts requiring approval:

1. You'll receive notifications in Business OS
2. Navigate to **Approvals** tab
3. Review the payout details
4. Approve or reject with reason
5. The workflow will continue or halt based on your decision

### Kill Switch

In case of emergency:

1. Navigate to **Incidents** tab in Business OS
2. Click **Activate Kill Switch**
3. All autonomous workflows will pause immediately
4. Manual review required to resume

## 📊 Monitoring

### Real-time Monitoring

Monitor workflow execution in multiple places:

1. **n8n Interface**: 
   - View execution history
   - See node-by-node results
   - Debug failed executions

2. **Business OS Control Room**:
   - **Events** tab: All system events
   - **Actions** tab: Tool calls with latency/cost
   - **Outcomes** tab: Task results with rewards
   - **Audit Trail**: Complete history

### Key Metrics to Track

- **Payout Processor**:
  - Total payouts processed
  - Approval rate
  - Policy violations
  - Average processing time
  - Error rate

- **Content Factory**:
  - Content pieces generated
  - Publishing success rate
  - Engagement metrics
  - Bandit arm performance
  - Content quality scores

## 🔧 Troubleshooting

### Common Issues

1. **Workflow not executing**:
   - Check if workflow is activated in n8n
   - Verify cron expression is correct
   - Check n8n logs for errors

2. **API calls failing**:
   - Verify BUSINESS_OS_URL is correct
   - Check authentication credentials
   - Ensure Business OS is accessible

3. **Policy gates blocking everything**:
   - Review policy conditions
   - Check if thresholds are too strict
   - Temporarily lower autonomy level

4. **Approvals not appearing**:
   - Verify approval workflow is configured
   - Check notification settings
   - Review Business OS logs

### Getting Help

- Check n8n documentation: https://docs.n8n.io
- Review Business OS logs in Control Room
- Contact support if issues persist

## 🎯 Next Steps

After successful setup:

1. **Add More Workflows**:
   - Dispute Handler
   - Creator Scheduler
   - Inventory Replenishment
   - Ad Spend Optimizer

2. **Increase Autonomy**:
   - Gradually move from A1 → A2 → A3
   - Monitor closely at each level
   - Set up alerts for anomalies

3. **Optimize Performance**:
   - Review bandit arm performance
   - Update policies based on learnings
   - Experiment with new strategies

4. **Scale Operations**:
   - Add more business units
   - Deploy additional agents
   - Expand to new platforms

## 📚 Additional Resources

- Business OS Setup Guide: `BUSINESS_OS_SETUP.md`
- Business OS README: `BUSINESS_OS_README.md`
- AI Business OS Guide: `AI_BUSINESS_OS_GUIDE.md`
- n8n Documentation: https://docs.n8n.io
- Business OS Control Room: `https://your-domain.manus.space/business-os`
