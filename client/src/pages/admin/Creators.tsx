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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  DollarSign,
  TrendingUp,
  Award,
  Plus,
  CreditCard,
  Video,
} from "lucide-react";

/**
 * Creators Management Page
 * Manage influencers, commissions, and payouts
 */

export default function CreatorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const { data: creators, refetch } = trpc.creators.list.useQuery({
    tier: tierFilter === "all" ? undefined : tierFilter,
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.creators.getStats.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Creators</h1>
          <p className="text-gray-400 mt-1">Manage influencers and commission payouts</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Creator
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Creator</DialogTitle>
              <DialogDescription className="text-gray-400">
                Onboard a new influencer to the platform
              </DialogDescription>
            </DialogHeader>
            <AddCreatorForm
              onSuccess={() => {
                setDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Creators</p>
              <p className="text-2xl font-bold text-white">{stats?.totalCreators || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Commissions</p>
              <p className="text-2xl font-bold text-white">
                ${stats?.totalCommissions?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending Payouts</p>
              <p className="text-2xl font-bold text-white">
                ${stats?.pendingPayouts?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-white">{stats?.activeSessions || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search creators by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Creators Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
              <TableHead className="text-gray-400">Creator</TableHead>
              <TableHead className="text-gray-400">Tier</TableHead>
              <TableHead className="text-gray-400">Commission Rate</TableHead>
              <TableHead className="text-gray-400">Total Sales</TableHead>
              <TableHead className="text-gray-400">Total Earned</TableHead>
              <TableHead className="text-gray-400">Pending Payout</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators?.map((creator) => (
              <TableRow key={creator.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {creator.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{creator.name}</p>
                      <p className="text-sm text-gray-400">{creator.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      creator.tier === "platinum"
                        ? "bg-purple-600"
                        : creator.tier === "gold"
                          ? "bg-yellow-600"
                          : creator.tier === "silver"
                            ? "bg-gray-500"
                            : "bg-orange-700"
                    }
                  >
                    <Award className="w-3 h-3 mr-1" />
                    {creator.tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-white font-medium">
                  {creator.commissionRate}%
                </TableCell>
                <TableCell className="text-gray-300">
                  ${creator.totalSales?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell className="text-green-400 font-medium">
                  ${creator.totalEarned?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell className="text-yellow-400 font-medium">
                  ${creator.pendingPayout?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={creator.status === "active" ? "bg-green-600" : "bg-gray-600"}
                  >
                    {creator.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!creators || creators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  No creators found. Add your first creator to get started.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-700/10 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bronze</h3>
              <p className="text-sm text-gray-400">5-10% commission</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {creators?.filter((c) => c.tier === "bronze").length || 0}
          </p>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-500/10 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Silver</h3>
              <p className="text-sm text-gray-400">10-15% commission</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {creators?.filter((c) => c.tier === "silver").length || 0}
          </p>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-600/10 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gold</h3>
              <p className="text-sm text-gray-400">15-20% commission</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {creators?.filter((c) => c.tier === "gold").length || 0}
          </p>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Platinum</h3>
              <p className="text-sm text-gray-400">20-30% commission</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {creators?.filter((c) => c.tier === "platinum").length || 0}
          </p>
        </Card>
      </div>
    </div>
  );
}

function AddCreatorForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("bronze");
  const [commissionRate, setCommissionRate] = useState("10");

  const createMutation = trpc.creators.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      email,
      tier: tier as any,
      commissionRate: parseFloat(commissionRate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-white">
          Creator Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="bg-zinc-800 border-zinc-700 text-white"
          required
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="bg-zinc-800 border-zinc-700 text-white"
          required
        />
      </div>

      <div>
        <Label htmlFor="tier" className="text-white">
          Tier
        </Label>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="bronze">Bronze (5-10%)</SelectItem>
            <SelectItem value="silver">Silver (10-15%)</SelectItem>
            <SelectItem value="gold">Gold (15-20%)</SelectItem>
            <SelectItem value="platinum">Platinum (20-30%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="commissionRate" className="text-white">
          Commission Rate (%)
        </Label>
        <Input
          id="commissionRate"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={commissionRate}
          onChange={(e) => setCommissionRate(e.target.value)}
          placeholder="10"
          className="bg-zinc-800 border-zinc-700 text-white"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Adding..." : "Add Creator"}
      </Button>

      {createMutation.error && (
        <p className="text-sm text-red-500">{createMutation.error.message}</p>
      )}
    </form>
  );
}
