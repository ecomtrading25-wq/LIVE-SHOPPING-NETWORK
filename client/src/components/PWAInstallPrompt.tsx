import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download } from "lucide-react";

/**
 * PWA Install Prompt Component
 * Shows install banner for Progressive Web App
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show if user previously dismissed
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 bg-white dark:bg-background shadow-2xl border-2 border-purple-600 text-foreground">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-zinc-100 dark:hover:bg-card rounded-full transition-colors text-card-foreground"
        >
          <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-foreground" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-zinc-900 dark:text-foreground mb-1">
              Install Live Shopping Network
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Get instant access with one tap. Works offline and loads faster!
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 h-10 bg-purple-600 hover:bg-purple-700"
              >
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="h-10"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Fast Loading
              </div>
            </div>
            <div>
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Home Screen
              </div>
            </div>
            <div>
              <div className="text-2xl mb-1">🔔</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Push Alerts
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
