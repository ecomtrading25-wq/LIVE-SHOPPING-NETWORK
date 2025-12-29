import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  AlertCircle,
  Download,
  Calendar,
  Brain,
} from "lucide-react";

/**
 * Business Intelligence Suite
 * Predictive analytics, cohort analysis, revenue forecasting, custom KPI dashboards
 */

interface Forecast {
  period: string;
  predicted: number;
  confidence: { low: number; high: number };
  actual?: number;
}

interface Cohort {
  month: string;
  users: number;
  retention: number[];
}

interface KPIWidget {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
  icon: any;
  color: string;
}

interface AutomatedInsight {
  id: string;
  type: "alert" | "opportunity" | "anomaly";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  timestamp: string;
}

export default function BISuitePage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [forecastPeriod, setForecastPeriod] = useState<"30" | "60" | "90">("30");

  // Mock revenue forecast
  const revenueForecast: Forecast[] = [
    {
      period: "Week 1",
      predicted: 125000,
      confidence: { low: 118000, high: 132000 },
      actual: 123500,
    },
    {
      period: "Week 2",
      predicted: 132000,
      confidence: { low: 124000, high: 140000 },
      actual: 135000,
    },
    {
      period: "Week 3",
      predicted: 138000,
      confidence: { low: 130000, high: 146000 },
    },
    {
      period: "Week 4",
      predicted: 145000,
      confidence: { low: 136000, high: 154000 },
    },
  ];

  // Mock cohort data
  const cohorts: Cohort[] = [
    {
      month: "Sep 2025",
      users: 1250,
      retention: [100, 68, 52, 41, 35],
    },
    {
      month: "Oct 2025",
      users: 1890,
      retention: [100, 72, 58, 47],
    },
    {
      month: "Nov 2025",
      users: 2340,
      retention: [100, 75, 62],
    },
    {
      month: "Dec 2025",
      users: 2890,
      retention: [100, 78],
    },
  ];

  // Mock KPI widgets
  const kpiWidgets: KPIWidget[] = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: "$2.4M",
      change: 24.5,
      trend: "up",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      id: "customers",
      title: "Active Customers",
      value: "12,450",
      change: 18.2,
      trend: "up",
      icon: Users,
      color: "text-blue-500",
    },
    {
      id: "conversion",
      title: "Conversion Rate",
      value: "3.8%",
      change: -2.1,
      trend: "down",
      icon: Target,
      color: "text-orange-500",
    },
    {
      id: "aov",
      title: "Avg Order Value",
      value: "$192.50",
      change: 12.3,
      trend: "up",
      icon: TrendingUp,
      color: "text-red-500",
    },
  ];

  // Mock automated insights
  const insights: AutomatedInsight[] = [
    {
      id: "INS-001",
      type: "alert",
      title: "Sales Drop in Electronics Category",
      description: "Electronics category sales decreased by 15% compared to last week. Investigate pricing or inventory issues.",
      impact: "high",
      timestamp: "2025-12-27T14:00:00Z",
    },
    {
      id: "INS-002",
      type: "opportunity",
      title: "High Conversion on Mobile Devices",
      description: "Mobile conversion rate increased to 4.2% (up from 3.1%). Consider mobile-first campaigns.",
      impact: "medium",
      timestamp: "2025-12-27T12:00:00Z",
    },
    {
      id: "INS-003",
      type: "anomaly",
      title: "Unusual Traffic Spike Detected",
      description: "Traffic from social media increased by 340% in the last 24 hours. Likely from viral post.",
      impact: "medium",
      timestamp: "2025-12-27T10:00:00Z",
    },
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-red-500/20 text-red-400";
      case "opportunity":
        return "bg-green-500/20 text-green-400";
      case "anomaly":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Business Intelligence Suite</h1>
          <p className="text-muted-foreground">
            Predictive analytics, forecasting, and automated insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiWidgets.map((widget) => (
          <Card key={widget.id} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{widget.title}</p>
              <widget.icon className={`w-5 h-5 ${widget.color}`} />
            </div>
            <p className="text-3xl font-bold mb-1">{widget.value}</p>
            <div className="flex items-center gap-1">
              {widget.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-xs ${
                  widget.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {widget.change > 0 ? "+" : ""}
                {widget.change}% from last month
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="forecasting">
            <Brain className="w-4 h-4 mr-2" />
            Predictive Forecasting
          </TabsTrigger>
          <TabsTrigger value="cohorts">
            <Users className="w-4 h-4 mr-2" />
            Cohort Analysis
          </TabsTrigger>
          <TabsTrigger value="insights">
            <AlertCircle className="w-4 h-4 mr-2" />
            Automated Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Revenue Trend</h2>
              <div className="space-y-4">
                {[
                  { month: "Sep", revenue: 1850000, growth: 12.5 },
                  { month: "Oct", revenue: 2100000, growth: 13.5 },
                  { month: "Nov", revenue: 2340000, growth: 11.4 },
                  { month: "Dec", revenue: 2450000, growth: 4.7 },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.month} 2025</span>
                      <span className="font-bold">
                        ${(item.revenue / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(item.revenue / 2500000) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-500 mt-1">+{item.growth}% growth</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Customer Acquisition</h2>
              <div className="space-y-4">
                {[
                  { month: "Sep", customers: 1250, cost: 45 },
                  { month: "Oct", customers: 1890, cost: 42 },
                  { month: "Nov", customers: 2340, cost: 38 },
                  { month: "Dec", customers: 2890, cost: 35 },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.month} 2025</p>
                      <p className="text-sm text-muted-foreground">
                        CAC: ${item.cost}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{item.customers.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Forecasting Tab */}
        <TabsContent value="forecasting">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Revenue Forecast</h2>
              <div className="flex gap-2">
                <Button
                  variant={forecastPeriod === "30" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("30")}
                >
                  30 Days
                </Button>
                <Button
                  variant={forecastPeriod === "60" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("60")}
                >
                  60 Days
                </Button>
                <Button
                  variant={forecastPeriod === "90" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("90")}
                >
                  90 Days
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {revenueForecast.map((forecast, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{forecast.period}</h3>
                    {forecast.actual && (
                      <Badge className="bg-green-500/20 text-green-400">
                        Actual: ${forecast.actual.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Predicted</p>
                      <p className="text-2xl font-bold text-blue-500">
                        ${forecast.predicted.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Low Confidence</p>
                      <p className="text-xl font-bold">
                        ${forecast.confidence.low.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">High Confidence</p>
                      <p className="text-xl font-bold">
                        ${forecast.confidence.high.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {forecast.actual && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm">
                        Accuracy:{" "}
                        <span
                          className={
                            Math.abs(forecast.actual - forecast.predicted) / forecast.predicted <
                            0.05
                              ? "text-green-500 font-bold"
                              : "text-yellow-500 font-bold"
                          }
                        >
                          {(
                            (1 -
                              Math.abs(forecast.actual - forecast.predicted) /
                                forecast.predicted) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Card className="p-4 mt-6 bg-blue-500/10 border-blue-500/20">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-500 mb-1">ML Model Performance</p>
                  <p className="text-sm text-muted-foreground">
                    Our predictive model has achieved 94.2% accuracy over the last 90 days,
                    with a mean absolute error of $4,850. Confidence intervals are calculated
                    using historical variance and seasonal patterns.
                  </p>
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohorts">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Customer Retention Cohorts</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Cohort</th>
                    <th className="text-left p-3 font-medium">Users</th>
                    <th className="text-left p-3 font-medium">Month 0</th>
                    <th className="text-left p-3 font-medium">Month 1</th>
                    <th className="text-left p-3 font-medium">Month 2</th>
                    <th className="text-left p-3 font-medium">Month 3</th>
                    <th className="text-left p-3 font-medium">Month 4</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{cohort.month}</td>
                      <td className="p-3">{cohort.users.toLocaleString()}</td>
                      {cohort.retention.map((rate, rateIndex) => (
                        <td key={rateIndex} className="p-3">
                          <div
                            className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                              rate >= 70
                                ? "bg-green-500/20 text-green-400"
                                : rate >= 50
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {rate}%
                          </div>
                        </td>
                      ))}
                      {Array(5 - cohort.retention.length)
                        .fill(0)
                        .map((_, i) => (
                          <td key={`empty-${i}`} className="p-3 text-muted-foreground">
                            -
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="p-4">
                <h3 className="font-bold mb-2">Avg 1-Month Retention</h3>
                <p className="text-3xl font-bold text-green-500">73.3%</p>
                <p className="text-xs text-muted-foreground mt-1">Across all cohorts</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-bold mb-2">Avg 3-Month Retention</h3>
                <p className="text-3xl font-bold text-yellow-500">44.0%</p>
                <p className="text-xs text-muted-foreground mt-1">For eligible cohorts</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-bold mb-2">Customer Lifetime</h3>
                <p className="text-3xl font-bold text-blue-500">8.2 months</p>
                <p className="text-xs text-muted-foreground mt-1">Average duration</p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* Automated Insights Tab */}
        <TabsContent value="insights">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Automated Insights</h2>

            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{insight.title}</h3>
                        <Badge className={getInsightColor(insight.type)}>{insight.type}</Badge>
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(insight.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Investigate
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
