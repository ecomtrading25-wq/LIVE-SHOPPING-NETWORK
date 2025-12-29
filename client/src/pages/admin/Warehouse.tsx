import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Grid,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Warehouse Zones & Bins Management
 * Configure warehouse layout, zones, and bin locations
 */

export default function WarehousePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [newWarehouseOpen, setNewWarehouseOpen] = useState(false);
  const [newZoneOpen, setNewZoneOpen] = useState(false);
  const [newBinOpen, setNewBinOpen] = useState(false);

  const { data: warehouses, refetch: refetchWarehouses } =
    trpc.warehouses.list.useQuery();
  const { data: zones, refetch: refetchZones } = trpc.warehouses.zones.useQuery({
    warehouseId: selectedWarehouse || undefined,
  });
  const { data: bins, refetch: refetchBins } = trpc.warehouses.bins.useQuery({
    warehouseId: selectedWarehouse || undefined,
    search: searchQuery || undefined,
  });

  const createWarehouseMutation = trpc.warehouses.create.useMutation({
    onSuccess: () => {
      toast.success("Warehouse created successfully");
      refetchWarehouses();
      setNewWarehouseOpen(false);
    },
  });

  const createZoneMutation = trpc.warehouses.createZone.useMutation({
    onSuccess: () => {
      toast.success("Zone created successfully");
      refetchZones();
      setNewZoneOpen(false);
    },
  });

  const createBinMutation = trpc.warehouses.createBin.useMutation({
    onSuccess: () => {
      toast.success("Bin created successfully");
      refetchBins();
      setNewBinOpen(false);
    },
  });

  const handleCreateWarehouse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createWarehouseMutation.mutate({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      country: formData.get("country") as string,
    });
  };

  const handleCreateZone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createZoneMutation.mutate({
      warehouseId: selectedWarehouse,
      name: formData.get("name") as string,
      type: formData.get("type") as "pick" | "pack" | "storage" | "receiving",
      capacity: parseInt(formData.get("capacity") as string),
    });
  };

  const handleCreateBin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createBinMutation.mutate({
      warehouseId: selectedWarehouse,
      zoneId: formData.get("zoneId") as string,
      code: formData.get("code") as string,
      aisle: formData.get("aisle") as string,
      shelf: formData.get("shelf") as string,
      position: formData.get("position") as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouse Management</h1>
          <p className="text-gray-400 mt-1">Configure zones, bins, and layouts</p>
        </div>
        <Dialog open={newWarehouseOpen} onOpenChange={setNewWarehouseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              New Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Warehouse</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Name</label>
                <Input name="name" required className="bg-card border-zinc-700 text-card-foreground" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Address</label>
                <Input name="address" required className="bg-card border-zinc-700 text-card-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">City</label>
                  <Input name="city" required className="bg-card border-zinc-700 text-card-foreground" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">State</label>
                  <Input name="state" required className="bg-card border-zinc-700 text-card-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ZIP</label>
                  <Input name="zip" required className="bg-card border-zinc-700 text-card-foreground" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Country</label>
                  <Input name="country" required className="bg-card border-zinc-700 text-card-foreground" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Warehouse
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warehouse Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses?.map((warehouse) => (
          <Card
            key={warehouse.id}
            className={`p-6 cursor-pointer transition-all ${
              selectedWarehouse === warehouse.id
                ? "bg-red-600 border-red-500"
                : "bg-background text-foreground border-border hover:bg-card"
            }`}
            onClick={() => setSelectedWarehouse(warehouse.id)}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedWarehouse === warehouse.id
                    ? "bg-background text-foreground/20"
                    : "bg-red-500/20"
                }`}
              >
                <WarehouseIcon
                  className={`w-6 h-6 ${
                    selectedWarehouse === warehouse.id
                      ? "text-foreground"
                      : "text-red-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{warehouse.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{warehouse.address}</p>
                <p className="text-sm text-gray-400">
                  {warehouse.city}, {warehouse.state}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedWarehouse && (
        <>
          {/* Zones Section */}
          <Card className="p-6 bg-background border-border text-foreground">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Zones</h2>
              <Dialog open={newZoneOpen} onOpenChange={setNewZoneOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    New Zone
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border text-foreground">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Create Zone</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateZone} className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Name</label>
                      <Input
                        name="name"
                        required
                        placeholder="e.g., Pick Zone A"
                        className="bg-card border-zinc-700 text-card-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Type</label>
                      <select
                        name="type"
                        required
                        className="w-full px-3 py-2 bg-card border border-zinc-700 rounded-md text-foreground"
                      >
                        <option value="pick">Pick Zone</option>
                        <option value="pack">Pack Zone</option>
                        <option value="storage">Storage Zone</option>
                        <option value="receiving">Receiving Zone</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Capacity
                      </label>
                      <Input
                        name="capacity"
                        type="number"
                        required
                        placeholder="100"
                        className="bg-card border-zinc-700 text-card-foreground"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Zone
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {zones?.map((zone) => (
                <Card key={zone.id} className="p-4 bg-card border-zinc-700 text-card-foreground">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Grid className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{zone.name}</h4>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {zone.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Capacity: {zone.capacity}
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Bins Section */}
          <Card className="p-6 bg-background border-border text-foreground">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Bins</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search bins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card border-zinc-700 text-card-foreground"
                  />
                </div>
                <Dialog open={newBinOpen} onOpenChange={setNewBinOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      New Bin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Create Bin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateBin} className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Zone</label>
                        <select
                          name="zoneId"
                          required
                          className="w-full px-3 py-2 bg-card border border-zinc-700 rounded-md text-foreground"
                        >
                          {zones?.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Bin Code
                        </label>
                        <Input
                          name="code"
                          required
                          placeholder="A1-001"
                          className="bg-card border-zinc-700 text-card-foreground"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Aisle
                          </label>
                          <Input
                            name="aisle"
                            required
                            placeholder="A"
                            className="bg-card border-zinc-700 text-card-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Shelf
                          </label>
                          <Input
                            name="shelf"
                            required
                            placeholder="1"
                            className="bg-card border-zinc-700 text-card-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Position
                          </label>
                          <Input
                            name="position"
                            required
                            placeholder="001"
                            className="bg-card border-zinc-700 text-card-foreground"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        Create Bin
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Bin Code
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Zone
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bins?.map((bin) => (
                    <tr key={bin.id} className="border-b border-border">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span className="font-mono text-foreground">{bin.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{bin.zoneName}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {bin.aisle}-{bin.shelf}-{bin.position}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={bin.status === "active" ? "default" : "secondary"}
                        >
                          {bin.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
