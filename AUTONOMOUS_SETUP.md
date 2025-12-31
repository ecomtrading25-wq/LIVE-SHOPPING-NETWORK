# 🤖 Autonomous Operations - Quick Start Guide

## What You've Got

Your Live Shopping Network now includes a complete autonomous operation stack:

```
✅ Email Service         - SendGrid integration with templates
✅ Monitoring & Alerting - Real-time metrics with Slack/email alerts  
✅ Agent Orchestrator    - Policy enforcement & approval workflows
✅ Autonomous Scheduler  - 12 automated cron jobs
✅ Self-Healing          - Retry logic, circuit breakers, DLQ
```

---

## ⚡ 5-Minute Setup

### Step 1: Get API Keys

| Service | Get Key At | Purpose |
|---------|-----------|---------|
| **SendGrid** | sendgrid.com | Email (free tier: 100/day) |
| **Slack** | api.slack.com/apps | Alerts |

### Step 2: Set Environment Variables

In Manus Management UI → Settings → Secrets, add:

```bash
# Email Service
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourdomain.com

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
FOUNDER_EMAIL=you@example.com
ALERT_EMAIL=you@example.com

# Enable Autonomous Mode
ENABLE_AUTONOMOUS=true

# Payout Safety Limits
DAILY_PAYOUT_LIMIT=5000
SINGLE_PAYOUT_LIMIT=1000
```

### Step 3: Deploy

Click **Publish** in Management UI. Done! 🎉

---

## 📊 What Runs Automatically

### Every 5 Minutes
- 🔍 Fraud scan on new orders
- 📬 Process notification queue

### Every Hour
- 🛒 Abandoned cart recovery emails
- 📦 Order status sync

### Every 30 Minutes
- 📊 Inventory sync to channels
- 💱 Exchange rate updates

### Daily
- 📈 **8 AM**: Daily summary email to founder
- 🌙 **1 AM**: Creator payout processing
- 🌙 **2 AM**: Inventory reorder check
- 🌙 **3 AM**: Data cleanup

### Weekly
- 📊 Monday 8 AM: Performance report

### Monthly
- 💰 1st of month: Financial reconciliation

---

## 🚨 Alert Triggers

You'll get Slack/Email alerts when:

| Condition | Severity |
|-----------|----------|
| Revenue drops >50% in 1 hour | 🔴 CRITICAL |
| Payment failure rate >10% | 🔴 CRITICAL |
| Fraud rate >5% | 🔴 CRITICAL |
| Error rate >5% | 🔴 CRITICAL |
| Response time >5s | 🔴 CRITICAL |
| Revenue drops >30% in 1 hour | 🟡 WARNING |
| No orders in 1 hour | 🟡 WARNING |
| Products out of stock | 🟡 WARNING |
| >5 open disputes | 🟡 WARNING |

---

## 🛡️ Safety Controls

### Automatic Limits
- Daily payout cap: $5,000 (configurable)
- Single payout cap: $1,000 (configurable)
- High-risk actions require founder approval

### Kill Switch
Auto-activates when:
- Revenue drops >50% suddenly
- Fraud rate exceeds 10%
- Error rate exceeds 5%
- Multiple payout failures

---

## 📧 Your Daily Routine

### Morning (2 minutes)
1. Check daily summary email
2. Review any pending approvals
3. Glance at Slack for overnight alerts

### That's it!

The system handles:
- ✅ Order processing
- ✅ Inventory monitoring
- ✅ Fraud detection
- ✅ Creator payouts
- ✅ Customer notifications
- ✅ Dispute detection
- ✅ Performance tracking

---

## 🔧 Customization

### Adjust Payout Limits

```bash
# In environment variables
DAILY_PAYOUT_LIMIT=10000
SINGLE_PAYOUT_LIMIT=2000
```

### Adjust Alert Thresholds

Edit in `server/monitoring-service.ts`:

```typescript
monitoring.addThreshold({
  metric: 'hourly_revenue',
  operator: 'lt',
  value: 100,  // Alert if revenue < $100/hour
  severity: 'warning',
});
```

---

## 🆘 Troubleshooting

### No Daily Summary Email
1. Check SENDGRID_API_KEY is set
2. Check FOUNDER_EMAIL is set
3. Check Railway logs for email errors

### Alerts Not Working
1. Check SLACK_WEBHOOK_URL is valid
2. Test webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL`

### Autonomous Tasks Not Running
1. Check ENABLE_AUTONOMOUS=true
2. Check logs for scheduler errors
3. Verify database connection

### Kill Switch Activated Unexpectedly
1. Check monitoring alerts for cause
2. Fix underlying issue
3. Deactivate: Go to Admin Dashboard → System Controls

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server/email-service.ts` | Email sending & templates |
| `server/monitoring-service.ts` | Metrics & alerts |
| `server/agent-orchestrator.ts` | Agent management & policies |
| `server/autonomous-scheduler.ts` | Cron job scheduling |
| `server/self-healing.ts` | Retry & recovery |

---

## ✅ Pre-Launch Checklist

- [ ] SendGrid API key set and verified
- [ ] Slack webhook receiving test messages
- [ ] FOUNDER_EMAIL receiving test emails
- [ ] ENABLE_AUTONOMOUS=true
- [ ] Test order placed successfully
- [ ] Daily summary runs (check logs)
- [ ] Monitoring checks passing

---

**You're ready for autonomous operation!** 🤖

The system will now run your live shopping business 24/7 with minimal intervention.
