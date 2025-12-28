import { useState } from 'react';
import { ExportModal } from '@/components/ExportModal';
import { formatCurrency, formatPercentage } from '@/lib/exportUtils';
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
  AlertTriangle, 
  Users, 
  TrendingDown,
  Mail,
  Gift,
  DollarSign,
  Calendar,
  Search,
  Download,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Mock data - replace with actual tRPC calls
const mockChurnData = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    lifetimeValue: 2847,
    lastPurchase: '45 days ago',
    purchaseFrequency: 12,
    avgOrderValue: 237,
    churnRisk: 'critical' as const,
    churnProbability: 92,
    daysSinceLastPurchase: 45,
    recommendedAction: 'Immediate win-back campaign with 25% discount',
    predictedLoss: 2400
  },
  {
    id: '2',
    customerName: 'Michael Chen',
    email: 'mchen@email.com',
    lifetimeValue: 1523,
    lastPurchase: '28 days ago',
    purchaseFrequency: 8,
    avgOrderValue: 190,
    churnRisk: 'high' as const,
    churnProbability: 78,
    daysSinceLastPurchase: 28,
    recommendedAction: 'Personalized email with exclusive offer',
    predictedLoss: 1200
  },
  {
    id: '3',
    customerName: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    lifetimeValue: 3921,
    lastPurchase: '18 days ago',
    purchaseFrequency: 15,
    avgOrderValue: 261,
    churnRisk: 'medium' as const,
    churnProbability: 45,
    daysSinceLastPurchase: 18,
    recommendedAction: 'Loyalty rewards reminder',
    predictedLoss: 800
  },
  {
    id: '4',
    customerName: 'David Kim',
    email: 'david.kim@email.com',
    lifetimeValue: 892,
    lastPurchase: '12 days ago',
    purchaseFrequency: 5,
    avgOrderValue: 178,
    churnRisk: 'low' as const,
    churnProbability: 22,
    daysSinceLastPurchase: 12,
    recommendedAction: 'Standard newsletter',
    predictedLoss: 200
  }
];

const riskDistribution = [
  { name: 'Critical', value: 23, color: '#dc2626' },
  { name: 'High', value: 47, color: '#ea580c' },
  { name: 'Medium', value: 89, color: '#ca8a04' },
  { name: 'Low', value: 156, color: '#16a34a' }
];

const churnTrends = [
  { month: 'Jan', churnRate: 5.2, prevented: 12 },
  { month: 'Feb', churnRate: 4.8, prevented: 15 },
  { month: 'Mar', churnRate: 6.1, prevented: 10 },
  { month: 'Apr', churnRate: 5.5, prevented: 18 },
  { month: 'May', churnRate: 4.2, prevented: 22 },
  { month: 'Jun', churnRate: 3.9, prevented: 25 }
];

export default function ChurnRiskDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState<'churnProbability' | 'lifetimeValue' | 'lastPurchase'>('churnProbability');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [exportOpen, setExportOpen] = useState(false);

  const filteredCustomers = mockChurnData
    .filter(c => {
      const matchesSearch = c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === 'all' || c.churnRisk === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'churnProbability') {
        aVal = a.churnProbability;
        bVal = b.churnProbability;
      } else if (sortField === 'lifetimeValue') {
        aVal = a.lifetimeValue;
        bVal = b.lifetimeValue;
      } else {
        aVal = a.daysSinceLastPurchase;
        bVal = b.daysSinceLastPurchase;
      }
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const riskColor = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-green-600'
  };

  const totalAtRisk = mockChurnData.filter(c => c.churnRisk === 'critical' || c.churnRisk === 'high').length;
  const totalPotentialLoss = mockChurnData.reduce((sum, c) => sum + c.predictedLoss, 0);
  const avgChurnProbability = mockChurnData.reduce((sum, c) => sum + c.churnProbability, 0) / mockChurnData.length;

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Churn Risk</h1>
            <p className="text-muted-foreground">AI-powered churn prediction and retention strategies</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExportOpen(true)}>
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
              <span className="text-sm text-muted-foreground">Total Customers</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground mt-1">
              Active customer base
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">At Risk</span>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600">{totalAtRisk}</div>
            <div className="text-sm text-orange-600 mt-1">
              Critical + High risk
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Potential Loss</span>
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">
              ${(totalPotentialLoss / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Revenue at risk
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Churn Risk</span>
              <TrendingDown className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold">{avgChurnProbability.toFixed(1)}%</div>
            <div className="text-sm text-green-600 mt-1">
              -2.3% vs last month
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {riskDistribution.map((risk) => (
                <div key={risk.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: risk.color }} />
                    <span className="text-sm">{risk.name}</span>
                  </div>
                  <span className="text-sm font-medium">{risk.value} customers</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Churn Trends */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Churn Trends & Prevention</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={churnTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="churnRate" fill="#ef4444" name="Churn Rate %" />
                <Bar dataKey="prevented" fill="#22c55e" name="Churn Prevented" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Customer Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">At-Risk Customers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium cursor-pointer hover:bg-accent" onClick={() => toggleSort('churnProbability')}>
                    <div className="flex items-center gap-1">
                      Churn Risk
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium cursor-pointer hover:bg-accent" onClick={() => toggleSort('lifetimeValue')}>
                    <div className="flex items-center gap-1">
                      LTV
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium cursor-pointer hover:bg-accent" onClick={() => toggleSort('lastPurchase')}>
                    <div className="flex items-center gap-1">
                      Last Purchase
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium">Recommended Action</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-accent/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge className={riskColor[customer.churnRisk]}>
                          {customer.churnRisk}
                        </Badge>
                        <span className="text-sm font-medium">{customer.churnProbability}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">${customer.lifetimeValue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          ${customer.avgOrderValue} avg
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {customer.lastPurchase}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{customer.recommendedAction}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <Gift className="w-4 h-4 mr-1" />
                          Win-Back
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bulk Actions */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold mb-3">Bulk Win-Back Campaign</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Launch targeted campaigns for all critical and high-risk customers with personalized offers based on their purchase history.
          </p>
          <div className="flex gap-2">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Launch Campaign for Critical Risk ({mockChurnData.filter(c => c.churnRisk === 'critical').length})
            </Button>
            <Button variant="outline">
              Launch Campaign for High Risk ({mockChurnData.filter(c => c.churnRisk === 'high').length})
            </Button>
          </div>
        </Card>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Customer Churn Risk Report"
        data={filteredCustomers.map(c => ({
          name: c.customerName,
          email: c.email,
          riskScore: c.churnProbability,
          riskLevel: c.churnRisk,
          totalSpent: c.lifetimeValue,
          daysSinceLastOrder: c.daysSinceLastPurchase,
          orderFrequency: c.purchaseFrequency,
          potentialLoss: c.predictedLoss
        }))}
        columns={[
          { key: 'name', label: 'Customer Name' },
          { key: 'email', label: 'Email' },
          { key: 'riskScore', label: 'Risk Score %' },
          { key: 'riskLevel', label: 'Risk Level' },
          { key: 'totalSpent', label: 'Total Spent', formatter: formatCurrency },
          { key: 'daysSinceLastOrder', label: 'Days Since Last Order' },
          { key: 'orderFrequency', label: 'Order Frequency' },
          { key: 'potentialLoss', label: 'Potential Loss', formatter: formatCurrency }
        ]}
      />
    </div>
  );
}
