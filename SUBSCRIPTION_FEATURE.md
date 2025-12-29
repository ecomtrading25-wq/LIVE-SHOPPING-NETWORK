# Stripe Subscription Management - Customer Portal

## Overview

This feature adds comprehensive Stripe subscription management to the Live Shopping Network customer portal. Users can subscribe to plans, manage their billing, view payment history, and upgrade/downgrade their subscriptions.

## Features Implemented

### 1. Database Schema
- **stripe_subscription_plans**: Stores available subscription plans with pricing and features
- **stripe_subscriptions**: Tracks user subscriptions and their status
- **stripe_payment_methods**: Stores user payment methods (cards, etc.)
- **stripe_billing_history**: Records all invoices and payments
- **stripe_webhook_events**: Logs all Stripe webhook events for audit trail

### 2. Backend Services

#### Subscription Service (`server/subscription-service.ts`)
- `getSubscriptionPlans()`: Retrieve all active subscription plans
- `getUserSubscription()`: Get user's current subscription
- `createSubscriptionCheckout()`: Create Stripe checkout session
- `cancelSubscription()`: Cancel subscription (at period end or immediately)
- `reactivateSubscription()`: Reactivate a canceled subscription
- `changeSubscriptionPlan()`: Upgrade or downgrade subscription
- `getPaymentMethods()`: List user's saved payment methods
- `getBillingHistory()`: Retrieve invoice history
- `createCustomerPortalSession()`: Generate Stripe Customer Portal URL

#### Subscription Middleware (`server/subscription-middleware.ts`)
- Tier-based access control (free, basic, pro, enterprise)
- Feature gating and limit enforcement
- Subscription status checking
- Helper functions for authorization

#### Webhook Handler (`server/subscription-webhooks.ts`)
Handles all Stripe subscription events:
- `checkout.session.completed`: New subscription created
- `customer.subscription.created`: Subscription record creation
- `customer.subscription.updated`: Subscription changes
- `customer.subscription.deleted`: Subscription cancellation
- `invoice.created`, `invoice.paid`, `invoice.payment_failed`: Billing events
- `payment_method.attached`, `payment_method.detached`: Payment method changes

### 3. API Endpoints

#### tRPC Procedures (`subscriptions` router)
- `getPlans`: Get all available plans (public)
- `getMySubscription`: Get current user's subscription
- `createCheckout`: Start subscription checkout flow
- `cancel`: Cancel subscription
- `reactivate`: Reactivate canceled subscription
- `changePlan`: Change subscription plan
- `getPaymentMethods`: List payment methods
- `getBillingHistory`: Get billing history
- `createPortalSession`: Access Stripe Customer Portal
- `getStatus`: Get subscription status and features

#### Webhook Endpoint
- `POST /api/webhooks/stripe/subscriptions`: Stripe webhook receiver

### 4. Frontend UI

#### Subscription Management Page (`/account/subscription`)
- View current subscription status
- Browse and compare available plans
- Subscribe to a new plan
- Upgrade or downgrade existing subscription
- Cancel subscription (with period-end option)
- Reactivate canceled subscription
- View billing history with invoice links
- Access Stripe Customer Portal for payment methods

#### Navigation
- Added "Subscription & Billing" link to account sidebar
- Route: `/account/subscription`

### 5. Subscription Tiers

#### Free Tier
- 10 products max
- 50 orders/month max
- 1 concurrent live stream
- Basic features only

#### Basic Plan ($29.99/month)
- 100 products
- 500 orders/month
- 5 concurrent live streams
- Advanced analytics
- Email support

#### Pro Plan ($99.99/month)
- 1,000 products
- 5,000 orders/month
- 20 concurrent live streams
- Advanced analytics
- Priority support
- Custom branding
- API access
- Multi-channel support

#### Enterprise Plan ($299.99/month)
- Unlimited products
- Unlimited orders
- Unlimited live streams
- All Pro features
- 24/7 priority support
- Dedicated account manager
- Custom integrations

## Setup Instructions

### 1. Database Migration

Run the migration to create subscription tables:

```bash
node migrations/add-stripe-subscriptions.mjs
```

### 2. Seed Subscription Plans

Create plans in Stripe and database:

```bash
node migrations/seed-subscription-plans.mjs
```

This will:
- Create products in Stripe
- Create prices in Stripe
- Save plan records to database

### 3. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe/subscriptions`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.created`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.finalized`
   - `payment_method.attached`
   - `payment_method.detached`
4. Copy the webhook signing secret
5. Set `STRIPE_WEBHOOK_SECRET` environment variable

### 4. Environment Variables

Required environment variables (already configured):
- `STRIPE_SECRET_KEY`: Stripe secret API key
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (frontend)

## Testing

Run the test suite:

```bash
pnpm test subscription-service.test.ts
```

Tests cover:
- Subscription service functions
- Tier hierarchy and feature limits
- Access control middleware
- Subscription status retrieval

## Usage Examples

### Check User's Subscription Tier

```typescript
import { getUserSubscriptionTier } from "./subscription-middleware";

const tier = await getUserSubscriptionTier(userId);
// Returns: "free" | "basic" | "pro" | "enterprise"
```

### Enforce Feature Access

```typescript
import { requireFeatureAccess } from "./subscription-middleware";

// In a tRPC procedure
await requireFeatureAccess(ctx.user.id, "apiAccess", "API Access");
// Throws TRPCError if user doesn't have access
```

### Check Limits

```typescript
import { checkLimit } from "./subscription-middleware";

const productCount = await getProductCount(userId);
await checkLimit(ctx.user.id, "maxProducts", productCount, "products");
// Throws TRPCError if limit reached
```

### Frontend Usage

```typescript
// Get subscription status
const { data: subscription } = trpc.subscriptions.getMySubscription.useQuery();

// Subscribe to a plan
const createCheckout = trpc.subscriptions.createCheckout.useMutation();
await createCheckout.mutateAsync({
  planId: "plan_123",
  successUrl: window.location.origin + "/account/subscription?success=true",
  cancelUrl: window.location.origin + "/account/subscription",
});

// Cancel subscription
const cancel = trpc.subscriptions.cancel.useMutation();
await cancel.mutateAsync({
  subscriptionId: subscription.id,
  cancelAtPeriodEnd: true,
});
```

## Architecture Decisions

### Why Stripe Customer Portal?
- Reduces implementation complexity for payment method management
- PCI compliance handled by Stripe
- Consistent UX with Stripe's best practices
- Automatic updates when Stripe adds features

### Why tRPC?
- Type-safe API calls
- Automatic client generation
- Better developer experience
- Consistent with existing platform architecture

### Webhook Event Recording
All webhook events are logged to `stripe_webhook_events` table for:
- Audit trail
- Debugging failed webhooks
- Replay capability
- Compliance requirements

## Future Enhancements

The following features are marked for future implementation:
- Subscription renewal reminders (email notifications)
- Failed payment retry logic with dunning management
- Usage-based billing for certain features
- Annual billing with discounts
- Team/multi-user subscriptions
- Custom enterprise pricing

## Troubleshooting

### Webhook Not Receiving Events
1. Check webhook URL is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check Stripe Dashboard → Webhooks for delivery attempts
4. Review server logs for errors

### Subscription Not Updating
1. Check webhook events are being received
2. Verify database records in `stripe_webhook_events`
3. Look for errors in webhook processing logs
4. Ensure subscription metadata includes `userId` and `planId`

### Payment Method Not Showing
1. Ensure user has completed checkout at least once
2. Check Stripe Customer Portal is accessible
3. Verify payment method webhook events are processed

## Security Considerations

- Webhook signature verification prevents spoofed events
- User authorization checks in all tRPC procedures
- Stripe Customer ID tied to user ID for security
- Payment method details (full card numbers) never stored locally
- Only last 4 digits and metadata stored in database

## Support

For issues or questions:
1. Check Stripe Dashboard for payment/subscription issues
2. Review webhook event logs in database
3. Check server logs for error messages
4. Contact Stripe support for payment processing issues
