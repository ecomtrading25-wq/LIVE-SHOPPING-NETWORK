import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  MapPin,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  Warehouse,
  Search,
  BarChart3,
  Navigation,
  DollarSign,
} from "lucide-react";

/**
 * Supply Chain Visibility Dashboard
 * Real-time shipment tracking, warehouse heatmaps, carrier analytics, delivery predictions
 */

interface Shipment {
  id: string;
  orderId: string;
  customer: string;
  carrier: string;
  trackingNumber: string;
  status: "in_transit" | "out_for_delivery" | "delivered" | "delayed" | "exception";
  origin: string;
  destination: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  lastUpdate: string;
  currentLocation: string;
  events: ShipmentEvent[];
}

interface ShipmentEvent {
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

interface WarehouseStats {
  id: string;
  name: string;
  location: string;
  totalStock: number;
  capacity: number;
  activeOrders: number;
  avgProcessingTime: number;
  utilizationRate: number;
}

interface CarrierPerformance {
  carrier: string;
  totalShipments: number;
  onTimeRate: number;
  avgTransitTime: number;
  costPerShipment: number;
  exceptionRate: number;
}

export default function SupplyChainPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Mock shipments
  const shipments: Shipment[] = [
    {
      id: "SHP-001",
      orderId: "ORD-12345",
      customer: "Sarah Johnson",
      carrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
      status: "in_transit",
      origin: "Los Angeles, CA",
      destination: "New York, NY",
      estimatedDelivery: "2025-12-29T18:00:00Z",
      lastUpdate: "2025-12-27T14:30:00Z",
      currentLocation: "Chicago, IL",
      events: [
        {
          timestamp: "2025-12-27T14:30:00Z",
          location: "Chicago, IL",
          status: "In Transit",
          description: "Package arrived at UPS facility",
        },
        {
          timestamp: "2025-12-27T08:00:00Z",
          location: "Denver, CO",
          status: "In Transit",
          description: "Package departed facility",
        },
        {
          timestamp: "2025-12-26T20:00:00Z",
          location: "Los Angeles, CA",
          status: "Picked Up",
          description: "Package picked up from warehouse",
        },
      ],
    },
    {
      id: "SHP-002",
      orderId: "ORD-12346",
      customer: "Michael Chen",
      carrier: "FedEx",
      trackingNumber: "7894561230123456",
      status: "out_for_delivery",
      origin: "Seattle, WA",
      destination: "Portland, OR",
      estimatedDelivery: "2025-12-27T17:00:00Z",
      lastUpdate: "2025-12-27T09:00:00Z",
      currentLocation: "Portland, OR",
      events: [
        {
          timestamp: "2025-12-27T09:00:00Z",
          location: "Portland, OR",
          status: "Out for Delivery",
          description: "On FedEx vehicle for delivery",
        },
        {
          timestamp: "2025-12-27T06:00:00Z",
          location: "Portland, OR",
          status: "Arrived",
          description: "Arrived at local FedEx facility",
        },
        {
          timestamp: "2025-12-26T18:00:00Z",
          location: "Seattle, WA",
          status: "Picked Up",
          description: "Package picked up",
        },
      ],
    },
    {
      id: "SHP-003",
      orderId: "ORD-12347",
      customer: "Emily Rodriguez",
      carrier: "DHL",
      trackingNumber: "DHL123456789",
      status: "delayed",
      origin: "Miami, FL",
      destination: "Boston, MA",
      estimatedDelivery: "2025-12-28T18:00:00Z",
      lastUpdate: "2025-12-27T12:00:00Z",
      currentLocation: "Atlanta, GA",
      events: [
        {
          timestamp: "2025-12-27T12:00:00Z",
          location: "Atlanta, GA",
          status: "Delayed",
          description: "Delay due to weather conditions",
        },
        {
          timestamp: "2025-12-27T06:00:00Z",
          location: "Atlanta, GA",
          status: "In Transit",
          description: "Package arrived at sorting facility",
        },
        {
          timestamp: "2025-12-26T14:00:00Z",
          location: "Miami, FL",
          status: "Picked Up",
          description: "Package picked up",
        },
      ],
    },
  ];

  // Mock warehouse stats
  const warehouses: WarehouseStats[] = [
    {
      id: "WH-001",
      name: "West Coast Hub",
      location: "Los Angeles, CA",
      totalStock: 45000,
      capacity: 60000,
      activeOrders: 234,
      avgProcessingTime: 2.3,
      utilizationRate: 75,
    },
    {
      id: "WH-002",
      name: "East Coast Hub",
      location: "New York, NY",
      totalStock: 38000,
      capacity: 50000,
      activeOrders: 189,
      avgProcessingTime: 2.8,
      utilizationRate: 76,
    },
    {
      id: "WH-003",
      name: "Central Hub",
      location: "Chicago, IL",
      totalStock: 52000,
      capacity: 70000,
      activeOrders: 312,
      avgProcessingTime: 2.1,
      utilizationRate: 74,
    },
  ];

  // Mock carrier performance
  const carriers: CarrierPerformance[] = [
    {
      carrier: "UPS",
      totalShipments: 15420,
      onTimeRate: 94.5,
      avgTransitTime: 3.2,
      costPerShipment: 12.45,
      exceptionRate: 2.1,
    },
    {
      carrier: "FedEx",
      totalShipments: 12890,
      onTimeRate: 92.8,
      avgTransitTime: 3.5,
      costPerShipment: 13.20,
      exceptionRate: 3.2,
    },
    {
      carrier: "DHL",
      totalShipments: 8650,
      onTimeRate: 89.3,
      avgTransitTime: 4.1,
      costPerShipment: 15.80,
      exceptionRate: 4.5,
    },
    {
      carrier: "USPS",
      totalShipments: 6420,
      onTimeRate: 87.5,
      avgTransitTime: 4.8,
      costPerShipment: 8.90,
      exceptionRate: 5.8,
    },
  ];

  const filteredShipments = shipments.filter(
    (s) =>
      searchQuery === "" ||
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalShipments = shipments.length;
  const inTransit = shipments.filter((s) => s.status === "in_transit").length;
  const delayed = shipments.filter((s) => s.status === "delayed").length;
  const avgOnTimeRate = carriers.reduce((sum, c) => sum + c.onTimeRate, 0) / carriers.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400";
      case "out_for_delivery":
        return "bg-blue-500/20 text-blue-400";
      case "in_transit":
        return "bg-red-500/20 text-red-400";
      case "delayed":
        return "bg-yellow-500/20 text-yellow-400";
      case "exception":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "out_for_delivery":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "in_transit":
        return <Navigation className="w-5 h-5 text-red-500" />;
      case "delayed":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "exception":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Supply Chain Visibility</h1>
          <p className="text-muted-foreground">
            Real-time tracking, warehouse analytics, and carrier performance
          </p>
        </div>
        <Button>
          <BarChart3 className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Active Shipments</p>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalShipments}</p>
          <p className="text-xs text-green-500">+12% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">In Transit</p>
            <Truck className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{inTransit}</p>
          <p className="text-xs text-muted-foreground">Currently moving</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Delayed</p>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{delayed}</p>
          <p className="text-xs text-yellow-500">Requires attention</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">On-Time Rate</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgOnTimeRate.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+2.3% from last month</p>
        </Card>
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tracking">
            <Navigation className="w-4 h-4 mr-2" />
            Shipment Tracking
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <Warehouse className="w-4 h-4 mr-2" />
            Warehouse Heatmap
          </TabsTrigger>
          <TabsTrigger value="carriers">
            <Truck className="w-4 h-4 mr-2" />
            Carrier Performance
          </TabsTrigger>
        </TabsList>

        {/* Shipment Tracking */}
        <TabsContent value="tracking" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by tracking number, order ID, or customer..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredShipments.map((shipment) => (
                <Card
                  key={shipment.id}
                  className="p-4 cursor-pointer hover:border-primary transition-all"
                  onClick={() => setSelectedShipment(shipment)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(shipment.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{shipment.trackingNumber}</h3>
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order {shipment.orderId} • {shipment.customer}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{shipment.carrier}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Origin</p>
                      <p className="font-medium">{shipment.origin}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Current Location</p>
                      <p className="font-medium">{shipment.currentLocation}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Destination</p>
                      <p className="font-medium">{shipment.destination}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">
                      Last Update: {new Date(shipment.lastUpdate).toLocaleString()}
                    </span>
                  </div>

                  {/* Timeline */}
                  {selectedShipment?.id === shipment.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <h4 className="font-bold mb-3">Tracking History</h4>
                      {shipment.events.map((event, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            {index < shipment.events.length - 1 && (
                              <div className="w-0.5 h-full bg-border my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium mb-1">{event.status}</p>
                            <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                              <span>•</span>
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Warehouse Heatmap */}
        <TabsContent value="warehouses">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Warehouse Distribution & Utilization</h2>

            <div className="space-y-4">
              {warehouses.map((warehouse) => (
                <Card key={warehouse.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{warehouse.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {warehouse.location}
                      </p>
                    </div>
                    <Badge
                      className={
                        warehouse.utilizationRate > 80
                          ? "bg-red-500/20 text-red-400"
                          : warehouse.utilizationRate > 60
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    >
                      {warehouse.utilizationRate}% Utilized
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Stock</p>
                      <p className="text-2xl font-bold">{warehouse.totalStock.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                      <p className="text-2xl font-bold">{warehouse.capacity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active Orders</p>
                      <p className="text-2xl font-bold">{warehouse.activeOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Processing</p>
                      <p className="text-2xl font-bold">{warehouse.avgProcessingTime}h</p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Capacity Utilization</span>
                      <span className="font-bold">
                        {warehouse.totalStock} / {warehouse.capacity}
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          warehouse.utilizationRate > 80
                            ? "bg-red-500"
                            : warehouse.utilizationRate > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${warehouse.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Carrier Performance */}
        <TabsContent value="carriers">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Carrier Performance Analytics</h2>

            <div className="space-y-4">
              {carriers.map((carrier) => (
                <Card key={carrier.carrier} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{carrier.carrier}</h3>
                    <Badge variant="outline">{carrier.totalShipments.toLocaleString()} shipments</Badge>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">On-Time Rate</p>
                      <p className={`text-2xl font-bold ${carrier.onTimeRate > 90 ? "text-green-500" : "text-yellow-500"}`}>
                        {carrier.onTimeRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Transit Time</p>
                      <p className="text-2xl font-bold">{carrier.avgTransitTime} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cost/Shipment</p>
                      <p className="text-2xl font-bold text-blue-500">${carrier.costPerShipment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Exception Rate</p>
                      <p className={`text-2xl font-bold ${carrier.exceptionRate < 3 ? "text-green-500" : "text-red-500"}`}>
                        {carrier.exceptionRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                      <p className="text-2xl font-bold">
                        ${(carrier.totalShipments * carrier.costPerShipment / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
