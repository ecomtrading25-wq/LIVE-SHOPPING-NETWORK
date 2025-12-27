import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Zap,
  Search,
  Download,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

// Mock data - replace with actual tRPC calls
const mockPricingData = [
  {
    id: '1',
    productName: 'Wireless Headphones Pro',
    currentPrice: 89.99,
    recommendedPrice: 94.99,
    optimalPrice: 92.99,
    elasticity: -1.8,
    currentRevenue: 8999,
    projectedRevenue: 10449,
    revenueIncrease: 16.1,
    profitIncrease: 18.5,
    competitorAvgPrice: 95.99,
    salesVolume: 100,
    projectedVolume: 95,
    confidence: 88,
    reasoning: 'Demand is inelastic. Price increase will boost revenue with minimal volume impact.'
  },
  {
    id: '2',
    productName: 'Smart Watch Ultra',
    currentPrice: 299.99,
    recommendedPrice: 279.99,
    optimalPrice: 284.99,
    elasticity: -2.3,
    currentRevenue: 14999,
    projectedRevenue: 16799,
    revenueIncrease: 12.0,
    profitIncrease: 14.2,
    competitorAvgPrice: 289.99,
    salesVolume: 50,
    projectedVolume: 59,
    confidence: 92,
    reasoning: 'High elasticity. Price reduction will significantly increase volume and total revenue.'
  },
  {
    id: '3',
    productName: 'Portable Charger 20K',
    currentPrice: 39.99,
    recommendedPrice: 44.99,
    optimalPrice: 42.99,
    elasticity: -1.5,
    currentRevenue: 7998,
    projectedRevenue: 9438,
    revenueIncrease: 18.0,
    profitIncrease: 22.3,
    competitorAvgPrice: 44.99,
    salesVolume: 200,
    projectedVolume: 190,
    confidence: 85,
    reasoning: 'Below competitor pricing. Room for price increase while maintaining competitiveness.'
  },
  {
    id: '4',
    productName: 'Bluetooth Speaker Mini',
    currentPrice: 49.99,
    recommendedPrice: 49.99,
    optimalPrice: 49.99,
    elasticity: -2.0,
    currentRevenue: 4999,
    projectedRevenue: 4999,
    revenueIncrease: 0,
    profitIncrease: 0,
    competitorAvgPrice: 49.99,
    salesVolume: 100,
    projectedVolume: 100,
    confidence: 90,
    reasoning: 'Already at optimal price point. No adjustment recommended.'
  }
];

const priceImpactData = [
  { price: 79.99, revenue: 7999, profit: 3200, volume: 100 },
  { price: 84.99, revenue: 8499, profit: 3740, volume: 100 },
  { price: 89.99, revenue: 8999, profit: 4320, volume: 100 },
  { price: 94.99, revenue: 10449, profit: 5434, volume: 110 },
  { price: 99.99, revenue: 9999, profit: 5200, volume: 100 },
  { price: 104.99, revenue: 9449, profit: 4820, volume: 90 }
];

export default function PricingOptimizationDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(mockPricingData[0]);
  const [filterType, setFilterType] = useState('all');

  const filteredProducts = mockPricingData.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'increase' && p.recommendedPrice > p.currentPrice) ||
      (filterType === 'decrease' && p.recommendedPrice < p.currentPrice) ||
      (filterType === 'optimal' && p.recommendedPrice === p.currentPrice);
    return matchesSearch && matchesFilter;
  });

  const totalRevenueIncrease = mockPricingData.reduce((sum, p) => sum + (p.projectedRevenue - p.currentRevenue), 0);
  const avgPriceChange = mockPricingData.reduce((sum, p) => sum + ((p.recommendedPrice - p.currentPrice) / p.currentPrice * 100), 0) / mockPricingData.length;
  const productsNeedingAdjustment = mockPricingData.filter(p => p.recommendedPrice !== p.currentPrice).length;

  const priceChange = selectedProduct.recommendedPrice - selectedProduct.currentPrice;
  const priceChangePercent = (priceChange / selectedProduct.currentPrice * 100);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pricing Optimization</h1>
            <p className="text-muted-foreground">AI-powered pricing recommendations based on elasticity analysis</p>
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
              <span className="text-sm text-muted-foreground">Potential Revenue Increase</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              +${(totalRevenueIncrease / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              If all recommendations applied
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Products Analyzed</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">248</div>
            <div className="text-sm text-muted-foreground mt-1">
              Active SKUs
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Need Adjustment</span>
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600">{productsNeedingAdjustment}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Price optimization opportunities
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Price Change</span>
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold">
              {avgPriceChange > 0 ? '+' : ''}{avgPriceChange.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Recommended adjustment
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product List */}
          <Card className="p-6">
            <div className="mb-4 space-y-3">
              <h2 className="text-xl font-bold">Products</h2>
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="increase">Price Increase</SelectItem>
                  <SelectItem value="decrease">Price Decrease</SelectItem>
                  <SelectItem value="optimal">Already Optimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((product) => {
                const change = product.recommendedPrice - product.currentPrice;
                const changePercent = (change / product.currentPrice * 100);
                
                return (
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
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: ${product.currentPrice}
                        </div>
                      </div>
                      {change === 0 ? (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Optimal
                        </Badge>
                      ) : change > 0 ? (
                        <Badge className="bg-blue-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{changePercent.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-600">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {changePercent.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Recommended: ${product.recommendedPrice}
                      </span>
                      <span className="text-green-600 font-medium">
                        +${(product.projectedRevenue - product.currentRevenue).toFixed(0)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Pricing Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProduct.productName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Confidence: {selectedProduct.confidence}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Elasticity: {selectedProduct.elasticity}
                    </span>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={priceChange === 0}
                >
                  {priceChange === 0 ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Already Optimal
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Apply Recommended Price
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Price</div>
                  <div className="text-2xl font-bold">${selectedProduct.currentPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedProduct.salesVolume} units/month
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Recommended Price</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${selectedProduct.recommendedPrice}
                  </div>
                  <div className="text-sm">
                    {priceChange > 0 ? (
                      <span className="text-blue-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{priceChangePercent.toFixed(1)}%
                      </span>
                    ) : priceChange < 0 ? (
                      <span className="text-orange-600 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {priceChangePercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Optimal
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Competitor Avg</div>
                  <div className="text-2xl font-bold">${selectedProduct.competitorAvgPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    Market benchmark
                  </div>
                </div>
              </div>
            </Card>

            {/* Price Impact Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Price Impact Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={priceImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price" tickFormatter={(value) => `$${value}`} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: any) => `$${value}`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#9333ea" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
                  <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} name="Volume" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue Projection */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Revenue & Profit Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Current Revenue</div>
                  <div className="text-2xl font-bold">${selectedProduct.currentRevenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedProduct.salesVolume} units × ${selectedProduct.currentPrice}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Projected Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${selectedProduct.projectedRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +${(selectedProduct.projectedRevenue - selectedProduct.currentRevenue).toLocaleString()} ({selectedProduct.revenueIncrease.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Profit Increase</div>
                    <div className="text-xl font-bold text-purple-600">
                      +{selectedProduct.profitIncrease.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volume Change</div>
                    <div className="text-xl font-bold">
                      {selectedProduct.projectedVolume - selectedProduct.salesVolume > 0 ? '+' : ''}
                      {selectedProduct.projectedVolume - selectedProduct.salesVolume} units
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Reasoning */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                AI Recommendation
              </h3>
              <p className="text-sm mb-4">{selectedProduct.reasoning}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>
                    <strong>Elasticity Analysis:</strong> {selectedProduct.elasticity < -2 ? 'Highly elastic' : selectedProduct.elasticity < -1.5 ? 'Moderately elastic' : 'Inelastic'} demand 
                    ({selectedProduct.elasticity}). {selectedProduct.elasticity < -2 ? 'Price changes will significantly impact volume.' : 'Volume relatively stable with price changes.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>
                    <strong>Competitive Position:</strong> {
                      selectedProduct.currentPrice < selectedProduct.competitorAvgPrice 
                        ? `Priced ${((1 - selectedProduct.currentPrice / selectedProduct.competitorAvgPrice) * 100).toFixed(1)}% below market average. Room for increase.`
                        : selectedProduct.currentPrice > selectedProduct.competitorAvgPrice
                        ? `Priced ${((selectedProduct.currentPrice / selectedProduct.competitorAvgPrice - 1) * 100).toFixed(1)}% above market. Consider reduction.`
                        : 'At market parity.'
                    }
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bulk Actions */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold mb-3">Bulk Price Optimization</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Apply AI-recommended prices to all products with optimization opportunities. Estimated total revenue increase: <strong className="text-green-600">+${(totalRevenueIncrease / 1000).toFixed(1)}K/month</strong>
          </p>
          <div className="flex gap-2">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Zap className="w-4 h-4 mr-2" />
              Apply All Recommendations ({productsNeedingAdjustment} products)
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Pricing Strategy
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
