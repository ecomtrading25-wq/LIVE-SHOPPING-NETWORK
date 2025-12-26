import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Globe,
  Clock,
} from "lucide-react";

/**
 * Performance Monitoring Dashboard
 * Real-time system health and performance metrics
 */

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");

  // Mock performance data - in production, fetch from tRPC/monitoring service
  const metrics = {
    systemHealth: "healthy" as "healthy" | "degraded" | "down",
    uptime: 99.98,
    avgResponseTime: 145,
    errorRate: 0.02,
    requestsPerMinute: 1247,
    activeUsers: 342,
    databaseConnections: 45,
    memoryUsage: 68,
    cpuUsage: 42,
  };

  const endpoints = [
    {
      name: "Homepage",
      path: "/",
      avgTime: 120,
      p95Time: 180,
      errorRate: 0.01,
      requests: 5420,
      status: "healthy",
    },
    {
      name: "Products API",
      path: "/api/trpc/products.list",
      avgTime: 85,
      p95Time: 140,
      errorRate: 0.00,
      requests: 3210,
      status: "healthy",
    },
    {
      name: "Orders API",
      path: "/api/trpc/orders.list",
      avgTime: 210,
      p95Time: 350,
      errorRate: 0.05,
      requests: 1890,
      status: "degraded",
    },
    {
      name: "Checkout",
      path: "/api/trpc/checkout.createSession",
      avgTime: 320,
      p95Time: 480,
      errorRate: 0.02,
      requests: 890,
      status: "healthy",
    },
  ];

  const recentErrors = [
    {
      id: "1",
      timestamp: new Date(Date.now() - 300000),
      endpoint: "/api/trpc/orders.list",
      error: "Database connection timeout",
      count: 3,
      severity: "high",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 900000),
      endpoint: "/api/trpc/products.get",
      error: "Product not found",
      count: 12,
      severity: "low",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1800000),
      endpoint: "/api/stripe/webhook",
      error: "Invalid signature",
      count: 1,
      severity: "medium",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-600";
      case "degraded":
        return "bg-yellow-600";
      case "down":
        return "bg-red-600";
      default:
        return "bg-zinc-600";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Performance Monitoring</h1>
          <p className="text-zinc-400 mt-1">Real-time system health and metrics</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={timeRange === "1h" ? "default" : "outline"}
              onClick={() => setTimeRange("1h")}
              size="sm"
            >
              1 Hour
            </Button>
            <Button
              variant={timeRange === "24h" ? "default" : "outline"}
              onClick={() => setTimeRange("24h")}
              size="sm"
            >
              24 Hours
            </Button>
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              onClick={() => setTimeRange("7d")}
              size="sm"
            >
              7 Days
            </Button>
          </div>

          <Badge className={getStatusColor(metrics.systemHealth)}>
            <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            {metrics.systemHealth === "healthy" && "All Systems Operational"}
            {metrics.systemHealth === "degraded" && "Degraded Performance"}
            {metrics.systemHealth === "down" && "System Down"}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">Uptime</p>
          <p className="text-3xl font-bold text-white">{metrics.uptime}%</p>
          <p className="text-xs text-zinc-500 mt-2">Last 30 days</p>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <TrendingDown className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-white">{metrics.avgResponseTime}ms</p>
          <p className="text-xs text-zinc-500 mt-2">-12ms from last hour</p>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <TrendingDown className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">Error Rate</p>
          <p className="text-3xl font-bold text-white">{metrics.errorRate}%</p>
          <p className="text-xs text-zinc-500 mt-2">-0.01% from last hour</p>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">Requests/Min</p>
          <p className="text-3xl font-bold text-white">
            {metrics.requestsPerMinute.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-2">+8% from last hour</p>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-white">CPU Usage</p>
              <p className="text-sm text-zinc-400">Server load</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Current</span>
              <span className="text-white font-medium">{metrics.cpuUsage}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${metrics.cpuUsage}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-white">Memory Usage</p>
              <p className="text-sm text-zinc-400">RAM utilization</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Current</span>
              <span className="text-white font-medium">{metrics.memoryUsage}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${metrics.memoryUsage}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-white">Database</p>
              <p className="text-sm text-zinc-400">Active connections</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Current</span>
              <span className="text-white font-medium">
                {metrics.databaseConnections}/100
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${metrics.databaseConnections}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Endpoint Performance */}
      <Card className="p-6 bg-zinc-900 border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-6">Endpoint Performance</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  Endpoint
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  Avg Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  P95 Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  Error Rate
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  Requests
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint.path} className="border-b border-zinc-800/50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white font-medium">{endpoint.name}</p>
                      <p className="text-sm text-zinc-500">{endpoint.path}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white">{endpoint.avgTime}ms</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white">{endpoint.p95Time}ms</span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={
                        endpoint.errorRate > 0.03
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {endpoint.errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white">
                      {endpoint.requests.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={getStatusColor(endpoint.status)}>
                      {endpoint.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Errors */}
      <Card className="p-6 bg-zinc-900 border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-6">Recent Errors</h2>

        <div className="space-y-4">
          {recentErrors.map((error) => (
            <div
              key={error.id}
              className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg"
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-medium text-white">{error.error}</p>
                  <Badge className={getSeverityColor(error.severity)}>
                    {error.severity}
                  </Badge>
                  <Badge variant="outline" className="text-zinc-400">
                    {error.count}x
                  </Badge>
                </div>
                <p className="text-sm text-zinc-400 mb-1">{error.endpoint}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  {error.timestamp.toLocaleString()}
                </div>
              </div>

              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
