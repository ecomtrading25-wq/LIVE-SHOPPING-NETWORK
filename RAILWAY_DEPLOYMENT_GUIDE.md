# Railway Deployment Guide - Live Shopping Network

This guide provides step-by-step instructions for deploying the Live Shopping Network platform to Railway.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)
9. [Scaling](#scaling)

---

## Prerequisites

Before deploying to Railway, ensure you have:

- **Railway Account**: Sign up at [railway.app](https://railway.app)
- **GitHub Repository**: Code pushed to GitHub (Railway deploys from Git)
- **External Service Accounts**:
  - Stripe account (for payments)
  - PayPal Business account (for disputes)
  - Wise account (for creator payouts)
  - Twilio account (for live streaming)
  - AWS S3 bucket (for file storage)
  - OpenAI API key (for AI features)

---

## Initial Setup

### 1. Create New Railway Project

```bash
# Install Railway CLI (optional but recommended)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

Or use the Railway dashboard:
1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Click "Deploy Now"

### 2. Add PostgreSQL Database

Railway projects need a database:

1. In your Railway project dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL instance
4. Connection string will be auto-injected as `DATABASE_URL`

---

## Database Configuration

### Update Database Connection

The project uses Drizzle ORM with MySQL/TiDB by default. For Railway PostgreSQL:

1. **Update `drizzle.config.ts`**:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg', // Changed from 'mysql2' to 'pg'
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

2. **Update database dependencies**:

```bash
pnpm remove mysql2
pnpm add pg @types/pg
```

3. **Run migrations**:

```bash
# Railway will run this automatically during build
pnpm db:push
```

---

## Environment Variables

### Required Environment Variables

Set these in Railway dashboard under "Variables" tab:

#### Core Application
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<auto-injected-by-railway>
```

#### Authentication & Security
```
JWT_SECRET=<generate-random-256-bit-key>
VITE_APP_ID=<your-app-identifier>
VITE_APP_TITLE=Live Shopping Network
VITE_APP_LOGO=https://your-cdn.com/logo.png
```

#### Stripe Payment Processing
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### PayPal Integration
```
PAYPAL_CLIENT_ID=<your-paypal-client-id>
PAYPAL_CLIENT_SECRET=<your-paypal-client-secret>
PAYPAL_WEBHOOK_ID=<your-paypal-webhook-id>
PAYPAL_MODE=live
```

#### Wise (TransferWise) Payouts
```
WISE_API_TOKEN=<your-wise-api-token>
WISE_PROFILE_ID=<your-wise-profile-id>
WISE_WEBHOOK_SECRET=<your-wise-webhook-secret>
```

#### Twilio Live Streaming
```
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_API_KEY=<your-twilio-api-key>
TWILIO_API_SECRET=<your-twilio-api-secret>
```

#### AWS S3 Storage
```
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your-bucket-name>
AWS_S3_PUBLIC_URL=https://<your-bucket>.s3.amazonaws.com
```

#### OpenAI (AI Features)
```
OPENAI_API_KEY=sk-...
```

#### Application URLs
```
VITE_APP_URL=https://<your-railway-domain>.railway.app
VITE_FRONTEND_URL=https://<your-railway-domain>.railway.app
```

### Generate Secure Secrets

Use these commands to generate secure random keys:

```bash
# JWT Secret (256-bit)
openssl rand -base64 32

# Webhook secrets
openssl rand -hex 32
```

---

## Deployment Process

### Automatic Deployment (Recommended)

Railway automatically deploys when you push to your connected branch:

```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

Railway will:
1. Detect changes
2. Build the application
3. Run database migrations
4. Deploy to production
5. Health check the deployment

### Manual Deployment via CLI

```bash
# Deploy current directory
railway up

# Watch logs
railway logs

# Open in browser
railway open
```

### Build Process

Railway executes (defined in `railway.toml`):

```bash
# Build command
pnpm install && pnpm db:push && pnpm build

# Start command
pnpm start
```

---

## Post-Deployment

### 1. Verify Health Endpoints

```bash
# Health check
curl https://<your-app>.railway.app/health

# Should return:
# {"status":"ok","timestamp":"2024-...","uptime":123}
```

### 2. Configure Webhooks

Update webhook URLs in external services:

**Stripe Webhooks**:
- Dashboard: https://dashboard.stripe.com/webhooks
- Endpoint: `https://<your-app>.railway.app/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `charge.dispute.created`, etc.

**PayPal Webhooks**:
- Dashboard: https://developer.paypal.com/dashboard/webhooks
- Endpoint: `https://<your-app>.railway.app/api/webhooks/paypal`
- Events: All payment and dispute events

**Wise Webhooks**:
- Dashboard: https://wise.com/settings/webhooks
- Endpoint: `https://<your-app>.railway.app/api/webhooks/wise`
- Events: `transfers#state-change`, `balances#credit`

**Twilio Webhooks**:
- Dashboard: https://console.twilio.com/
- Status Callback: `https://<your-app>.railway.app/api/webhooks/twilio/stream-status`

### 3. Test Critical Flows

1. **User Registration & Login**
2. **Product Browsing**
3. **Checkout Process**
4. **Payment Processing**
5. **Live Show Streaming**
6. **Creator Payouts**

### 4. Set Up Custom Domain (Optional)

1. In Railway dashboard, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your custom domain
4. Add CNAME record to your DNS:
   ```
   CNAME <your-domain> <railway-generated-domain>
   ```
5. Wait for DNS propagation (5-30 minutes)

---

## Monitoring & Logging

### Railway Logs

View logs in real-time:

```bash
# Via CLI
railway logs

# Via Dashboard
# Go to your project → "Deployments" → Click deployment → "Logs"
```

### Application Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count
- Response times

Access in dashboard under "Metrics" tab.

### Error Tracking

Consider integrating:
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and debugging
- **Datadog**: Full-stack observability

Add to `package.json`:
```bash
pnpm add @sentry/node @sentry/tracing
```

### Health Monitoring

Set up external monitoring:
- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Multi-location checks

Monitor endpoint: `https://<your-app>.railway.app/health`

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: `pnpm install failed`

**Solution**:
- Check `package.json` for invalid dependencies
- Ensure `pnpm-lock.yaml` is committed
- Try clearing Railway cache (redeploy)

#### 2. Database Connection Errors

**Error**: `connect ECONNREFUSED`

**Solution**:
- Verify `DATABASE_URL` is set
- Check database is running in Railway dashboard
- Ensure database driver matches (pg for PostgreSQL)

#### 3. Environment Variable Issues

**Error**: `process.env.STRIPE_SECRET_KEY is undefined`

**Solution**:
- Double-check all required env vars are set
- Restart deployment after adding new variables
- Check for typos in variable names

#### 4. TypeScript Errors

**Error**: `TS2339: Property 'x' does not exist`

**Solution**:
- Run `pnpm build` locally first
- Fix type errors before deploying
- Check `tsconfig.json` configuration

#### 5. Memory Issues

**Error**: `JavaScript heap out of memory`

**Solution**:
- Upgrade Railway plan for more memory
- Optimize build process
- Add to `package.json` scripts:
  ```json
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  ```

### Debug Mode

Enable detailed logging:

```bash
# Add to Railway environment variables
DEBUG=*
LOG_LEVEL=debug
```

### Rollback Deployment

If deployment fails:

1. Go to Railway dashboard → "Deployments"
2. Find previous successful deployment
3. Click "Redeploy"

Or via CLI:
```bash
railway rollback
```

---

## Scaling

### Vertical Scaling

Upgrade Railway plan for more resources:
- **Starter**: 512MB RAM, 1 vCPU
- **Developer**: 8GB RAM, 8 vCPU
- **Team**: 32GB RAM, 32 vCPU

### Horizontal Scaling

Railway supports multiple replicas:

1. Go to "Settings" → "Scaling"
2. Increase "Replicas" count
3. Railway load balances automatically

**Note**: Ensure your app is stateless for horizontal scaling.

### Database Scaling

For high traffic:
1. Upgrade PostgreSQL plan in Railway
2. Consider read replicas
3. Implement caching (Redis)
4. Use connection pooling

### CDN for Static Assets

Serve static files via CDN:
1. Upload `dist/client` to AWS S3
2. Configure CloudFront distribution
3. Update `VITE_CDN_URL` environment variable

---

## Backup & Recovery

### Database Backups

Railway automatically backs up PostgreSQL:
- Frequency: Daily
- Retention: 7 days (Starter), 30 days (Pro)

Manual backup:
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

Restore:
```bash
railway run psql $DATABASE_URL < backup.sql
```

### Code Backups

Always maintain Git repository:
- Push to GitHub/GitLab regularly
- Tag releases: `git tag v1.0.0`
- Keep `main` branch stable

---

## Security Checklist

- [ ] All environment variables set securely
- [ ] JWT secret is strong (256-bit)
- [ ] Webhook signatures verified
- [ ] HTTPS enforced (Railway does this automatically)
- [ ] Database connections use SSL
- [ ] API rate limiting enabled
- [ ] CORS configured properly
- [ ] Secrets not committed to Git
- [ ] Regular dependency updates
- [ ] Security headers configured

---

## Performance Optimization

### 1. Enable Compression

Already configured in server with `compression` middleware.

### 2. Database Indexing

Ensure critical queries have indexes:
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_products_category ON products(category_id);
```

### 3. Caching Strategy

Implement Redis for:
- Session storage
- API response caching
- Rate limiting

Add to Railway:
```bash
railway add redis
```

### 4. Asset Optimization

- Images: Use WebP format
- Code: Already minified by Vite
- Fonts: Subset and preload

---

## Support & Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: GitHub Issues tab
- **Status Page**: https://status.railway.app

---

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrated successfully
- [ ] Webhooks configured in external services
- [ ] Custom domain set up (if applicable)
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Critical flows tested
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Team access configured
- [ ] Documentation updated
- [ ] Rollback plan ready

---

## Next Steps

After successful deployment:

1. **Monitor Performance**: Watch metrics for first 24 hours
2. **Test Load**: Run load tests to verify capacity
3. **User Feedback**: Collect feedback from beta users
4. **Iterate**: Deploy updates based on feedback
5. **Scale**: Adjust resources as traffic grows

---

**Congratulations!** Your Live Shopping Network is now live on Railway. 🚀

For questions or issues, refer to the troubleshooting section or contact support.
