# 🚀 Deploy Live Shopping Network to Railway - Quick Start

## 5-Minute Deployment

### Step 1: Push to GitHub (2 minutes)

```bash
# Initialize git if not already done
cd /path/to/live-shopping-network
git init
git add .
git commit -m "Ready for Railway deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/live-shopping-network.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway (2 minutes)

1. Go to **https://railway.app/new**
2. Click **"Deploy from GitHub repo"**
3. Select your **live-shopping-network** repository
4. Click **"Deploy Now"**

Railway will automatically:
- Detect the Node.js project
- Install dependencies
- Build the application
- Start the server

### Step 3: Add PostgreSQL Database (30 seconds)

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Done! Database URL is automatically connected

### Step 4: Set Environment Variables (30 seconds)

In Railway project → **Settings** → **Variables**, add:

```bash
NODE_ENV=production
JWT_SECRET=your-secret-key-here
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Run Database Migrations (30 seconds)

In Railway dashboard:
1. Go to your service
2. Click **"Deploy"** tab
3. Wait for deployment to complete
4. Your database tables are automatically created!

## ✅ Done! Your Site is Live

Your Live Shopping Network is now deployed at:
```
https://your-project-name.railway.app
```

## Next Steps

### Add Stripe for Payments

In Railway environment variables:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Get keys from: https://dashboard.stripe.com/apikeys

### Add Custom Domain

1. Railway → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain
4. Add CNAME record to your DNS:
   - Name: `@` or `www`
   - Value: Your Railway domain

### Configure Twilio (Optional - for live streaming)

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_API_KEY=SK...
TWILIO_API_SECRET=...
```

Get from: https://console.twilio.com

## Automatic Deployments

Every time you push to GitHub main branch, Railway automatically:
1. Pulls latest code
2. Builds application
3. Runs tests
4. Deploys with zero downtime
5. Rolls back if anything fails

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Railway deploys automatically!
```

## Troubleshooting

**Build fails?**
- Check Railway logs for errors
- Ensure `pnpm build` works locally

**Database connection issues?**
- Verify PostgreSQL is added to project
- Check `DATABASE_URL` is set automatically

**Need help?**
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app

## Your Platform Includes

✅ **170+ Pages** - Complete e-commerce experience
✅ **119 Database Tables** - Full data model
✅ **Live Streaming** - Twilio integration ready
✅ **Payment Processing** - Stripe integration
✅ **TikTok Shop Arbitrage** - Automation ready
✅ **Admin Dashboards** - Complete management suite
✅ **White-Labeled** - No Manus branding visible
✅ **Auto-Scaling** - Handles traffic spikes
✅ **Zero-Downtime** - Deployments with rollback

**You're ready for business!** 🎉

For detailed deployment options, see `RAILWAY_DEPLOYMENT.md`
