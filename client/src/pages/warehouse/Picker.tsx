import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Package,
  MapPin,
  CheckCircle,
  AlertCircle,
  Scan,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Warehouse Picker Mobile Interface
 * Mobile-first UI for pick task execution
 */

export default function PickerPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [scanInput, setScanInput] = useState("");
  const [activeTask, setActiveTask] = useState<any>(null);

  const { data: warehouses } = trpc.warehouses.list.useQuery();
  const { data: tasks, refetch: refetchTasks } = trpc.fulfillment.tasks.useQuery({
    warehouseId: selectedWarehouse || undefined,
    taskType: "pick",
    status: "pending",
    limit: 20,
  });

  const updateTaskMutation = trpc.fulfillment.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      refetchTasks();
      setActiveTask(null);
      setScanInput("");
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const handleStartTask = (task: any) => {
    setActiveTask(task);
    updateTaskMutation.mutate({
      id: task.id,
      status: "in_progress",
    });
  };

  const handleScanBarcode = () => {
    if (!scanInput.trim()) {
      toast.error("Please scan or enter a barcode");
      return;
    }

    // Simulate barcode verification
    toast.success(`Scanned: ${scanInput}`);
    setScanInput("");
    
    // In production, verify against expected SKU/bin
  };

  const handleCompleteTask = () => {
    if (!activeTask) return;

    updateTaskMutation.mutate({
      id: activeTask.id,
      status: "completed",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="bg-red-600 text-foreground p-4 sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-bold">Picker Dashboard</h1>
        <p className="text-sm text-red-100">
          {tasks?.length || 0} pending tasks
        </p>
      </div>

      {/* Warehouse Selector */}
      {!selectedWarehouse && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Select Warehouse</h2>
          <div className="grid gap-3">
            {warehouses?.map((warehouse) => (
              <Card
                key={warehouse.id}
                className="p-4 cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => setSelectedWarehouse(warehouse.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold">{warehouse.name}</p>
                      <p className="text-sm text-gray-500">{warehouse.address}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Task View */}
      {selectedWarehouse && activeTask && (
        <div className="p-4">
          <Card className="p-6 mb-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-8 h-8 text-red-600" />
              <div>
                <p className="font-semibold text-lg">Active Pick Task</p>
                <p className="text-sm text-gray-600">Order #{activeTask.orderId}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Scan Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Scan Barcode
                </label>
                <div className="flex gap-2">
                  <Input
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="text-lg h-12"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleScanBarcode();
                      }
                    }}
                  />
                  <Button
                    size="lg"
                    onClick={handleScanBarcode}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Scan className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Task Details */}
              <div className="bg-background text-foreground rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Task Details:</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Priority:</span>
                    <Badge variant={activeTask.priority > 5 ? "destructive" : "default"}>
                      {activeTask.priority > 5 ? "High" : "Normal"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setActiveTask(null)}
                  className="h-14"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleCompleteTask}
                  className="bg-green-600 hover:bg-green-700 h-14"
                  disabled={updateTaskMutation.isPending}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Task List */}
      {selectedWarehouse && !activeTask && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Pick Tasks</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWarehouse("")}
            >
              Change Warehouse
            </Button>
          </div>

          {!tasks || tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-gray-500">No pending pick tasks</p>
              <p className="text-sm text-gray-400 mt-2">
                Check back later or refresh the page
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleStartTask(task)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        task.priority > 5 ? "bg-red-100" : "bg-red-100"
                      }`}>
                        <Package className={`w-6 h-6 ${
                          task.priority > 5 ? "text-red-600" : "text-red-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Order #{task.orderId}</p>
                        <p className="text-sm text-gray-500">
                          Priority: {task.priority > 5 ? "High" : "Normal"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background text-foreground border-t border-gray-200 p-4 shadow-lg">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex-1" onClick={refetchTasks}>
            <Package className="w-5 h-5 mr-2" />
            Tasks
          </Button>
          <Button variant="ghost" className="flex-1">
            <AlertCircle className="w-5 h-5 mr-2" />
            Help
          </Button>
        </div>
      </div>
    </div>
  );
}
