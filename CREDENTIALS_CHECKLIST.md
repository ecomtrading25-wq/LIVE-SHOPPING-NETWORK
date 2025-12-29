# Live Shopping Network - Credentials Checklist

## 🔐 Required API Credentials for Full Deployment

This checklist covers all external service credentials needed to activate every feature of the Live Shopping Network platform.

---

## ✅ Currently Configured

These credentials are already set up in the Manus platform:

- [x] **Database** - MySQL/TiDB connection (`DATABASE_URL`)
- [x] **Authentication** - Manus OAuth (`JWT_SECRET`, `OAUTH_SERVER_URL`)
- [x] **Storage** - Manus S3 integration (`BUILT_IN_FORGE_API_KEY`)
- [x] **Analytics** - Manus analytics (`VITE_ANALYTICS_ENDPOINT`)
- [x] **Stripe** - Test sandbox created (needs claiming)

---

## 🎯 Priority 1: Essential for Launch

### 1. Stripe (Payment Processing)
**Status:** Test sandbox ready, needs activation  
**Required for:** Customer payments, subscriptions, payouts

**Action Required:**
1. Claim test sandbox: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xU2hITmg0dDVkUXo2dW1NLDE3NjczNDk4MDEv100LDEqH8Ud
2. Test in sandbox mode
3. Activate production mode when ready
4. No additional credentials needed (already configured)

**Deadline:** Before accepting first customer payment

---

### 2. Twilio (Live Streaming)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** Live shopping shows, OBS streaming, viewer distribution

**Sign up:** https://www.twilio.com/try-twilio

**Credentials Needed:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
```

**How to Get:**
1. Create Twilio account
2. Go to Console → Account → API Keys & Tokens
3. Create new API Key
4. Save Account SID, Auth Token, API Key, and API Secret

**Cost:** Pay-as-you-go (approx $0.0015/minute per participant)

**Deadline:** Before first live show

---

### 3. HeyGen (Avatar Video Generation)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** Elle, Aya, and Vera avatar video content

**Sign up:** https://www.heygen.com/

**Credentials Needed:**
```
HEYGEN_API_KEY=your_heygen_api_key_here
```

**How to Get:**
1. Create HeyGen account
2. Go to Settings → API
3. Generate API key
4. Copy and save securely

**Cost:** Pay-per-video (approx $0.15-0.30 per minute of video)

**Alternative:** Can manually create avatar videos initially

**Deadline:** Before launching avatar content strategy

---

## 🎯 Priority 2: Enhanced Features

### 4. PayPal (Alternative Payment Method)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** PayPal checkout option, PayPal disputes

**Developer Portal:** https://developer.paypal.com/

**Credentials Needed:**
```
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here
PAYPAL_MODE=sandbox  # Change to 'live' for production
```

**How to Get:**
1. Create PayPal Business account
2. Go to Developer Dashboard
3. Create REST API app
4. Copy Client ID and Secret
5. Create webhook endpoint
6. Copy Webhook ID

**Cost:** 2.9% + $0.30 per transaction (US domestic)

**Optional:** Can launch with Stripe only

**Deadline:** When expanding payment options

---

### 5. Wise (International Payouts)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** International creator payouts, multi-currency

**API Access:** https://wise.com/help/articles/2958228/wise-api

**Credentials Needed:**
```
WISE_API_TOKEN=your_wise_api_token_here
WISE_PROFILE_ID=your_profile_id_here
WISE_MODE=sandbox  # Change to 'live' for production
```

**How to Get:**
1. Create Wise Business account
2. Apply for API access
3. Generate API token
4. Get Profile ID from account settings

**Cost:** Variable by currency/destination (typically 0.5-2%)

**Optional:** Can use Stripe Connect for payouts initially

**Deadline:** When onboarding international creators

---

## 🎯 Priority 3: Optional Enhancements

### 6. Google Maps (Location Features)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** Store locator, shipping address validation

**Note:** Manus provides a proxy for Google Maps, but you can add your own key for higher quotas

**Optional:** Use Manus built-in proxy

**Deadline:** When adding location-based features

---

### 7. SendGrid / Mailgun (Transactional Email)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** Order confirmations, shipping notifications

**Alternative:** Use Manus built-in notification system

**Optional:** Can use Manus notifications initially

**Deadline:** When scaling email volume

---

### 8. Sentry (Error Tracking)
**Status:** ⚠️ NOT CONFIGURED  
**Required for:** Production error monitoring, debugging

**Optional:** Can use console logs initially

**Deadline:** Before production launch

---

## 📋 Credential Entry Instructions

### Method 1: Management UI (Recommended)

1. Open your Live Shopping Network project
2. Click the settings icon (top-right of chatbox header)
3. Navigate to **Settings → Secrets**
4. Click "Add Secret"
5. Enter key name (e.g., `TWILIO_ACCOUNT_SID`)
6. Enter value
7. Click "Save"
8. Repeat for each credential

### Method 2: Via Chat (Alternative)

Simply tell me "I have the Twilio credentials" and I'll create an input card for you to enter them securely.

---

## 🚦 Launch Readiness Status

### Minimum Viable Launch
- [x] Database configured
- [x] Authentication working
- [x] Storage operational
- [ ] **Stripe activated** ← ACTION REQUIRED
- [ ] **Twilio configured** ← ACTION REQUIRED

**Status:** 60% ready - Need Stripe + Twilio to launch

---

### Full Feature Launch
- [x] Database configured
- [x] Authentication working
- [x] Storage operational
- [ ] Stripe activated
- [ ] Twilio configured
- [ ] HeyGen configured
- [ ] PayPal configured (optional)
- [ ] Wise configured (optional)

**Status:** 38% ready - Need all Priority 1 & 2 credentials

---

## 📞 Support

### Getting Help with Credentials

**Twilio Support:** https://support.twilio.com/  
**HeyGen Support:** support@heygen.com  
**PayPal Developer Support:** https://developer.paypal.com/support/  
**Wise API Support:** https://wise.com/help/contact/api  
**Stripe Support:** https://support.stripe.com/

### Manus Platform Support

**Help Center:** https://help.manus.im  
**Settings Panel:** Management UI → Settings → Support

---

## ⏱️ Estimated Setup Time

- **Stripe activation:** 5 minutes
- **Twilio setup:** 15 minutes
- **HeyGen setup:** 10 minutes
- **PayPal setup:** 20 minutes
- **Wise setup:** 30 minutes (includes business verification)

**Total time for Priority 1:** ~30 minutes  
**Total time for all services:** ~80 minutes

---

## 💰 Cost Estimate (Monthly)

### Minimum Launch Budget
- **Stripe:** $0 (pay-as-you-go, 2.9% + $0.30 per transaction)
- **Twilio:** ~$100-500 (depends on live show frequency)
- **Total:** ~$100-500/month

### Full Feature Budget
- **Stripe:** Pay-as-you-go
- **Twilio:** ~$100-500
- **HeyGen:** ~$200-1000 (depends on video volume)
- **PayPal:** Pay-as-you-go
- **Wise:** Pay-as-you-go
- **Total:** ~$300-1500/month

**Note:** All payment processing fees are transaction-based, so costs scale with revenue.

---

## ✅ Next Steps

1. **Claim Stripe sandbox** (5 min) - Test payments immediately
2. **Sign up for Twilio** (15 min) - Enable live streaming
3. **Create HeyGen account** (10 min) - Activate avatar videos
4. **Enter credentials in Settings → Secrets** (5 min)
5. **Test each integration** (30 min)
6. **Launch!** 🚀

---

**Last Updated:** December 29, 2025  
**Platform Version:** 1.0 (Avatar Studio Edition)
