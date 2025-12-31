-- ============================================================================
-- METABASE SQL QUERIES FOR LIVE SHOPPING NETWORK
-- Pre-built queries for dashboards and reports
-- ============================================================================

-- ============================================================================
-- 1. EXECUTIVE DASHBOARD
-- ============================================================================

-- Daily Revenue Trend (Last 30 Days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM orders
WHERE status IN ('completed', 'shipped', 'delivered')
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top 10 Products by Revenue
SELECT 
  p.id,
  p.name,
  p.sku,
  COUNT(DISTINCT oi.order_id) as orders,
  SUM(oi.quantity) as units_sold,
  SUM(oi.quantity * oi.price) as total_revenue,
  AVG(oi.price) as avg_price
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('completed', 'shipped', 'delivered')
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id
ORDER BY total_revenue DESC
LIMIT 10;

-- Revenue by Channel
SELECT 
  c.name as channel,
  COUNT(DISTINCT o.id) as orders,
  SUM(o.total_amount) as revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
JOIN channels c ON o.channel_id = c.id
WHERE o.status IN ('completed', 'shipped', 'delivered')
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY c.id
ORDER BY revenue DESC;

-- Key Metrics Summary
SELECT 
  COUNT(DISTINCT CASE WHEN created_at >= CURDATE() THEN id END) as orders_today,
  SUM(CASE WHEN created_at >= CURDATE() THEN total_amount ELSE 0 END) as revenue_today,
  COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN id END) as orders_week,
  SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END) as revenue_week,
  COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN id END) as orders_month,
  SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN total_amount ELSE 0 END) as revenue_month
FROM orders
WHERE status IN ('completed', 'shipped', 'delivered');

-- ============================================================================
-- 2. LIVE STREAMING ANALYTICS
-- ============================================================================

-- Active Streams Performance
SELECT 
  ls.id,
  ls.title,
  ls.host_name,
  ls.status,
  ls.started_at,
  ls.ended_at,
  TIMESTAMPDIFF(MINUTE, ls.started_at, COALESCE(ls.ended_at, NOW())) as duration_minutes,
  COUNT(DISTINCT lv.user_id) as unique_viewers,
  AVG(lv.watch_duration_seconds) / 60 as avg_watch_minutes,
  COUNT(DISTINCT o.id) as orders_during_stream,
  SUM(o.total_amount) as revenue_during_stream
FROM live_shows ls
LEFT JOIN live_viewers lv ON ls.id = lv.show_id
LEFT JOIN orders o ON o.created_at BETWEEN ls.started_at AND COALESCE(ls.ended_at, NOW())
WHERE ls.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ls.id
ORDER BY ls.started_at DESC;

-- Top Performing Hosts
SELECT 
  ls.host_name,
  COUNT(DISTINCT ls.id) as total_streams,
  SUM(TIMESTAMPDIFF(MINUTE, ls.started_at, ls.ended_at)) as total_minutes_streamed,
  COUNT(DISTINCT lv.user_id) as total_unique_viewers,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_amount) / COUNT(DISTINCT ls.id) as avg_revenue_per_stream
FROM live_shows ls
LEFT JOIN live_viewers lv ON ls.id = lv.show_id
LEFT JOIN orders o ON o.created_at BETWEEN ls.started_at AND ls.ended_at
WHERE ls.status = 'completed'
  AND ls.started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ls.host_name
ORDER BY total_revenue DESC;

-- Product Performance in Streams
SELECT 
  p.id,
  p.name,
  COUNT(DISTINCT lsp.show_id) as featured_in_streams,
  COUNT(DISTINCT o.id) as orders_from_streams,
  SUM(oi.quantity) as units_sold_in_streams,
  SUM(oi.quantity * oi.price) as revenue_from_streams
FROM products p
JOIN live_show_products lsp ON p.id = lsp.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at BETWEEN 
  (SELECT started_at FROM live_shows WHERE id = lsp.show_id) AND 
  (SELECT ended_at FROM live_shows WHERE id = lsp.show_id)
WHERE lsp.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id
ORDER BY revenue_from_streams DESC
LIMIT 20;

-- ============================================================================
-- 3. CREATOR PERFORMANCE
-- ============================================================================

-- Creator Leaderboard
SELECT 
  c.id,
  c.name,
  c.email,
  c.tier,
  COUNT(DISTINCT ca.order_id) as attributed_orders,
  SUM(ca.sale_amount) as attributed_sales,
  SUM(ca.commission_amount) as total_commission,
  AVG(ca.commission_rate) * 100 as avg_commission_rate_pct,
  SUM(CASE WHEN cp.status = 'paid' THEN cp.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN cp.status = 'pending' THEN cp.amount ELSE 0 END) as pending_payout
FROM creators c
LEFT JOIN creator_attributions ca ON c.id = ca.creator_id
LEFT JOIN creator_payouts cp ON c.id = cp.creator_id
WHERE ca.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY c.id
ORDER BY total_commission DESC
LIMIT 50;

-- Creator Sales by Product
SELECT 
  c.name as creator_name,
  p.name as product_name,
  COUNT(DISTINCT ca.order_id) as orders,
  SUM(ca.sale_amount) as total_sales,
  SUM(ca.commission_amount) as total_commission
FROM creator_attributions ca
JOIN creators c ON ca.creator_id = c.id
JOIN products p ON ca.product_id = p.id
WHERE ca.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY c.id, p.id
ORDER BY total_commission DESC
LIMIT 100;

-- Payout History
SELECT 
  cp.id,
  c.name as creator_name,
  cp.amount,
  cp.currency,
  cp.status,
  cp.payment_method,
  cp.created_at,
  cp.paid_at,
  DATEDIFF(cp.paid_at, cp.created_at) as days_to_payment
FROM creator_payouts cp
JOIN creators c ON cp.creator_id = c.id
WHERE cp.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
ORDER BY cp.created_at DESC;

-- ============================================================================
-- 4. INVENTORY MANAGEMENT
-- ============================================================================

-- Low Stock Alert
SELECT 
  p.id,
  p.name,
  p.sku,
  w.name as warehouse,
  i.available,
  i.reserved,
  i.on_hand,
  CASE 
    WHEN i.available = 0 THEN 'Out of Stock'
    WHEN i.available < 10 THEN 'Critical'
    WHEN i.available < 50 THEN 'Low'
    WHEN i.available < 100 THEN 'Medium'
    ELSE 'Good'
  END as stock_status,
  p.price * i.available as stock_value
FROM products p
JOIN inventory i ON p.id = i.product_id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE p.status = 'active'
ORDER BY i.available ASC, stock_value DESC;

-- Inventory Turnover Rate
SELECT 
  p.id,
  p.name,
  p.sku,
  i.on_hand as current_stock,
  COUNT(DISTINCT oi.order_id) as orders_last_30d,
  SUM(oi.quantity) as units_sold_last_30d,
  CASE 
    WHEN i.on_hand > 0 THEN (SUM(oi.quantity) / i.on_hand) * 30
    ELSE 0
  END as days_of_stock_remaining,
  CASE 
    WHEN SUM(oi.quantity) > 0 THEN i.on_hand / (SUM(oi.quantity) / 30)
    ELSE 999
  END as days_until_stockout
FROM products p
JOIN inventory i ON p.id = i.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE p.status = 'active'
GROUP BY p.id, i.on_hand
HAVING units_sold_last_30d > 0
ORDER BY days_until_stockout ASC;

-- Warehouse Capacity
SELECT 
  w.name as warehouse,
  COUNT(DISTINCT i.product_id) as unique_products,
  SUM(i.on_hand) as total_units,
  SUM(p.price * i.on_hand) as total_stock_value,
  COUNT(DISTINCT CASE WHEN i.available < 10 THEN i.product_id END) as low_stock_products
FROM warehouses w
LEFT JOIN inventory i ON w.id = i.warehouse_id
LEFT JOIN products p ON i.product_id = p.id
WHERE w.status = 'active'
GROUP BY w.id
ORDER BY total_stock_value DESC;

-- ============================================================================
-- 5. CUSTOMER ANALYTICS
-- ============================================================================

-- Customer Lifetime Value (Top 100)
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_amount) as lifetime_value,
  AVG(o.total_amount) as avg_order_value,
  MIN(o.created_at) as first_order_date,
  MAX(o.created_at) as last_order_date,
  DATEDIFF(MAX(o.created_at), MIN(o.created_at)) as customer_lifetime_days
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status IN ('completed', 'shipped', 'delivered')
GROUP BY u.id
ORDER BY lifetime_value DESC
LIMIT 100;

-- Cohort Retention Analysis
SELECT 
  DATE_FORMAT(first_order_date, '%Y-%m') as cohort_month,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN months_since_first = 0 THEN user_id END) as month_0,
  COUNT(DISTINCT CASE WHEN months_since_first = 1 THEN user_id END) as month_1,
  COUNT(DISTINCT CASE WHEN months_since_first = 2 THEN user_id END) as month_2,
  COUNT(DISTINCT CASE WHEN months_since_first = 3 THEN user_id END) as month_3,
  COUNT(DISTINCT CASE WHEN months_since_first = 6 THEN user_id END) as month_6
FROM (
  SELECT 
    o.user_id,
    MIN(DATE(o.created_at)) as first_order_date,
    DATE(o.created_at) as order_date,
    TIMESTAMPDIFF(MONTH, MIN(DATE(o.created_at)), DATE(o.created_at)) as months_since_first
  FROM orders o
  WHERE o.status IN ('completed', 'shipped', 'delivered')
  GROUP BY o.user_id, DATE(o.created_at)
) cohort_data
WHERE first_order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY cohort_month
ORDER BY cohort_month DESC;

-- Customer Segmentation (RFM)
SELECT 
  u.id,
  u.name,
  u.email,
  DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order,
  COUNT(DISTINCT o.id) as order_frequency,
  SUM(o.total_amount) as monetary_value,
  CASE 
    WHEN DATEDIFF(NOW(), MAX(o.created_at)) <= 30 THEN 'Active'
    WHEN DATEDIFF(NOW(), MAX(o.created_at)) <= 90 THEN 'At Risk'
    ELSE 'Churned'
  END as recency_segment,
  CASE 
    WHEN COUNT(DISTINCT o.id) >= 10 THEN 'VIP'
    WHEN COUNT(DISTINCT o.id) >= 5 THEN 'Loyal'
    WHEN COUNT(DISTINCT o.id) >= 2 THEN 'Regular'
    ELSE 'New'
  END as frequency_segment,
  CASE 
    WHEN SUM(o.total_amount) >= 5000 THEN 'High Value'
    WHEN SUM(o.total_amount) >= 1000 THEN 'Medium Value'
    ELSE 'Low Value'
  END as monetary_segment
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status IN ('completed', 'shipped', 'delivered')
GROUP BY u.id
ORDER BY monetary_value DESC;

-- ============================================================================
-- 6. FRAUD DETECTION
-- ============================================================================

-- High Risk Transactions
SELECT 
  fc.id,
  o.id as order_id,
  o.user_id,
  u.email,
  o.total_amount,
  fc.risk_score,
  fc.risk_level,
  fc.decision,
  fc.fraud_indicators,
  fc.created_at
FROM fraud_checks fc
JOIN orders o ON fc.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE fc.risk_level IN ('high', 'critical')
  AND fc.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY fc.risk_score DESC, fc.created_at DESC;

-- Fraud Patterns by Indicator
SELECT 
  JSON_UNQUOTE(JSON_EXTRACT(fraud_indicators, '$[0]')) as primary_indicator,
  COUNT(*) as occurrences,
  AVG(risk_score) as avg_risk_score,
  COUNT(CASE WHEN decision = 'decline' THEN 1 END) as declined,
  COUNT(CASE WHEN decision = 'review' THEN 1 END) as under_review
FROM fraud_checks
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND fraud_indicators IS NOT NULL
GROUP BY primary_indicator
ORDER BY occurrences DESC;

-- Blocked Entities
SELECT 
  entity_type,
  entity_value,
  reason,
  blocked_at,
  DATEDIFF(NOW(), blocked_at) as days_blocked
FROM blocked_entities
WHERE status = 'active'
ORDER BY blocked_at DESC;

-- ============================================================================
-- 7. FINANCIAL REPORTING
-- ============================================================================

-- Daily Financial Summary
SELECT 
  DATE(created_at) as date,
  SUM(total_amount) as gross_revenue,
  SUM(shipping_cost) as shipping_revenue,
  SUM(tax_amount) as tax_collected,
  SUM(total_amount - shipping_cost - tax_amount) as net_revenue,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status IN ('completed', 'shipped', 'delivered')
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Revenue by Payment Method
SELECT 
  payment_method,
  COUNT(*) as transactions,
  SUM(amount) as total_amount,
  AVG(amount) as avg_transaction,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  (COUNT(CASE WHEN status = 'failed' THEN 1 END) / COUNT(*)) * 100 as failure_rate_pct
FROM payment_transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY payment_method
ORDER BY total_amount DESC;

-- Refunds and Returns
SELECT 
  DATE(r.created_at) as date,
  COUNT(*) as return_count,
  SUM(r.refund_amount) as total_refunded,
  AVG(r.refund_amount) as avg_refund,
  COUNT(DISTINCT r.order_id) as affected_orders
FROM refunds r
WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(r.created_at)
ORDER BY date DESC;
