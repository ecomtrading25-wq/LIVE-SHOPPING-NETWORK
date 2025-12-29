import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Maximize,
  Minimize,
  RotateCw,
  Move,
  Ruler,
  Camera,
  Share2,
  Download,
  Eye,
  Sparkles,
  Box,
  Home,
  User,
} from "lucide-react";
import { toast } from "sonner";

/**
 * AR Product Visualization
 * 3D model viewer, virtual try-on, room placement preview
 */

interface Product {
  id: string;
  name: string;
  price: number;
  category: "furniture" | "fashion" | "accessories" | "decor";
  model3D?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  colors: string[];
  images: string[];
}

export default function ARPreviewPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product>({
    id: "1",
    name: "Modern Leather Sofa",
    price: 1299.99,
    category: "furniture",
    model3D: "/models/sofa.glb",
    dimensions: {
      width: 84,
      height: 32,
      depth: 36,
    },
    colors: ["#8B4513", "#2C2C2C", "#F5F5DC"],
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    ],
  });

  const [viewMode, setViewMode] = useState<"3d" | "ar" | "room">("3d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [showDimensions, setShowDimensions] = useState(true);
  const [arSupported, setArSupported] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Mock products
  const products: Product[] = [
    {
      id: "1",
      name: "Modern Leather Sofa",
      price: 1299.99,
      category: "furniture",
      dimensions: { width: 84, height: 32, depth: 36 },
      colors: ["#8B4513", "#2C2C2C", "#F5F5DC"],
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"],
    },
    {
      id: "2",
      name: "Designer Sunglasses",
      price: 249.99,
      category: "accessories",
      dimensions: { width: 5.5, height: 2, depth: 6 },
      colors: ["#000000", "#8B4513", "#FFD700"],
      images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800"],
    },
    {
      id: "3",
      name: "Minimalist Coffee Table",
      price: 449.99,
      category: "furniture",
      dimensions: { width: 48, height: 18, depth: 24 },
      colors: ["#8B4513", "#2C2C2C", "#FFFFFF"],
      images: ["https://images.unsplash.com/photo-1565191999001-551c187427bb?w=800"],
    },
    {
      id: "4",
      name: "Vintage Leather Jacket",
      price: 399.99,
      category: "fashion",
      colors: ["#000000", "#8B4513", "#2C2C2C"],
      images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"],
    },
  ];

  const handleRotate = () => {
    setRotation(prev => ({ ...prev, y: prev.y + 45 }));
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen && canvasRef.current) {
      canvasRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleARView = () => {
    if (!arSupported) {
      toast.error('AR is not supported on this device');
      return;
    }
    setViewMode('ar');
    toast.success('AR mode activated. Point your camera at a flat surface.');
  };

  const handleTakeSnapshot = () => {
    toast.success('Snapshot saved to gallery');
  };

  const handleShare = () => {
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">AR Product Preview</h1>
          <p className="text-muted-foreground text-lg">Visualize products in 3D, try them virtually, or see them in your space</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D/AR Viewer */}
            <Card className="overflow-hidden bg-white/5 border-white/10">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <TabsList className="bg-white/5">
                    <TabsTrigger value="3d">
                      <Box className="w-4 h-4 mr-2" />
                      3D View
                    </TabsTrigger>
                    <TabsTrigger value="ar">
                      <Eye className="w-4 h-4 mr-2" />
                      AR View
                    </TabsTrigger>
                    <TabsTrigger value="room">
                      <Home className="w-4 h-4 mr-2" />
                      Room Preview
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRotate}>
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleFullscreen}>
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <TabsContent value="3d" className="m-0">
                  <div
                    ref={canvasRef}
                    className="relative bg-gradient-to-br from-gray-900 to-black aspect-[4/3] flex items-center justify-center"
                  >
                    {/* 3D Model Placeholder */}
                    <div className="text-center">
                      <div className="w-64 h-64 mx-auto mb-6 relative">
                        <img
                          src={selectedProduct.images[0]}
                          alt={selectedProduct.name}
                          className="w-full h-full object-contain"
                          style={{
                            transform: `rotateY(${rotation.y}deg) rotateX(${rotation.x}deg)`,
                            transition: 'transform 0.5s ease',
                          }}
                        />
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Interactive 3D Model
                      </Badge>
                    </div>

                    {/* Dimension Overlay */}
                    {showDimensions && selectedProduct.dimensions && (
                      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur p-4 rounded-lg text-foreground">
                        <p className="text-foreground text-sm font-bold mb-2">Dimensions</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Width: {selectedProduct.dimensions.width}"</p>
                          <p>Height: {selectedProduct.dimensions.height}"</p>
                          <p>Depth: {selectedProduct.dimensions.depth}"</p>
                        </div>
                      </div>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute top-4 right-4 space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDimensions(!showDimensions)}
                        className="bg-background/80 backdrop-blur text-foreground"
                      >
                        <Ruler className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTakeSnapshot}
                        className="bg-background/80 backdrop-blur text-foreground"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ar" className="m-0">
                  <div className="relative bg-background aspect-[4/3] flex items-center justify-center text-foreground">
                    {/* AR Camera View Placeholder */}
                    <div className="text-center">
                      <div className="w-32 h-32 border-4 border-dashed border-purple-500 rounded-lg mx-auto mb-6 flex items-center justify-center">
                        <Eye className="w-16 h-16 text-purple-400" />
                      </div>
                      <p className="text-foreground text-lg font-bold mb-2">Point at a flat surface</p>
                      <p className="text-gray-400 text-sm">Move your device to detect surfaces</p>
                    </div>

                    {/* AR Instructions */}
                    <div className="absolute bottom-4 left-0 right-0 px-4">
                      <Card className="p-4 bg-background/80 backdrop-blur border-white/10 text-foreground">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <p className="text-foreground text-sm">Tap on a surface to place the product</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="room" className="m-0">
                  <div className="relative aspect-[4/3]">
                    {/* Room Preview with Product */}
                    <img
                      src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200"
                      alt="Room"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Product Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-1/2 h-auto object-contain opacity-90"
                      />
                    </div>

                    {/* Room Controls */}
                    <div className="absolute bottom-4 left-0 right-0 px-4">
                      <Card className="p-4 bg-background/80 backdrop-blur border-white/10 text-foreground">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Move className="w-5 h-5 text-purple-400" />
                            <p className="text-foreground text-sm">Drag to reposition</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Save Scene
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Product Info */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">{selectedProduct.name}</h2>
                  <p className="text-gray-400 capitalize">{selectedProduct.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-foreground">${selectedProduct.price}</p>
                  <Badge className="bg-green-500/20 text-green-400 mt-2">In Stock</Badge>
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <p className="text-foreground font-medium mb-3">Available Colors</p>
                <div className="flex gap-3">
                  {selectedProduct.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(index)}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        selectedColor === index ? 'border-purple-500 scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Gallery */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">More Products</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full p-3 rounded-lg transition-all ${
                      selectedProduct.id === product.id
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-foreground font-medium text-sm mb-1">{product.name}</p>
                        <p className="text-purple-400 font-bold">${product.price}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* AR Features */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AR Features
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-foreground">
                  <Box className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>360° interactive 3D models</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Eye className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Virtual try-on with face tracking</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Home className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>See products in your actual space</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Ruler className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Real-time dimension overlay</span>
                </li>
                <li className="flex items-start gap-2 text-foreground">
                  <Camera className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Capture and share AR scenes</span>
                </li>
              </ul>
            </Card>

            {/* Device Support */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Device Support</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">AR Supported</span>
                  <Badge className={arSupported ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {arSupported ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">WebXR Compatible</span>
                  <Badge className="bg-green-500/20 text-green-400">Yes</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">3D Models</span>
                  <Badge className="bg-green-500/20 text-green-400">Available</Badge>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use two fingers to rotate the 3D model</li>
                <li>• Pinch to zoom in and out</li>
                <li>• Tap dimensions icon to toggle measurements</li>
                <li>• For best AR experience, use in well-lit areas</li>
                <li>• Move slowly to help AR detect surfaces</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
