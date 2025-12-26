import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Package,
  Printer,
  CheckCircle,
  Scan,
  Box,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Warehouse Packer Mobile Interface
 * Mobile-first UI for pack task execution
 */

export default function PackerPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [scanInput, setScanInput] = useState("");
  const [activeTask, setActiveTask] = useState<any>(null);
  const [scannedItems, setScannedItems] = useState<string[]>([]);

  const { data: warehouses } = trpc.warehouses.list.useQuery();
  const { data: tasks, refetch: refetchTasks } = trpc.fulfillment.tasks.useQuery({
    warehouseId: selectedWarehouse || undefined,
    taskType: "pack",
    status: "pending",
    limit: 20,
  });

  const updateTaskMutation = trpc.fulfillment.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      refetchTasks();
      setActiveTask(null);
      setScannedItems([]);
      setScanInput("");
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const handleStartTask = (task: any) => {
    setActiveTask(task);
    setScannedItems([]);
    updateTaskMutation.mutate({
      id: task.id,
      status: "in_progress",
    });
  };

  const handleScanItem = () => {
    if (!scanInput.trim()) {
      toast.error("Please scan or enter an item code");
      return;
    }

    setScannedItems([...scannedItems, scanInput]);
    toast.success(`Scanned: ${scanInput}`);
    setScanInput("");
  };

  const handlePrintLabel = () => {
    toast.success("Printing shipping label...");
    // In production, trigger actual label printing
  };

  const handleCompleteTask = () => {
    if (!activeTask) return;

    if (scannedItems.length === 0) {
      toast.error("Please scan at least one item before completing");
      return;
    }

    updateTaskMutation.mutate({
      id: activeTask.id,
      status: "completed",
      metadata: {
        scannedItems,
        completedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-bold">Packer Dashboard</h1>
        <p className="text-sm text-green-100">
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
                className="p-4 cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => setSelectedWarehouse(warehouse.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="w-6 h-6 text-green-600" />
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
          <Card className="p-6 mb-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Box className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-lg">Active Pack Task</p>
                <p className="text-sm text-gray-600">Order #{activeTask.orderId}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Scan Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Scan Item
                </label>
                <div className="flex gap-2">
                  <Input
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan or enter item code"
                    className="text-lg h-12"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleScanItem();
                      }
                    }}
                  />
                  <Button
                    size="lg"
                    onClick={handleScanItem}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Scan className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Scanned Items */}
              {scannedItems.length > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">
                    Scanned Items ({scannedItems.length})
                  </p>
                  <div className="space-y-2">
                    {scannedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm font-mono">{item}</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Print Label Button */}
              <Button
                size="lg"
                variant="outline"
                onClick={handlePrintLabel}
                className="w-full h-14 border-green-600 text-green-600 hover:bg-green-50"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print Shipping Label
              </Button>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setActiveTask(null);
                    setScannedItems([]);
                  }}
                  className="h-14"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleCompleteTask}
                  className="bg-green-600 hover:bg-green-700 h-14"
                  disabled={updateTaskMutation.isPending || scannedItems.length === 0}
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
            <h2 className="text-lg font-semibold">Pending Pack Tasks</h2>
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
              <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending pack tasks</p>
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
                        task.priority > 5 ? "bg-red-100" : "bg-green-100"
                      }`}>
                        <Package className={`w-6 h-6 ${
                          task.priority > 5 ? "text-red-600" : "text-green-600"
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex-1" onClick={refetchTasks}>
            <Package className="w-5 h-5 mr-2" />
            Tasks
          </Button>
          <Button variant="ghost" className="flex-1" onClick={handlePrintLabel}>
            <Printer className="w-5 h-5 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
