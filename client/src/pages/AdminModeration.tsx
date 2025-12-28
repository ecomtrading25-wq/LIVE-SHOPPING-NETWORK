/**
 * Admin Moderation Dashboard
 * Content moderation queue, user reports, and reputation management
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import {
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

type ModerationLog = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  allowed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  confidence: number;
  createdAt: Date;
  context: any;
};

type UserReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  context: any;
};

type UserReputation = {
  userId: string;
  userName: string;
  score: number;
  level: 'trusted' | 'normal' | 'suspicious' | 'banned';
  violations: number;
  reports: number;
};

export default function AdminModeration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const utils = trpc.useUtils();

  // Fetch moderation data
  const { data: moderationQueue, isLoading: queueLoading } = trpc.moderation.getQueue.useQuery({
    limit: 100,
  });

  const { data: userReports, isLoading: reportsLoading } = trpc.moderation.getReports.useQuery({
    limit: 100,
  });

  const { data: flaggedUsers, isLoading: usersLoading } = trpc.moderation.getFlaggedUsers.useQuery({
    limit: 50,
  });

  // Mutations
  const reviewLogMutation = trpc.moderation.reviewLog.useMutation({
    onSuccess: () => {
      utils.moderation.getQueue.invalidate();
      toast.success('Moderation log reviewed');
      setSelectedLog(null);
    },
    onError: (error) => {
      toast.error(`Failed to review log: ${error.message}`);
    },
  });

  const reviewReportMutation = trpc.moderation.reviewReport.useMutation({
    onSuccess: () => {
      utils.moderation.getReports.invalidate();
      toast.success('Report reviewed');
      setSelectedReport(null);
    },
    onError: (error) => {
      toast.error(`Failed to review report: ${error.message}`);
    },
  });

  const banUserMutation = trpc.moderation.banUser.useMutation({
    onSuccess: () => {
      utils.moderation.getFlaggedUsers.invalidate();
      utils.moderation.getQueue.invalidate();
      toast.success('User banned');
      setActionDialogOpen(false);
      setActionReason('');
    },
    onError: (error) => {
      toast.error(`Failed to ban user: ${error.message}`);
    },
  });

  const unbanUserMutation = trpc.moderation.unbanUser.useMutation({
    onSuccess: () => {
      utils.moderation.getFlaggedUsers.invalidate();
      toast.success('User unbanned');
    },
    onError: (error) => {
      toast.error(`Failed to unban user: ${error.message}`);
    },
  });

  // Filter data based on search
  const filteredQueue = moderationQueue?.filter(
    (log) =>
      log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = userReports?.filter(
    (report) =>
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get severity badge color
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

  // Get reputation level color
  const getReputationColor = (level: string) => {
    switch (level) {
      case 'trusted':
        return 'bg-green-500';
      case 'normal':
        return 'bg-blue-500';
      case 'suspicious':
        return 'bg-yellow-500';
      case 'banned':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle ban user action
  const handleBanUser = (userId: string) => {
    if (!actionReason.trim()) {
      toast.error('Please provide a reason for banning');
      return;
    }

    banUserMutation.mutate({
      userId,
      reason: actionReason,
    });
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review flagged content and manage user reports
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationQueue?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Items in queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">User Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userReports?.filter((r) => r.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flaggedUsers?.filter((u) => u.level === 'banned').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently banned</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="queue">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
          <TabsTrigger value="reports">User Reports</TabsTrigger>
          <TabsTrigger value="users">Flagged Users</TabsTrigger>
        </TabsList>

        {/* Moderation Queue */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Content</CardTitle>
              <CardDescription>
                Content that has been flagged by automated moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredQueue && filteredQueue.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.content}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {log.categories.map((cat) => (
                              <Badge key={cat} variant="outline">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{(log.confidence * 100).toFixed(0)}%</TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLog(log)}
                            >
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No items in moderation queue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Reports */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>
                Reports submitted by users about other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredReports && filteredReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reported User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.reporterName}</TableCell>
                        <TableCell>{report.reportedUserName}</TableCell>
                        <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={report.status === 'pending' ? 'default' : 'outline'}
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedReport(report)}
                            >
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No pending reports</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flagged Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Users</CardTitle>
              <CardDescription>
                Users with low reputation or multiple violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : flaggedUsers && flaggedUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Reputation</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Violations</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{user.userName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${user.score}%` }}
                              />
                            </div>
                            <span className="text-sm">{user.score}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getReputationColor(user.level)}>
                            {user.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.violations}</TableCell>
                        <TableCell>{user.reports}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.level === 'banned' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unbanUserMutation.mutate({ userId: user.userId })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedLog({ userId: user.userId } as any);
                                  setActionDialogOpen(true);
                                }}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No flagged users</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban User Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This action will permanently ban the user from the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for ban</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Explain why this user is being banned..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLog && handleBanUser(selectedLog.userId)}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
