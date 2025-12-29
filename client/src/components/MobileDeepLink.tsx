import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Smartphone } from "lucide-react";

/**
 * Mobile Deep Linking System
 * Detects mobile users and prompts app download/open
 */

export default function MobileDeepLink() {
  const [showBanner, setShowBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor;
    const mobile = /android|iphone|ipad|ipod/i.test(userAgent);
    setIsMobile(mobile);

    // Check if banner was dismissed
    const dismissed = localStorage.getItem("app_banner_dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Show banner if mobile and not recently dismissed
    if (mobile && dismissedTime < oneDayAgo) {
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("app_banner_dismissed", Date.now().toString());
  };

  const handleOpenApp = () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    // Try to open app with deep link
    const deepLink = `liveshopping://open${window.location.pathname}`;
    
    if (isIOS) {
      // iOS Universal Links
      window.location.href = deepLink;
      
      // Fallback to App Store after 2 seconds if app not installed
      setTimeout(() => {
        window.location.href = "https://apps.apple.com/app/live-shopping-network/id123456789";
      }, 2000);
    } else if (isAndroid) {
      // Android App Links
      window.location.href = deepLink;
      
      // Fallback to Play Store
      setTimeout(() => {
        window.location.href = "https://play.google.com/store/apps/details?id=com.liveshoppingnetwork";
      }, 2000);
    }
  };

  const handleDownload = () => {
    window.location.href = "/download";
  };

  if (!isMobile || !showBanner) return null;

  return (
    <>
      {/* Top Banner */}
      <Card className="fixed top-0 left-0 right-0 z-50 rounded-none border-b shadow-lg bg-gradient-to-r from-red-600 to-orange-600 text-foreground">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Get the Live Shopping App</p>
                <p className="text-xs text-white/90 truncate">
                  Better experience • Push notifications • Exclusive deals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleOpenApp}
                className="whitespace-nowrap"
              >
                Open App
              </Button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Spacer to prevent content from being hidden */}
      <div className="h-[72px]" />
    </>
  );
}

/**
 * Smart Banner Component (Alternative Design)
 * Shows at bottom of screen
 */
export function MobileSmartBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const mobile = /android|iphone|ipad|ipod/i.test(userAgent);
    setIsMobile(mobile);

    const dismissed = localStorage.getItem("smart_banner_dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    if (mobile && dismissedTime < threeDaysAgo) {
      setTimeout(() => setShowBanner(true), 3000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("smart_banner_dismissed", Date.now().toString());
  };

  const handleInstall = () => {
    window.location.href = "/download";
  };

  if (!isMobile || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/90 to-transparent">
      <Card className="bg-background border-border p-4 text-foreground">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-8 h-8 text-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">Live Shopping Network</p>
            <p className="text-sm text-gray-400">Shop live with exclusive mobile deals</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-red-600 border-2 border-zinc-900" />
                ))}
              </div>
              <span className="text-xs text-gray-400">10K+ users</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-gradient-to-r from-red-600 to-orange-600 whitespace-nowrap"
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-400 hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
