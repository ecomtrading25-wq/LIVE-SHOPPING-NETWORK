import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Search,
  CheckCircle,
  Clock,
  Truck,
  Box,
  AlertCircle,
  Play,
} from "lucide-react";

/**
 * Fulfillment Management Page
 * Manage pick, pack, and ship workflows
 */

export default function FulfillmentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: tasks, refetch } = trpc.fulfillment.listTasks.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    search: searchQuery || undefined,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_progress":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-600";
      case "in_progress":
        return "bg-blue-600";
      case "completed":
        return "bg-green-600";
      case "failed":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pick":
        return <Box className="w-4 h-4" />;
      case "pack":
        return <Package className="w-4 h-4" />;
      case "ship":
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Fulfillment</h1>
        <p className="text-gray-400 mt-1">Manage pick, pack, and ship operations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending Tasks</p>
              <p className="text-2xl font-bold text-white">
                {tasks?.filter((t) => t.status === "pending").length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-white">
                {tasks?.filter((t) => t.status === "in_progress").length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Completed Today</p>
              <p className="text-2xl font-bold text-white">
                {tasks?.filter((t) => t.status === "completed").length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Failed Tasks</p>
              <p className="text-2xl font-bold text-white">
                {tasks?.filter((t) => t.status === "failed").length || 0}
              </p>
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
              placeholder="Search by order number, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pick">Pick Tasks</SelectItem>
              <SelectItem value="pack">Pack Tasks</SelectItem>
              <SelectItem value="ship">Ship Tasks</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tasks Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
              <TableHead className="text-gray-400">Task ID</TableHead>
              <TableHead className="text-gray-400">Type</TableHead>
              <TableHead className="text-gray-400">Order</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Assigned To</TableHead>
              <TableHead className="text-gray-400">Priority</TableHead>
              <TableHead className="text-gray-400">Created</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task) => (
              <TableRow key={task.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-mono text-sm text-gray-300">
                  {task.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(task.type)}
                    <Badge className="bg-purple-600">{task.type}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-white font-medium">#{task.orderId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{task.assignedTo || "Unassigned"}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      task.priority === "high"
                        ? "bg-red-600"
                        : task.priority === "medium"
                          ? "bg-yellow-600"
                          : "bg-gray-600"
                    }
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-400">
                  {new Date(task.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!tasks || tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  No fulfillment tasks found
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {/* Workflow Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pick Tasks</h3>
              <p className="text-sm text-gray-400">Warehouse picking operations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "pick" && t.status === "pending").length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">In Progress</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "pick" && t.status === "in_progress").length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "pick" && t.status === "completed").length || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pack Tasks</h3>
              <p className="text-sm text-gray-400">Order packing operations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "pack" && t.status === "pending").length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">In Progress</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "pack" && t.status === "in_progress").length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "pack" && t.status === "completed").length || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ship Tasks</h3>
              <p className="text-sm text-gray-400">Shipping and delivery</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "ship" && t.status === "pending").length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">In Progress</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "ship" && t.status === "in_progress").length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="text-white font-medium">
                {tasks?.filter((t) => t.type === "ship" && t.status === "completed").length || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
