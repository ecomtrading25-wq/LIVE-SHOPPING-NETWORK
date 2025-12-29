/**
 * Ops Console - Business Superintelligence OS Control Room
 * 
 * Central command center for monitoring and controlling autonomous operations
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Brain,
  PlayCircle,
  PauseCircle,
  RotateCcw,
} from "lucide-react";

const ORG_UNIT_ID = "lsn_main"; // Default org unit

export default function OpsConsole() {
  const [selectedTab, setSelectedTab] = useState("dashboard");

  // Dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = trpc.businessOS.getDashboard.useQuery({
    orgUnitId: ORG_UNIT_ID,
  });

  // Approvals
  const { data: approvals, refetch: refetchApprovals } = trpc.businessOS.listApprovals.useQuery({
    status: "pending",
  });

  // Incidents
  const { data: incidents } = trpc.businessOS.listIncidents.useQuery({
    orgUnitId: ORG_UNIT_ID,
    status: "open",
  });

  // Workflows
  const { data: workflows } = trpc.businessOS.listWorkflows.useQuery({
    orgUnitId: ORG_UNIT_ID,
  });

  // Decisions
  const { data: decisions } = trpc.businessOS.listDecisions.useQuery({
    orgUnitId: ORG_UNIT_ID,
    limit: 20,
  });

  // Mutations
  const approveActionMutation = trpc.businessOS.approveAction.useMutation({
    onSuccess: () => refetchApprovals(),
  });

  const killSwitchMutation = trpc.businessOS.killSwitch.useMutation();

  const updateAutonomyMutation = trpc.businessOS.updateWorkflowAutonomy.useMutation();

  const handleApprove = async (approvalId: string, approved: boolean) => {
    await approveActionMutation.mutateAsync({
      approvalId,
      approved,
    });
  };

  const handleKillSwitch = async () => {
    if (!confirm("Are you sure you want to activate the kill switch? This will pause ALL autonomous operations.")) {
      return;
    }

    const reason = prompt("Reason for kill switch activation:");
    if (!reason) return;

    await killSwitchMutation.mutateAsync({
      orgUnitId: ORG_UNIT_ID,
      reason,
    });

    alert("Kill switch activated. All autonomous operations paused.");
  };

  if (dashboardLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Superintelligence OS</h1>
          <p className="text-muted-foreground">Control Room & Autonomous Operations</p>
        </div>
        <Button
          variant="destructive"
          onClick={handleKillSwitch}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Kill Switch
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Workflows</p>
              <p className="text-2xl font-bold">{dashboard?.activeWorkflowsCount || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{dashboard?.pendingApprovalsCount || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Incidents</p>
              <p className="text-2xl font-bold">{dashboard?.openIncidentsCount || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue (24h)</p>
              <p className="text-2xl font-bold">
                ${((dashboard?.metrics as any)?.revenue || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals {approvals && approvals.length > 0 && `(${approvals.length})`}
          </TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="incidents">
            Incidents {incidents && incidents.length > 0 && `(${incidents.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Autonomous Decisions</h2>
            <div className="space-y-3">
              {dashboard?.recentDecisions?.slice(0, 5).map((decision: any) => (
                <div key={decision.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{decision.type}</p>
                    <p className="text-sm text-muted-foreground">{decision.reasoning}</p>
                  </div>
                  <Badge variant={
                    decision.status === "executed" ? "default" :
                    decision.status === "approved" ? "secondary" :
                    "outline"
                  }>
                    {decision.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Business Metrics</h2>
              <div className="space-y-3">
                {dashboard?.metrics && Object.entries(dashboard.metrics as Record<string, number>).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-semibold">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">System Health</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Policy Enforcement</span>
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Decision Engine</span>
                  <Badge variant="default" className="gap-1">
                    <Brain className="h-3 w-3" /> Running
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Digital Twin</span>
                  <Badge variant="default" className="gap-1">
                    <Zap className="h-3 w-3" /> Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Workflow Engine</span>
                  <Badge variant="default" className="gap-1">
                    <Activity className="h-3 w-3" /> Active
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
            {approvals && approvals.length > 0 ? (
              <div className="space-y-4">
                {approvals.map((approval: any) => (
                  <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline">{approval.type}</Badge>
                        <p className="font-medium mt-2">{approval.reason}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Requested by: {approval.requestedBy}
                        </p>
                        {approval.context && (
                          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                            {JSON.stringify(approval.context, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(approval.id, true)}
                        disabled={approveActionMutation.isPending}
                        className="gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprove(approval.id, false)}
                        disabled={approveActionMutation.isPending}
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending approvals</p>
            )}
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Active Workflows</h2>
            <div className="space-y-3">
              {workflows?.map((workflow: any) => (
                <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{workflow.name}</p>
                      <Badge variant={
                        workflow.status === "active" ? "default" :
                        workflow.status === "paused" ? "secondary" :
                        "outline"
                      }>
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Autonomy: {workflow.autonomyLevel.replace("_", " ").toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <PauseCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Decisions</h2>
            <div className="space-y-3">
              {decisions?.map((decision: any) => (
                <div key={decision.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline">{decision.type}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(decision.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      decision.status === "executed" ? "default" :
                      decision.status === "approved" ? "secondary" :
                      decision.status === "proposed" ? "outline" :
                      "destructive"
                    }>
                      {decision.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{decision.reasoning}</p>
                  {decision.actualImpact && (
                    <div className="mt-2 text-xs bg-muted p-2 rounded">
                      <strong>Impact:</strong> {JSON.stringify(decision.actualImpact)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Open Incidents</h2>
            {incidents && incidents.length > 0 ? (
              <div className="space-y-3">
                {incidents.map((incident: any) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            incident.severity === "critical" ? "destructive" :
                            incident.severity === "high" ? "destructive" :
                            incident.severity === "medium" ? "default" :
                            "secondary"
                          }>
                            {incident.severity}
                          </Badge>
                          <p className="font-medium">{incident.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(incident.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No open incidents</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
