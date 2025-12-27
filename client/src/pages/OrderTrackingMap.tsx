import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, MessageCircle, Package, CheckCircle2, Truck, Home } from 'lucide-react';

interface DeliveryLocation {
  lat: number;
  lng: number;
  label: string;
}

interface OrderTrackingData {
  orderId: string;
  status: 'confirmed' | 'picked_up' | 'out_for_delivery' | 'delivered';
  driver: {
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
    currentLocation: DeliveryLocation;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  estimatedArrival: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  milestones: Array<{
    status: string;
    label: string;
    timestamp?: string;
    completed: boolean;
  }>;
}

export default function OrderTrackingMap() {
  const params = useParams();
  const orderId = params.orderId || 'ORD-001';

  // Mock data - replace with real API call
  const [trackingData] = useState<OrderTrackingData>({
    orderId,
    status: 'out_for_delivery',
    driver: {
      name: 'Michael Chen',
      phone: '+1 (555) 123-4567',
      vehicle: 'White Toyota Camry - ABC 1234',
      rating: 4.9,
      currentLocation: {
        lat: 37.7749,
        lng: -122.4194,
        label: 'Current Location'
      }
    },
    destination: {
      address: '123 Market St, Apt 4B, San Francisco, CA 94103',
      lat: 37.7849,
      lng: -122.4094
    },
    estimatedArrival: 'Today, 3:45 PM',
    items: [
      { name: 'Wireless Headphones Pro', quantity: 1, price: 299.99 },
      { name: 'Portable Charger 20K', quantity: 1, price: 49.99 }
    ],
    milestones: [
      { status: 'confirmed', label: 'Order Confirmed', timestamp: '2:15 PM', completed: true },
      { status: 'picked_up', label: 'Picked Up', timestamp: '2:45 PM', completed: true },
      { status: 'out_for_delivery', label: 'Out for Delivery', timestamp: '3:10 PM', completed: true },
      { status: 'delivered', label: 'Delivered', completed: false }
    ]
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // In production, this would fetch new driver location
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Order Tracking</h1>
            <p className="text-muted-foreground">Order #{orderId}</p>
          </div>
          <Badge className="bg-green-600 text-lg px-4 py-2">
            {trackingData.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Live Map</h2>
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            {/* Map Placeholder - Replace with actual Google Maps integration */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MapPin className="w-16 h-16 text-purple-500 mx-auto" />
                  <div>
                    <div className="font-bold text-lg">Map View</div>
                    <div className="text-sm text-muted-foreground">
                      Driver is {Math.floor(Math.random() * 5 + 1)} miles away
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock route visualization */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1="30%"
                  y1="70%"
                  x2="70%"
                  y2="30%"
                  stroke="#9333ea"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                />
                {/* Driver marker */}
                <circle cx="30%" cy="70%" r="12" fill="#9333ea" />
                {/* Destination marker */}
                <circle cx="70%" cy="30%" r="12" fill="#ec4899" />
              </svg>

              {/* ETA Badge */}
              <div className="absolute top-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3">
                <div className="text-sm text-muted-foreground">Estimated Arrival</div>
                <div className="text-2xl font-bold text-purple-600">{trackingData.estimatedArrival}</div>
              </div>
            </div>

            {/* Delivery Milestones */}
            <div className="mt-6">
              <h3 className="font-bold mb-4">Delivery Progress</h3>
              <div className="space-y-4">
                {trackingData.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{milestone.label}</div>
                      {milestone.timestamp && (
                        <div className="text-sm text-muted-foreground">{milestone.timestamp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Info */}
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Your Driver
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {trackingData.driver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{trackingData.driver.name}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>⭐ {trackingData.driver.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {trackingData.driver.vehicle}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </Card>

            {/* Delivery Details */}
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Delivery Address
              </h3>
              <div className="text-sm space-y-2">
                <p>{trackingData.destination.address}</p>
                <div className="pt-3 border-t">
                  <div className="font-medium mb-1">Estimated Delivery</div>
                  <div className="text-lg font-bold text-purple-600">
                    {trackingData.estimatedArrival}
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h3>
              <div className="space-y-3">
                {trackingData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">${item.price.toFixed(2)}</div>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between font-bold">
                  <span>Total</span>
                  <span>${trackingData.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Contact Support */}
            <Button className="w-full" variant="outline">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
