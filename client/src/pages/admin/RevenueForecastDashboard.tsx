import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
  Target,
  AlertCircle,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
const mockForecastData = {
  projectedRevenue: 2847500,
  growthRate: 18.5,
  confidenceLevel: 87,
  lastUpdated: '2 hours ago',
  forecast: [
    // Historical data
    { date: 'Jan', actual: 245000, forecast: null, lower: null, upper: null, type: 'actual' },
    { date: 'Feb', actual: 268000, forecast: null, lower: null, upper: null, type: 'actual' },
    { date: 'Mar', actual: 289000, forecast: null, lower: null, upper: null, type: 'actual' },
    { date: 'Apr', actual: 312000, forecast: null, lower: null, upper: null, type: 'actual' },
    { date: 'May', actual: 298000, forecast: null, lower: null, upper: null, type: 'actual' },
    { date: 'Jun', actual: 325000, forecast: null, lower: null, upper: null, type: 'actual' },
    // Forecast data (90 days)
    { date: 'Jul', actual: null, forecast: 342000, lower: 315000, upper: 369000, type: 'forecast' },
    { date: 'Aug', actual: null, forecast: 358000, lower: 328000, upper: 388000, type: 'forecast' },
    { date: 'Sep', actual: null, forecast: 375000, lower: 342000, upper: 408000, type: 'forecast' }
  ],
  segments: [
    { name: 'Electronics', current: 125000, projected: 148000, growth: 18.4, confidence: 89 },
    { name: 'Fashion', current: 98000, projected: 112000, growth: 14.3, confidence: 85 },
    { name: 'Home & Garden', current: 67000, projected: 82000, growth: 22.4, confidence: 82 },
    { name: 'Sports', current: 45000, projected: 51000, growth: 13.3, confidence: 88 }
  ],
  channels: [
    { name: 'Direct', revenue: 145000, percentage: 44.6, growth: 15.2 },
    { name: 'Marketplace', revenue: 112000, percentage: 34.5, growth: 22.8 },
    { name: 'Social', revenue: 68000, percentage: 20.9, growth: 28.5 }
  ],
  scenarios: {
    bestCase: { revenue: 3125000, probability: 25, growth: 25.2 },
    expected: { revenue: 2847500, probability: 50, growth: 18.5 },
    worstCase: { revenue: 2456000, probability: 25, growth: 8.7 }
  },
  drivers: [
    { factor: 'Seasonal Demand', impact: 'High', contribution: 32, trend: 'up' },
    { factor: 'Marketing Campaigns', impact: 'Medium', contribution: 18, trend: 'up' },
    { factor: 'Customer Retention', impact: 'High', contribution: 28, trend: 'stable' },
    { factor: 'New Product Launches', impact: 'Medium', contribution: 15, trend: 'up' },
    { factor: 'Market Competition', impact: 'Low', contribution: 7, trend: 'down' }
  ],
  risks: [
    { risk: 'Supply Chain Disruption', probability: 'Medium', impact: 'High', mitigation: 'Diversify suppliers' },
    { risk: 'Market Saturation', probability: 'Low', impact: 'Medium', mitigation: 'Expand to new categories' },
    { risk: 'Economic Downturn', probability: 'Medium', impact: 'High', mitigation: 'Focus on value products' }
  ]
};

const channelColors = ['#8b5cf6', '#3b82f6', '#10b981'];

export default function RevenueForecastDashboard() {
  const [timeRange, setTimeRange] = useState('90d');
  const [segmentView, setSegmentView] = useState('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-red-600';
      case 'Medium':
        return 'bg-yellow-600';
      case 'Low':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Revenue Forecast</h1>
            <p className="text-muted-foreground">AI-powered 90-day revenue projections with confidence intervals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Forecast
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Projected Revenue</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(mockForecastData.projectedRevenue)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Next 90 days
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Growth Rate</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              +{mockForecastData.growthRate}%
            </div>
            <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Above target
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Confidence Level</span>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {mockForecastData.confidenceLevel}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              High accuracy
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold">
              {mockForecastData.lastUpdated.split(' ')[0]}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {mockForecastData.lastUpdated.split(' ').slice(1).join(' ')}
            </div>
          </Card>
        </div>

        {/* Revenue Forecast Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Revenue Forecast with Confidence Bands</h2>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="60d">60 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="180d">180 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={mockForecastData.forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="upper"
                fill="#3b82f6"
                stroke="none"
                fillOpacity={0.1}
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                fill="#3b82f6"
                stroke="none"
                fillOpacity={0.1}
                name="Lower Bound"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Actual Revenue"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Forecasted Revenue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segment Analysis */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Revenue by Segment</h2>
            <div className="space-y-4">
              {mockForecastData.segments.map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{segment.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={segment.growth > 15 ? 'bg-green-600' : 'bg-blue-600'}>
                        +{segment.growth}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {segment.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-medium">{formatCurrency(segment.current)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Projected: </span>
                      <span className="font-medium text-green-600">{formatCurrency(segment.projected)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(segment.projected / segment.current) * 50}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Channel Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Revenue by Channel</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockForecastData.channels}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {mockForecastData.channels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={channelColors[index % channelColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {mockForecastData.channels.map((channel, index) => (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors[index] }} />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(channel.revenue)}</span>
                    <Badge className="bg-green-600 text-xs">+{channel.growth}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Scenario Analysis */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Scenario Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-2 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-600">Best Case</span>
                <Badge className="bg-green-600">{mockForecastData.scenarios.bestCase.probability}%</Badge>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(mockForecastData.scenarios.bestCase.revenue)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{mockForecastData.scenarios.bestCase.growth}% growth
              </div>
            </Card>

            <Card className="p-4 border-2 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-600">Expected</span>
                <Badge className="bg-blue-600">{mockForecastData.scenarios.expected.probability}%</Badge>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatCurrency(mockForecastData.scenarios.expected.revenue)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{mockForecastData.scenarios.expected.growth}% growth
              </div>
            </Card>

            <Card className="p-4 border-2 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-orange-600">Worst Case</span>
                <Badge className="bg-orange-600">{mockForecastData.scenarios.worstCase.probability}%</Badge>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {formatCurrency(mockForecastData.scenarios.worstCase.revenue)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{mockForecastData.scenarios.worstCase.growth}% growth
              </div>
            </Card>
          </div>
        </Card>

        {/* Revenue Drivers */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Drivers</h2>
          <div className="space-y-3">
            {mockForecastData.drivers.map((driver) => (
              <div key={driver.factor} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTrendIcon(driver.trend)}
                  <div>
                    <div className="font-medium">{driver.factor}</div>
                    <div className="text-sm text-muted-foreground">
                      {driver.contribution}% contribution
                    </div>
                  </div>
                </div>
                <Badge className={getImpactColor(driver.impact)}>
                  {driver.impact} Impact
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Assessment */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Risk Assessment
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Risk</th>
                  <th className="text-left p-3 font-medium">Probability</th>
                  <th className="text-left p-3 font-medium">Impact</th>
                  <th className="text-left p-3 font-medium">Mitigation Strategy</th>
                </tr>
              </thead>
              <tbody>
                {mockForecastData.risks.map((risk, index) => (
                  <tr key={index} className="border-b hover:bg-accent/50">
                    <td className="p-3 font-medium">{risk.risk}</td>
                    <td className="p-3">
                      <Badge className={risk.probability === 'High' ? 'bg-red-600' : risk.probability === 'Medium' ? 'bg-yellow-600' : 'bg-green-600'}>
                        {risk.probability}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getImpactColor(risk.impact)}>
                        {risk.impact}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{risk.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            AI Insights & Recommendations
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5" />
              <span>
                <strong>Strong growth trajectory:</strong> Current trend indicates 18.5% growth with 87% confidence. Seasonal demand and marketing campaigns are key drivers.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5" />
              <span>
                <strong>Social channel opportunity:</strong> Social commerce showing 28.5% growth - highest among all channels. Consider increasing investment in this area.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5" />
              <span>
                <strong>Supply chain risk:</strong> Medium probability of disruption with high impact. Recommend diversifying suppliers to mitigate potential revenue loss.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
