/**
 * Analytics Dashboard
 * Comprehensive business intelligence and reporting
 */

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Analytics() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <MetricCard title="Total Revenue" value="$1,245,890" change="+12.5%" />
            <MetricCard title="Orders" value="8,432" change="+8.2%" />
            <MetricCard title="Active Creators" value="156" change="+15.3%" />
            <MetricCard title="Avg Order Value" value="$147.80" change="+5.1%" />
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <div className="h-80 bg-muted/20 rounded flex items-center justify-center">
              Chart: Revenue over time
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Products</h3>
              <div className="space-y-4">
                <ProductRow name="Wireless Headphones" sales="$45,230" units="542" />
                <ProductRow name="Smart Watch" sales="$38,920" units="389" />
                <ProductRow name="Laptop Stand" sales="$28,450" units="1,138" />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Creators</h3>
              <div className="space-y-4">
                <CreatorRow name="StyleQueen" revenue="$125,400" shows="45" />
                <CreatorRow name="TechGuru" revenue="$98,230" shows="38" />
                <CreatorRow name="HomeDecor" revenue="$87,650" shows="52" />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard title="Today's Sales" value="$12,450" change="+18.2%" />
            <MetricCard title="This Week" value="$89,230" change="+12.5%" />
            <MetricCard title="This Month" value="$345,890" change="+15.8%" />
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
            <div className="h-80 bg-muted/20 rounded flex items-center justify-center">
              Chart: Category breakdown
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <MetricCard title="Total Creators" value="156" change="+15.3%" />
            <MetricCard title="Active This Month" value="142" change="+8.7%" />
            <MetricCard title="Avg Shows/Creator" value="12.5" change="+5.2%" />
            <MetricCard title="Avg Revenue/Creator" value="$7,987" change="+12.1%" />
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Creator Performance</h3>
            <div className="h-80 bg-muted/20 rounded flex items-center justify-center">
              Chart: Creator metrics
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ title, value, change }: { title: string; value: string; change: string }) {
  const isPositive = change.startsWith('+');
  return (
    <Card className="p-6">
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {change} from last period
      </p>
    </Card>
  );
}

function ProductRow({ name, sales, units }: { name: string; sales: string; units: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">{name}</span>
      <div className="text-right">
        <p className="font-semibold">{sales}</p>
        <p className="text-sm text-muted-foreground">{units} units</p>
      </div>
    </div>
  );
}

function CreatorRow({ name, revenue, shows }: { name: string; revenue: string; shows: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">{name}</span>
      <div className="text-right">
        <p className="font-semibold">{revenue}</p>
        <p className="text-sm text-muted-foreground">{shows} shows</p>
      </div>
    </div>
  );
}
