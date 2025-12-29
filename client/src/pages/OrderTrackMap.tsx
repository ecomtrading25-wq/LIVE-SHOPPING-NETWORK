import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
} from "lucide-react";
import { MapView } from "@/components/Map";

/**
 * Order Tracking Map
 * Real-time delivery visualization with Google Maps, driver location, route, ETA predictions
 */

interface DeliveryMilestone {
  id: string;
  status: "completed" | "current" | "pending";
  title: string;
  description: string;
  timestamp?: string;
  location?: string;
}

interface DriverInfo {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  photo: string;
}

export default function OrderTrackMapPage() {
  const params = useParams();
  const orderId = params.orderId || "ORD-12345";
  
  const [eta, setEta] = useState("25 mins");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock order data
  const orderData = {
    orderId: orderId,
    status: "out_for_delivery",
    estimatedDelivery: "Today, 3:45 PM",
    currentLocation: { lat: 37.7749, lng: -122.4194 },
    destination: { lat: 37.7849, lng: -122.4094 },
    warehouse: { lat: 37.7649, lng: -122.4294 },
  };

  // Mock driver info
  const driver: DriverInfo = {
    name: "Michael Chen",
    phone: "+1 (555) 123-4567",
    vehicle: "White Toyota Camry - ABC 1234",
    rating: 4.9,
    photo: "/placeholder-driver.jpg",
  };

  // Mock delivery milestones
  const milestones: DeliveryMilestone[] = [
    {
      id: "1",
      status: "completed",
      title: "Order Confirmed",
      description: "Your order has been confirmed and is being prepared",
      timestamp: "2025-12-27T10:00:00Z",
      location: "Live Shopping Network Warehouse",
    },
    {
      id: "2",
      status: "completed",
      title: "Picked Up",
      description: "Package picked up by delivery driver",
      timestamp: "2025-12-27T14:00:00Z",
      location: "San Francisco Distribution Center",
    },
    {
      id: "3",
      status: "current",
      title: "Out for Delivery",
      description: "Your package is on the way",
      timestamp: "2025-12-27T15:30:00Z",
      location: "Mission District",
    },
    {
      id: "4",
      status: "pending",
      title: "Delivered",
      description: "Package delivered to your address",
      location: "123 Market St, San Francisco, CA",
    },
  ];

  // Simulate ETA updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In real implementation, fetch updated location from backend
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleMapReady = (map: google.maps.Map) => {
    // Initialize Google Maps services
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#8B5CF6",
        strokeWeight: 4,
      },
    });

    // Add markers for warehouse, current location, and destination
    new google.maps.Marker({
      position: orderData.warehouse,
      map: map,
      title: "Warehouse",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3B82F6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    new google.maps.Marker({
      position: orderData.currentLocation,
      map: map,
      title: "Driver Location",
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#10B981",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        rotation: 45,
      },
    });

    new google.maps.Marker({
      position: orderData.destination,
      map: map,
      title: "Delivery Address",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#EF4444",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    // Draw route from current location to destination
    directionsService.route(
      {
        origin: orderData.currentLocation,
        destination: orderData.destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );

    // Fit bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(orderData.warehouse);
    bounds.extend(orderData.currentLocation);
    bounds.extend(orderData.destination);
    map.fitBounds(bounds);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
              <p className="text-muted-foreground">Order #{orderId}</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
              <Truck className="w-5 h-5 mr-2" />
              Out for Delivery
            </Badge>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Live Tracking</h2>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="text-2xl font-bold text-green-500">{eta}</p>
                </div>
              </div>

              <div className="h-[500px] rounded-lg overflow-hidden border">
                <MapView
                  onMapReady={handleMapReady}
                  defaultCenter={orderData.currentLocation}
                  defaultZoom={13}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
                <Button variant="outline" size="sm">
                  <Navigation className="w-4 h-4 mr-2" />
                  Refresh Location
                </Button>
              </div>
            </Card>

            {/* Delivery Milestones */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Progress</h2>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          milestone.status === "completed"
                            ? "bg-green-500"
                            : milestone.status === "current"
                            ? "bg-blue-500 animate-pulse"
                            : "bg-gray-500"
                        }`}
                      >
                        {milestone.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-foreground" />
                        ) : milestone.status === "current" ? (
                          <Truck className="w-5 h-5 text-foreground" />
                        ) : (
                          <Package className="w-5 h-5 text-foreground" />
                        )}
                      </div>
                      {index < milestones.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${
                            milestone.status === "completed" ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <h3 className="font-bold mb-1">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {milestone.description}
                      </p>
                      {milestone.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(milestone.timestamp).toLocaleString()}
                        </p>
                      )}
                      {milestone.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{milestone.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Your Driver</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex-shrink-0" />
                <div>
                  <h3 className="font-bold">{driver.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>⭐ {driver.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{driver.vehicle}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Driver
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Driver
                </Button>
              </div>
            </Card>

            {/* Delivery Details */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Delivery Address</p>
                  <p className="font-medium">123 Market St, Apt 4B</p>
                  <p className="font-medium">San Francisco, CA 94103</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Estimated Delivery</p>
                  <p className="font-medium">{orderData.estimatedDelivery}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Delivery Instructions</p>
                  <p className="font-medium">Leave at door, ring doorbell</p>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-3">
                {[
                  { name: "Wireless Headphones Pro", qty: 1, price: 299.99 },
                  { name: "Portable Charger 20K", qty: 2, price: 49.99 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <p className="font-bold">${item.price}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Help */}
            <Card className="p-6 bg-blue-500/10 border-blue-500/20">
              <h2 className="text-xl font-bold text-blue-500 mb-2">Need Help?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team if you have any questions about your delivery.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
