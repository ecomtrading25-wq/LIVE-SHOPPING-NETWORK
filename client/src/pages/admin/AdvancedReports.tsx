import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
  Calendar,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Advanced Admin Reporting Dashboard
 * Comprehensive reports with CSV/PDF/XLSX export
 */

export default function AdvancedReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("30");
  const [exportFormat, setExportFormat] = useState("csv");

  const reportTypes = [
    { value: "sales", label: "Sales Performance", icon: DollarSign },
    { value: "inventory", label: "Inventory Movement", icon: Package },
    { value: "customers", label: "Customer Analytics", icon: Users },
    { value: "products", label: "Product Performance", icon: BarChart3 },
    { value: "channels", label: "Channel Comparison", icon: TrendingUp },
    { value: "creators", label: "Creator Commissions", icon: Users },
    { value: "fulfillment", label: "Fulfillment Efficiency", icon: Package },
    { value: "financial", label: "Financial Summary", icon: DollarSign },
  ];

  const handleExport = () => {
    toast.success(`Exporting ${reportType} report as ${exportFormat.toUpperCase()}...`);
    // In production, this would trigger actual export
    setTimeout(() => {
      toast.success("Report downloaded successfully!");
    }, 2000);
  };

  const handleScheduleReport = () => {
    toast.success("Report scheduled for daily delivery at 9:00 AM");
  };

  // Mock data
  const salesData = {
    totalRevenue: 245678.90,
    totalOrders: 1847,
    avgOrderValue: 133.05,
    growthRate: 24.5,
    topProducts: [
      { name: "Wireless Headphones Pro", sales: 234, revenue: 23400 },
      { name: "Smart Watch Ultra", sales: 189, revenue: 56700 },
      { name: "Portable Charger 20K", sales: 156, revenue: 7800 },
    ],
    topChannels: [
      { name: "TikTok Shop", orders: 892, revenue: 118976 },
      { name: "Shopify", orders: 645, revenue: 85935 },
      { name: "Amazon", orders: 310, revenue: 40767 },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Advanced Reports</h1>
          <p className="text-gray-400">
            Generate comprehensive reports with custom filters and export options
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-background border-border mb-8 text-foreground">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Report Type */}
              <div>
                <Label className="text-foreground mb-2 block">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-card border-zinc-700 text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-foreground mb-2 block">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-card border-zinc-700 text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="365">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Format */}
              <div>
                <Label className="text-foreground mb-2 block">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="bg-card border-zinc-700 text-card-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleExport}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={handleScheduleReport}>
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background border-border text-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <span className="text-sm text-green-500">+{salesData.growthRate}%</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                ${salesData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-background border-border text-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-blue-500" />
                <span className="text-sm text-blue-500">+18%</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {salesData.totalOrders.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-background border-border text-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <span className="text-sm text-purple-500">+12%</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                ${salesData.avgOrderValue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Avg Order Value</p>
            </CardContent>
          </Card>

          <Card className="bg-background border-border text-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-pink-500" />
                <span className="text-sm text-pink-500">+28%</span>
              </div>
              <p className="text-3xl font-bold text-foreground">4,521</p>
              <p className="text-sm text-gray-400">Active Customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <Card className="bg-background border-border text-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.sales} sales</p>
                    </div>
                    <p className="text-lg font-bold text-green-500">
                      ${product.revenue.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Channels */}
          <Card className="bg-background border-border text-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Top Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topChannels.map((channel, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                  >
                    <div>
                      <p className="font-medium text-foreground">{channel.name}</p>
                      <p className="text-sm text-gray-400">{channel.orders} orders</p>
                    </div>
                    <p className="text-lg font-bold text-purple-500">
                      ${channel.revenue.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Report Templates */}
        <Card className="bg-background border-border mt-8 text-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Report Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => {
                  setReportType("sales");
                  setDateRange("30");
                  toast.success("Loaded Sales Summary template");
                }}
              >
                <FileText className="w-8 h-8 text-green-500" />
                <span className="font-medium">Sales Summary</span>
                <span className="text-xs text-gray-400">Last 30 days</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => {
                  setReportType("inventory");
                  setDateRange("7");
                  toast.success("Loaded Inventory Status template");
                }}
              >
                <Package className="w-8 h-8 text-blue-500" />
                <span className="font-medium">Inventory Status</span>
                <span className="text-xs text-gray-400">Current week</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => {
                  setReportType("creators");
                  setDateRange("30");
                  toast.success("Loaded Creator Payouts template");
                }}
              >
                <Users className="w-8 h-8 text-purple-500" />
                <span className="font-medium">Creator Payouts</span>
                <span className="text-xs text-gray-400">Monthly</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => {
                  setReportType("financial");
                  setDateRange("90");
                  toast.success("Loaded Financial Summary template");
                }}
              >
                <DollarSign className="w-8 h-8 text-yellow-500" />
                <span className="font-medium">Financial Summary</span>
                <span className="text-xs text-gray-400">Quarterly</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card className="bg-background border-border mt-8 text-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Daily Sales Summary", schedule: "Every day at 9:00 AM", format: "PDF" },
                { name: "Weekly Inventory Report", schedule: "Every Monday at 8:00 AM", format: "XLSX" },
                { name: "Monthly Financial Report", schedule: "1st of every month", format: "PDF" },
              ].map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                >
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-sm text-gray-400">{report.schedule}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-purple-500">{report.format}</span>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
