/**
 * Admin Executive Dashboard
 * Real-time metrics, SKU performance, disputes, financial health, and operations overview
 */

import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  // Fetch dashboard data
  const { data: topSKUs } = trpc.sku.getTopPerforming.useQuery({
    channelId: 'default-channel',
    metric: 'profit',
    limit: 10
  });

  const { data: atRiskSKUs } = trpc.sku.getAtRisk.useQuery({
    channelId: 'default-channel'
  });

  const { data: disputes } = trpc.disputes.getDisputes.useQuery({
    channelId: 'default-channel',
    needsManual: true,
    limit: 10
  });

  const { data: balance } = trpc.financial.getBalance.useQuery({
    channelId: 'default-channel',
    currency: 'AUD'
  });

  const { data: discrepancies } = trpc.financial.getDiscrepancies.useQuery({
    channelId: 'default-channel',
    status: 'OPEN'
  });

  const { data: lowStock } = trpc.inventory.getLowStock.useQuery({
    channelId: 'default-channel',
    threshold: 20
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-background text-foreground border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time business intelligence</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              📊 Export Report
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold opacity-90">Total Revenue</div>
              <div className="text-2xl">💰</div>
            </div>
            <div className="text-3xl font-bold mb-1">
              ${((balance?.totalRevenueCents || 0) / 100).toLocaleString()}
            </div>
            <div className="text-sm opacity-75">+12.5% from last month</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold opacity-90">Net Profit</div>
              <div className="text-2xl">📈</div>
            </div>
            <div className="text-3xl font-bold mb-1">
              ${((balance?.netBalanceCents || 0) / 100).toLocaleString()}
            </div>
            <div className="text-sm opacity-75">Margin: 24.3%</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold opacity-90">Active Orders</div>
              <div className="text-2xl">📦</div>
            </div>
            <div className="text-3xl font-bold mb-1">1,247</div>
            <div className="text-sm opacity-75">89 shipped today</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold opacity-90">Alerts</div>
              <div className="text-2xl">⚠️</div>
            </div>
            <div className="text-3xl font-bold mb-1">
              {(disputes?.length || 0) + (discrepancies?.length || 0) + (lowStock?.length || 0)}
            </div>
            <div className="text-sm opacity-75">Requires attention</div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-background text-foreground border border-gray-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skus">SKU Performance</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Performing SKUs */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Top Performing SKUs</h2>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                <div className="space-y-4">
                  {topSKUs?.slice(0, 5).map((sku: any) => (
                    <div key={sku.productId} className="flex items-center justify-between p-4 bg-background text-foreground rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{sku.productName}</div>
                        <div className="text-sm text-gray-500">SKU: {sku.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${(sku.netProfitCents / 100).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sku.profitMarginPercent.toFixed(1)}% margin
                        </div>
                      </div>
                      <Badge className="ml-4 bg-green-100 text-green-800 border-0">
                        #{sku.rank}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-400">
                      No data available
                    </div>
                  )}
                </div>
              </Card>

              {/* At-Risk SKUs */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">SKUs At Risk</h2>
                  <Badge className="bg-red-100 text-red-800 border-0">
                    {atRiskSKUs?.length || 0} items
                  </Badge>
                </div>
                <div className="space-y-4">
                  {atRiskSKUs?.slice(0, 5).map((sku: any) => (
                    <div key={sku.productId} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{sku.productName}</div>
                        <div className="text-sm text-red-600">
                          {sku.issues.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {sku.profitMarginPercent.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Score: {sku.score}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="ml-4 border-red-300 text-red-600">
                        Review
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-400">
                      All SKUs performing well
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Alerts Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Disputes Alert */}
              <Card className="p-6 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Open Disputes</h3>
                  <Badge className="bg-orange-100 text-orange-800 border-0">
                    {disputes?.length || 0}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {disputes?.filter((d: any) => d.needsManual).length || 0} need manual review
                </p>
                <Button variant="outline" className="w-full">
                  Review Disputes
                </Button>
              </Card>

              {/* Financial Discrepancies */}
              <Card className="p-6 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Discrepancies</h3>
                  <Badge className="bg-red-100 text-red-800 border-0">
                    {discrepancies?.length || 0}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Financial reconciliation issues
                </p>
                <Button variant="outline" className="w-full">
                  Reconcile Now
                </Button>
              </Card>

              {/* Low Stock Alert */}
              <Card className="p-6 border-l-4 border-l-yellow-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Low Stock</h3>
                  <Badge className="bg-yellow-100 text-yellow-800 border-0">
                    {lowStock?.length || 0}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Products need reordering
                </p>
                <Button variant="outline" className="w-full">
                  Create PO
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* SKU Performance Tab */}
          <TabsContent value="skus" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">SKU Profitability Analysis</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Export</Button>
                  <Button size="sm" className="bg-purple-600 text-foreground">
                    Run Weekly Pruning
                  </Button>
                </div>
              </div>

              {/* SKU Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Units Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Profit</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Margin</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSKUs?.map((sku: any) => (
                      <tr key={sku.productId} className="border-b border-gray-100 hover:bg-background text-foreground">
                        <td className="py-3 px-4">
                          <Badge className="bg-purple-100 text-purple-800 border-0">
                            #{sku.rank}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{sku.productName}</div>
                          <div className="text-sm text-gray-500">{sku.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {sku.unitsSold.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          ${(sku.netRevenueCents / 100).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">
                          ${(sku.netProfitCents / 100).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {sku.profitMarginPercent.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={
                            sku.status === 'WINNER' ? 'bg-green-100 text-green-800 border-0' :
                            sku.status === 'PROFITABLE' ? 'bg-blue-100 text-blue-800 border-0' :
                            'bg-gray-100 text-gray-800 border-0'
                          }>
                            {sku.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-purple-600">
                          {sku.score}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">
                          No SKU data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Dispute Management</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Filter</Button>
                  <Button size="sm" className="bg-orange-600 text-foreground">
                    Auto-Submit Ready
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {disputes?.map((dispute: any) => (
                  <Card key={dispute.disputeId} className="p-4 border-l-4 border-l-orange-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={
                            dispute.status === 'OPEN' ? 'bg-red-100 text-red-800 border-0' :
                            dispute.status === 'EVIDENCE_BUILDING' ? 'bg-yellow-100 text-yellow-800 border-0' :
                            'bg-blue-100 text-blue-800 border-0'
                          }>
                            {dispute.status}
                          </Badge>
                          <span className="font-semibold text-gray-900">
                            {dispute.provider} - {dispute.providerDisputeId}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Order: {dispute.orderId} | Amount: ${(dispute.amountCents / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Reason: {dispute.reason} | Opened: {new Date(dispute.openedAt).toLocaleDateString()}
                        </div>
                        {dispute.needsManual && (
                          <Badge className="mt-2 bg-red-600 text-foreground border-0">
                            ⚠️ Needs Manual Review
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" className="bg-green-600 text-foreground">
                          Submit Evidence
                        </Button>
                      </div>
                    </div>
                  </Card>
                )) || (
                  <div className="text-center py-8 text-gray-400">
                    No open disputes
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Balance Summary */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Financial Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-bold text-gray-900">
                      ${((balance?.totalRevenueCents || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Refunds</span>
                    <span className="font-bold text-red-600">
                      -${((balance?.totalRefundsCents || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Commissions</span>
                    <span className="font-bold text-orange-600">
                      -${((balance?.totalCommissionsCents || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Payouts</span>
                    <span className="font-bold text-blue-600">
                      -${((balance?.totalPayoutsCents || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Fees</span>
                    <span className="font-bold text-purple-600">
                      -${((balance?.totalFeesCents || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-lg font-bold text-gray-900">Net Balance</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${((balance?.netBalanceCents || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Reconciliation Status */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Reconciliation Status</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-green-900">Matched</span>
                      <Badge className="bg-green-600 text-foreground border-0">
                        98.5%
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-green-600">1,247</div>
                    <div className="text-sm text-green-700">transactions</div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-red-900">Discrepancies</span>
                      <Badge className="bg-red-600 text-foreground border-0">
                        {discrepancies?.length || 0}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {discrepancies?.length || 0}
                    </div>
                    <div className="text-sm text-red-700">need review</div>
                  </div>

                  <Button className="w-full bg-purple-600 text-foreground">
                    Run Reconciliation
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Inventory Management</h2>
                <Button className="bg-blue-600 text-foreground">
                  Create Purchase Order
                </Button>
              </div>

              <div className="space-y-4">
                {lowStock?.map((product: any) => (
                  <Card key={product.productId} className="p-4 border-l-4 border-l-yellow-500">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          SKU: {product.sku} | Current Stock: {product.stockQuantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Reorder Point</div>
                          <div className="font-bold text-yellow-600">20 units</div>
                        </div>
                        <Button size="sm" className="bg-blue-600 text-foreground">
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </Card>
                )) || (
                  <div className="text-center py-8 text-gray-400">
                    All products well stocked
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
