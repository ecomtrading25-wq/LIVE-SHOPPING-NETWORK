# Live Shopping Network - Operations Runbook

## 📋 Daily Operations

### Morning Checklist (9:00 AM)
- [ ] Check Operations Center dashboard for alerts
- [ ] Review overnight order volume and status
- [ ] Check live show schedule for today
- [ ] Review pending disputes (SLA < 24h)
- [ ] Check creator payout queue
- [ ] Verify inventory levels for today's shows
- [ ] Review fraud detection alerts

### Evening Checklist (6:00 PM)
- [ ] Review day's GMV and conversion rates
- [ ] Check all live shows completed successfully
- [ ] Process pending creator payouts
- [ ] Review customer support tickets
- [ ] Check warehouse fulfillment status
- [ ] Verify all webhooks processed successfully

---

## 🚨 Incident Response

### Priority Levels

**P0 - Critical (Resolve within 1 hour)**
- Site completely down
- Payment processing failure
- Data breach or security incident
- Live show cannot start

**P1 - High (Resolve within 4 hours)**
- Partial site outage
- Webhook delivery failures
- Database connection issues
- Creator payout failures

**P2 - Medium (Resolve within 24 hours)**
- Individual feature not working
- Performance degradation
- Non-critical API errors
- UI display issues

**P3 - Low (Resolve within 1 week)**
- Minor bugs
- Enhancement requests
- Documentation updates
- Cosmetic issues

### Incident Response Process

1. **Identify**: Alert received or issue reported
2. **Assess**: Determine priority level
3. **Escalate**: Notify appropriate team members
4. **Investigate**: Review logs and metrics
5. **Resolve**: Implement fix or workaround
6. **Verify**: Test resolution in production
7. **Document**: Update runbook with learnings
8. **Communicate**: Notify stakeholders of resolution

---

## 💳 Payment Operations

### Processing PayPal Payments

**Normal Flow:**
1. Customer completes checkout
2. PayPal payment captured
3. Webhook received → order status updated
4. Inventory reserved
5. Order sent to fulfillment

**Troubleshooting:**

**Issue: Payment capture fails**
```bash
# Check PayPal credentials
echo $PAYPAL_CLIENT_ID
echo $PAYPAL_MODE

# Review PayPal transaction logs
# Management UI → Operations Center → Payments → PayPal Transactions

# Verify webhook delivery
# PayPal Dashboard → Webhooks → Event History
```

**Issue: Webhook not received**
```bash
# Check webhook endpoint is accessible
curl -I https://your-domain.manus.space/api/webhooks/paypal

# Verify webhook signature verification
# Check logs for signature validation errors

# Manually sync payment status
# Management UI → Operations Center → Payments → Sync PayPal Status
```

### Processing Refunds

**Standard Refund Process:**
1. Customer requests refund
2. Support reviews request
3. Refund approved in admin panel
4. PayPal refund initiated
5. Webhook received → order status updated
6. Customer notified

**Partial Refunds:**
- Navigate to order in admin panel
- Click "Issue Partial Refund"
- Enter refund amount and reason
- Confirm refund

**Full Refunds:**
- Navigate to order in admin panel
- Click "Issue Full Refund"
- Select reason from dropdown
- Confirm refund

---

## 👥 Creator Payout Operations

### Weekly Payout Process

**Schedule:** Every Friday at 2:00 PM

**Steps:**
1. Navigate to Creator Dashboard
2. Click "Generate Payout Batch"
3. Review payout amounts and recipients
4. Verify bank details are current
5. Click "Process Payouts"
6. Monitor Wise transfer status
7. Handle any failed transfers

**Payout Calculation:**
```
Creator Earnings = (Order Total - Costs) × Commission Rate
Where:
- Order Total = Sum of all orders attributed to creator
- Costs = Product cost + Shipping + Platform fee
- Commission Rate = Based on creator tier (10-30%)
```

**Troubleshooting:**

**Issue: Payout fails**
```bash
# Check Wise credentials
echo $WISE_API_TOKEN
echo $WISE_PROFILE_ID

# Review Wise transfer logs
# Management UI → Creator Dashboard → Payouts → Transfer History

# Verify recipient bank details
# Management UI → Creator Dashboard → Creators → Bank Accounts

# Retry failed payout
# Management UI → Creator Dashboard → Payouts → Retry Failed
```

**Issue: Creator disputes payout amount**
1. Navigate to Creator Dashboard
2. Find creator's payout record
3. Click "View Breakdown"
4. Review attributed orders
5. Verify commission calculation
6. Adjust if error found
7. Process adjustment payout

---

## 📦 Dispute Management

### Dispute Lifecycle

**States:**
1. **OPEN** - Dispute received from PayPal
2. **EVIDENCE_REQUIRED** - Need to submit evidence
3. **EVIDENCE_BUILDING** - Gathering evidence
4. **EVIDENCE_READY** - Ready to submit
5. **SUBMITTED** - Evidence submitted to PayPal
6. **WON/LOST** - Dispute resolved
7. **CLOSED** - Case closed

### Evidence Collection Checklist

For each dispute, gather:
- [ ] Order confirmation email
- [ ] Shipping tracking number
- [ ] Delivery confirmation
- [ ] Product description and images
- [ ] Customer communication history
- [ ] Refund policy
- [ ] Terms of service

### Submitting Evidence

**Automated Process:**
1. Dispute webhook received
2. System automatically gathers evidence
3. Evidence pack generated
4. Auto-submitted if deadline > 48h

**Manual Process:**
1. Navigate to Operations Center → Disputes
2. Find dispute in queue
3. Click "Review Evidence"
4. Add additional evidence if needed
5. Click "Submit to PayPal"
6. Monitor dispute status

**Best Practices:**
- Submit evidence within 24 hours of dispute creation
- Include all relevant documentation
- Use clear, professional language
- Provide tracking numbers for all shipments
- Keep evidence concise and organized

---

## 📺 Live Show Operations

### Pre-Show Checklist (30 minutes before)

- [ ] Verify creator is online and ready
- [ ] Test video and audio quality
- [ ] Verify products are pinned correctly
- [ ] Check inventory levels for featured products
- [ ] Test chat functionality
- [ ] Verify price drops are scheduled
- [ ] Send reminder notifications to followers

### During Show Monitoring

- [ ] Monitor viewer count
- [ ] Watch for chat moderation needs
- [ ] Track product sales in real-time
- [ ] Monitor stream quality metrics
- [ ] Be ready to assist with technical issues

### Post-Show Checklist

- [ ] Verify recording saved successfully
- [ ] Generate show performance report
- [ ] Process any pending orders
- [ ] Update creator performance metrics
- [ ] Create highlight clips for social media
- [ ] Schedule replay availability

### Troubleshooting Live Shows

**Issue: Stream won't start**
```bash
# Check Twilio credentials
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_API_KEY_SID

# Verify Twilio room creation
# Management UI → Live Shows → Technical Logs

# Check creator's internet connection
# Minimum required: 5 Mbps upload

# Verify browser compatibility
# Supported: Chrome 74+, Firefox 66+, Safari 12.1+
```

**Issue: Poor video quality**
1. Check creator's internet speed
2. Reduce video resolution if needed
3. Verify Twilio region selection
4. Check viewer's connection
5. Consider switching to backup stream

**Issue: Chat not working**
1. Verify WebSocket connection
2. Check CORS configuration
3. Review browser console for errors
4. Test with different browser
5. Check rate limiting settings

---

## 📊 Inventory Management

### Daily Inventory Checks

**Morning:**
- Review low stock alerts
- Check reorder points
- Verify incoming shipments
- Update stock levels

**Evening:**
- Reconcile day's sales with inventory
- Check for overselling incidents
- Update forecasts
- Plan tomorrow's shows based on stock

### Reorder Process

**Automated Reorders:**
- System triggers when stock < reorder point
- PO generated automatically
- Sent to supplier via email
- Tracked in Purchasing Dashboard

**Manual Reorders:**
1. Navigate to Purchasing Dashboard
2. Click "Create Purchase Order"
3. Select supplier and products
4. Enter quantities and pricing
5. Review landed cost calculation
6. Submit PO to supplier

### Handling Overselling

**Prevention:**
- Real-time inventory reservation
- Buffer stock for popular items
- Live stock sync during shows

**If Overselling Occurs:**
1. Identify affected orders
2. Contact customers immediately
3. Offer alternatives or refund
4. Update inventory counts
5. Investigate root cause
6. Implement preventive measures

---

## 🔍 Fraud Detection

### Daily Fraud Review

**High-Risk Orders (Score > 70):**
1. Navigate to Fraud Console
2. Review flagged orders
3. Check fraud indicators:
   - Velocity (multiple orders same IP)
   - Device fingerprint
   - IP reputation
   - Geolocation mismatch
   - Payment method history
4. Decide: Approve, Review, or Decline
5. Document decision reasoning

**Fraud Indicators:**
- Multiple orders from same IP in short time
- Shipping address doesn't match billing
- High-value first-time order
- VPN or proxy detected
- Suspicious email domain
- Multiple failed payment attempts

### Fraud Response Actions

**Approve:**
- Order proceeds normally
- Update fraud model with false positive

**Review:**
- Contact customer for verification
- Request additional documentation
- Hold order for 24-48 hours

**Decline:**
- Refund payment immediately
- Add to blocklist if confirmed fraud
- Report to payment processor

---

## 📞 Customer Support

### Support Ticket Triage

**Priority Levels:**
- **Urgent**: Payment issues, order not received
- **High**: Shipping delays, product defects
- **Medium**: Account questions, feature requests
- **Low**: General inquiries, feedback

### Common Support Scenarios

**"Where is my order?"**
1. Look up order by number or email
2. Check order status and tracking
3. Provide tracking link
4. Set expectation for delivery
5. Offer proactive updates

**"I want to return this"**
1. Verify order is within return window (30 days)
2. Check return eligibility
3. Generate RMA number
4. Send return instructions
5. Process refund upon receipt

**"I was charged twice"**
1. Check order history
2. Verify payment transactions
3. Confirm duplicate charge
4. Initiate refund for duplicate
5. Apologize and explain

**"Product is defective"**
1. Gather product details and photos
2. Verify purchase date
3. Offer replacement or refund
4. Generate return label
5. Flag product for quality review

---

## 🔧 System Maintenance

### Weekly Maintenance (Sunday 2:00 AM)

```bash
# Database optimization
pnpm db:optimize

# Clear old logs (> 90 days)
pnpm logs:cleanup

# Backup database
pnpm db:backup

# Update exchange rates
pnpm currency:update

# Generate weekly reports
pnpm reports:weekly
```

### Monthly Maintenance (First Saturday)

```bash
# Update dependencies
pnpm update

# Security audit
pnpm audit

# Performance review
pnpm perf:analyze

# Backup verification
pnpm backup:verify

# SSL certificate check
pnpm ssl:check
```

### Quarterly Maintenance

- Review and rotate API keys
- Update privacy policy and terms
- Conduct security audit
- Review and optimize database indexes
- Update disaster recovery plan
- Test backup restoration
- Review and update runbooks

---

## 📈 Performance Monitoring

### Key Metrics to Monitor

**Application Health:**
- Uptime: Target > 99.9%
- API Response Time: Target < 200ms p95
- Error Rate: Target < 0.1%
- Database Query Time: Target < 50ms p95

**Business Metrics:**
- GMV (Gross Merchandise Value)
- Conversion Rate
- Average Order Value
- Customer Acquisition Cost
- Creator Earnings
- Live Show Engagement

**Operational Metrics:**
- Order Fulfillment Time
- Dispute Win Rate
- Payout Success Rate
- Inventory Turnover
- Customer Support Response Time

### Alert Thresholds

**Critical Alerts:**
- Uptime < 99%
- Error rate > 1%
- Payment failure rate > 5%
- Database connection failures

**Warning Alerts:**
- API response time > 500ms
- Disk usage > 80%
- Memory usage > 85%
- Webhook delivery failures

---

## 🆘 Emergency Contacts

### Internal Team
- **Technical Lead**: [Configure]
- **Operations Manager**: [Configure]
- **Customer Support Lead**: [Configure]
- **Finance Manager**: [Configure]

### External Services
- **Manus Support**: https://help.manus.im
- **PayPal Support**: 1-888-221-1161
- **Wise Support**: https://wise.com/help
- **Twilio Support**: https://support.twilio.com
- **Stripe Support**: https://support.stripe.com

### Escalation Path

1. **On-call Engineer** (24/7)
2. **Technical Lead** (if unresolved in 1 hour)
3. **CTO** (if unresolved in 4 hours)
4. **CEO** (for business-critical issues)

---

## 📚 Additional Resources

- **Technical Documentation**: `/DEPLOYMENT.md`
- **API Reference**: Management UI → Documentation
- **Database Schema**: `drizzle/schema.ts`
- **Architecture Overview**: `/DEPLOYMENT.md` Section 12
- **Feature List**: `/todo.md`

---

**Document Version:** 1.0  
**Last Updated:** December 29, 2024  
**Next Review:** January 29, 2025  
**Owner:** Operations Team
