import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  DollarSign, Users, Package, ShoppingCart, AlertCircle, Activity,
  BarChart3, Settings, Shield, Zap, Eye, RefreshCw, Download
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

/**
 * LSN Founder Control Console
 * Autonomous business operations command center
 * - Real-time escalations & incidents
 * - Executive KPIs & health metrics
 * - Policy pack management
 * - System-wide controls
 */

export default function FounderControlConsole() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  // Fetch escalations
  const { data: escalations, refetch: refetchEscalations } = trpc.lsnOperations.getEscalations.useQuery({
    status: "open",
    limit: 50,
  });

  // Fetch executive KPIs
  const { data: kpis } = trpc.lsnExecutive.getExecutiveKPIs.useQuery({
    timeRange,
  });

  // Fetch system health
  const { data: systemHealth } = trpc.lsnOperations.getSystemHealth.useQuery();

  // Fetch recent incidents
  const { data: incidents } = trpc.lsnOperations.getIncidents.useQuery({
    limit: 100,
    severity: ["high", "critical"],
  });

  // Fetch policy violations
  const { data: violations } = trpc.lsnOperations.getPolicyViolations.useQuery({
    limit: 50,
  });

  // Mutations
  const acknowledgeEscalation = trpc.lsnOperations.acknowledgeEscalation.useMutation({
    onSuccess: () => refetchEscalations(),
  });

  const closeEscalation = trpc.lsnOperations.closeEscalation.useMutation({
    onSuccess: () => refetchEscalations(),
  });

  const triggerSafeMode = trpc.lsnOperations.triggerSafeMode.useMutation();
  const disableSafeMode = trpc.lsnOperations.disableSafeMode.useMutation();

  // Check if user is founder
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2">Access Denied</h2>
          <p className="text-center text-gray-600">
            This console is restricted to founder access only.
          </p>
        </Card>
      </div>
    );
  }

  const criticalEscalations = escalations?.filter(e => e.severity === "critical") || [];
  const highEscalations = escalations?.filter(e => e.severity === "high") || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Founder Control Console</h1>
              <p className="text-gray-400">Autonomous Operations Command Center</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="border-white/20 text-foreground hover:bg-background/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-foreground hover:bg-background/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Critical Alerts Banner */}
          {criticalEscalations.length > 0 && (
            <Alert className="bg-red-500/20 border-red-500 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-foreground font-semibold">
                {criticalEscalations.length} CRITICAL escalation{criticalEscalations.length > 1 ? 's' : ''} require immediate attention
              </AlertDescription>
            </Alert>
          )}

          {/* System Health Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">System Status</p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemHealth?.status || "OPERATIONAL"}
                  </p>
                </div>
                <Activity className={`w-8 h-8 ${systemHealth?.status === "OPERATIONAL" ? "text-green-500" : "text-red-500"}`} />
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Open Escalations</p>
                  <p className="text-2xl font-bold text-foreground">{escalations?.length || 0}</p>
                </div>
                <AlertCircle className={`w-8 h-8 ${criticalEscalations.length > 0 ? "text-red-500" : "text-yellow-500"}`} />
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">GMV (24h)</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${kpis?.gmv24h?.toLocaleString() || "0"}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Net Profit (24h)</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${kpis?.netProfit24h?.toLocaleString() || "0"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-background text-foreground/10 backdrop-blur border-white/20 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background text-foreground/20">
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="escalations" className="data-[state=active]:bg-background text-foreground/20">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Escalations {criticalEscalations.length > 0 && (
                <Badge variant="destructive" className="ml-2">{criticalEscalations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-background text-foreground/20">
              <Shield className="w-4 h-4 mr-2" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="kpis" className="data-[state=active]:bg-background text-foreground/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="controls" className="data-[state=active]:bg-background text-foreground/20">
              <Settings className="w-4 h-4 mr-2" />
              Controls
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Escalations */}
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Critical Escalations
                </h3>
                <div className="space-y-3">
                  {criticalEscalations.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No critical escalations</p>
                  ) : (
                    criticalEscalations.slice(0, 5).map((esc) => (
                      <Card key={esc.id} className="p-4 bg-red-500/10 border-red-500/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive">CRITICAL</Badge>
                              {esc.sessionId && (
                                <Badge variant="outline" className="text-xs">
                                  Session: {esc.sessionId.slice(0, 8)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-foreground font-medium">{esc.title}</p>
                            <p className="text-gray-400 text-sm mt-1">{esc.summary}</p>
                            <p className="text-gray-500 text-xs mt-2">
                              {new Date(esc.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeEscalation.mutate({ id: esc.id })}
                              className="border-white/30 text-foreground hover:bg-background/10"
                            >
                              Ack
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closeEscalation.mutate({ 
                                id: esc.id, 
                                notes: "Reviewed by founder" 
                              })}
                              className="border-white/30 text-foreground hover:bg-background/10"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>

              {/* Recent Incidents */}
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  Recent Incidents
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {incidents?.slice(0, 10).map((inc, idx) => (
                    <Card key={idx} className="p-3 bg-background text-foreground/5 border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={inc.severity === "critical" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {inc.severity.toUpperCase()}
                            </Badge>
                            <span className="text-foreground text-sm font-medium">{inc.ruleId}</span>
                          </div>
                          <p className="text-gray-400 text-xs">{inc.textExcerpt}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(inc.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
                <p className="text-gray-400 text-sm mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-foreground">{kpis?.activeOrders || 0}</p>
                <p className="text-green-500 text-xs mt-1">↑ Processing</p>
              </Card>
              <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
                <p className="text-gray-400 text-sm mb-1">Live Shows</p>
                <p className="text-3xl font-bold text-foreground">{kpis?.liveShows || 0}</p>
                <p className="text-blue-500 text-xs mt-1">● Broadcasting</p>
              </Card>
              <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
                <p className="text-gray-400 text-sm mb-1">Active Creators</p>
                <p className="text-3xl font-bold text-foreground">{kpis?.activeCreators || 0}</p>
                <p className="text-red-500 text-xs mt-1">Online now</p>
              </Card>
              <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
                <p className="text-gray-400 text-sm mb-1">Dispute Rate</p>
                <p className="text-3xl font-bold text-foreground">{kpis?.disputeRate || "0.0"}%</p>
                <p className={`text-xs mt-1 ${(kpis?.disputeRate || 0) < 1 ? "text-green-500" : "text-red-500"}`}>
                  {(kpis?.disputeRate || 0) < 1 ? "↓ Healthy" : "↑ Monitor"}
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* Escalations Tab */}
          <TabsContent value="escalations" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">All Escalations</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-foreground hover:bg-background/10"
                  onClick={() => refetchEscalations()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {escalations?.map((esc) => (
              <Card key={esc.id} className={`p-6 ${
                esc.severity === "critical" 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-background text-foreground/10 border-white/20"
              } backdrop-blur`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge 
                        variant={esc.severity === "critical" ? "destructive" : "secondary"}
                      >
                        {esc.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-foreground">
                        {esc.status}
                      </Badge>
                      {esc.sessionId && (
                        <Badge variant="outline" className="text-xs text-gray-400">
                          Session: {esc.sessionId}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{esc.title}</h3>
                    <p className="text-muted-foreground mb-3">{esc.summary}</p>
                    
                    {/* Trigger Details */}
                    {esc.triggerJson && (
                      <Card className="p-3 bg-background/30 border-white/10 mb-3 text-foreground">
                        <p className="text-xs text-gray-400 mb-2">Trigger Details:</p>
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(esc.triggerJson, null, 2)}
                        </pre>
                      </Card>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(esc.createdAt).toLocaleString()}
                      </span>
                      {esc.ackBy && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Acknowledged by {esc.ackBy}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    {esc.status === "open" && (
                      <Button
                        onClick={() => acknowledgeEscalation.mutate({ id: esc.id })}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Acknowledge
                      </Button>
                    )}
                    {esc.status !== "closed" && (
                      <Button
                        onClick={() => closeEscalation.mutate({ 
                          id: esc.id, 
                          notes: "Reviewed and resolved by founder" 
                        })}
                        variant="outline"
                        className="border-white/30 text-foreground hover:bg-background/10"
                      >
                        Close
                      </Button>
                    )}
                    <Link href={`/founder/incident/${esc.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/30 text-foreground hover:bg-background/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}

            {escalations?.length === 0 && (
              <Card className="p-12 bg-background text-foreground/10 backdrop-blur border-white/20 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">All Clear</h3>
                <p className="text-gray-400">No escalations require attention at this time.</p>
              </Card>
            )}
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">Policy Incidents & Violations</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {incidents?.map((inc, idx) => (
                <Card key={idx} className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={inc.severity === "critical" ? "destructive" : "secondary"}
                        >
                          {inc.severity.toUpperCase()}
                        </Badge>
                        <span className="text-foreground font-mono text-sm">{inc.ruleId}</span>
                        {inc.sessionId && (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            {inc.sessionId.slice(0, 12)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{inc.textExcerpt}</p>
                      <p className="text-gray-400 text-sm">Action: {inc.actionTaken}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(inc.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">Executive KPIs</h2>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === "24h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("24h")}
                  className={timeRange === "24h" ? "" : "border-white/20 text-foreground hover:bg-background/10"}
                >
                  24h
                </Button>
                <Button
                  variant={timeRange === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("7d")}
                  className={timeRange === "7d" ? "" : "border-white/20 text-foreground hover:bg-background/10"}
                >
                  7d
                </Button>
                <Button
                  variant={timeRange === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("30d")}
                  className={timeRange === "30d" ? "" : "border-white/20 text-foreground hover:bg-background/10"}
                >
                  30d
                </Button>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                <DollarSign className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-muted-foreground text-sm mb-1">Gross Merchandise Value</p>
                <p className="text-4xl font-bold text-foreground mb-2">
                  ${kpis?.gmv?.toLocaleString() || "0"}
                </p>
                <p className="text-green-400 text-sm">
                  {kpis?.gmvGrowth && kpis.gmvGrowth > 0 ? "↑" : "↓"} {Math.abs(kpis?.gmvGrowth || 0).toFixed(1)}% vs prev period
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                <TrendingUp className="w-8 h-8 text-blue-500 mb-3" />
                <p className="text-muted-foreground text-sm mb-1">Net Profit</p>
                <p className="text-4xl font-bold text-foreground mb-2">
                  ${kpis?.netProfit?.toLocaleString() || "0"}
                </p>
                <p className="text-blue-400 text-sm">
                  {kpis?.profitMargin?.toFixed(1) || "0"}% margin
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30">
                <ShoppingCart className="w-8 h-8 text-red-500 mb-3" />
                <p className="text-muted-foreground text-sm mb-1">Total Orders</p>
                <p className="text-4xl font-bold text-foreground mb-2">
                  {kpis?.totalOrders?.toLocaleString() || "0"}
                </p>
                <p className="text-red-400 text-sm">
                  ${kpis?.avgOrderValue?.toFixed(2) || "0"} AOV
                </p>
              </Card>
            </div>

            {/* Operational Health */}
            <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
              <h3 className="text-xl font-bold text-foreground mb-4">Operational Health</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Fulfillment Time</p>
                  <p className="text-2xl font-bold text-foreground">{kpis?.avgFulfillmentTime || "0"}h</p>
                  <p className="text-green-500 text-xs">Target: &lt;24h</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Dispute Rate</p>
                  <p className="text-2xl font-bold text-foreground">{kpis?.disputeRate?.toFixed(2) || "0"}%</p>
                  <p className={`text-xs ${(kpis?.disputeRate || 0) < 1 ? "text-green-500" : "text-red-500"}`}>
                    Target: &lt;1%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Refund Rate</p>
                  <p className="text-2xl font-bold text-foreground">{kpis?.refundRate?.toFixed(2) || "0"}%</p>
                  <p className={`text-xs ${(kpis?.refundRate || 0) < 3 ? "text-green-500" : "text-yellow-500"}`}>
                    Target: &lt;3%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">CSAT Score</p>
                  <p className="text-2xl font-bold text-foreground">{kpis?.csatScore?.toFixed(1) || "0"}</p>
                  <p className={`text-xs ${(kpis?.csatScore || 0) >= 4.5 ? "text-green-500" : "text-yellow-500"}`}>
                    Target: &gt;4.5
                  </p>
                </div>
              </div>
            </Card>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Top SKUs by Profit</h3>
                <div className="space-y-3">
                  {kpis?.topSkus?.slice(0, 5).map((sku, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-background text-foreground/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-500">#{idx + 1}</span>
                        <div>
                          <p className="text-foreground font-medium">{sku.name}</p>
                          <p className="text-gray-400 text-sm">{sku.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-500 font-bold">${sku.profit?.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">{sku.units} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Top Creators by GMV</h3>
                <div className="space-y-3">
                  {kpis?.topCreators?.slice(0, 5).map((creator, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-background text-foreground/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-500">#{idx + 1}</span>
                        <div>
                          <p className="text-foreground font-medium">{creator.name}</p>
                          <p className="text-gray-400 text-sm">{creator.tier} Tier</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-500 font-bold">${creator.gmv?.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">{creator.shows} shows</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Emergency Controls
              </h3>
              <div className="space-y-4">
                <Alert className="bg-red-500/20 border-red-500">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <AlertDescription className="text-foreground">
                    These controls affect the entire platform. Use only in emergency situations.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-red-500/10 border-red-500/30">
                    <h4 className="text-foreground font-bold mb-2">Safe Mode</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Pause all automated actions and require manual approval for critical operations.
                    </p>
                    <Button
                      onClick={() => triggerSafeMode.mutate()}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={systemHealth?.safeMode}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {systemHealth?.safeMode ? "Safe Mode Active" : "Trigger Safe Mode"}
                    </Button>
                    {systemHealth?.safeMode && (
                      <Button
                        onClick={() => disableSafeMode.mutate()}
                        variant="outline"
                        className="w-full mt-2 border-white/30 text-foreground hover:bg-background/10"
                      >
                        Disable Safe Mode
                      </Button>
                    )}
                  </Card>

                  <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                    <h4 className="text-foreground font-bold mb-2">Policy Pack Override</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Temporarily disable specific policy rules for testing or emergency situations.
                    </p>
                    <Link href="/founder/policy-packs">
                      <Button
                        variant="outline"
                        className="w-full border-white/30 text-foreground hover:bg-background/10"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Policy Packs
                      </Button>
                    </Link>
                  </Card>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
              <h3 className="text-xl font-bold text-foreground mb-4">System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/founder/audit-log">
                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-foreground hover:bg-background/10"
                  >
                    View Audit Log
                  </Button>
                </Link>
                <Link href="/founder/reconciliation">
                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-foreground hover:bg-background/10"
                  >
                    Financial Reconciliation
                  </Button>
                </Link>
                <Link href="/founder/creator-payouts">
                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-foreground hover:bg-background/10"
                  >
                    Creator Payouts
                  </Button>
                </Link>
                <Link href="/founder/fraud-review">
                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-foreground hover:bg-background/10"
                  >
                    Fraud Review Queue
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
