# Admin Access Quick Reference Guide

## 🔐 Authentication & Role-Based Access Control

### Overview

The Live Shopping Network implements secure role-based access control (RBAC) with two user roles:

- **Customer (`user`)** - Default role for all signups, access to shopping features only
- **Admin (`admin`)** - Elevated privileges for platform management and operations

### Key Features

✅ **Hidden Admin Navigation** - Admin dropdown only visible to admin users  
✅ **Protected Routes** - All admin pages redirect non-admin users to home  
✅ **Server-Side Validation** - Admin procedures check role before execution  
✅ **Automatic Role Checking** - Frontend components use `useAuth()` hook  
✅ **Tested & Verified** - Unit tests confirm proper access control

---

## 🎯 How to Make Someone an Admin

### Method 1: Database UI (Recommended)

1. Open the **Management UI** (right panel)
2. Click **Database** tab
3. Navigate to the `users` table
4. Find the user by email or name
5. Click **Edit** on their row
6. Change `role` field from `"user"` to `"admin"`
7. Click **Save**
8. User needs to refresh their browser to see admin access

### Method 2: SQL Query

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

Execute this in the Database panel's SQL query interface.

### Method 3: Bulk Promotion

To promote multiple users at once:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);
```

---

## 🔍 Verifying Admin Access

### For Admins

After being promoted to admin, you should see:

1. **"Admin" dropdown** in the top navigation bar (between Subscriptions and notifications)
2. **Access to admin pages** like `/admin`, `/operations-center`, `/analytics`
3. **No redirect** when visiting admin URLs

### For Customers

Regular users (role = "user") will experience:

1. **No admin dropdown** in navigation (completely hidden)
2. **Automatic redirect** to home page when accessing admin URLs
3. **Loading screen** briefly shown during authentication check

---

## 📋 Protected Admin Pages

All of these pages are protected and only accessible to admin users:

### Main Admin Dashboard
- `/admin` - Main admin dashboard with navigation
- `/admin/*` - All admin sub-pages

### Operations & Management
- `/operations-center` - Real-time operations monitoring
- `/analytics` - Analytics dashboard
- `/inventory` - Inventory management
- `/email-campaigns` - Email marketing
- `/supplier-portal` - Supplier management
- `/live-sessions` - Live session management
- `/referral-dashboard` - Referral program

### Advanced Dashboards
- `/executive-dashboard` - Executive analytics
- `/fraud-console` - Fraud detection
- `/purchasing-dashboard` - Purchasing operations
- `/creator-dashboard` - Creator economy
- `/marketing-dashboard` - Marketing analytics
- `/tiktok-arbitrage` - TikTok Shop arbitrage
- `/live-show-management` - Live show scheduling
- `/automation-workflows` - Workflow automation
- `/profit-analytics` - Profit analysis

### AI Analytics
- `/admin/demand-forecast` - Demand forecasting
- `/admin/churn-risk` - Churn risk analysis
- `/admin/pricing-optimization` - Pricing optimization
- `/admin/sentiment-analysis` - Sentiment analysis
- `/admin/revenue-forecast` - Revenue forecasting
- `/admin/rfm-segmentation` - RFM segmentation

---

## 🧪 Testing Admin Access

### Test Scenarios Verified

✅ **Admin users can access all admin pages**  
✅ **Customer users are redirected from admin pages**  
✅ **Unauthenticated users are redirected from protected pages**  
✅ **Admin navigation only shows for admin role**  
✅ **Server-side procedures validate admin role**

### Manual Testing Steps

1. **Test as Customer:**
   - Sign up for a new account
   - Verify no "Admin" button in navigation
   - Try accessing `/admin` directly → should redirect to home
   - Try accessing `/operations-center` → should redirect to home

2. **Test as Admin:**
   - Promote your account to admin (see methods above)
   - Refresh the browser
   - Verify "Admin" dropdown appears in navigation
   - Click admin dropdown → see all admin tools
   - Access `/admin` → should load admin dashboard
   - Access `/operations-center` → should load operations center

3. **Test Role Switching:**
   - Demote admin back to user: `UPDATE users SET role = 'user' WHERE email = '...'`
   - Refresh browser
   - Verify admin dropdown disappears
   - Verify admin pages redirect to home

---

## 🛠️ Technical Implementation

### Frontend Protection

**AdminProtectedRoute Component:**
```tsx
// Wraps admin pages to check authentication and role
<AdminProtectedRoute>
  <AdminDashboard />
</AdminProtectedRoute>
```

**AdminNav Component:**
```tsx
// Only renders for admin users
if (!user || user.role !== "admin") {
  return null;
}
```

### Backend Protection

**adminProcedure Middleware:**
```typescript
// Validates admin role before executing
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({ ctx });
  })
);
```

### Database Schema

**Users Table:**
```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // ... other fields
});
```

---

## 🚨 Security Best Practices

### Do's ✅

- **Always verify role on both frontend and backend**
- **Use database UI for role changes** (audit trail)
- **Test admin access after promotion** (refresh required)
- **Document admin users** (keep track of who has access)
- **Regular access reviews** (remove admin when no longer needed)

### Don'ts ❌

- **Don't rely on frontend checks alone** (server validates too)
- **Don't share admin credentials** (each admin should have own account)
- **Don't hardcode admin emails** (use database role field)
- **Don't skip testing** (verify access control works)
- **Don't forget to refresh** (browser needs to reload user data)

---

## 📞 Troubleshooting

### Problem: Admin button not showing after promotion

**Solution:**
1. Verify role was updated in database: `SELECT role FROM users WHERE email = '...'`
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache and cookies
4. Log out and log back in
5. Check browser console for errors

### Problem: Admin pages still redirect to home

**Solution:**
1. Verify you're logged in (check `/account` page)
2. Verify role is "admin" in database
3. Check that `AdminProtectedRoute` is imported correctly
4. Look for JavaScript errors in browser console
5. Verify authentication token is valid

### Problem: Customer can access admin pages

**Solution:**
1. Verify `AdminProtectedRoute` wraps the page component
2. Check that `useAuth()` hook is working
3. Verify role checking logic in `AdminProtectedRoute`
4. Test in incognito mode to rule out caching
5. Check server logs for authentication errors

### Problem: Need to demote admin back to user

**Solution:**
```sql
UPDATE users 
SET role = 'user' 
WHERE email = 'admin@example.com';
```

User needs to refresh browser to see changes.

---

## 📊 Admin Access Audit

### Checking Current Admins

```sql
SELECT id, email, name, role, createdAt, lastSignedIn
FROM users
WHERE role = 'admin'
ORDER BY lastSignedIn DESC;
```

### Checking Recent Admin Activity

```sql
SELECT email, name, lastSignedIn
FROM users
WHERE role = 'admin'
ORDER BY lastSignedIn DESC
LIMIT 10;
```

### Counting Users by Role

```sql
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;
```

---

## 🎓 Training New Admins

### Onboarding Checklist

- [ ] Create admin account
- [ ] Promote to admin role
- [ ] Verify admin access works
- [ ] Tour of admin dashboard
- [ ] Review key features and tools
- [ ] Explain role-based permissions
- [ ] Document admin responsibilities
- [ ] Provide support contact info

### Key Admin Features to Learn

1. **Operations Center** - Real-time monitoring
2. **Product Management** - Add/edit products
3. **Order Management** - Process orders
4. **Inventory Management** - Track stock
5. **Creator Management** - Manage hosts
6. **Analytics Dashboard** - View metrics
7. **Fraud Console** - Review risky orders
8. **Email Campaigns** - Marketing tools

---

**Need Help?** Submit a support request at https://help.manus.im
