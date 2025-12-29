import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react';

export default function ModerationDashboard() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // Fetch moderation data
  const { data: reports = [], refetch } = trpc.moderation.getReports.useQuery({ 
    status: filterStatus as any,
    limit: 50 
  });
  const { data: stats } = trpc.moderation.getStats.useQuery();
  const { data: bannedUsers = [] } = trpc.moderation.getBannedUsers.useQuery();

  // Mutations
  const takeAction = trpc.moderation.takeAction.useMutation({
    onSuccess: () => {
      toast({
        title: '✅ Action Taken',
        description: 'Moderation action has been applied',
      });
      setSelectedReport(null);
      setActionReason('');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const banUser = trpc.moderation.banUser.useMutation({
    onSuccess: () => {
      toast({
        title: '🚫 User Banned',
        description: 'User has been banned from the platform',
      });
      refetch();
    },
  });

  const unbanUser = trpc.moderation.unbanUser.useMutation({
    onSuccess: () => {
      toast({
        title: '✅ User Unbanned',
        description: 'User has been unbanned',
      });
      refetch();
    },
  });

  const handleAction = (action: 'approve' | 'reject' | 'ban') => {
    if (!selectedReport) return;
    
    takeAction.mutate({
      reportId: selectedReport.id,
      action,
      reason: actionReason,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'show':
        return <Eye className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-red-600" />
            Moderation Dashboard
          </h1>
          <p className="text-gray-600">Monitor and manage platform content</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Pending Reports</span>
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold">{stats?.pendingReports || 0}</p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Resolved Today</span>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold">{stats?.resolvedToday || 0}</p>
              <p className="text-sm text-gray-500">Actions taken</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Banned Users</span>
                <Ban className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-3xl font-bold">{bannedUsers.length}</p>
              <p className="text-sm text-gray-500">Active bans</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Response Time</span>
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">{stats?.avgResponseTime || '0'}m</p>
              <p className="text-sm text-gray-500">Average</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Content Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No reports to review</p>
                <p className="text-sm text-gray-500">All clear! No pending moderation actions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-background text-foreground rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full ${getSeverityColor(report.severity)} flex items-center justify-center text-foreground`}>
                        {getTypeIcon(report.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{report.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {report.type}
                          </Badge>
                          <Badge className={`${getSeverityColor(report.severity)} text-foreground text-xs`}>
                            {report.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{report.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Reported by User #{report.reporterId} • {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banned Users */}
        {bannedUsers.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Banned Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bannedUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-600">Banned: {new Date(user.bannedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {user.banReason}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unbanUser.mutate({ userId: user.id })}
                      disabled={unbanUser.isPending}
                    >
                      Unban
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Review Report
              </DialogTitle>
              <DialogDescription>
                Take action on this content report
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 mt-4">
                <div className="bg-background text-foreground rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getSeverityColor(selectedReport.severity)} text-foreground`}>
                      {selectedReport.severity}
                    </Badge>
                    <Badge variant="outline">{selectedReport.type}</Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{selectedReport.title}</h3>
                  <p className="text-gray-700 mb-3">{selectedReport.description}</p>
                  {selectedReport.content && (
                    <div className="bg-background text-foreground rounded p-3 border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-1">Reported Content:</p>
                      <p className="text-sm">{selectedReport.content}</p>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Reporter: User #{selectedReport.reporterId}</p>
                    <p>Reported: {new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Action Reason</label>
                  <Textarea
                    placeholder="Explain the action taken..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={takeAction.isPending}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Content
                  </Button>
                  <Button
                    onClick={() => handleAction('reject')}
                    disabled={takeAction.isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove Content
                  </Button>
                  <Button
                    onClick={() => handleAction('ban')}
                    disabled={takeAction.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
