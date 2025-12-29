import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Clock,
  Plus,
  Video,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye,
  Package,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import AdminProtectedRoute from "@/components/AdminProtectedRoute";
export default function LiveSessionManagement() {
  return (
    <AdminProtectedRoute>
      <LiveSessionManagementContent />
    </AdminProtectedRoute>
  );
}

function LiveSessionManagementContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    status: "scheduled" as "scheduled" | "live" | "ended",
  });

  const { data: sessions, isLoading, refetch } = trpc.liveSessions.list.useQuery({
    limit: 50,
  });

  const createSession = trpc.liveSessions.create.useMutation({
    onSuccess: () => {
      refetch();
      setCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        scheduledAt: "",
        status: "scheduled",
      });
    },
  });

  const updateSessionStatus = trpc.liveSessions.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteSession = trpc.liveSessions.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCreateSession = () => {
    if (!formData.title || !formData.scheduledAt) {
      return;
    }

    createSession.mutate({
      title: formData.title,
      description: formData.description,
      scheduledAt: new Date(formData.scheduledAt),
      status: formData.status,
    });
  };

  const handleStartSession = (sessionId: string) => {
    updateSessionStatus.mutate({
      id: sessionId,
      status: "live",
    });
  };

  const handleEndSession = (sessionId: string) => {
    updateSessionStatus.mutate({
      id: sessionId,
      status: "ended",
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this live session?")) {
      deleteSession.mutate({ id: sessionId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ended":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Live Session Management</h1>
            <p className="text-gray-400">Create and manage your live shopping shows</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Live Session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-white/10 text-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create New Live Session</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Session Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tech Tuesday - Amazing Deals on Electronics"
                    className="bg-background/10 border-white/20 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Join us for exclusive deals on the latest tech gadgets!"
                    className="bg-background/10 border-white/20 text-foreground min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledAt" className="text-foreground">Scheduled Date & Time *</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="bg-background/10 border-white/20 text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-foreground">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-background/10 border-white/20 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10 text-foreground">
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="flex-1 border-white/20 text-foreground hover:bg-background/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSession}
                    disabled={createSession.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {createSession.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Session
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {sessions?.filter((s: any) => s.status === "live").length || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">Live Now</p>
            <p className="text-sm text-gray-400">Active sessions</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {sessions?.filter((s: any) => s.status === "scheduled").length || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">Scheduled</p>
            <p className="text-sm text-gray-400">Upcoming shows</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-red-400" />
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {sessions?.reduce((sum: number, s: any) => sum + (s.viewerCount || 0), 0) || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">Total Viewers</p>
            <p className="text-sm text-gray-400">All sessions</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-pink-400" />
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                ${sessions?.reduce((sum: number, s: any) => sum + parseFloat(s.revenue || "0"), 0).toFixed(2) || "0.00"}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">Revenue</p>
            <p className="text-sm text-gray-400">From live sales</p>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions && sessions.length === 0 ? (
            <Card className="p-12 bg-background text-foreground/5 border-white/10 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">No Live Sessions Yet</h2>
              <p className="text-gray-400 mb-6">
                Create your first live shopping session to start selling
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Session
              </Button>
            </Card>
          ) : (
            sessions?.map((session: any) => (
              <Card key={session.id} className="p-6 bg-background text-foreground/5 border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-foreground">{session.title}</h3>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-gray-400 mb-4">{session.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(session.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(session.scheduledAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{session.viewerCount || 0} viewers</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">{session.pinnedProducts?.length || 0} products</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {session.status === "scheduled" && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSession(session.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}

                    {session.status === "live" && (
                      <Button
                        size="sm"
                        onClick={() => handleEndSession(session.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        End
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-foreground hover:bg-background/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-foreground hover:bg-background/10"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSession(session.id)}
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
