/**
 * Operations Console - Business OS Control Center
 * 
 * Central command center for autonomous business operations:
 * - Workflow queue monitoring
 * - Approval inbox
 * - Incident management
 * - Decision engine dashboard
 * - Autonomy controls
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  RefreshCw,
  Zap,
  Shield,
  TrendingUp,
  Settings
} from "lucide-react";

export default function OperationsConsole() {
  const [orgUnitId] = useState("lsn_main"); // TODO: Get from context

  // Fetch dashboard data
  const { data: dashboard, isLoading } = trpc.businessOS.getDashboard.useQuery({
    orgUnitId,
  });

  const { data: workflows } = trpc.businessOS.listWorkflows.useQuery({
    orgUnitId,
  });

  const { data: approvals } = trpc.businessOS.listApprovals.useQuery({
    status: "pending",
  });

  const { data: incidents } = trpc.businessOS.listIncidents.useQuery({
    orgUnitId,
    status: "open",
  });

  const { data: decisions } = trpc.businessOS.listDecisions.useQuery({
    orgUnitId,
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Console</h1>
          <p className="text-muted-foreground">Business OS Control Center</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activeWorkflowsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Running autonomously
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.pendingApprovalsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting founder decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.openIncidentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisions Today</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{decisions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI-powered decisions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals
            {(dashboard?.pendingApprovalsCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {dashboard?.pendingApprovalsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents">
            Incidents
            {(dashboard?.openIncidentsCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {dashboard?.openIncidentsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>
                Event-driven workflows running autonomously
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflows && workflows.length > 0 ? (
                <div className="space-y-4">
                  {workflows.map((workflow: any) => (
                    <WorkflowCard key={workflow.id} workflow={workflow} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active workflows
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Inbox</CardTitle>
              <CardDescription>
                High-risk actions requiring founder approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvals && approvals.length > 0 ? (
                <div className="space-y-4">
                  {approvals.map((approval: any) => (
                    <ApprovalCard key={approval.id} approval={approval} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>All clear! No pending approvals.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Center</CardTitle>
              <CardDescription>
                Policy violations and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents && incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map((incident: any) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>All systems operational. No incidents.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Engine</CardTitle>
              <CardDescription>
                AI-powered business decisions with contextual bandits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decisions && decisions.length > 0 ? (
                <div className="space-y-4">
                  {decisions.map((decision: any) => (
                    <DecisionCard key={decision.id} decision={decision} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent decisions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Management</CardTitle>
              <CardDescription>
                Business rules and safety constraints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <PolicyCard
                  title="No Payouts Without Reconciliation"
                  description="Prevents payouts unless reconciliation matches and risk score is acceptable"
                  status="active"
                />
                <PolicyCard
                  title="Margin Floor Protection"
                  description="Prevents pricing below 15% margin floor"
                  status="active"
                />
                <PolicyCard
                  title="Cash Runway Protection"
                  description="Prevents marketing spend increases when cash runway is low"
                  status="active"
                />
                <PolicyCard
                  title="Refund Approval Limits"
                  description="Requires approval for refunds over $500"
                  status="active"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component: Workflow Card
function WorkflowCard({ workflow }: { workflow: any }) {
  const updateAutonomy = trpc.businessOS.updateWorkflowAutonomy.useMutation();

  const toggleAutonomy = async () => {
    await updateAutonomy.mutateAsync({
      workflowId: workflow.id,
      autonomyLevel: workflow.autonomyLevel === "autonomous" ? "supervised" : "autonomous",
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{workflow.name}</h4>
          <Badge variant={workflow.autonomyLevel === "autonomous" ? "default" : "secondary"}>
            {workflow.autonomyLevel}
          </Badge>
          <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
            {workflow.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAutonomy}
          disabled={updateAutonomy.isPending}
        >
          {workflow.autonomyLevel === "autonomous" ? (
            <><Pause className="w-4 h-4 mr-2" /> Supervise</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Automate</>
          )}
        </Button>
      </div>
    </div>
  );
}

// Component: Approval Card
function ApprovalCard({ approval }: { approval: any }) {
  const approveAction = trpc.businessOS.approveAction.useMutation();

  const handleApprove = async (decision: "approved" | "rejected") => {
    await approveAction.mutateAsync({
      approvalId: approval.id,
      decision,
      notes: "",
    });
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{approval.type}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(approval.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="font-semibold mt-2">{approval.reason}</p>
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
          variant="default"
          onClick={() => handleApprove("approved")}
          disabled={approveAction.isPending}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleApprove("rejected")}
          disabled={approveAction.isPending}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </div>
  );
}

// Component: Incident Card
function IncidentCard({ incident }: { incident: any }) {
  const updateIncident = trpc.businessOS.updateIncident.useMutation();

  const handleResolve = async () => {
    await updateIncident.mutateAsync({
      incidentId: incident.id,
      status: "resolved",
      resolution: "Manually resolved by operator",
    });
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{incident.severity}</Badge>
            <Badge variant="outline">{incident.type}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(incident.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="font-semibold mt-2">{incident.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleResolve}
        disabled={updateIncident.isPending}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Mark Resolved
      </Button>
    </div>
  );
}

// Component: Decision Card
function DecisionCard({ decision }: { decision: any }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{decision.type}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(decision.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="font-semibold mt-2">{decision.action}</p>
          {decision.reasoning && (
            <p className="text-sm text-muted-foreground mt-1">{decision.reasoning}</p>
          )}
          {decision.expectedImpact && (
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Expected impact: {JSON.stringify(decision.expectedImpact)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component: Policy Card
function PolicyCard({ 
  title, 
  description, 
  status 
}: { 
  title: string; 
  description: string; 
  status: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{title}</h4>
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Shield className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}
