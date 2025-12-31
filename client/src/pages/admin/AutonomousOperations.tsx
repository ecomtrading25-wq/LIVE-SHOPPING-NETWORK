import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle, XCircle, Activity, Zap, Clock, AlertTriangle, Shield, PlayCircle, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutonomousOperations() {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Fetch autonomous system data
  const { data: status, isLoading: statusLoading } = trpc.autonomous.status.useQuery();
  const { data: monitoringStats } = trpc.autonomous.monitoringStats.useQuery();
  const { data: alerts } = trpc.autonomous.alerts.useQuery({ limit: 50 });
  const { data: pendingApprovals } = trpc.autonomous.pendingApprovals.useQuery();
  const { data: killSwitchStatus } = trpc.autonomous.killSwitchStatus.useQuery();
  const { data: scheduledJobs } = trpc.autonomous.scheduledJobs.useQuery();
  const { data: circuitBreakers } = trpc.autonomous.circuitBreakers.useQuery();
  const { data: dlq } = trpc.autonomous.deadLetterQueue.useQuery();

  // Mutations
  const acknowledgeAlertMutation = trpc.autonomous.acknowledgeAlert.useMutation();
  const approveTaskMutation = trpc.autonomous.approveTask.useMutation();
  const rejectTaskMutation = trpc.autonomous.rejectTask.useMutation();
  const activateKillSwitchMutation = trpc.autonomous.activateKillSwitch.useMutation();
  const deactivateKillSwitchMutation = trpc.autonomous.deactivateKillSwitch.useMutation();
  const enableJobMutation = trpc.autonomous.enableJob.useMutation();
  const disableJobMutation = trpc.autonomous.disableJob.useMutation();

  const utils = trpc.useUtils();

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlertMutation.mutateAsync({ alertId });
      toast.success('Alert acknowledged');
      utils.autonomous.alerts.invalidate();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleApproveTask = async (taskId: string, approvedBy: string) => {
    try {
      await approveTaskMutation.mutateAsync({ taskId, approvedBy });
      toast.success('Task approved');
      utils.autonomous.pendingApprovals.invalidate();
    } catch (error) {
      toast.error('Failed to approve task');
    }
  };

  const handleRejectTask = async (taskId: string, reason: string) => {
    try {
      await rejectTaskMutation.mutateAsync({ taskId, reason });
      toast.success('Task rejected');
      utils.autonomous.pendingApprovals.invalidate();
    } catch (error) {
      toast.error('Failed to reject task');
    }
  };

  const handleToggleKillSwitch = async () => {
    try {
      if (killSwitchStatus?.active) {
        await deactivateKillSwitchMutation.mutateAsync();
        toast.success('Kill switch deactivated - autonomous operations resumed');
      } else {
        const reason = prompt('Enter reason for activating kill switch:');
        if (reason) {
          await activateKillSwitchMutation.mutateAsync({ reason });
          toast.warning('Kill switch activated - all autonomous operations stopped');
        }
      }
      utils.autonomous.killSwitchStatus.invalidate();
    } catch (error) {
      toast.error('Failed to toggle kill switch');
    }
  };

  const handleToggleJob = async (jobName: string, enabled: boolean) => {
    try {
      if (enabled) {
        await disableJobMutation.mutateAsync({ jobName });
        toast.success(`Job "${jobName}" disabled`);
      } else {
        await enableJobMutation.mutateAsync({ jobName });
        toast.success(`Job "${jobName}" enabled`);
      }
      utils.autonomous.scheduledJobs.invalidate();
    } catch (error) {
      toast.error('Failed to toggle job');
    }
  };

  if (statusLoading) {
    return <div className="flex items-center justify-center h-96">Loading autonomous operations...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Autonomous Operations</h1>
          <p className="text-muted-foreground">Monitor and control autonomous business operations</p>
        </div>
        
        {/* Kill Switch */}
        <Card className={`border-2 ${killSwitchStatus?.active ? 'border-red-500' : 'border-green-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Shield className={`h-8 w-8 ${killSwitchStatus?.active ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="font-semibold">Emergency Kill Switch</p>
                <p className="text-sm text-muted-foreground">
                  {killSwitchStatus?.active ? 'All operations stopped' : 'All systems operational'}
                </p>
              </div>
              <Button
                variant={killSwitchStatus?.active ? 'default' : 'destructive'}
                onClick={handleToggleKillSwitch}
              >
                {killSwitchStatus?.active ? 'Resume Operations' : 'Emergency Stop'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.enabled ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Uptime: {monitoringStats?.health?.uptime || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.filter(a => !a.acknowledged).length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {alerts?.filter(a => a.severity === 'critical').length || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">Require human approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Jobs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheduledJobs?.filter(j => j.enabled).length || 0}/{scheduledJobs?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Active jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Statistics</CardTitle>
                <CardDescription>Real-time system metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Events:</span>
                  <span className="font-semibold">{monitoringStats?.stats?.totalEvents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alerts Generated:</span>
                  <span className="font-semibold">{monitoringStats?.stats?.alertsGenerated || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health Checks:</span>
                  <span className="font-semibold">{monitoringStats?.stats?.healthChecks || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Circuit Breakers</CardTitle>
                <CardDescription>Service protection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {circuitBreakers && Object.entries(circuitBreakers).map(([name, stats]: [string, any]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm">{name}:</span>
                    <Badge variant={stats.state === 'closed' ? 'default' : 'destructive'}>
                      {stats.state}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts?.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${
                      alert.acknowledged ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {alert.severity === 'critical' && (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        {alert.severity === 'warning' && (
                          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        )}
                        {alert.severity === 'info' && (
                          <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{alert.message}</p>
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'warning' ? 'default' : 'secondary'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                          {alert.metadata && (
                            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No alerts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Task Approvals</CardTitle>
              <CardDescription>High-risk tasks requiring human approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals?.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{task.type}</p>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge>{task.riskLevel}</Badge>
                          <Badge variant="outline">{task.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveTask(task.id, 'admin')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) handleRejectTask(task.id, reason);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!pendingApprovals || pendingApprovals.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No pending approvals</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Jobs</CardTitle>
              <CardDescription>Automated tasks and their schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledJobs?.map((job) => (
                  <div key={job.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{job.name}</p>
                          <Badge variant={job.enabled ? 'default' : 'secondary'}>
                            {job.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Schedule: {job.schedule}
                        </p>
                        {job.lastRun && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last run: {new Date(job.lastRun).toLocaleString()}
                          </p>
                        )}
                        {job.nextRun && (
                          <p className="text-xs text-muted-foreground">
                            Next run: {new Date(job.nextRun).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleJob(job.name, job.enabled)}
                      >
                        {job.enabled ? (
                          <>
                            <PauseCircle className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {(!scheduledJobs || scheduledJobs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No scheduled jobs</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge className="bg-green-500">Healthy</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-semibold">{monitoringStats?.health?.uptime || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span className="font-semibold">{monitoringStats?.health?.memoryUsage || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Usage:</span>
                  <span className="font-semibold">{monitoringStats?.health?.cpuUsage || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dead Letter Queue</CardTitle>
                <CardDescription>Failed operations requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{dlq?.size || 0} items</div>
                {dlq?.items && dlq.items.length > 0 ? (
                  <div className="space-y-2">
                    {dlq.items.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="text-sm p-2 bg-muted rounded">
                        <p className="font-semibold">{item.operation}</p>
                        <p className="text-xs text-muted-foreground">{item.error}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No failed operations</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
