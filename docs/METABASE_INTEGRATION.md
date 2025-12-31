# Metabase Integration for Live Shopping Network

## Overview

Metabase provides powerful business intelligence and analytics capabilities for the Live Shopping Network. This guide explains how to integrate Metabase with your LSN platform for comprehensive data visualization and reporting.

---

## 🎯 What Metabase Provides

### Business Intelligence Features
- **Interactive Dashboards**: Visual analytics for sales, inventory, customers, and creators
- **SQL Query Builder**: Direct database access with visual query interface
- **Automated Reports**: Scheduled email reports for daily/weekly/monthly metrics
- **Custom Visualizations**: Charts, graphs, tables, and maps
- **Data Exploration**: Ad-hoc analysis without coding
- **User Permissions**: Role-based access control for team members

### Key Dashboards for LSN
1. **Executive Dashboard**: Revenue, orders, conversion rates, top products
2. **Live Streaming Analytics**: Viewer counts, engagement, sales per stream
3. **Creator Performance**: Commission, sales attribution, top performers
4. **Inventory Management**: Stock levels, reorder points, turnover rates
5. **Customer Analytics**: LTV, cohort analysis, retention metrics
6. **Fraud Detection**: Risk scores, flagged transactions, patterns

---

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

**Advantages**: Easy setup, isolated environment, automatic updates

```bash
# 1. Create docker-compose.yml
version: '3.8'
services:
  metabase:
    image: metabase/metabase:latest
    container_name: lsn-metabase
    ports:
      - "3001:3000"
    environment:
      MB_DB_TYPE: mysql
      MB_DB_DBNAME: metabase
      MB_DB_PORT: 3306
      MB_DB_USER: ${METABASE_DB_USER}
      MB_DB_PASS: ${METABASE_DB_PASSWORD}
      MB_DB_HOST: ${METABASE_DB_HOST}
    volumes:
      - metabase-data:/metabase-data
    restart: unless-stopped

volumes:
  metabase-data:

# 2. Start Metabase
docker-compose up -d

# 3. Access at http://localhost:3001
```

### Option 2: Metabase Cloud (Easiest)

**Advantages**: No infrastructure management, automatic backups, 24/7 support

1. Sign up at https://www.metabase.com/start/
2. Choose plan:
   - **Starter**: $85/mo (5 users)
   - **Pro**: $500/mo (10 users)
   - **Enterprise**: Custom pricing
3. Connect to LSN database (see Database Connection section)

### Option 3: Self-Hosted JAR

**Advantages**: Lightweight, no Docker required

```bash
# 1. Download Metabase
wget https://downloads.metabase.com/latest/metabase.jar

# 2. Run Metabase
java -jar metabase.jar

# 3. Access at http://localhost:3000
```

---

## 🔌 Database Connection

### Step 1: Get Database Credentials

From your LSN platform, get the `DATABASE_URL`:
```
mysql://user:password@host:3306/database_name
```

Parse into components:
- **Host**: `host`
- **Port**: `3306`
- **Database**: `database_name`
- **Username**: `user`
- **Password**: `password`

### Step 2: Configure Metabase Connection

1. Open Metabase admin panel
2. Go to **Settings** → **Admin** → **Databases**
3. Click **Add Database**
4. Fill in connection details:
   - **Database type**: MySQL
   - **Name**: Live Shopping Network
   - **Host**: [from DATABASE_URL]
   - **Port**: 3306
   - **Database name**: [from DATABASE_URL]
   - **Username**: [from DATABASE_URL]
   - **Password**: [from DATABASE_URL]
   - **SSL**: Enable (recommended)
5. Click **Save**
6. Test connection

### Step 3: Configure Read-Only Access (Recommended)

For security, create a read-only database user for Metabase:

```sql
-- Create read-only user
CREATE USER 'metabase_readonly'@'%' IDENTIFIED BY 'secure_password';

-- Grant SELECT permission on all LSN tables
GRANT SELECT ON lsn_database.* TO 'metabase_readonly'@'%';

-- Apply changes
FLUSH PRIVILEGES;
```

Use this user for Metabase connection instead of the main database user.

---

## 📊 Pre-Built Dashboards

### 1. Executive Dashboard

**Metrics**:
- Total Revenue (today, week, month, year)
- Order Count & Average Order Value
- Conversion Rate
- Active Customers
- Top Products by Revenue
- Revenue by Channel

**SQL Example**:
```sql
-- Daily Revenue
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders,
  SUM(total_amount) as revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'completed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. Live Streaming Analytics

**Metrics**:
- Active Streams
- Total Viewers
- Average Watch Time
- Sales During Streams
- Top Performing Hosts
- Product Conversion by Stream

**SQL Example**:
```sql
-- Stream Performance
SELECT 
  ls.id,
  ls.title,
  ls.host_name,
  COUNT(DISTINCT lv.user_id) as unique_viewers,
  COUNT(DISTINCT o.id) as orders_during_stream,
  SUM(o.total_amount) as revenue_during_stream
FROM live_shows ls
LEFT JOIN live_viewers lv ON ls.id = lv.show_id
LEFT JOIN orders o ON o.created_at BETWEEN ls.started_at AND ls.ended_at
WHERE ls.status = 'completed'
  AND ls.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ls.id
ORDER BY revenue_during_stream DESC;
```

### 3. Creator Performance Dashboard

**Metrics**:
- Total Commission Earned
- Sales Attributed
- Conversion Rate
- Top Products Promoted
- Payout History

**SQL Example**:
```sql
-- Creator Leaderboard
SELECT 
  c.id,
  c.name,
  c.tier,
  COUNT(DISTINCT ca.order_id) as attributed_orders,
  SUM(ca.commission_amount) as total_commission,
  AVG(ca.commission_rate) as avg_commission_rate
FROM creators c
LEFT JOIN creator_attributions ca ON c.id = ca.creator_id
WHERE ca.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY c.id
ORDER BY total_commission DESC
LIMIT 20;
```

### 4. Inventory Management Dashboard

**Metrics**:
- Stock Levels by Warehouse
- Low Stock Alerts
- Inventory Turnover Rate
- Reorder Recommendations
- Stock Value

**SQL Example**:
```sql
-- Low Stock Products
SELECT 
  p.id,
  p.name,
  p.sku,
  i.available,
  i.reserved,
  w.name as warehouse,
  CASE 
    WHEN i.available < 10 THEN 'Critical'
    WHEN i.available < 50 THEN 'Low'
    ELSE 'OK'
  END as stock_status
FROM products p
JOIN inventory i ON p.id = i.product_id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.available < 50
ORDER BY i.available ASC;
```

---

## 🔐 Security & Permissions

### User Roles

Configure these roles in Metabase:

1. **Admin**: Full access to all data and settings
   - Founder, CTO
   
2. **Analyst**: Can create queries and dashboards
   - Operations team, marketing team

3. **Viewer**: Read-only access to dashboards
   - Customer service, warehouse staff

4. **Creator**: Limited access to their own performance data
   - Individual creators

### Row-Level Security

For creator-specific dashboards, use SQL filters:

```sql
-- Creator can only see their own data
SELECT * FROM creator_attributions
WHERE creator_id = {{creator_id}}
```

Pass `creator_id` as a parameter from the user session.

---

## 📧 Automated Reports

### Daily Summary Report

**Schedule**: Every day at 8 AM
**Recipients**: Founder, operations team
**Contents**:
- Yesterday's revenue and orders
- Top 5 products sold
- Active live streams
- Critical inventory alerts
- Fraud alerts

### Weekly Performance Report

**Schedule**: Every Monday at 9 AM
**Recipients**: All stakeholders
**Contents**:
- Week-over-week growth
- Creator leaderboard
- Customer acquisition metrics
- Inventory turnover
- Financial summary

### Monthly Business Review

**Schedule**: 1st of each month at 10 AM
**Recipients**: Founder, investors
**Contents**:
- Monthly revenue and profit
- Customer lifetime value trends
- Cohort retention analysis
- Market expansion metrics
- Strategic recommendations

---

## 🔗 Integration with LSN Platform

### Option A: Embed Metabase in LSN Admin Panel

Add iframe to admin dashboard:

```tsx
// client/src/pages/admin/Analytics.tsx
export function AnalyticsPage() {
  const metabaseUrl = process.env.VITE_METABASE_URL;
  const dashboardId = 1; // Executive Dashboard
  
  return (
    <div className="h-screen">
      <iframe
        src={`${metabaseUrl}/embed/dashboard/${dashboardId}`}
        className="w-full h-full border-0"
        allowTransparency
      />
    </div>
  );
}
```

### Option B: Direct Link from Admin Panel

Add navigation link:

```tsx
// client/src/components/AdminNav.tsx
<NavLink href={process.env.VITE_METABASE_URL} target="_blank">
  📊 Analytics (Metabase)
</NavLink>
```

### Option C: API Integration

Fetch Metabase data via API:

```typescript
// server/metabase-integration.ts
import { publicProcedure, router } from './trpc';

export const metabaseRouter = router({
  getDashboardData: publicProcedure
    .input(z.object({ dashboardId: z.number() }))
    .query(async ({ input }) => {
      const response = await fetch(
        `${process.env.METABASE_URL}/api/dashboard/${input.dashboardId}`,
        {
          headers: {
            'X-Metabase-Session': process.env.METABASE_SESSION_TOKEN
          }
        }
      );
      return response.json();
    })
});
```

---

## 💰 Cost Analysis

### Metabase Cloud Pricing
- **Starter**: $85/mo (5 users, basic features)
- **Pro**: $500/mo (10 users, advanced features, SSO)
- **Enterprise**: Custom (unlimited users, white-label, SLA)

### Self-Hosted Costs
- **Server**: $20-50/mo (2GB RAM, 2 vCPU)
- **Maintenance**: 2-4 hours/month
- **Total**: ~$50-100/mo equivalent

### ROI Calculation
- **Time saved**: 10-20 hours/week on manual reporting
- **Better decisions**: 5-10% revenue increase from data insights
- **Cost**: $85-500/mo
- **Break-even**: $1,000-5,000/mo in additional revenue

---

## 🎯 Quick Start Checklist

- [ ] Choose deployment option (Cloud vs Self-hosted)
- [ ] Set up Metabase instance
- [ ] Create read-only database user
- [ ] Connect Metabase to LSN database
- [ ] Import pre-built dashboards
- [ ] Configure user permissions
- [ ] Set up automated reports
- [ ] Train team on Metabase usage
- [ ] Integrate with LSN admin panel (optional)

---

## 📚 Resources

- **Metabase Documentation**: https://www.metabase.com/docs/
- **SQL Tutorial**: https://www.metabase.com/learn/sql-questions/
- **Dashboard Best Practices**: https://www.metabase.com/learn/dashboards/
- **Community Forum**: https://discourse.metabase.com/

---

## 🆘 Troubleshooting

### Connection Issues
- Verify database credentials
- Check firewall rules (port 3306)
- Enable SSL if required
- Test connection from Metabase server

### Performance Issues
- Add database indexes on frequently queried columns
- Use query caching in Metabase
- Limit dashboard refresh frequency
- Consider read replicas for heavy queries

### Permission Issues
- Verify database user has SELECT permission
- Check Metabase user roles
- Review row-level security filters

---

## 🎉 Next Steps

1. **Set up Metabase** using your preferred deployment method
2. **Connect to LSN database** with read-only credentials
3. **Import dashboards** from the examples above
4. **Train your team** on how to use Metabase
5. **Schedule reports** for automated delivery
6. **Monitor usage** and optimize queries

**Ready to get started? Choose your deployment option and follow the setup guide!**
