import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  Mail,
  FileSpreadsheet,
} from "lucide-react";

/**
 * Admin Reports Dashboard
 * Generate and export business intelligence reports
 */

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [exportFormat, setExportFormat] = useState("csv");
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      id: "sales_by_channel",
      name: "Sales by Channel",
      description: "Revenue breakdown across all sales channels",
      icon: TrendingUp,
      fields: ["Channel", "Orders", "Revenue", "Avg Order Value", "Growth %"],
    },
    {
      id: "product_performance",
      name: "Product Performance",
      description: "Top selling products and inventory metrics",
      icon: Package,
      fields: ["SKU", "Product Name", "Units Sold", "Revenue", "Stock Level"],
    },
    {
      id: "creator_commissions",
      name: "Creator Commissions",
      description: "Influencer performance and payout calculations",
      icon: Users,
      fields: ["Creator", "Sales", "Commission Rate", "Earned", "Paid", "Pending"],
    },
    {
      id: "fulfillment_efficiency",
      name: "Fulfillment Efficiency",
      description: "Warehouse operations and shipping metrics",
      icon: ShoppingCart,
      fields: ["Date", "Orders", "Picked", "Packed", "Shipped", "Avg Time"],
    },
    {
      id: "financial_summary",
      name: "Financial Summary",
      description: "Comprehensive P&L and cash flow analysis",
      icon: DollarSign,
      fields: ["Category", "Revenue", "COGS", "Expenses", "Profit", "Margin %"],
    },
    {
      id: "customer_analytics",
      name: "Customer Analytics",
      description: "Customer acquisition, retention, and LTV metrics",
      icon: Users,
      fields: ["Metric", "New Customers", "Repeat Rate", "LTV", "CAC", "Churn"],
    },
  ];

  const dateRanges = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "last_90_days", label: "Last 90 Days" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_quarter", label: "This Quarter" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error("Please select a report type");
      return;
    }

    setIsGenerating(true);

    // In production, call tRPC mutation to generate report
    setTimeout(() => {
      setIsGenerating(false);
      toast.success(`Report generated successfully! Downloading ${exportFormat.toUpperCase()}...`);
      
      // Mock download
      const report = reportTypes.find((r) => r.id === reportType);
      const filename = `${report?.name.replace(/\s+/g, "_")}_${dateRange}.${exportFormat}`;
      console.log(`Downloading: ${filename}`);
    }, 2000);
  };

  const handleScheduleReport = () => {
    if (!reportType) {
      toast.error("Please select a report type");
      return;
    }

    toast.success("Report scheduled! You'll receive it via email every Monday at 9 AM.");
  };

  const selectedReport = reportTypes.find((r) => r.id === reportType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-zinc-400 mt-1">
          Generate and export business intelligence reports
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-foreground">24</span>
          </div>
          <p className="text-sm text-zinc-400">Reports Generated</p>
          <p className="text-xs text-zinc-500 mt-1">This month</p>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-foreground">8</span>
          </div>
          <p className="text-sm text-zinc-400">Scheduled Reports</p>
          <p className="text-xs text-zinc-500 mt-1">Active schedules</p>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between mb-2">
            <Download className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-foreground">156</span>
          </div>
          <p className="text-sm text-zinc-400">Total Downloads</p>
          <p className="text-xs text-zinc-500 mt-1">All time</p>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between mb-2">
            <FileSpreadsheet className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-foreground">2.4 MB</span>
          </div>
          <p className="text-sm text-zinc-400">Storage Used</p>
          <p className="text-xs text-zinc-500 mt-1">Last 90 days</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-background border-border text-foreground">
            <h2 className="text-xl font-bold text-foreground mb-6">Generate Report</h2>

            <div className="space-y-6">
              {/* Report Type */}
              <div>
                <Label className="text-foreground mb-3 block">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-foreground mb-3 block">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range (if selected) */}
              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground mb-2 block">Start Date</Label>
                    <Input type="date" className="h-12" />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2 block">End Date</Label>
                    <Input type="date" className="h-12" />
                  </div>
                </div>
              )}

              {/* Export Format */}
              <div>
                <Label className="text-foreground mb-3 block">Export Format</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      exportFormat === "csv"
                        ? "border-purple-600 bg-purple-600/10 text-foreground"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      exportFormat === "pdf"
                        ? "border-purple-600 bg-purple-600/10 text-foreground"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setExportFormat("xlsx")}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      exportFormat === "xlsx"
                        ? "border-purple-600 bg-purple-600/10 text-foreground"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    XLSX
                  </button>
                </div>
              </div>

              {/* Report Preview */}
              {selectedReport && (
                <div className="p-4 bg-card/50 rounded-lg border border-zinc-700 text-card-foreground">
                  <div className="flex items-start gap-3 mb-3">
                    {(() => {
                      const Icon = selectedReport.icon;
                      return <Icon className="w-5 h-5 text-purple-500 mt-0.5" />;
                    })()}
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedReport.name}
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-zinc-400 mb-2">Report Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.fields.map((field) => (
                        <span
                          key={field}
                          className="px-3 py-1 bg-background rounded-full text-xs text-zinc-300"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Generate & Download
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleScheduleReport}
                  variant="outline"
                  className="h-12"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Schedule
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Report Types List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Available Reports</h2>

          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={`p-4 cursor-pointer transition-all ${
                  reportType === type.id
                    ? "bg-purple-600/10 border-purple-600"
                    : "bg-background border-border hover:border-zinc-700"
                }`}
                onClick={() => setReportType(type.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center flex-shrink-0 text-card-foreground">
                    <Icon className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{type.name}</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <Card className="p-6 bg-background border-border text-foreground">
        <h2 className="text-xl font-bold text-foreground mb-6">Recent Reports</h2>

        <div className="space-y-3">
          {[
            {
              name: "Sales by Channel",
              date: "2024-01-15 14:30",
              format: "CSV",
              size: "245 KB",
            },
            {
              name: "Product Performance",
              date: "2024-01-14 09:15",
              format: "PDF",
              size: "1.2 MB",
            },
            {
              name: "Creator Commissions",
              date: "2024-01-13 16:45",
              format: "XLSX",
              size: "180 KB",
            },
            {
              name: "Financial Summary",
              date: "2024-01-12 11:20",
              format: "PDF",
              size: "890 KB",
            },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-card/50 rounded-lg hover:bg-card transition-colors text-card-foreground"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="font-medium text-foreground">{report.name}</p>
                  <p className="text-sm text-zinc-400">{report.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-foreground">{report.format}</p>
                  <p className="text-xs text-zinc-500">{report.size}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
