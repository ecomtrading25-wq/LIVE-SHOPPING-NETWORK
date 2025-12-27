import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShoppingCart, 
  Package,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Mock data - replace with actual tRPC calls
const mockForecastData = [
  { date: 'Jan 1', actual: 120, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 2', actual: 135, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 3', actual: 142, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 4', actual: 128, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 5', actual: 155, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 6', actual: 148, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 7', actual: 162, forecast: 0, lower: 0, upper: 0 },
  { date: 'Jan 8', actual: 0, forecast: 168, lower: 155, upper: 181 },
  { date: 'Jan 9', actual: 0, forecast: 175, lower: 160, upper: 190 },
  { date: 'Jan 10', actual: 0, forecast: 182, lower: 165, upper: 199 },
  { date: 'Jan 11', actual: 0, forecast: 188, lower: 170, upper: 206 },
  { date: 'Jan 12', actual: 0, forecast: 195, lower: 175, upper: 215 },
  { date: 'Jan 13', actual: 0, forecast: 202, lower: 180, upper: 224 },
  { date: 'Jan 14', actual: 0, forecast: 208, lower: 185, upper: 231 }
];

const mockProducts = [
  {
    id: '1',
    name: 'Wireless Headphones Pro',
    currentStock: 45,
    averageDailySales: 12.5,
    forecastedDemand: { next7Days: 88, next14Days: 175, next30Days: 375 },
    reorderPoint: 50,
    recommendedQuantity: 200,
    urgency: 'high' as const,
    trendDirection: 'increasing' as const,
    confidence: 87
  },
  {
    id: '2',
    name: 'Smart Watch Ultra',
    currentStock: 120,
    averageDailySales: 8.3,
    forecastedDemand: { next7Days: 58, next14Days: 116, next30Days: 249 },
    reorderPoint: 80,
    recommendedQuantity: 150,
    urgency: 'medium' as const,
    trendDirection: 'stable' as const,
    confidence: 92
  },
  {
    id: '3',
    name: 'Portable Charger 20K',
    currentStock: 15,
    averageDailySales: 18.7,
    forecastedDemand: { next7Days: 131, next14Days: 262, next30Days: 561 },
    reorderPoint: 100,
    recommendedQuantity: 300,
    urgency: 'critical' as const,
    trendDirection: 'increasing' as const,
    confidence: 89
  },
  {
    id: '4',
    name: 'Bluetooth Speaker Mini',
    currentStock: 200,
    averageDailySales: 5.2,
    forecastedDemand: { next7Days: 36, next14Days: 73, next30Days: 156 },
    reorderPoint: 60,
    recommendedQuantity: 100,
    urgency: 'low' as const,
    trendDirection: 'decreasing' as const,
    confidence: 85
  }
];

export default function DemandForecastDashboard() {
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  const filteredProducts = mockProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const urgencyColor = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-green-600'
  };

  const trendIcon = {
    increasing: <TrendingUp className="w-4 h-4 text-green-500" />,
    stable: <div className="w-4 h-4 border-t-2 border-gray-500" />,
    decreasing: <TrendingDown className="w-4 h-4 text-red-500" />
  };

  const daysUntilStockout = selectedProduct.currentStock / selectedProduct.averageDailySales;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Demand Forecasting</h1>
            <p className="text-muted-foreground">AI-powered inventory predictions and reorder recommendations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Products</span>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">248</div>
            <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +12% from last month
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Low Stock Alerts</span>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold">23</div>
            <div className="text-sm text-orange-600 mt-1">
              Requires immediate attention
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Daily Sales</span>
              <ShoppingCart className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold">1,247</div>
            <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +8.3% vs forecast
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Forecast Accuracy</span>
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold">89%</div>
            <div className="text-sm text-muted-foreground mt-1">
              Last 30 days average
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product List */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-3">Products</h2>
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedProduct.id === product.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {product.currentStock} units
                      </div>
                    </div>
                    <Badge className={urgencyColor[product.urgency]}>
                      {product.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {product.averageDailySales.toFixed(1)} units/day
                    </span>
                    {trendIcon[product.trendDirection]}
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Forecast Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={urgencyColor[selectedProduct.urgency]}>
                      {selectedProduct.urgency.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      {trendIcon[selectedProduct.trendDirection]}
                      {selectedProduct.trendDirection}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedProduct.confidence}% confidence
                    </span>
                  </div>
                </div>
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Generate Purchase Order
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Stock</div>
                  <div className="text-2xl font-bold">{selectedProduct.currentStock}</div>
                  <div className="text-sm text-orange-600">
                    {daysUntilStockout.toFixed(1)} days until stockout
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Reorder Point</div>
                  <div className="text-2xl font-bold">{selectedProduct.reorderPoint}</div>
                  <div className="text-sm text-muted-foreground">
                    Safety threshold
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Recommended Order</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedProduct.recommendedQuantity}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    EOQ optimized
                  </div>
                </div>
              </div>
            </Card>

            {/* Forecast Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Demand Forecast (Next 14 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockForecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stackId="1"
                    stroke="#9333ea"
                    fill="#9333ea"
                    fillOpacity={0.1}
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stackId="2"
                    stroke="#9333ea"
                    fill="#9333ea"
                    fillOpacity={0.3}
                    name="Forecast"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stackId="3"
                    stroke="#9333ea"
                    fill="#9333ea"
                    fillOpacity={0.1}
                    name="Lower Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual Sales"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Forecast Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Forecasted Demand</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Next 7 Days</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedProduct.forecastedDemand.next7Days}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">units</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Next 14 Days</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {selectedProduct.forecastedDemand.next14Days}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">units</div>
                </div>
                <div className="text-center p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Next 30 Days</div>
                  <div className="text-3xl font-bold text-pink-600">
                    {selectedProduct.forecastedDemand.next30Days}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">units</div>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
                AI Recommendations
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                  <span>
                    <strong>Urgent:</strong> Current stock will last only {daysUntilStockout.toFixed(1)} days at current sales rate. 
                    Recommend ordering {selectedProduct.recommendedQuantity} units immediately.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                  <span>
                    <strong>Trend Analysis:</strong> Sales are {selectedProduct.trendDirection}. 
                    Consider adjusting safety stock levels by 15%.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                  <span>
                    <strong>Cost Optimization:</strong> EOQ analysis suggests ordering {selectedProduct.recommendedQuantity} units 
                    to minimize total inventory costs.
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
