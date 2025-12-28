/**
 * Advanced Business Intelligence & Reporting Engine
 * Dashboards, metrics, KPIs, data visualization, predictive analytics, report generation
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  metrics: Metric[];
  dimensions: Dimension[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  format: ReportFormat;
  createdAt: Date;
  updatedAt: Date;
}

export type ReportType = 
  | 'sales' | 'revenue' | 'orders' | 'customers' | 'products' 
  | 'inventory' | 'marketing' | 'shows' | 'engagement' | 'custom';

export type ReportFormat = 'table' | 'chart' | 'dashboard' | 'pdf' | 'excel';

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  aggregation: AggregationType;
  field: string;
  formula?: string;
  target?: number;
  format?: MetricFormat;
}

export type MetricType = 
  | 'count' | 'sum' | 'average' | 'min' | 'max' 
  | 'percentage' | 'ratio' | 'growth' | 'custom';

export type AggregationType = 
  | 'sum' | 'avg' | 'count' | 'min' | 'max' 
  | 'distinct' | 'median' | 'percentile';

export interface MetricFormat {
  type: 'number' | 'currency' | 'percentage' | 'duration';
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export interface Dimension {
  id: string;
  name: string;
  field: string;
  type: 'time' | 'category' | 'geography' | 'custom';
  grouping?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator = 
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  enabled: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  metric: Metric;
  visualization: VisualizationType;
  size: WidgetSize;
  position: WidgetPosition;
  config?: WidgetConfig;
}

export type WidgetType = 
  | 'metric' | 'chart' | 'table' | 'map' | 'gauge' 
  | 'progress' | 'list' | 'text' | 'custom';

export type VisualizationType = 
  | 'line' | 'bar' | 'pie' | 'donut' | 'area' 
  | 'scatter' | 'heatmap' | 'funnel' | 'gauge' | 'number';

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetConfig {
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animation?: boolean;
  threshold?: number;
  comparison?: ComparisonConfig;
}

export interface ComparisonConfig {
  enabled: boolean;
  period: 'previous_period' | 'previous_year' | 'custom';
  showChange?: boolean;
  showPercentage?: boolean;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  gap: number;
}

export interface DashboardFilter {
  id: string;
  field: string;
  type: 'date_range' | 'select' | 'multi_select' | 'search';
  options?: any[];
  defaultValue?: any;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  metric: Metric;
  target: number;
  current: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercentage: number;
  status: 'good' | 'warning' | 'critical';
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  data: any;
  recommendations?: string[];
  createdAt: Date;
}

export type InsightType = 
  | 'anomaly' | 'trend' | 'forecast' | 'correlation' 
  | 'opportunity' | 'risk' | 'performance';

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: ReportFilter[];
  dateRange: DateRange;
  groupBy?: string[];
  orderBy?: OrderBy[];
  limit?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year';
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryResult {
  data: any[];
  total: number;
  aggregations?: Record<string, number>;
  metadata: QueryMetadata;
}

export interface QueryMetadata {
  executionTime: number;
  rowCount: number;
  cached: boolean;
  query: string;
}

// ============================================================================
// METRICS ENGINE
// ============================================================================

class MetricsEngine {
  private metrics: Map<string, Metric> = new Map();

  // Register metric
  registerMetric(metric: Metric): void {
    this.metrics.set(metric.id, metric);
  }

  // Calculate metric
  async calculateMetric(metricId: string, data: any[], filters?: ReportFilter[]): Promise<number> {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      throw new Error(`Metric not found: ${metricId}`);
    }

    // Apply filters
    let filtered = data;
    if (filters) {
      filtered = this.applyFilters(data, filters);
    }

    // Calculate based on aggregation type
    switch (metric.aggregation) {
      case 'sum':
        return filtered.reduce((sum, item) => sum + (item[metric.field] || 0), 0);
      
      case 'avg':
        const sum = filtered.reduce((s, item) => s + (item[metric.field] || 0), 0);
        return filtered.length > 0 ? sum / filtered.length : 0;
      
      case 'count':
        return filtered.length;
      
      case 'min':
        return Math.min(...filtered.map(item => item[metric.field] || 0));
      
      case 'max':
        return Math.max(...filtered.map(item => item[metric.field] || 0));
      
      case 'distinct':
        return new Set(filtered.map(item => item[metric.field])).size;
      
      case 'median':
        const sorted = filtered.map(item => item[metric.field] || 0).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      
      default:
        return 0;
    }
  }

  // Apply filters
  private applyFilters(data: any[], filters: ReportFilter[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'not_equals':
            return value !== filter.value;
          case 'contains':
            return String(value).includes(String(filter.value));
          case 'not_contains':
            return !String(value).includes(String(filter.value));
          case 'greater_than':
            return value > filter.value;
          case 'less_than':
            return value < filter.value;
          case 'between':
            return value >= filter.value[0] && value <= filter.value[1];
          case 'in':
            return filter.value.includes(value);
          case 'not_in':
            return !filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  // Format metric value
  formatMetric(value: number, format?: MetricFormat): string {
    if (!format) return String(value);

    let formatted = value.toFixed(format.decimals || 0);

    switch (format.type) {
      case 'currency':
        formatted = `$${formatted}`;
        break;
      case 'percentage':
        formatted = `${formatted}%`;
        break;
      case 'duration':
        formatted = this.formatDuration(value);
        break;
    }

    if (format.prefix) formatted = format.prefix + formatted;
    if (format.suffix) formatted = formatted + format.suffix;

    return formatted;
  }

  // Format duration
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  // Get all metrics
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

class ReportGenerator {
  private metricsEngine: MetricsEngine;

  constructor(metricsEngine: MetricsEngine) {
    this.metricsEngine = metricsEngine;
  }

  // Generate report
  async generateReport(report: Report, data: any[]): Promise<QueryResult> {
    const startTime = Date.now();

    // Calculate metrics
    const results: any[] = [];
    
    if (report.dimensions.length === 0) {
      // No dimensions - single row with metrics
      const row: any = {};
      for (const metric of report.metrics) {
        const value = await this.metricsEngine.calculateMetric(metric.id, data, report.filters);
        row[metric.name] = value;
      }
      results.push(row);
    } else {
      // Group by dimensions
      const grouped = this.groupByDimensions(data, report.dimensions);
      
      for (const [key, groupData] of grouped.entries()) {
        const row: any = { dimension: key };
        for (const metric of report.metrics) {
          const value = await this.metricsEngine.calculateMetric(metric.id, groupData, report.filters);
          row[metric.name] = value;
        }
        results.push(row);
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      data: results,
      total: results.length,
      metadata: {
        executionTime,
        rowCount: results.length,
        cached: false,
        query: `Report: ${report.name}`
      }
    };
  }

  // Group by dimensions
  private groupByDimensions(data: any[], dimensions: Dimension[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    for (const item of data) {
      const key = dimensions.map(dim => {
        let value = item[dim.field];
        
        // Apply time grouping
        if (dim.type === 'time' && dim.grouping && value instanceof Date) {
          value = this.groupByTime(value, dim.grouping);
        }
        
        return value;
      }).join('|');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    }

    return grouped;
  }

  // Group by time
  private groupByTime(date: Date, grouping: string): string {
    switch (grouping) {
      case 'hour':
        return date.toISOString().slice(0, 13);
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week':
        const week = this.getWeekNumber(date);
        return `${date.getFullYear()}-W${week}`;
      case 'month':
        return date.toISOString().slice(0, 7);
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case 'year':
        return String(date.getFullYear());
      default:
        return date.toISOString();
    }
  }

  // Get week number
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Export report
  async exportReport(report: Report, result: QueryResult, format: ReportFormat): Promise<string> {
    switch (format) {
      case 'table':
        return this.exportAsTable(result);
      case 'chart':
        return this.exportAsChart(result);
      case 'pdf':
        return this.exportAsPDF(report, result);
      case 'excel':
        return this.exportAsExcel(result);
      default:
        return JSON.stringify(result.data, null, 2);
    }
  }

  // Export as table
  private exportAsTable(result: QueryResult): string {
    if (result.data.length === 0) return '';

    const headers = Object.keys(result.data[0]);
    const rows = result.data.map(row => 
      headers.map(h => row[h]).join('\t')
    );

    return [headers.join('\t'), ...rows].join('\n');
  }

  // Export as chart (JSON config)
  private exportAsChart(result: QueryResult): string {
    return JSON.stringify({
      type: 'line',
      data: result.data,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }, null, 2);
  }

  // Export as PDF
  private exportAsPDF(report: Report, result: QueryResult): string {
    // In production, would use a PDF library
    return `PDF Report: ${report.name}\n\n${this.exportAsTable(result)}`;
  }

  // Export as Excel
  private exportAsExcel(result: QueryResult): string {
    // In production, would use an Excel library
    return this.exportAsTable(result);
  }
}

// ============================================================================
// DASHBOARD MANAGER
// ============================================================================

class DashboardManager {
  private dashboards: Map<string, Dashboard> = new Map();
  private metricsEngine: MetricsEngine;

  constructor(metricsEngine: MetricsEngine) {
    this.metricsEngine = metricsEngine;
  }

  // Create dashboard
  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
    const id = this.generateId();
    const now = new Date();

    const newDashboard: Dashboard = {
      id,
      ...dashboard,
      createdAt: now,
      updatedAt: now
    };

    this.dashboards.set(id, newDashboard);
    return newDashboard;
  }

  // Update dashboard
  updateDashboard(id: string, updates: Partial<Dashboard>): Dashboard | null {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return null;

    const updated = {
      ...dashboard,
      ...updates,
      updatedAt: new Date()
    };

    this.dashboards.set(id, updated);
    return updated;
  }

  // Delete dashboard
  deleteDashboard(id: string): boolean {
    return this.dashboards.delete(id);
  }

  // Get dashboard
  getDashboard(id: string): Dashboard | undefined {
    return this.dashboards.get(id);
  }

  // List dashboards
  listDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  // Render dashboard
  async renderDashboard(dashboardId: string, data: any[]): Promise<any> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    const widgets = await Promise.all(
      dashboard.widgets.map(widget => this.renderWidget(widget, data))
    );

    return {
      id: dashboard.id,
      name: dashboard.name,
      widgets,
      layout: dashboard.layout
    };
  }

  // Render widget
  private async renderWidget(widget: Widget, data: any[]): Promise<any> {
    const value = await this.metricsEngine.calculateMetric(widget.metric.id, data);

    return {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      value,
      visualization: widget.visualization,
      size: widget.size,
      position: widget.position,
      config: widget.config
    };
  }

  // Generate ID
  private generateId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// KPI TRACKER
// ============================================================================

class KPITracker {
  private kpis: Map<string, KPI> = new Map();
  private metricsEngine: MetricsEngine;

  constructor(metricsEngine: MetricsEngine) {
    this.metricsEngine = metricsEngine;
  }

  // Track KPI
  async trackKPI(kpi: Omit<KPI, 'current' | 'trend' | 'change' | 'changePercentage' | 'status'>, data: any[], previousData?: any[]): Promise<KPI> {
    const current = await this.metricsEngine.calculateMetric(kpi.metric.id, data);
    
    let change = 0;
    let changePercentage = 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (previousData) {
      const previous = await this.metricsEngine.calculateMetric(kpi.metric.id, previousData);
      change = current - previous;
      changePercentage = previous !== 0 ? (change / previous) * 100 : 0;
      trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    }

    const status = this.calculateStatus(current, kpi.target);

    const trackedKPI: KPI = {
      ...kpi,
      current,
      trend,
      change,
      changePercentage,
      status
    };

    this.kpis.set(kpi.id, trackedKPI);
    return trackedKPI;
  }

  // Calculate status
  private calculateStatus(current: number, target: number): 'good' | 'warning' | 'critical' {
    const percentage = (current / target) * 100;
    
    if (percentage >= 100) return 'good';
    if (percentage >= 80) return 'warning';
    return 'critical';
  }

  // Get KPI
  getKPI(id: string): KPI | undefined {
    return this.kpis.get(id);
  }

  // List KPIs
  listKPIs(): KPI[] {
    return Array.from(this.kpis.values());
  }

  // Get KPIs by status
  getKPIsByStatus(status: 'good' | 'warning' | 'critical'): KPI[] {
    return this.listKPIs().filter(kpi => kpi.status === status);
  }
}

// ============================================================================
// INSIGHTS ENGINE
// ============================================================================

class InsightsEngine {
  private insights: Insight[] = [];

  // Detect anomalies
  detectAnomalies(data: any[], metric: string, threshold: number = 2): Insight[] {
    const values = data.map(item => item[metric]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    const anomalies: Insight[] = [];

    for (let i = 0; i < data.length; i++) {
      const value = values[i];
      const zScore = Math.abs((value - mean) / stdDev);

      if (zScore > threshold) {
        anomalies.push({
          id: this.generateId(),
          type: 'anomaly',
          title: `Anomaly detected in ${metric}`,
          description: `Value ${value} is ${zScore.toFixed(2)} standard deviations from the mean`,
          severity: zScore > 3 ? 'critical' : 'warning',
          data: { value, mean, stdDev, zScore, index: i },
          createdAt: new Date()
        });
      }
    }

    this.insights.push(...anomalies);
    return anomalies;
  }

  // Detect trends
  detectTrends(data: any[], metric: string, minPeriods: number = 3): Insight[] {
    const values = data.map(item => item[metric]);
    const trends: Insight[] = [];

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (Math.abs(slope) > 0.1) {
      trends.push({
        id: this.generateId(),
        type: 'trend',
        title: `${slope > 0 ? 'Upward' : 'Downward'} trend in ${metric}`,
        description: `${metric} is trending ${slope > 0 ? 'up' : 'down'} with slope ${slope.toFixed(2)}`,
        severity: 'info',
        data: { slope, metric },
        recommendations: [
          slope > 0 
            ? `Consider increasing capacity for ${metric}`
            : `Investigate causes of declining ${metric}`
        ],
        createdAt: new Date()
      });
    }

    this.insights.push(...trends);
    return trends;
  }

  // Generate forecast
  generateForecast(data: any[], metric: string, periods: number = 7): Insight {
    const values = data.map(item => item[metric]);
    
    // Simple moving average forecast
    const windowSize = Math.min(7, values.length);
    const recentValues = values.slice(-windowSize);
    const forecast = recentValues.reduce((sum, v) => sum + v, 0) / windowSize;

    const insight: Insight = {
      id: this.generateId(),
      type: 'forecast',
      title: `Forecast for ${metric}`,
      description: `Predicted value: ${forecast.toFixed(2)} based on ${windowSize}-period moving average`,
      severity: 'info',
      data: { forecast, periods, metric },
      createdAt: new Date()
    };

    this.insights.push(insight);
    return insight;
  }

  // Get insights
  getInsights(filter?: { type?: InsightType; severity?: string }): Insight[] {
    let filtered = this.insights;

    if (filter?.type) {
      filtered = filtered.filter(i => i.type === filter.type);
    }

    if (filter?.severity) {
      filtered = filtered.filter(i => i.severity === filter.severity);
    }

    return filtered;
  }

  // Clear insights
  clearInsights(): void {
    this.insights = [];
  }

  // Generate ID
  private generateId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// PREDEFINED REPORTS
// ============================================================================

const PREDEFINED_REPORTS = {
  salesOverview: {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: 'Overview of sales performance',
    type: 'sales' as ReportType,
    metrics: [
      { id: 'total-sales', name: 'Total Sales', type: 'sum' as MetricType, aggregation: 'sum' as AggregationType, field: 'amount' },
      { id: 'order-count', name: 'Order Count', type: 'count' as MetricType, aggregation: 'count' as AggregationType, field: 'id' },
      { id: 'avg-order-value', name: 'Avg Order Value', type: 'average' as MetricType, aggregation: 'avg' as AggregationType, field: 'amount' }
    ],
    dimensions: [
      { id: 'date', name: 'Date', field: 'createdAt', type: 'time' as const, grouping: 'day' as const }
    ],
    filters: [],
    format: 'dashboard' as ReportFormat,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  customerAnalytics: {
    id: 'customer-analytics',
    name: 'Customer Analytics',
    description: 'Customer behavior and engagement metrics',
    type: 'customers' as ReportType,
    metrics: [
      { id: 'new-customers', name: 'New Customers', type: 'count' as MetricType, aggregation: 'count' as AggregationType, field: 'id' },
      { id: 'active-customers', name: 'Active Customers', type: 'count' as MetricType, aggregation: 'distinct' as AggregationType, field: 'userId' },
      { id: 'customer-lifetime-value', name: 'Customer Lifetime Value', type: 'average' as MetricType, aggregation: 'avg' as AggregationType, field: 'totalSpent' }
    ],
    dimensions: [],
    filters: [],
    format: 'dashboard' as ReportFormat,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  inventoryReport: {
    id: 'inventory-report',
    name: 'Inventory Report',
    description: 'Stock levels and inventory turnover',
    type: 'inventory' as ReportType,
    metrics: [
      { id: 'total-products', name: 'Total Products', type: 'count' as MetricType, aggregation: 'count' as AggregationType, field: 'id' },
      { id: 'low-stock', name: 'Low Stock Items', type: 'count' as MetricType, aggregation: 'count' as AggregationType, field: 'id' },
      { id: 'out-of-stock', name: 'Out of Stock', type: 'count' as MetricType, aggregation: 'count' as AggregationType, field: 'id' }
    ],
    dimensions: [
      { id: 'category', name: 'Category', field: 'category', type: 'category' as const }
    ],
    filters: [],
    format: 'table' as ReportFormat,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export const metricsEngine = new MetricsEngine();
export const reportGenerator = new ReportGenerator(metricsEngine);
export const dashboardManager = new DashboardManager(metricsEngine);
export const kpiTracker = new KPITracker(metricsEngine);
export const insightsEngine = new InsightsEngine();

// Helper functions
export function registerMetric(metric: Metric): void {
  metricsEngine.registerMetric(metric);
}

export async function generateReport(report: Report, data: any[]): Promise<QueryResult> {
  return await reportGenerator.generateReport(report, data);
}

export function createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
  return dashboardManager.createDashboard(dashboard);
}

export async function trackKPI(kpi: Omit<KPI, 'current' | 'trend' | 'change' | 'changePercentage' | 'status'>, data: any[], previousData?: any[]): Promise<KPI> {
  return await kpiTracker.trackKPI(kpi, data, previousData);
}

export function detectAnomalies(data: any[], metric: string, threshold?: number): Insight[] {
  return insightsEngine.detectAnomalies(data, metric, threshold);
}

export function detectTrends(data: any[], metric: string): Insight[] {
  return insightsEngine.detectTrends(data, metric);
}

export function getPredefinedReports() {
  return PREDEFINED_REPORTS;
}
