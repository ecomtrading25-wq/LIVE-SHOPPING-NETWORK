/**
 * Monitoring & Alerting Service
 * 
 * Tracks business metrics, system health, and triggers alerts
 * when thresholds are exceeded.
 */

import { sendAlertEmail } from './email-service';

export type MetricType =
  | 'hourly_revenue'
  | 'daily_revenue'
  | 'order_count'
  | 'fraud_rate'
  | 'error_rate'
  | 'response_time'
  | 'payment_failure_rate'
  | 'inventory_stock'
  | 'dispute_count';

export type Severity = 'info' | 'warning' | 'critical';

export interface Metric {
  type: MetricType;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Threshold {
  metric: MetricType;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  severity: Severity;
  message: string;
  cooldown?: number; // Minutes before alerting again
}

export interface Alert {
  id: string;
  severity: Severity;
  message: string;
  metric: MetricType;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

class MonitoringService {
  private metrics: Map<MetricType, Metric[]> = new Map();
  private thresholds: Threshold[] = [];
  private alerts: Alert[] = [];
  private lastAlertTime: Map<string, Date> = new Map();
  private slackWebhookUrl: string = process.env.SLACK_WEBHOOK_URL || '';

  constructor() {
    this.initializeDefaultThresholds();
  }

  /**
   * Initialize default monitoring thresholds
   */
  private initializeDefaultThresholds() {
    // Revenue thresholds
    this.addThreshold({
      metric: 'hourly_revenue',
      operator: 'lt',
      value: 50, // Alert if revenue drops below $50/hour
      severity: 'warning',
      message: 'Hourly revenue below threshold',
      cooldown: 60,
    });

    this.addThreshold({
      metric: 'daily_revenue',
      operator: 'lt',
      value: 500, // Alert if daily revenue below $500
      severity: 'warning',
      message: 'Daily revenue below threshold',
      cooldown: 120,
    });

    // Fraud rate thresholds
    this.addThreshold({
      metric: 'fraud_rate',
      operator: 'gt',
      value: 5, // Alert if fraud rate > 5%
      severity: 'critical',
      message: 'Fraud rate exceeds 5%',
      cooldown: 30,
    });

    this.addThreshold({
      metric: 'fraud_rate',
      operator: 'gt',
      value: 10, // Critical if fraud rate > 10%
      severity: 'critical',
      message: 'CRITICAL: Fraud rate exceeds 10%',
      cooldown: 15,
    });

    // Error rate thresholds
    this.addThreshold({
      metric: 'error_rate',
      operator: 'gt',
      value: 5, // Alert if error rate > 5%
      severity: 'critical',
      message: 'Error rate exceeds 5%',
      cooldown: 30,
    });

    // Payment failure thresholds
    this.addThreshold({
      metric: 'payment_failure_rate',
      operator: 'gt',
      value: 10, // Alert if payment failure > 10%
      severity: 'critical',
      message: 'Payment failure rate exceeds 10%',
      cooldown: 30,
    });

    // Response time thresholds
    this.addThreshold({
      metric: 'response_time',
      operator: 'gt',
      value: 5000, // Alert if response time > 5 seconds
      severity: 'critical',
      message: 'Response time exceeds 5 seconds',
      cooldown: 30,
    });

    // Order count thresholds
    this.addThreshold({
      metric: 'order_count',
      operator: 'lt',
      value: 1, // Alert if no orders in the hour
      severity: 'warning',
      message: 'No orders received in the last hour',
      cooldown: 60,
    });

    // Dispute count thresholds
    this.addThreshold({
      metric: 'dispute_count',
      operator: 'gt',
      value: 5, // Alert if more than 5 open disputes
      severity: 'warning',
      message: 'High number of open disputes',
      cooldown: 120,
    });
  }

  /**
   * Record a metric
   */
  recordMetric(type: MetricType, value: number, metadata?: Record<string, any>) {
    const metric: Metric = {
      type,
      value,
      timestamp: new Date(),
      metadata,
    };

    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }

    this.metrics.get(type)!.push(metric);

    // Keep only last 1000 metrics per type
    const metrics = this.metrics.get(type)!;
    if (metrics.length > 1000) {
      this.metrics.set(type, metrics.slice(-1000));
    }

    // Check thresholds
    this.checkThresholds(type, value);

    console.log(`[Monitoring] Recorded ${type}: ${value}`, metadata || '');
  }

  /**
   * Add a monitoring threshold
   */
  addThreshold(threshold: Threshold) {
    this.thresholds.push(threshold);
    console.log(`[Monitoring] Added threshold: ${threshold.metric} ${threshold.operator} ${threshold.value}`);
  }

  /**
   * Remove a threshold
   */
  removeThreshold(metric: MetricType, operator: string, value: number) {
    this.thresholds = this.thresholds.filter(
      (t) => !(t.metric === metric && t.operator === operator && t.value === value)
    );
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: MetricType, value: number) {
    const relevantThresholds = this.thresholds.filter((t) => t.metric === metric);

    for (const threshold of relevantThresholds) {
      let triggered = false;

      switch (threshold.operator) {
        case 'gt':
          triggered = value > threshold.value;
          break;
        case 'lt':
          triggered = value < threshold.value;
          break;
        case 'gte':
          triggered = value >= threshold.value;
          break;
        case 'lte':
          triggered = value <= threshold.value;
          break;
        case 'eq':
          triggered = value === threshold.value;
          break;
      }

      if (triggered) {
        this.triggerAlert(threshold, value);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(threshold: Threshold, value: number) {
    const alertKey = `${threshold.metric}_${threshold.operator}_${threshold.value}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = new Date();

    // Check cooldown period
    if (lastAlert && threshold.cooldown) {
      const minutesSinceLastAlert = (now.getTime() - lastAlert.getTime()) / 1000 / 60;
      if (minutesSinceLastAlert < threshold.cooldown) {
        console.log(`[Monitoring] Alert ${alertKey} in cooldown period`);
        return;
      }
    }

    const alert: Alert = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: threshold.severity,
      message: threshold.message,
      metric: threshold.metric,
      value,
      threshold: threshold.value,
      timestamp: now,
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.lastAlertTime.set(alertKey, now);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.log(`[Monitoring] 🚨 ALERT: ${alert.severity.toUpperCase()} - ${alert.message} (value: ${value})`);

    // Send notifications
    await this.sendAlertNotifications(alert);
  }

  /**
   * Send alert notifications via multiple channels
   */
  private async sendAlertNotifications(alert: Alert) {
    const message = `${alert.message}\n\nMetric: ${alert.metric}\nCurrent Value: ${alert.value}\nThreshold: ${alert.threshold}\nTime: ${alert.timestamp.toLocaleString()}`;

    // Send email alert
    try {
      await sendAlertEmail(alert.message, message, alert.severity);
    } catch (error) {
      console.error('[Monitoring] Failed to send email alert:', error);
    }

    // Send Slack alert
    if (this.slackWebhookUrl) {
      try {
        await this.sendSlackAlert(alert);
      } catch (error) {
        console.error('[Monitoring] Failed to send Slack alert:', error);
      }
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alert: Alert) {
    if (!this.slackWebhookUrl) return;

    const colors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
    };

    const emoji = {
      info: ':information_source:',
      warning: ':warning:',
      critical: ':rotating_light:',
    };

    const payload = {
      text: `${emoji[alert.severity]} *${alert.severity.toUpperCase()} ALERT*`,
      attachments: [
        {
          color: colors[alert.severity],
          fields: [
            {
              title: 'Alert',
              value: alert.message,
              short: false,
            },
            {
              title: 'Metric',
              value: alert.metric,
              short: true,
            },
            {
              title: 'Current Value',
              value: alert.value.toString(),
              short: true,
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toLocaleString(),
              short: true,
            },
          ],
        },
      ],
    };

    const response = await fetch(this.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Get metrics for a specific type
   */
  getMetrics(type: MetricType, limit: number = 100): Metric[] {
    const metrics = this.metrics.get(type) || [];
    return metrics.slice(-limit);
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 50, severity?: Severity): Alert[] {
    let alerts = this.alerts.slice(-limit);
    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }
    return alerts.reverse();
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`[Monitoring] Alert ${alertId} acknowledged`);
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const recentAlerts = this.getAlerts(10);
    const criticalAlerts = recentAlerts.filter((a) => a.severity === 'critical' && !a.acknowledged);

    return {
      healthy: criticalAlerts.length === 0,
      criticalAlerts: criticalAlerts.length,
      warningAlerts: recentAlerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length,
      totalAlerts: recentAlerts.length,
      lastCheck: new Date(),
    };
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const stats: Record<string, any> = {};

    for (const [type, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const values = metrics.map((m) => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      stats[type] = {
        count: metrics.length,
        latest: metrics[metrics.length - 1].value,
        average: avg,
        min,
        max,
        lastUpdated: metrics[metrics.length - 1].timestamp,
      };
    }

    return stats;
  }

  /**
   * Clear old metrics (for cleanup)
   */
  clearOldMetrics(hoursToKeep: number = 24) {
    const cutoffTime = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000);

    for (const [type, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter((m) => m.timestamp > cutoffTime);
      this.metrics.set(type, filtered);
    }

    console.log(`[Monitoring] Cleared metrics older than ${hoursToKeep} hours`);
  }
}

// Singleton instance
let monitoringService: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringService) {
    monitoringService = new MonitoringService();
  }
  return monitoringService;
}

// Convenience functions
export function recordMetric(type: MetricType, value: number, metadata?: Record<string, any>) {
  getMonitoringService().recordMetric(type, value, metadata);
}

export function getHealthStatus() {
  return getMonitoringService().getHealthStatus();
}

export function getMonitoringStats() {
  return getMonitoringService().getStats();
}
