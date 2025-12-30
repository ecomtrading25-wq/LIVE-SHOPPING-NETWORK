import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, Cpu, Database, 
  GitBranch, Layers, Play, Pause, Settings, TrendingUp, Users,
  Zap, Shield, Brain, Target, BarChart3, FileText, Bell
} from "lucide-react";

/**
 * Business Superintelligence OS - Control Room
 * 
 * The central command center for autonomous business operations.
 * Provides real-time visibility and control over:
 * - Autonomous workflows and agents
 * - Policy enforcement and approvals
 * - System health and incidents
 * - Learning and optimization
 * - Multi-business management
 */

export default function BusinessOsControlRoom() {
  const [selectedOrgUnit, setSelectedOrgUnit] = useState("LSN");
  
  // Mock data - replace with actual tRPC calls
  const metrics = {
    activeWorkflows: 12,
    pendingTasks: 47,
    pendingApprovals: 3,
    openIncidents: 1,
    activeAgents: 8,
    autonomyLevel: "A2" as const,
  };

  const orgUnits = [
    { id: "ceo", name: "CEO Office", type: "ceo" },
    { id: "lsn", name: "Live Shopping Network", type: "business_unit" },
    { id: "tiktok", name: "TikTok Arbitrage", type: "business_unit" },
    { id: "sisar", name: "SISAR", type: "business_unit" },
    { id: "dates", name: "DATES", type: "business_unit" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Business Superintelligence OS</h1>
                  <p className="text-sm text-slate-400">Autonomous Operations Control Room</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Activity className="mr-1 h-3 w-3" />
                System Online
              </Badge>
              <Button variant="outline" size="sm" className="border-slate-700">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Organization Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Organization Units</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {orgUnits.map((unit) => (
              <Button
                key={unit.id}
                variant={selectedOrgUnit === unit.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOrgUnit(unit.name)}
                className={selectedOrgUnit === unit.name ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-700"}
              >
                {unit.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Active Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.activeWorkflows}</div>
              <p className="text-xs text-slate-500 mt-1">Running autonomously</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.pendingTasks}</div>
              <p className="text-xs text-slate-500 mt-1">In queue</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-400" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.pendingApprovals}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting decision</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Open Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.openIncidents}</div>
              <p className="text-xs text-slate-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-600">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-cyan-600">
              <GitBranch className="mr-2 h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-cyan-600">
              <Users className="mr-2 h-4 w-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="approvals" className="data-[state=active]:bg-cyan-600">
              <Shield className="mr-2 h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-cyan-600">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-cyan-600">
              <Target className="mr-2 h-4 w-4" />
              Goals & Plans
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* System Health */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    System Health
                  </CardTitle>
                  <CardDescription>Real-time operational status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Database</span>
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">n8n Integration</span>
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Policy Engine</span>
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Decision Engine</span>
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Learning
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Autonomy Level */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-purple-400" />
                    Autonomy Level
                  </CardTitle>
                  <CardDescription>Current operational mode</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">{metrics.autonomyLevel}</span>
                      <Badge className="bg-purple-600">Supervised</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">A0 - Manual</span>
                        <span className="text-slate-600">Drafts only</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">A1 - Assisted</span>
                        <span className="text-slate-600">Asks approval</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-purple-400">A2 - Supervised</span>
                        <span className="text-purple-400">Within policy</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">A3 - Autonomous</span>
                        <span className="text-slate-600">Full autopilot</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">A4 - Self-optimizing</span>
                        <span className="text-slate-600">Experiments</span>
                      </div>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Adjust Autonomy Level
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ActivityItem
                    icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
                    title="Payout processed"
                    description="Creator payout #1234 completed successfully"
                    time="2 minutes ago"
                  />
                  <ActivityItem
                    icon={<Shield className="h-4 w-4 text-amber-400" />}
                    title="Policy gate triggered"
                    description="High-value refund requires approval"
                    time="15 minutes ago"
                  />
                  <ActivityItem
                    icon={<Zap className="h-4 w-4 text-cyan-400" />}
                    title="Workflow executed"
                    description="Content factory generated 5 new briefs"
                    time="1 hour ago"
                  />
                  <ActivityItem
                    icon={<Brain className="h-4 w-4 text-purple-400" />}
                    title="Decision made"
                    description="Bandit engine adjusted creator allocation"
                    time="2 hours ago"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Active Workflows</CardTitle>
                <CardDescription>n8n workflows running autonomously</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <WorkflowItem
                    name="Content Factory"
                    status="running"
                    executions={1247}
                    successRate={98.2}
                    autonomyLevel="A2"
                  />
                  <WorkflowItem
                    name="Payout Processor"
                    status="running"
                    executions={3421}
                    successRate={99.8}
                    autonomyLevel="A3"
                  />
                  <WorkflowItem
                    name="Dispute Handler"
                    status="running"
                    executions={892}
                    successRate={95.4}
                    autonomyLevel="A2"
                  />
                  <WorkflowItem
                    name="Creator Scheduler"
                    status="paused"
                    executions={567}
                    successRate={97.1}
                    autonomyLevel="A1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">AI Agents</CardTitle>
                <CardDescription>Autonomous workforce status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AgentItem
                    name="CFO Agent"
                    type="Financial Operations"
                    status="active"
                    tasksCompleted={1234}
                    performance={96.5}
                  />
                  <AgentItem
                    name="COO Agent"
                    type="Operations Management"
                    status="active"
                    tasksCompleted={2341}
                    performance={94.2}
                  />
                  <AgentItem
                    name="Creator Ops Agent"
                    type="Creator Management"
                    status="active"
                    tasksCompleted={5678}
                    performance={98.1}
                  />
                  <AgentItem
                    name="Legal Agent"
                    type="Compliance & Risk"
                    status="active"
                    tasksCompleted={456}
                    performance={99.2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Pending Approvals</CardTitle>
                <CardDescription>Founder-only decisions required</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ApprovalItem
                    title="High-value refund"
                    description="Refund request for $2,450 exceeds policy threshold"
                    riskLevel="high"
                    requestedAt="30 minutes ago"
                  />
                  <ApprovalItem
                    title="New supplier contract"
                    description="Exclusive partnership with 12-month commitment"
                    riskLevel="medium"
                    requestedAt="2 hours ago"
                  />
                  <ApprovalItem
                    title="Marketing spend increase"
                    description="Increase daily ad spend by 40% based on ROAS"
                    riskLevel="medium"
                    requestedAt="5 hours ago"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Incidents</CardTitle>
                <CardDescription>System issues and resolutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <IncidentItem
                    title="Payment gateway timeout"
                    severity="medium"
                    status="investigating"
                    detectedAt="1 hour ago"
                  />
                  <IncidentItem
                    title="Inventory sync delay"
                    severity="low"
                    status="resolved"
                    detectedAt="3 hours ago"
                  />
                </div>
                
                <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <div>
                        <h3 className="font-semibold text-white">Emergency Kill Switch</h3>
                        <p className="text-sm text-slate-400">Immediately pause all autonomous operations</p>
                      </div>
                    </div>
                    <Button variant="destructive" size="lg">
                      Activate Kill Switch
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Active Goals</CardTitle>
                <CardDescription>OKRs and business objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <GoalItem
                    title="Reach $1M monthly revenue"
                    progress={78}
                    target="$1,000,000"
                    current="$780,000"
                    deadline="End of Q1"
                  />
                  <GoalItem
                    title="Reduce refund rate below 5%"
                    progress={85}
                    target="5%"
                    current="5.8%"
                    deadline="End of month"
                  />
                  <GoalItem
                    title="Onboard 100 new creators"
                    progress={62}
                    target="100"
                    current="62"
                    deadline="End of Q1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components

function ActivityItem({ icon, title, description, time }: any) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{time}</span>
    </div>
  );
}

function WorkflowItem({ name, status, executions, successRate, autonomyLevel }: any) {
  const statusColors = {
    running: "border-green-500/30 bg-green-500/10 text-green-400",
    paused: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
      <div className="flex items-center gap-3">
        <GitBranch className="h-5 w-5 text-cyan-400" />
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-slate-400">{executions} executions • {successRate}% success</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-purple-600">{autonomyLevel}</Badge>
        <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
          {status === "running" ? <Play className="mr-1 h-3 w-3" /> : <Pause className="mr-1 h-3 w-3" />}
          {status}
        </Badge>
      </div>
    </div>
  );
}

function AgentItem({ name, type, status, tasksCompleted, performance }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-purple-400" />
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-slate-400">{type} • {tasksCompleted} tasks</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">{performance}%</span>
        <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
          {status}
        </Badge>
      </div>
    </div>
  );
}

function ApprovalItem({ title, description, riskLevel, requestedAt }: any) {
  const riskColors = {
    low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    high: "border-red-500/30 bg-red-500/10 text-red-400",
    critical: "border-red-600/30 bg-red-600/10 text-red-400",
  };

  return (
    <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
        <Badge variant="outline" className={riskColors[riskLevel as keyof typeof riskColors]}>
          {riskLevel}
        </Badge>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-500">{requestedAt}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-slate-700">
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

function IncidentItem({ title, severity, status, detectedAt }: any) {
  const severityColors = {
    low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    high: "border-red-500/30 bg-red-500/10 text-red-400",
    critical: "border-red-600/30 bg-red-600/10 text-red-400",
  };

  const statusColors = {
    open: "border-red-500/30 bg-red-500/10 text-red-400",
    investigating: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    mitigating: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    resolved: "border-green-500/30 bg-green-500/10 text-green-400",
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-slate-400">{detectedAt}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={severityColors[severity as keyof typeof severityColors]}>
          {severity}
        </Badge>
        <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
          {status}
        </Badge>
      </div>
    </div>
  );
}

function GoalItem({ title, progress, target, current, deadline }: any) {
  return (
    <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-slate-400 mt-1">
            {current} / {target} • {deadline}
          </p>
        </div>
        <span className="text-sm font-semibold text-cyan-400">{progress}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
        <div
          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
