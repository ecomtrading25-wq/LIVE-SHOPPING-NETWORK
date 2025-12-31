# 🚂 Railway Deployment Guide - Live Shopping Network

## Overview

This guide will help you deploy the Live Shopping Network platform to Railway with PostgreSQL database. The platform will be completely white-labeled with no Manus branding visible to users.

## Architecture

- **Frontend**: React 19 + Vite 7 (170+ pages)
- **Backend**: Express + tRPC 11 (type-safe API)
- **Database**: PostgreSQL + Drizzle ORM (119 tables)
- **Hosting**: Railway (auto-scaling, zero-downtime deployments)

## Prerequisites

1. GitHub account with your code repository
2. Railway account (sign up at https://railway.app)
3. Stripe account for payments
4. Twilio account for live streaming (optional)

## Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

```bash
cd /path/to/live-shopping-network
git init
git add .
git commit -m "Initial commit - Live Shopping Network"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/live-shopping-network.git
git push -u origin main
```

### 1.2 Verify Files

Ensure these files are in your repository:
- ✅ `railway.json` - Railway configuration
- ✅ `drizzle.config.ts` - Auto-detects MySQL/PostgreSQL
- ✅ `package.json` - Dependencies and scripts
- ✅ `.gitignore` - Excludes node_modules, .env

## Step 2: Create Railway Project

### 2.1 Create New Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `live-shopping-network` repository
4. Railway will automatically detect the project type

### 2.2 Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL instance
4. Database URL will be automatically added as `DATABASE_URL` environment variable

## Step 3: Configure Environment Variables

In Railway project settings, add these environment variables:

### Required Variables

```bash
# Database (automatically set by Railway)
DATABASE_URL=postgresql://...

# Application
NODE_ENV=production
PORT=3000

# JWT & Cookies
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OAuth (Manus backend - not visible to users)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Manus Built-in Services (backend only)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Twilio Live Streaming (optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_API_KEY=SK...
TWILIO_API_SECRET=...
TWILIO_PHONE_NUMBER=+1...

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-site-id

# App Branding
VITE_APP_TITLE=Live Shopping Network
VITE_APP_LOGO=/logo.png
```

### How to Get These Values

**JWT_SECRET**: Generate with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Stripe Keys**: Get from https://dashboard.stripe.com/apikeys

**Twilio Keys**: Get from https://console.twilio.com

**Manus OAuth**: These are provided by the Manus platform (backend authentication service)

## Step 4: Deploy

### 4.1 Trigger Deployment

Railway will automatically deploy when you:
- Push to the `main` branch on GitHub
- Or click "Deploy" in Railway dashboard

### 4.2 Monitor Deployment

1. Watch the build logs in Railway dashboard
2. Build process:
   - Install dependencies (`pnpm install`)
   - Build frontend (`pnpm build`)
   - Start server (`pnpm start`)

### 4.3 Run Database Migrations

After first deployment, run migrations:

1. In Railway dashboard, go to your service
2. Click "Settings" → "Deploy"
3. Add a deploy command or run manually:

```bash
pnpm db:push
```

This will create all 119 database tables in PostgreSQL.

## Step 5: Configure Domain

### 5.1 Use Railway Domain

Railway provides a free domain:
- Format: `your-project.railway.app`
- Automatically configured with SSL

### 5.2 Add Custom Domain (Optional)

1. In Railway project, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `liveshoppingnetwork.com`)
4. Add DNS records as shown:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: Your Railway domain

## Step 6: Post-Deployment

### 6.1 Verify Health

Check these endpoints:
- `https://your-domain.railway.app/` - Homepage
- `https://your-domain.railway.app/api/health` - Health check
- `https://your-domain.railway.app/admin` - Admin dashboard

### 6.2 Test Critical Flows

- [ ] User registration/login
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout with Stripe
- [ ] View live shows
- [ ] Admin dashboard access

### 6.3 Set Up Monitoring

1. Enable Railway metrics:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

2. Set up alerts for:
   - High error rates
   - Slow response times
   - Database connection issues

## Step 7: Continuous Deployment

### Auto-Deploy on Push

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will:
1. Pull latest code
2. Run build
3. Run health checks
4. Switch traffic to new version (zero downtime)
5. Keep old version running until new version is healthy

### Rollback

If deployment fails, Railway automatically rolls back to previous version.

Manual rollback:
1. Go to "Deployments" in Railway dashboard
2. Find previous successful deployment
3. Click "Redeploy"

## Deployment Strategies

### Rolling Deployment (Recommended)

Railway's default strategy:
- ✅ Zero downtime
- ✅ Automatic rollback on failure
- ✅ No configuration needed

### Blue-Green Deployment

For major releases:
1. Create a new Railway service
2. Deploy new version
3. Test thoroughly
4. Switch domain to new service
5. Keep old service for quick rollback

### Canary Release

For risk-averse releases:
1. Deploy new version
2. Route 10% of traffic to new version
3. Monitor metrics
4. Gradually increase to 100%
5. Requires load balancer configuration

## Database Management

### Backups

Railway automatically backs up PostgreSQL:
- Frequency: Daily
- Retention: 7 days (free tier), 30 days (pro)

Manual backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Migrations

When you update schema:

1. Update `drizzle/schema.ts`
2. Generate migration:
```bash
pnpm drizzle-kit generate
```
3. Push to production:
```bash
pnpm db:push
```

### Scaling

Railway automatically scales:
- **Vertical**: Increases CPU/memory as needed
- **Horizontal**: Add replicas for high traffic

Configure in Railway dashboard:
- Settings → Resources → Replicas

## Troubleshooting

### Build Fails

**Error**: TypeScript errors
**Solution**: Fix errors locally first:
```bash
pnpm build
```

**Error**: Out of memory
**Solution**: Increase Railway memory limit in settings

### Database Connection Issues

**Error**: "Connection refused"
**Solution**: Verify `DATABASE_URL` is set correctly

**Error**: "Too many connections"
**Solution**: Increase connection pool size or add read replicas

### Application Errors

Check logs in Railway dashboard:
```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs --follow
```

## Security Checklist

- [ ] All secrets in Railway environment variables (not in code)
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enabled (automatic with Railway)
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] CORS configured for your domain only
- [ ] SQL injection protection (Drizzle ORM handles this)
- [ ] XSS protection enabled

## Performance Optimization

### CDN for Static Assets

Use Railway's built-in CDN or add Cloudflare:
1. Point domain to Cloudflare
2. Enable caching for static assets
3. Configure cache rules

### Database Optimization

1. Add indexes for frequently queried fields
2. Enable connection pooling
3. Use read replicas for heavy read workloads

### Monitoring

Set up:
- Error tracking (Sentry, LogRocket)
- Performance monitoring (New Relic, Datadog)
- Uptime monitoring (UptimeRobot, Pingdom)

## Cost Estimation

### Railway Pricing

**Hobby Plan** (Free):
- $5 credit/month
- Suitable for development/testing
- Automatic sleep after inactivity

**Pro Plan** ($20/month):
- $20 credit included
- Additional usage billed
- No sleep
- Priority support

**Estimated Monthly Cost**:
- Small traffic (< 10K users/month): $20-50
- Medium traffic (10K-100K users): $50-200
- High traffic (100K+ users): $200-500+

### Database Costs

PostgreSQL on Railway:
- Included in compute costs
- Storage: $0.25/GB/month
- Backups: Included

## Support

### Railway Support

- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Platform Issues

For Live Shopping Network platform issues:
- Check logs in Railway dashboard
- Review error messages
- Test locally first

## Next Steps

After successful deployment:

1. **Configure Stripe Webhooks**:
   - Add webhook endpoint: `https://your-domain.railway.app/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.failed`

2. **Set Up TikTok Shop Integration**:
   - Add TikTok Shop API credentials in Railway environment
   - Configure webhook endpoint for order notifications

3. **Add Live Shows**:
   - Access admin dashboard
   - Create first live show
   - Test Twilio video streaming

4. **Invite Users**:
   - Share your domain
   - Monitor registration and engagement
   - Collect feedback

## Conclusion

Your Live Shopping Network is now deployed on Railway with:
- ✅ Zero-downtime deployments
- ✅ Automatic scaling
- ✅ PostgreSQL database
- ✅ SSL/HTTPS enabled
- ✅ White-labeled (no Manus branding visible)
- ✅ Production-ready

**Your platform is live and ready for business!** 🎉
