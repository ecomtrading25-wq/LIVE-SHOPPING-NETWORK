import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, DollarSign, FileText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import AdminProtectedRoute from "@/components/AdminProtectedRoute";
export default function FraudConsole() {
  return (
    <AdminProtectedRoute>
      <FraudConsoleContent />
    </AdminProtectedRoute>
  );
}

function FraudConsoleContent() {
  const [orderId, setOrderId] = useState("");
  const [dateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  const { data: dashboard, isLoading: dashboardLoading } = trpc.lsnFraud.getFinancialDashboard.useQuery(dateRange);
  const fraudCheckMutation = trpc.lsnFraud.performFraudCheck.useMutation();
  const [fraudResult, setFraudResult] = useState<any>(null);

  const handleFraudCheck = async () => {
    if (!orderId) {
      toast.error("Please enter an order ID");
      return;
    }

    try {
      const result = await fraudCheckMutation.mutateAsync({ orderId: parseInt(orderId) });
      setFraudResult(result);
      toast.success("Fraud check completed");
    } catch (error: any) {
      toast.error(error.message || "Fraud check failed");
    }
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };
    return <Badge className={colors[level as keyof typeof colors] || "bg-gray-500"}>{level.toUpperCase()}</Badge>;
  };

  if (dashboardLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Fraud Detection Console</h1>
          <p className="text-muted-foreground">Real-time fraud monitoring and prevention</p>
        </div>
      </div>

      {/* Quick Stats */}
      {dashboard && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboard.revenue.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Success rate: {dashboard.revenue.successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.disputes.total}</div>
              <p className="text-xs text-muted-foreground">
                Rate: {dashboard.disputes.rate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fraud Checks</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.fraud.totalChecks}</div>
              <p className="text-xs text-muted-foreground">
                Avg risk: {dashboard.fraud.avgRiskScore.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.fraud.criticalRisk}</div>
              <p className="text-xs text-muted-foreground">
                High: {dashboard.fraud.highRisk}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="check" className="space-y-4">
        <TabsList>
          <TabsTrigger value="check">Fraud Check</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="check" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run Fraud Check</CardTitle>
              <CardDescription>Analyze an order for fraud risk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  type="number"
                />
                <Button onClick={handleFraudCheck} disabled={fraudCheckMutation.isPending}>
                  <Search className="mr-2 h-4 w-4" />
                  Check
                </Button>
              </div>

              {fraudResult && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Risk Assessment</h3>
                      <p className="text-sm text-muted-foreground">Order #{fraudResult.orderId}</p>
                    </div>
                    {getRiskBadge(fraudResult.riskLevel)}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Risk Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{fraudResult.riskScore}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Flags Detected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{fraudResult.flags.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Recommendation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm font-medium">
                          {fraudResult.shouldReject && <Badge variant="destructive">REJECT</Badge>}
                          {fraudResult.shouldHold && !fraudResult.shouldReject && <Badge className="bg-orange-500">HOLD</Badge>}
                          {fraudResult.shouldReview && !fraudResult.shouldHold && <Badge className="bg-yellow-500">REVIEW</Badge>}
                          {!fraudResult.shouldReject && !fraudResult.shouldHold && !fraudResult.shouldReview && (
                            <Badge className="bg-green-500">APPROVE</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {fraudResult.flags.map((flag: string, i: number) => (
                          <Badge key={i} variant="outline">{flag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {fraudResult.reasons.map((reason: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          {dashboard && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Open</span>
                      <span className="font-medium">{dashboard.disputes.byStatus.open}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Evidence Submitted</span>
                      <span className="font-medium">{dashboard.disputes.byStatus.evidence_submitted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Won</span>
                      <span className="font-medium text-green-500">{dashboard.disputes.byStatus.won}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Lost</span>
                      <span className="font-medium text-red-500">{dashboard.disputes.byStatus.lost}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dispute Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${dashboard.disputes.amount.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {dashboard.disputes.rate.toFixed(2)}% of total revenue
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {dashboard && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fraud Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(dashboard.fraud.lowRisk / dashboard.fraud.totalChecks) * 100}%` }}
                          />
                        </div>
                        <span className="font-medium">{dashboard.fraud.lowRisk}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${(dashboard.fraud.mediumRisk / dashboard.fraud.totalChecks) * 100}%` }}
                          />
                        </div>
                        <span className="font-medium">{dashboard.fraud.mediumRisk}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(dashboard.fraud.highRisk / dashboard.fraud.totalChecks) * 100}%` }}
                          />
                        </div>
                        <span className="font-medium">{dashboard.fraud.highRisk}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Critical Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(dashboard.fraud.criticalRisk / dashboard.fraud.totalChecks) * 100}%` }}
                          />
                        </div>
                        <span className="font-medium">{dashboard.fraud.criticalRisk}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Protection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${dashboard.revenue.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed Transactions</p>
                    <p className="text-2xl font-bold text-red-500">${dashboard.revenue.failed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-green-500">{dashboard.revenue.successRate.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
