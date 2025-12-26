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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Settings, CheckCircle, XCircle, Clock } from "lucide-react";

/**
 * Channels Management Page
 * Manage multi-channel marketplace connections
 */

export default function ChannelsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: channels, refetch } = trpc.channels.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Channels</h1>
          <p className="text-gray-400 mt-1">Manage marketplace connections and integrations</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Channel</DialogTitle>
              <DialogDescription className="text-gray-400">
                Connect a new marketplace or sales channel
              </DialogDescription>
            </DialogHeader>
            <AddChannelForm onSuccess={() => { setDialogOpen(false); refetch(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels?.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} onUpdate={refetch} />
        ))}

        {!channels || channels.length === 0 ? (
          <Card className="col-span-full p-12 bg-zinc-900 border-zinc-800 text-center">
            <p className="text-gray-400 mb-4">No channels connected yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Channel
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function ChannelCard({ channel, onUpdate }: { channel: any; onUpdate: () => void }) {
  const syncMutation = trpc.channels.sync.useMutation({
    onSuccess: () => {
      onUpdate();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "disabled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "shopify":
        return "bg-green-600";
      case "tiktok_shop":
        return "bg-pink-600";
      case "amazon":
        return "bg-orange-600";
      case "ebay":
        return "bg-blue-600";
      default:
        return "bg-purple-600";
    }
  };

  return (
    <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${getPlatformColor(channel.platform)} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">
              {channel.platform.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{channel.name}</h3>
            <p className="text-sm text-gray-400">{channel.slug}</p>
          </div>
        </div>
        {getStatusIcon(channel.status)}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Platform</span>
          <Badge className={getPlatformColor(channel.platform)}>
            {channel.platform.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        {channel.lastSyncAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Last Sync</span>
            <span className="text-white">
              {new Date(channel.lastSyncAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => syncMutation.mutate({ channelId: channel.id })}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sync Now
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

function AddChannelForm({ onSuccess }: { onSuccess: () => void }) {
  const [platform, setPlatform] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const createMutation = trpc.channels.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      slug,
      platform: platform as any,
      settings: {},
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform" className="text-white">Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="shopify">Shopify</SelectItem>
            <SelectItem value="tiktok_shop">TikTok Shop</SelectItem>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="ebay">eBay</SelectItem>
            <SelectItem value="whatnot">Whatnot</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="name" className="text-white">Channel Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Store"
          className="bg-zinc-800 border-zinc-700 text-white"
          required
        />
      </div>

      <div>
        <Label htmlFor="slug" className="text-white">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-store"
          className="bg-zinc-800 border-zinc-700 text-white"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Channel"}
      </Button>

      {createMutation.error && (
        <p className="text-sm text-red-500">{createMutation.error.message}</p>
      )}
    </form>
  );
}
