import { useState } from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Zap,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Target,
  Rocket,
  Video,
  Scissors,
  Download,
  Upload,
  Database,
  Link2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  FileText,
  Package,
  Users,
  BarChart3,
  GitBranch,
  Workflow,
  Bot,
  Cpu,
} from "lucide-react";

/**
 * Automation Workflows Dashboard
 * 
 * Complete automation control center:
 * - Trend-to-Launch Pipeline Automation
 * - Daily Shortlist Generation (Scheduled)
 * - Asset Generation Workflows
 * - Test Stream Automation
 * - Host Handoff Generation
 * - Post-Live Clip Extraction
 * - External Data Sync (Sheets, Airtable, N8N)
 * - Profit Calculation Automation
 * - Job Queue Management
 * - Workflow Templates & Scheduling
 */

export default function AutomationWorkflows() {
  return (
    <AdminProtectedRoute>
      <AutomationWorkflowsContent />
    </AdminProtectedRoute>
  );
}

function AutomationWorkflowsContent() {
  const [channelId] = useState("default-channel");
  const [selectedTab, setSelectedTab] = useState("overview");
  
  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Automation Workflows</h1>
          <p className="text-muted-foreground mt-2">
            End-to-end pipeline automation & job orchestration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <OverviewSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="pipelines" className="space-y-6">
          <PipelinesSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="jobs" className="space-y-6">
          <JobQueueSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="sync" className="space-y-6">
          <DataSyncSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="schedules" className="space-y-6">
          <SchedulesSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-6">
          <LogsSection channelId={channelId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// OVERVIEW SECTION
// ============================================================================

function OverviewSection({ channelId }: { channelId: string }) {
  const workflows = [
    {
      id: "trend-to-launch",
      name: "Trend-to-Launch Pipeline",
      description: "Automated product discovery → launch creation",
      status: "ACTIVE",
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
      successRate: 95,
      avgDuration: "3.5 min",
    },
    {
      id: "daily-shortlist",
      name: "Daily Shortlist Generation",
      description: "Generate Top 10 products every day at 9 AM",
      status: "ACTIVE",
      lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 19 * 60 * 60 * 1000),
      successRate: 100,
      avgDuration: "1.2 min",
    },
    {
      id: "asset-generation",
      name: "Asset Generation",
      description: "LLM-powered script & OBS pack creation",
      status: "ACTIVE",
      lastRun: new Date(Date.now() - 30 * 60 * 1000),
      nextRun: null,
      successRate: 92,
      avgDuration: "4.8 min",
    },
    {
      id: "clip-extraction",
      name: "Post-Live Clip Factory",
      description: "Extract 5 clips from completed shows",
      status: "ACTIVE",
      lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000),
      nextRun: null,
      successRate: 88,
      avgDuration: "2.1 min",
    },
    {
      id: "data-sync",
      name: "External Data Sync",
      description: "Sync to Sheets, Airtable, N8N",
      status: "ACTIVE",
      lastRun: new Date(Date.now() - 10 * 60 * 1000),
      nextRun: new Date(Date.now() + 50 * 60 * 1000),
      successRate: 97,
      avgDuration: "0.8 min",
    },
    {
      id: "profit-calc",
      name: "Profit Calculation",
      description: "Multi-factor cost breakdown & profit tracking",
      status: "ACTIVE",
      lastRun: new Date(Date.now() - 15 * 60 * 1000),
      nextRun: new Date(Date.now() + 45 * 60 * 1000),
      successRate: 100,
      avgDuration: "0.3 min",
    },
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.status === "ACTIVE").length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.length} total workflows
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Today</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              234 completed · 13 pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.8%</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 min</div>
            <p className="text-xs text-muted-foreground">
              Across all workflows
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription className="mt-1">{workflow.description}</CardDescription>
                </div>
                <StatusBadge status={workflow.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{workflow.successRate}%</span>
                </div>
                <Progress value={workflow.successRate} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Last Run</p>
                  <p className="font-medium">
                    {Math.round((Date.now() - workflow.lastRun.getTime()) / (1000 * 60))}m ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Duration</p>
                  <p className="font-medium">{workflow.avgDuration}</p>
                </div>
              </div>
              
              {workflow.nextRun && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Next Run</p>
                  <p className="font-medium">
                    {Math.round((workflow.nextRun.getTime() - Date.now()) / (1000 * 60 * 60))}h
                  </p>
                </div>
              )}
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PIPELINES SECTION
// ============================================================================

function PipelinesSection({ channelId }: { channelId: string }) {
  const pipelines = [
    {
      id: "trend-to-launch",
      name: "Trend-to-Launch Pipeline",
      stages: [
        { name: "Trend Discovery", status: "COMPLETED", duration: "0.5 min" },
        { name: "Scoring & Analysis", status: "COMPLETED", duration: "1.2 min" },
        { name: "Shortlist Selection", status: "COMPLETED", duration: "0.3 min" },
        { name: "Launch Creation", status: "IN_PROGRESS", duration: "1.5 min" },
        { name: "Asset Generation", status: "PENDING", duration: "-" },
        { name: "Test Stream", status: "PENDING", duration: "-" },
      ],
      overallProgress: 60,
      enabled: true,
    },
    {
      id: "asset-to-live",
      name: "Asset-to-Live Pipeline",
      stages: [
        { name: "Script Generation", status: "COMPLETED", duration: "2.1 min" },
        { name: "OBS Pack Creation", status: "COMPLETED", duration: "1.8 min" },
        { name: "Compliance Check", status: "COMPLETED", duration: "0.9 min" },
        { name: "Host Handoff", status: "IN_PROGRESS", duration: "0.5 min" },
        { name: "Readiness Gate", status: "PENDING", duration: "-" },
      ],
      overallProgress: 75,
      enabled: true,
    },
    {
      id: "post-live",
      name: "Post-Live Pipeline",
      stages: [
        { name: "Show Completion", status: "COMPLETED", duration: "0.1 min" },
        { name: "Clip Extraction", status: "COMPLETED", duration: "2.1 min" },
        { name: "Profit Calculation", status: "COMPLETED", duration: "0.3 min" },
        { name: "Data Sync", status: "IN_PROGRESS", duration: "0.8 min" },
        { name: "Host Payout", status: "PENDING", duration: "-" },
      ],
      overallProgress: 80,
      enabled: true,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Pipelines</h2>
          <p className="text-muted-foreground">Multi-stage workflow orchestration</p>
        </div>
        <Button>
          <GitBranch className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>
      
      <div className="space-y-6">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{pipeline.name}</CardTitle>
                  <CardDescription>
                    {pipeline.stages.length} stages · {pipeline.overallProgress}% complete
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={pipeline.enabled} />
                  <Badge variant={pipeline.enabled ? "default" : "secondary"}>
                    {pipeline.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={pipeline.overallProgress} className="h-2" />
              
              <div className="space-y-3">
                {pipeline.stages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {stage.status === "COMPLETED" && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {stage.status === "IN_PROGRESS" && (
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      )}
                      {stage.status === "PENDING" && (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stage.status === "COMPLETED" && `Completed in ${stage.duration}`}
                        {stage.status === "IN_PROGRESS" && "In progress..."}
                        {stage.status === "PENDING" && "Waiting..."}
                      </p>
                    </div>
                    <StageBadge status={stage.status} />
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Run Pipeline
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Stages
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// JOB QUEUE SECTION
// ============================================================================

function JobQueueSection({ channelId }: { channelId: string }) {
  const jobs = [
    {
      id: "job-1",
      type: "GENERATE_ASSETS",
      launchName: "Viral Kitchen Gadget",
      status: "RUNNING",
      progress: 65,
      createdAt: new Date(Date.now() - 3 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 60 * 1000),
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000),
    },
    {
      id: "job-2",
      type: "EXTRACT_CLIPS",
      launchName: "Beauty Product Demo",
      status: "QUEUED",
      progress: 0,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      startedAt: null,
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000),
    },
    {
      id: "job-3",
      type: "SYNC_TO_AIRTABLE",
      launchName: "Fitness Gear Launch",
      status: "COMPLETED",
      progress: 100,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      startedAt: new Date(Date.now() - 9 * 60 * 1000),
      completedAt: new Date(Date.now() - 8 * 60 * 1000),
    },
    {
      id: "job-4",
      type: "CALCULATE_PROFIT",
      launchName: "Home Decor Item",
      status: "FAILED",
      progress: 45,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      startedAt: new Date(Date.now() - 14 * 60 * 1000),
      failedAt: new Date(Date.now() - 13 * 60 * 1000),
      error: "Insufficient cost data",
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Queue</h2>
          <p className="text-muted-foreground">Background task management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Pause className="h-4 w-4 mr-2" />
            Pause Queue
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active & Queued Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Launch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Badge variant="outline">{job.type.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{job.launchName}</p>
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="w-20" />
                      <span className="text-sm">{job.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {Math.round((Date.now() - job.createdAt.getTime()) / (1000 * 60))}m ago
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {job.status === "RUNNING" && (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === "FAILED" && (
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// DATA SYNC SECTION
// ============================================================================

function DataSyncSection({ channelId }: { channelId: string }) {
  const syncConfigs = [
    {
      id: "sync-sheets",
      name: "Google Sheets Sync",
      description: "Export launches & metrics to Google Sheets",
      platform: "GOOGLE_SHEETS",
      enabled: true,
      lastSync: new Date(Date.now() - 10 * 60 * 1000),
      nextSync: new Date(Date.now() + 50 * 60 * 1000),
      syncFrequency: "Every hour",
      recordsSynced: 1247,
    },
    {
      id: "sync-airtable",
      name: "Airtable Sync",
      description: "Bi-directional sync with Airtable base",
      platform: "AIRTABLE",
      enabled: true,
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      nextSync: new Date(Date.now() + 45 * 60 * 1000),
      syncFrequency: "Every hour",
      recordsSynced: 892,
    },
    {
      id: "sync-n8n",
      name: "N8N Webhook",
      description: "Trigger N8N workflows on events",
      platform: "N8N",
      enabled: true,
      lastSync: new Date(Date.now() - 2 * 60 * 1000),
      nextSync: null,
      syncFrequency: "Real-time",
      recordsSynced: 3421,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">External Data Sync</h2>
          <p className="text-muted-foreground">Integration with external platforms</p>
        </div>
        <Button>
          <Link2 className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {syncConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <CardDescription className="mt-1">{config.description}</CardDescription>
                </div>
                <Switch checked={config.enabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {config.recordsSynced.toLocaleString()} records synced
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium">{config.syncFrequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="font-medium">
                    {Math.round((Date.now() - config.lastSync.getTime()) / (1000 * 60))}m ago
                  </span>
                </div>
                {config.nextSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Sync</span>
                    <span className="font-medium">
                      {Math.round((config.nextSync.getTime() - Date.now()) / (1000 * 60))}m
                    </span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Google Sheets sync completed</p>
                <p className="text-xs text-muted-foreground">
                  247 records exported · 10 minutes ago
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Airtable sync completed</p>
                <p className="text-xs text-muted-foreground">
                  189 records synced · 15 minutes ago
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Link2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">N8N webhook triggered</p>
                <p className="text-xs text-muted-foreground">
                  Launch created event · 2 minutes ago
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SCHEDULES SECTION
// ============================================================================

function SchedulesSection({ channelId }: { channelId: string }) {
  const schedules = [
    {
      id: "schedule-1",
      name: "Daily Shortlist Generation",
      description: "Generate Top 10 products",
      cronExpression: "0 0 9 * * *",
      humanReadable: "Every day at 9:00 AM",
      enabled: true,
      lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 19 * 60 * 60 * 1000),
      successCount: 247,
      failureCount: 3,
    },
    {
      id: "schedule-2",
      name: "Hourly Data Sync",
      description: "Sync to external platforms",
      cronExpression: "0 0 * * * *",
      humanReadable: "Every hour",
      enabled: true,
      lastRun: new Date(Date.now() - 10 * 60 * 1000),
      nextRun: new Date(Date.now() + 50 * 60 * 1000),
      successCount: 1823,
      failureCount: 12,
    },
    {
      id: "schedule-3",
      name: "Weekly Performance Report",
      description: "Generate & email performance report",
      cronExpression: "0 0 10 * * 1",
      humanReadable: "Every Monday at 10:00 AM",
      enabled: false,
      lastRun: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      successCount: 34,
      failureCount: 1,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Jobs</h2>
          <p className="text-muted-foreground">Cron-based automation triggers</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>
      
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{schedule.name}</CardTitle>
                  <CardDescription>{schedule.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={schedule.enabled} />
                  <Badge variant={schedule.enabled ? "default" : "secondary"}>
                    {schedule.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Schedule</p>
                  <p className="font-medium">{schedule.humanReadable}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schedule.cronExpression}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Run</p>
                  <p className="font-medium">
                    {Math.round((Date.now() - schedule.lastRun.getTime()) / (1000 * 60 * 60))}h ago
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Run</p>
                  <p className="font-medium">
                    {Math.round((schedule.nextRun.getTime() - Date.now()) / (1000 * 60 * 60))}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="font-medium">
                    {((schedule.successCount / (schedule.successCount + schedule.failureCount)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schedule.successCount} / {schedule.successCount + schedule.failureCount} runs
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// LOGS SECTION
// ============================================================================

function LogsSection({ channelId }: { channelId: string }) {
  const logs = [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      level: "INFO",
      workflow: "Daily Shortlist",
      message: "Generated shortlist with 10 products",
      details: "Avg score: 78.5, Min score: 72",
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      level: "SUCCESS",
      workflow: "Asset Generation",
      message: "Generated assets for launch: Viral Kitchen Gadget",
      details: "Script: 2.1 min, OBS pack: 1.8 min",
    },
    {
      id: "log-3",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      level: "WARNING",
      workflow: "Data Sync",
      message: "Airtable sync slow response",
      details: "Took 45s (expected <30s)",
    },
    {
      id: "log-4",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      level: "ERROR",
      workflow: "Profit Calculation",
      message: "Failed to calculate profit for launch",
      details: "Error: Missing source cost data",
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Logs</h2>
          <p className="text-muted-foreground">Real-time workflow execution logs</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {log.level === "INFO" && (
                      <div className="rounded-full bg-blue-100 p-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    {log.level === "SUCCESS" && (
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    {log.level === "WARNING" && (
                      <div className="rounded-full bg-yellow-100 p-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}
                    {log.level === "ERROR" && (
                      <div className="rounded-full bg-red-100 p-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{log.workflow}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; label: string }> = {
    ACTIVE: { variant: "default", label: "Active" },
    PAUSED: { variant: "secondary", label: "Paused" },
    DISABLED: { variant: "outline", label: "Disabled" },
    ERROR: { variant: "destructive", label: "Error" },
  };
  
  const config = variants[status] || { variant: "outline", label: status };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function StageBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; label: string }> = {
    COMPLETED: { variant: "default", label: "Done" },
    IN_PROGRESS: { variant: "default", label: "Running" },
    PENDING: { variant: "secondary", label: "Pending" },
    FAILED: { variant: "destructive", label: "Failed" },
  };
  
  const config = variants[status] || { variant: "outline", label: status };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function JobStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; label: string }> = {
    QUEUED: { variant: "secondary", label: "Queued" },
    RUNNING: { variant: "default", label: "Running" },
    COMPLETED: { variant: "default", label: "Completed" },
    FAILED: { variant: "destructive", label: "Failed" },
    CANCELLED: { variant: "outline", label: "Cancelled" },
  };
  
  const config = variants[status] || { variant: "outline", label: status };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
