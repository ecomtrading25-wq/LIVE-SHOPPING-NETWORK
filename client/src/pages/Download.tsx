import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Zap,
  Bell,
  ShoppingBag,
  Video,
  Star,
  Download as DownloadIcon,
  Apple,
  PlayCircle,
  QrCode,
  Check,
} from "lucide-react";

/**
 * Mobile App Landing Page
 * App store badges, features, QR code download
 */

export default function DownloadPage() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for mobile with instant loading and smooth scrolling",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get instant alerts for live shows, deals, and order updates",
    },
    {
      icon: Video,
      title: "Live Shopping",
      description: "Watch live shows, chat with hosts, and shop in real-time",
    },
    {
      icon: ShoppingBag,
      title: "One-Tap Checkout",
      description: "Save payment methods and addresses for ultra-fast checkout",
    },
    {
      icon: Star,
      title: "Exclusive Deals",
      description: "App-only discounts and early access to new products",
    },
    {
      icon: Bell,
      title: "Order Tracking",
      description: "Real-time shipment tracking with delivery notifications",
    },
  ];

  const stats = [
    { value: "4.8", label: "App Store Rating", icon: Star },
    { value: "100K+", label: "Downloads", icon: DownloadIcon },
    { value: "50K+", label: "Active Users", icon: Smartphone },
  ];

  const benefits = [
    "Faster checkout with saved payment methods",
    "Push notifications for live shows and deals",
    "Offline browsing and wishlist sync",
    "Exclusive app-only discounts",
    "Biometric authentication for secure login",
    "Augmented reality product preview",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-zinc-900 to-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <Badge className="bg-purple-600 mb-4">
              <Smartphone className="w-4 h-4 mr-2" />
              Download Our App
            </Badge>
            <h1 className="text-6xl font-bold text-white mb-6">
              Shop Live,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Anywhere
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Experience the future of live shopping with our mobile app. Watch live
              shows, chat with hosts, and get exclusive deals—all from your phone.
            </p>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                className="bg-black hover:bg-gray-900 text-white h-16 px-8 text-lg"
              >
                <Apple className="w-8 h-8 mr-3" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>

              <Button
                size="lg"
                className="bg-black hover:bg-gray-900 text-white h-16 px-8 text-lg"
              >
                <PlayCircle className="w-8 h-8 mr-3" />
                <div className="text-left">
                  <div className="text-xs">GET IT ON</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-5 h-5 text-purple-400" />
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone Mockup & QR Code */}
          <div className="relative">
            {/* Phone Frame */}
            <div className="relative mx-auto w-80 h-[640px] bg-zinc-900 rounded-[3rem] border-8 border-zinc-800 shadow-2xl overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-zinc-950 rounded-b-3xl z-10"></div>
              
              {/* Screen Content - Homepage Preview */}
              <div className="w-full h-full bg-gradient-to-br from-purple-900 via-zinc-900 to-black overflow-hidden">
                {/* Mini Header */}
                <div className="px-6 py-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
                    <span className="text-white font-bold text-sm">LSN</span>
                  </div>
                  <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>
                </div>

                {/* Mini Video Player */}
                <div className="px-6 mb-4">
                  <div className="aspect-video bg-zinc-800 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-pink-600/50"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-600 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-white/80 rounded w-24 mb-1"></div>
                            <div className="h-2 bg-white/60 rounded w-16"></div>
                          </div>
                          <div className="px-3 py-1 bg-purple-600 rounded text-white text-xs font-bold">
                            BUY
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Product Grid */}
                <div className="px-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-zinc-800 rounded-xl p-3">
                        <div className="aspect-square bg-zinc-700 rounded-lg mb-2"></div>
                        <div className="h-2 bg-zinc-700 rounded w-full mb-1"></div>
                        <div className="h-2 bg-zinc-700 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <Card className="absolute -right-8 top-1/2 transform -translate-y-1/2 p-6 bg-white shadow-2xl hidden lg:block">
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto mb-3 text-zinc-900" />
                <p className="text-sm font-medium text-zinc-900">Scan to Download</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need in One App
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Designed for the ultimate live shopping experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 bg-zinc-900/50 border-zinc-800 hover:border-purple-500 transition-all">
              <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Choose Our Mobile App?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Get the best shopping experience with features designed exclusively
                for mobile users.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-white text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block p-8 bg-white rounded-3xl shadow-2xl">
                <QrCode className="w-64 h-64 text-zinc-900" />
                <p className="text-zinc-900 font-bold text-xl mt-4">
                  Scan to Download Now
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of shoppers already enjoying the best live shopping
            experience on mobile.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-black hover:bg-gray-900 text-white h-16 px-8 text-lg"
            >
              <Apple className="w-8 h-8 mr-3" />
              <div className="text-left">
                <div className="text-xs">Download on the</div>
                <div className="font-bold">App Store</div>
              </div>
            </Button>

            <Button
              size="lg"
              className="bg-black hover:bg-gray-900 text-white h-16 px-8 text-lg"
            >
              <PlayCircle className="w-8 h-8 mr-3" />
              <div className="text-left">
                <div className="text-xs">GET IT ON</div>
                <div className="font-bold">Google Play</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
