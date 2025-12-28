import { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

export default function OrderTrackingPage() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Fetch user orders
  const { data: orders, refetch } = trpc.orders.getUserOrders.useQuery();

  // Fetch tracking details
  const { data: trackingDetails, isLoading: trackingLoading } = trpc.orders.getTrackingDetails.useQuery(
    { orderId: selectedOrder || '' },
    { enabled: !!selectedOrder }
  );

  // Track by number mutation
  const trackByNumber = trpc.orders.trackByNumber.useMutation({
    onSuccess: (data) => {
      setSelectedOrder(data.orderId);
      toast({ title: 'Order found!' });
    },
    onError: () => {
      toast({ title: 'Order not found', description: 'Please check your tracking number', variant: 'destructive' });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Package className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusProgress = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 25;
      case 'processing':
        return 50;
      case 'shipped':
        return 75;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400';
      case 'delivered':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-purple-900">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Order Tracking</h1>
          <p className="text-gray-300">Track your orders in real-time</p>
        </div>

        {/* Quick Track by Number */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="tracking-number" className="text-white">
                  Track by Order Number
                </Label>
                <Input
                  id="tracking-number"
                  placeholder="Enter your order or tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <Button
                onClick={() => trackByNumber.mutate({ trackingNumber })}
                disabled={!trackingNumber || trackByNumber.isPending}
                className="mt-6"
              >
                Track Order
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur border-white/20">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="all">All Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {orders?.filter((order) => !['delivered', 'cancelled'].includes(order.status.toLowerCase())).map((order) => (
              <Card
                key={order.id}
                className="bg-white/10 backdrop-blur border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => setSelectedOrder(order.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-xl font-bold text-white">Order #{order.orderNumber}</h3>
                        <p className="text-gray-400 text-sm">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <Progress value={getStatusProgress(order.status)} className="mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Amount</p>
                      <p className="text-white font-semibold">${order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Items</p>
                      <p className="text-white font-semibold">{order.itemCount} items</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Estimated Delivery</p>
                      <p className="text-white font-semibold">
                        {order.estimatedDelivery
                          ? new Date(order.estimatedDelivery).toLocaleDateString()
                          : 'TBD'}
                      </p>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Tracking:</span>
                      <span className="text-white font-mono">{order.trackingNumber}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            {orders?.filter((order) => order.status.toLowerCase() === 'delivered').map((order) => (
              <Card
                key={order.id}
                className="bg-white/10 backdrop-blur border-white/20"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <h3 className="text-xl font-bold text-white">Order #{order.orderNumber}</h3>
                        <p className="text-gray-400 text-sm">
                          Delivered on {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                      <Button variant="outline" size="sm">
                        Reorder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {orders?.map((order) => (
              <Card
                key={order.id}
                className="bg-white/10 backdrop-blur border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => setSelectedOrder(order.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-xl font-bold text-white">Order #{order.orderNumber}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Detailed Tracking View */}
        {selectedOrder && trackingDetails && (
          <Card className="bg-white/10 backdrop-blur border-white/20 mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Tracking Details</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shipment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Shipping Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Delivery Address</p>
                        <p className="text-white">{trackingDetails.shippingAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Contact</p>
                        <p className="text-white">{trackingDetails.contactPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Carrier Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-400">Carrier</p>
                      <p className="text-white">{trackingDetails.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Tracking Number</p>
                      <p className="text-white font-mono">{trackingDetails.trackingNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Service Type</p>
                      <p className="text-white">{trackingDetails.serviceType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div>
                <h4 className="font-semibold text-white mb-4">Tracking History</h4>
                <div className="space-y-4">
                  {trackingDetails.events?.map((event: TrackingEvent, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-500'}`} />
                        {index < (trackingDetails.events?.length || 0) - 1 && (
                          <div className="w-0.5 h-full bg-gray-700 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-semibold">{event.status}</p>
                            <p className="text-gray-400 text-sm">{event.description}</p>
                            <p className="text-gray-500 text-xs mt-1">{event.location}</p>
                          </div>
                          <p className="text-gray-400 text-sm">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-white mb-4">Order Items</h4>
                <div className="space-y-3">
                  {trackingDetails.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <img
                        src={item.image || '/placeholder.jpg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-white font-semibold">{item.name}</p>
                        <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-white font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
