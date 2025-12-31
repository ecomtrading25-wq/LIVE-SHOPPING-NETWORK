# Live Shopping Network - Deployment Configuration Guide

## 🎯 Overview

This guide provides step-by-step instructions for configuring all third-party integrations required for full autonomous operation of the Live Shopping Network platform.

---

## 📋 Configuration Checklist

### ✅ Already Configured (Built-in)
These are automatically provided by Manus and require no action:
- `DATABASE_URL` - MySQL/TiDB connection
- `JWT_SECRET` - Session signing
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth backend
- `VITE_OAUTH_PORTAL_URL` - Login portal
- `OWNER_OPEN_ID`, `OWNER_NAME` - Owner info
- `BUILT_IN_FORGE_API_URL` - Manus built-in APIs
- `BUILT_IN_FORGE_API_KEY` - Server-side API token
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend API token
- `STRIPE_SECRET_KEY` - Stripe test sandbox (needs claiming)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhooks
- `TWILIO_*` - Twilio credentials for SMS/streaming

### 🔧 Required for Autonomous Operations
These MUST be configured for the platform to run autonomously:

#### 1. Core Operations (CRITICAL)
```bash
ENABLE_AUTONOMOUS=true              # Enable 24/7 autonomous mode
FOUNDER_EMAIL=your@email.com        # Daily summary recipient
SENDGRID_API_KEY=SG.xxx            # Email notifications
SLACK_WEBHOOK_URL=https://hooks... # Real-time alerts
```

#### 2. Live Streaming & AI Avatars (CRITICAL)
```bash
HEYGEN_API_KEY=xxx                 # AI avatar generation
ELEVENLABS_API_KEY=xxx             # Voice synthesis (optional, can use OpenAI)
AGORA_APP_ID=xxx                   # Video streaming infrastructure
ENABLE_AUTONOMOUS_STREAMS=true     # Enable 24/7 streaming
```

#### 3. Product Sourcing (IMPORTANT)
```bash
CJ_API_KEY=xxx                     # CJ Dropshipping integration
ALIEXPRESS_API_KEY=xxx             # AliExpress (optional)
TIKTOK_SHOP_ACCESS_TOKEN=xxx       # TikTok Shop integration
TIKTOK_SHOP_SHOP_ID=xxx            # TikTok Shop ID
```

#### 4. Creator Payouts (IMPORTANT)
```bash
WISE_API_TOKEN=xxx                 # Wise for international payouts
PAYPAL_CLIENT_ID=xxx               # PayPal integration
PAYPAL_CLIENT_SECRET=xxx           # PayPal secret
```

#### 5. Australian Shipping (IMPORTANT)
```bash
AUSPOST_API_KEY=xxx                # Australia Post shipping
SENDLE_API_ID=xxx                  # Sendle shipping
SENDLE_API_KEY=xxx                 # Sendle API key
```

#### 6. Australian Payments (IMPORTANT)
```bash
AFTERPAY_MERCHANT_ID=xxx           # Afterpay BNPL
AFTERPAY_SECRET_KEY=xxx            # Afterpay secret
ZIP_MERCHANT_ID=xxx                # Zip BNPL
ZIP_API_KEY=xxx                    # Zip API key
```

---

## 🚀 Step-by-Step Setup

### Step 1: Claim Stripe Test Sandbox (2 minutes)

The platform already has a Stripe test sandbox created. You need to claim it:

1. Visit: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xU2hITmg0dDVkUXo2dW1NLDE3NjczNDk4MDEv100LDEqH8Ud
2. Claim before: 2026-02-24T10:30:01.000Z
3. The keys are already configured in the platform
4. For production, upgrade to live Stripe account

**Status**: ✅ Test keys already configured, just needs claiming

---

### Step 2: Configure Core Operations (10 minutes)

#### A. SendGrid Email Setup
1. Sign up at https://sendgrid.com (Free tier: 100 emails/day)
2. Create API key with "Mail Send" permission
3. Verify sender domain or email
4. Add to platform: `SENDGRID_API_KEY=SG.xxx`

#### B. Slack Alerts Setup
1. Go to your Slack workspace
2. Create incoming webhook: https://api.slack.com/messaging/webhooks
3. Choose channel for alerts (e.g., #lsn-alerts)
4. Copy webhook URL
5. Add to platform: `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx`

#### C. Enable Autonomous Mode
1. Set founder email: `FOUNDER_EMAIL=your@email.com`
2. Enable autonomous operations: `ENABLE_AUTONOMOUS=true`

**Expected Result**: Daily summary emails + real-time Slack alerts

---

### Step 3: Configure Live Streaming (15 minutes)

#### A. HeyGen AI Avatars (REQUIRED)
1. Sign up at https://heygen.com
2. Choose plan:
   - Creator Plan: $89/mo (20 credits/mo)
   - Business Plan: $300/mo (90 credits/mo)
3. Create API key in Settings → API
4. Add to platform: `HEYGEN_API_KEY=xxx`

**What it does**: Creates AI presenters for 24/7 live streams

#### B. ElevenLabs Voice (OPTIONAL)
1. Sign up at https://elevenlabs.io
2. Choose plan:
   - Free: 10,000 characters/mo
   - Starter: $5/mo (30,000 characters/mo)
   - Creator: $22/mo (100,000 characters/mo)
3. Create API key
4. Add to platform: `ELEVENLABS_API_KEY=xxx`

**Alternative**: Use OpenAI TTS (already configured via BUILT_IN_FORGE_API_KEY)

#### C. Agora Video Infrastructure
1. Sign up at https://console.agora.io
2. Create new project
3. Get App ID from project dashboard
4. Add to platform: `AGORA_APP_ID=xxx`
5. Enable autonomous streams: `ENABLE_AUTONOMOUS_STREAMS=true`

**Expected Result**: 24/7 AI-hosted live shopping streams

---

### Step 4: Configure Product Sourcing (10 minutes)

#### A. CJ Dropshipping (RECOMMENDED)
1. Sign up at https://cjdropshipping.com
2. Apply for API access (requires business verification)
3. Get API key from Settings → API
4. Add to platform: `CJ_API_KEY=xxx`

**What it does**: Automatically sources and imports products

#### B. TikTok Shop Integration
1. Sign up for TikTok Shop Seller: https://seller.tiktokglobalshop.com
2. Apply for API access in Seller Center
3. Create app and get credentials
4. Add to platform:
   ```bash
   TIKTOK_SHOP_ACCESS_TOKEN=xxx
   TIKTOK_SHOP_SHOP_ID=xxx
   ```

**Expected Result**: Automated product imports from suppliers

---

### Step 5: Configure Creator Payouts (10 minutes)

#### A. Wise (Recommended for International)
1. Sign up at https://wise.com/business
2. Verify business account
3. Get API token from Settings → API
4. Add to platform: `WISE_API_TOKEN=xxx`

**What it does**: Automated international creator payouts

#### B. PayPal (Alternative)
1. Sign up at https://developer.paypal.com
2. Create app in Dashboard
3. Get Client ID and Secret
4. Add to platform:
   ```bash
   PAYPAL_CLIENT_ID=xxx
   PAYPAL_CLIENT_SECRET=xxx
   ```

**Expected Result**: Automated daily payouts to creators (with $500+ approval threshold)

---

### Step 6: Configure Australian Shipping (10 minutes)

#### A. Australia Post
1. Sign up at https://developers.auspost.com.au
2. Create API key
3. Add to platform: `AUSPOST_API_KEY=xxx`

#### B. Sendle
1. Sign up at https://sendle.com
2. Get API credentials from Settings
3. Add to platform:
   ```bash
   SENDLE_API_ID=xxx
   SENDLE_API_KEY=xxx
   ```

**Expected Result**: Automated shipping label generation and tracking

---

### Step 7: Configure Australian Payments (10 minutes)

#### A. Afterpay
1. Sign up at https://www.afterpay.com/en-AU/for-merchants
2. Get merchant credentials
3. Add to platform:
   ```bash
   AFTERPAY_MERCHANT_ID=xxx
   AFTERPAY_SECRET_KEY=xxx
   ```

#### B. Zip
1. Sign up at https://zip.co/au/business
2. Get API credentials
3. Add to platform:
   ```bash
   ZIP_MERCHANT_ID=xxx
   ZIP_API_KEY=xxx
   ```

**Expected Result**: Buy Now Pay Later options at checkout

---

## 💰 Cost Breakdown

### Monthly Fixed Costs
| Service | Plan | Cost | Required? |
|---------|------|------|-----------|
| Manus Hosting | Standard | $20-50 | ✅ Yes |
| HeyGen | Creator/Business | $89-300 | ✅ Yes |
| Agora | Pay-as-you-go | $10-50 | ✅ Yes |
| SendGrid | Free/Essentials | $0-20 | ✅ Yes |
| ElevenLabs | Free/Creator | $0-22 | ⚠️ Optional |
| Wise | Business | $0 + fees | ✅ Yes |
| **Total Fixed** | | **$119-442/mo** | |

### Variable Costs
- Stripe: 2.9% + $0.30 per transaction
- Afterpay: ~4% per transaction
- Zip: ~4% per transaction
- Wise: 0.5-2% per payout
- Shipping: Actual carrier costs

### Break-even Analysis
- At $10,000/mo revenue: ~$600 in fees (6%)
- At $50,000/mo revenue: ~$2,000 in fees (4%)
- At $100,000/mo revenue: ~$3,500 in fees (3.5%)

---

## 🔐 How to Add Secrets to Manus

### Method 1: Via Manus UI (Recommended)
1. Open your project in Manus
2. Click "Management UI" icon (top right)
3. Go to "Settings" → "Secrets"
4. Click "Add Secret"
5. Enter key name and value
6. Click "Save"

### Method 2: Via Code Request
The platform will prompt you when secrets are needed. Just provide the values when asked.

---

## ✅ Validation Checklist

After configuring all secrets, verify:

- [ ] Daily summary email received at `FOUNDER_EMAIL`
- [ ] Slack alerts working in configured channel
- [ ] Test live stream starts successfully
- [ ] AI avatar appears in stream
- [ ] Products can be imported from CJ/TikTok
- [ ] Test order processes through Stripe
- [ ] Shipping label generates successfully
- [ ] Creator payout can be initiated
- [ ] Afterpay/Zip options appear at checkout

---

## 🎯 Minimum Viable Configuration

To launch with basic autonomous operations, you MUST have:

1. ✅ `ENABLE_AUTONOMOUS=true`
2. ✅ `FOUNDER_EMAIL` (for daily summaries)
3. ✅ `SENDGRID_API_KEY` (for notifications)
4. ✅ `SLACK_WEBHOOK_URL` (for alerts)
5. ✅ Stripe claimed (already configured)

Everything else can be added incrementally as you scale.

---

## 🚨 Security Best Practices

1. **Never commit secrets to git**
   - All secrets are stored in Manus encrypted storage
   - Never add secrets to code files

2. **Use test/sandbox keys first**
   - Test all integrations before using production keys
   - Stripe test mode is already configured

3. **Rotate keys regularly**
   - Change API keys every 90 days
   - Revoke unused keys immediately

4. **Monitor access logs**
   - Check Manus audit logs regularly
   - Review API usage in third-party dashboards

---

## 📞 Support

If you encounter issues:
1. Check service status pages
2. Verify API key permissions
3. Review Manus logs in Management UI
4. Contact service support:
   - HeyGen: support@heygen.com
   - Stripe: support@stripe.com
   - Agora: support@agora.io
   - Manus: https://help.manus.im

---

## 🎉 Next Steps

Once all secrets are configured:
1. Run validation tests
2. Monitor first 24 hours
3. Review daily summary email
4. Adjust alert thresholds
5. Scale up operations

**Ready to configure? Let's start with Step 1!**
