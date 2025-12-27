import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Warehouse,
  Package,
  Truck,
  MapPin,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Settings,
  Play,
  Pause,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Order Fulfillment Automation
 * Smart warehouse routing, batch picking, and shipping label generation
 */

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentLoad: number;
  activeOrders: number;
  avgProcessingTime: number;
  efficiency: number;
  zones: string[];
}

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  type: "routing" | "batching" | "priority" | "shipping";
  conditions: string;
  actions: string;
  ordersProcessed: number;
  timeSaved: number;
}

interface BatchPickingTask {
  id: string;
  batchId: string;
  orders: number;
  items: number;
  zone: string;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  estimatedTime: number;
  progress: number;
}

export default function FulfillmentAutomationPage() {
  const [automationEnabled, setAutomationEnabled] = useState(true);

  // Mock warehouses data
  const warehouses: Warehouse[] = [
    {
      id: "wh1",
      name: "West Coast Hub",
      location: "Los Angeles, CA",
      capacity: 10000,
      currentLoad: 7500,
      activeOrders: 342,
      avgProcessingTime: 2.3,
      efficiency: 94,
      zones: ["A", "B", "C", "D"],
    },
    {
      id: "wh2",
      name: "East Coast Hub",
      location: "New York, NY",
      capacity: 8000,
      currentLoad: 5200,
      activeOrders: 267,
      avgProcessingTime: 2.1,
      efficiency: 96,
      zones: ["A", "B", "C"],
    },
    {
      id: "wh3",
      name: "Central Hub",
      location: "Chicago, IL",
      capacity: 12000,
      currentLoad: 8900,
      activeOrders: 423,
      avgProcessingTime: 2.5,
      efficiency: 91,
      zones: ["A", "B", "C", "D", "E"],
    },
  ];

  // Mock automation rules
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Smart Warehouse Routing",
      enabled: true,
      type: "routing",
      conditions: "Order placed within 100 miles of warehouse",
      actions: "Route to nearest warehouse with available capacity",
      ordersProcessed: 1247,
      timeSaved: 18.5,
    },
    {
      id: "2",
      name: "Batch Picking Optimization",
      enabled: true,
      type: "batching",
      conditions: "5+ orders in same zone within 1 hour",
      actions: "Create batch picking task for warehouse staff",
      ordersProcessed: 892,
      timeSaved: 24.3,
    },
    {
      id: "3",
      name: "Priority Order Fast-Track",
      enabled: true,
      type: "priority",
      conditions: "Express shipping or VIP customer",
      actions: "Assign to dedicated picker, skip batching",
      ordersProcessed: 234,
      timeSaved: 12.7,
    },
    {
      id: "4",
      name: "Auto Label Generation",
      enabled: true,
      type: "shipping",
      conditions: "Order packed and ready",
      actions: "Generate shipping label via carrier API",
      ordersProcessed: 2156,
      timeSaved: 32.1,
    },
    {
      id: "5",
      name: "Load Balancing",
      enabled: false,
      type: "routing",
      conditions: "Warehouse load > 80%",
      actions: "Redirect new orders to alternate warehouse",
      ordersProcessed: 156,
      timeSaved: 8.2,
    },
  ]);

  // Mock batch picking tasks
  const batchTasks: BatchPickingTask[] = [
    {
      id: "1",
      batchId: "BATCH-2025-001",
      orders: 12,
      items: 34,
      zone: "A",
      assignedTo: "John Smith",
      status: "in_progress",
      priority: "high",
      estimatedTime: 45,
      progress: 65,
    },
    {
      id: "2",
      batchId: "BATCH-2025-002",
      orders: 8,
      items: 21,
      zone: "B",
      assignedTo: "Sarah Johnson",
      status: "in_progress",
      priority: "medium",
      estimatedTime: 30,
      progress: 40,
    },
    {
      id: "3",
      batchId: "BATCH-2025-003",
      orders: 15,
      items: 47,
      zone: "C",
      assignedTo: "Mike Davis",
      status: "pending",
      priority: "medium",
      estimatedTime: 60,
      progress: 0,
    },
    {
      id: "4",
      batchId: "BATCH-2025-004",
      orders: 6,
      items: 18,
      zone: "D",
      assignedTo: "Emily Chen",
      status: "completed",
      priority: "low",
      estimatedTime: 25,
      progress: 100,
    },
  ];

  const toggleRule = (ruleId: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("Automation rule updated");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: "bg-gray-500/20 text-gray-400",
      medium: "bg-yellow-500/20 text-yellow-400",
      high: "bg-red-500/20 text-red-400",
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Fulfillment Automation</h1>
          <p className="text-gray-400 mt-2">Smart routing, batch picking, and automated workflows</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <Label htmlFor="automation-toggle" className="text-white">
              Automation
            </Label>
            <Switch
              id="automation-toggle"
              checked={automationEnabled}
              onCheckedChange={setAutomationEnabled}
            />
          </div>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configure Rules
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Active Orders</p>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">1,032</p>
          <p className="text-green-400 text-sm mt-1">+12% from yesterday</p>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Avg Processing Time</p>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">2.3h</p>
          <p className="text-green-400 text-sm mt-1">-18% improvement</p>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Automation Rate</p>
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">87%</p>
          <p className="text-green-400 text-sm mt-1">+5% this week</p>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Time Saved Today</p>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">96h</p>
          <p className="text-gray-400 text-sm mt-1">Across all rules</p>
        </Card>
      </div>

      {/* Warehouse Status */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6">Warehouse Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{warehouse.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    {warehouse.location}
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  {warehouse.efficiency}% efficient
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Capacity</span>
                    <span className="text-white text-sm font-medium">
                      {warehouse.currentLoad.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (warehouse.currentLoad / warehouse.capacity) * 100 > 80
                          ? "bg-red-500"
                          : (warehouse.currentLoad / warehouse.capacity) * 100 > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${(warehouse.currentLoad / warehouse.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Active Orders</p>
                    <p className="text-white text-lg font-bold">{warehouse.activeOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Avg Time</p>
                    <p className="text-white text-lg font-bold">{warehouse.avgProcessingTime}h</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Zones</p>
                  <div className="flex gap-2">
                    {warehouse.zones.map((zone) => (
                      <Badge key={zone} className="bg-purple-500/20 text-purple-400">
                        Zone {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Automation Rules */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6">Automation Rules</h2>
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <h3 className="text-lg font-bold text-white">{rule.name}</h3>
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {rule.type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Conditions</p>
                      <p className="text-white text-sm">{rule.conditions}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Actions</p>
                      <p className="text-white text-sm">{rule.actions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">
                        {rule.ordersProcessed.toLocaleString()} orders processed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">
                        {rule.timeSaved}h saved
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit Rule
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Batch Picking Tasks */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6">Batch Picking Tasks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Batch ID</th>
                <th className="text-left p-4 text-gray-400 font-medium">Orders</th>
                <th className="text-left p-4 text-gray-400 font-medium">Items</th>
                <th className="text-left p-4 text-gray-400 font-medium">Zone</th>
                <th className="text-left p-4 text-gray-400 font-medium">Assigned To</th>
                <th className="text-left p-4 text-gray-400 font-medium">Priority</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Progress</th>
                <th className="text-left p-4 text-gray-400 font-medium">Est. Time</th>
              </tr>
            </thead>
            <tbody>
              {batchTasks.map((task) => (
                <tr key={task.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <span className="text-white font-medium">{task.batchId}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{task.orders}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{task.items}</span>
                  </td>
                  <td className="p-4">
                    <Badge className="bg-purple-500/20 text-purple-400">
                      Zone {task.zone}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{task.assignedTo}</span>
                  </td>
                  <td className="p-4">
                    <Badge className={getPriorityBadge(task.priority)}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={`border ${getStatusBadge(task.status)}`}>
                      {task.status === "in_progress" ? "In Progress" : task.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-white/10 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400">{task.estimatedTime} min</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
