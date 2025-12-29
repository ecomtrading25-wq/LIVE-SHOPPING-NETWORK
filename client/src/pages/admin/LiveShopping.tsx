import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Video,
  Play,
  Square,
  Users,
  ShoppingCart,
  TrendingUp,
  Plus,
  Pin,
  DollarSign,
} from "lucide-react";

/**
 * Live Shopping Management Page
 * Control live sessions, pinned products, and real-time analytics
 */

export default function LiveShoppingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: sessions, refetch } = trpc.live.listSessions.useQuery();
  const { data: analytics } = trpc.live.getAnalytics.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Shopping</h1>
          <p className="text-gray-400 mt-1">Manage live sessions and real-time commerce</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Live Session</DialogTitle>
              <DialogDescription className="text-gray-400">
                Start a new live shopping session
              </DialogDescription>
            </DialogHeader>
            <CreateSessionForm
              onSuccess={() => {
                setDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Live Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Live Now</p>
              <p className="text-2xl font-bold text-foreground">
                {sessions?.filter((s) => s.status === "live").length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Viewers</p>
              <p className="text-2xl font-bold text-foreground">{analytics?.totalViewers || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Live Orders</p>
              <p className="text-2xl font-bold text-foreground">{analytics?.liveOrders || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Live Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                ${analytics?.liveRevenue?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="bg-background border-border text-foreground">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Live Sessions</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-card/50 text-card-foreground">
              <TableHead className="text-gray-400">Session</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Viewers</TableHead>
              <TableHead className="text-gray-400">Duration</TableHead>
              <TableHead className="text-gray-400">Revenue</TableHead>
              <TableHead className="text-gray-400">Pinned Product</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session) => (
              <SessionRow key={session.id} session={session} onUpdate={refetch} />
            ))}

            {!sessions || sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  No live sessions. Create your first session to get started.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SessionRow({ session, onUpdate }: { session: any; onUpdate: () => void }) {
  const startMutation = trpc.live.startSession.useMutation({ onSuccess: onUpdate });
  const stopMutation = trpc.live.stopSession.useMutation({ onSuccess: onUpdate });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <Badge className="bg-red-600 animate-pulse">
            <div className="w-2 h-2 bg-background text-foreground rounded-full mr-2" />
            LIVE
          </Badge>
        );
      case "scheduled":
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case "ended":
        return <Badge className="bg-gray-600">Ended</Badge>;
      default:
        return <Badge className="bg-yellow-600">Draft</Badge>;
    }
  };

  const getDuration = () => {
    if (!session.startedAt) return "--";
    const start = new Date(session.startedAt).getTime();
    const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes}m`;
  };

  return (
    <TableRow className="border-border hover:bg-card/50 text-card-foreground">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center text-card-foreground">
            <Video className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">{session.title}</p>
            <p className="text-sm text-gray-400">{session.channelId}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(session.status)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-foreground">{session.viewerCount || 0}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{getDuration()}</TableCell>
      <TableCell className="text-foreground font-medium">
        ${session.revenue?.toFixed(2) || "0.00"}
      </TableCell>
      <TableCell>
        {session.pinnedProductId ? (
          <Badge className="bg-red-600">
            <Pin className="w-3 h-3 mr-1" />
            Pinned
          </Badge>
        ) : (
          <span className="text-gray-500">None</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {session.status === "live" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => stopMutation.mutate({ sessionId: session.id })}
              disabled={stopMutation.isPending}
            >
              <Square className="w-4 h-4 mr-2" />
              End
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startMutation.mutate({ sessionId: session.id })}
              disabled={startMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function CreateSessionForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [channelId, setChannelId] = useState("");

  const createMutation = trpc.live.createSession.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      streamUrl,
      channelId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">
          Session Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Friday Night Live Sale"
          className="bg-card border-zinc-700 text-foreground"
          required
        />
      </div>

      <div>
        <Label htmlFor="streamUrl" className="text-foreground">
          Stream URL (HLS)
        </Label>
        <Input
          id="streamUrl"
          value={streamUrl}
          onChange={(e) => setStreamUrl(e.target.value)}
          placeholder="https://stream.example.com/live.m3u8"
          className="bg-card border-zinc-700 text-foreground"
          required
        />
      </div>

      <div>
        <Label htmlFor="channelId" className="text-foreground">
          Channel ID
        </Label>
        <Input
          id="channelId"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="main-channel"
          className="bg-card border-zinc-700 text-foreground"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Session"}
      </Button>

      {createMutation.error && (
        <p className="text-sm text-red-500">{createMutation.error.message}</p>
      )}
    </form>
  );
}
