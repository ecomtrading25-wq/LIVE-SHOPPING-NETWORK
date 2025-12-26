import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  DollarSign,
  ShoppingCart,
  Mail,
  Download
} from "lucide-react";

export default function CustomerSegments() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - in production, fetch from tRPC
  const segments = [
    {
      name: "Champions",
      description: "Your best customers who buy often and spend the most",
      count: 1250,
      totalRevenue: 485000,
      avgOrderValue: 388,
      rfmPattern: ["555", "554", "544"],
      color: "bg-green-500",
      recommendedAction: "Reward them with VIP perks, early access, and exclusive offers",
    },
    {
      name: "Loyal Customers",
      description: "Consistent customers with high lifetime value",
      count: 2100,
      totalRevenue: 720000,
      avgOrderValue: 343,
      rfmPattern: ["543", "444", "435"],
      color: "bg-blue-500",
      recommendedAction: "Upsell higher value products and ask for referrals",
    },
    {
      name: "At Risk",
      description: "Used to purchase frequently but haven't returned recently",
      count: 850,
      totalRevenue: 180000,
      avgOrderValue: 212,
      rfmPattern: ["255", "254", "245"],
      color: "bg-orange-500",
      recommendedAction: "Send personalized emails with special discounts",
    },
    {
      name: "Can't Lose Them",
      description: "Made big purchases but long time ago",
      count: 420,
      totalRevenue: 95000,
      avgOrderValue: 226,
      rfmPattern: ["155", "154", "144"],
      color: "bg-red-500",
      recommendedAction: "Win them back with renewals and helpful products",
    },
    {
      name: "Potential Loyalists",
      description: "Recent customers with potential to become loyal",
      count: 1800,
      totalRevenue: 420000,
      avgOrderValue: 233,
      rfmPattern: ["553", "551", "552"],
      color: "bg-purple-500",
      recommendedAction: "Offer membership programs and recommend products",
    },
    {
      name: "New Customers",
      description: "Recently acquired customers",
      count: 3200,
      totalRevenue: 580000,
      avgOrderValue: 181,
      rfmPattern: ["512", "511", "422"],
      color: "bg-cyan-500",
      recommendedAction: "Provide onboarding support and build relationships",
    },
    {
      name: "Hibernating",
      description: "Last purchase was long ago and low spending",
      count: 1500,
      totalRevenue: 120000,
      avgOrderValue: 80,
      rfmPattern: ["332", "322", "231"],
      color: "bg-gray-500",
      recommendedAction: "Offer other relevant products and special discounts",
    },
    {
      name: "Lost",
      description: "Lowest recency, frequency, and monetary scores",
      count: 980,
      totalRevenue: 45000,
      avgOrderValue: 46,
      rfmPattern: ["111", "112", "121"],
      color: "bg-slate-500",
      recommendedAction: "Revive interest with brand new products or ignore",
    },
  ];

  const totalCustomers = segments.reduce((sum, seg) => sum + seg.count, 0);
  const totalRevenue = segments.reduce((sum, seg) => sum + seg.totalRevenue, 0);

  const filteredSegments = segments.filter((seg) =>
    seg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Customer Segments</h1>
        <p className="text-muted-foreground mt-2">
          RFM analysis-based customer segmentation for targeted marketing
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {segments.length} segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalRevenue / totalCustomers).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.find((s) => s.name === "At Risk")?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search segments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSegments.map((segment) => (
          <Card key={segment.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                    {segment.name}
                  </CardTitle>
                  <CardDescription>{segment.description}</CardDescription>
                </div>
                <Badge variant="secondary">{segment.count} customers</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">
                    ${(segment.totalRevenue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-xl font-bold">${segment.avgOrderValue}</p>
                </div>
              </div>

              {/* RFM Pattern */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">RFM Patterns</p>
                <div className="flex flex-wrap gap-1">
                  {segment.rfmPattern.map((pattern) => (
                    <Badge key={pattern} variant="outline" className="font-mono text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Recommended Action</p>
                <p className="text-sm text-muted-foreground">{segment.recommendedAction}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  View Customers
                </Button>
                <Button size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RFM Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>About RFM Analysis</CardTitle>
          <CardDescription>
            Understanding Recency, Frequency, and Monetary value segmentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="font-semibold">Recency (R)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                How recently a customer made a purchase. Score 5 = most recent, 1 = least recent.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                </div>
                <h3 className="font-semibold">Frequency (F)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                How often a customer makes purchases. Score 5 = most frequent, 1 = least frequent.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </div>
                <h3 className="font-semibold">Monetary (M)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                How much money a customer spends. Score 5 = highest spend, 1 = lowest spend.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Example:</strong> A customer with RFM score "555" is a Champion - they purchased
              recently, buy frequently, and spend a lot. A customer with "111" is Lost - they haven't
              purchased in a long time, rarely buy, and spend little.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
