import { X, Download, RefreshCw, WifiOff, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInstallPrompt, useUpdateNotification, useOfflineIndicator } from '@/hooks/usePWA';

// Install prompt banner
export function InstallPromptBanner() {
  const { showBanner, handleInstall, handleDismiss } = useInstallPrompt();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom">
      <Card className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 text-white shadow-2xl">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">
                Install Live Shopping Network
              </h3>
              <p className="text-sm text-white/90 mb-3">
                Install our app for faster access, offline support, and push notifications!
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Not now
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Update notification
export function UpdateNotification() {
  const { showNotification, handleUpdate, handleDismiss } = useUpdateNotification();

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-top">
      <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 border-0 text-white shadow-2xl">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">
                Update Available
              </h3>
              <p className="text-sm text-white/90 mb-3">
                A new version of the app is available. Update now to get the latest features!
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-white/90"
                >
                  Update Now
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Later
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Offline indicator
export function OfflineIndicator() {
  const { showIndicator, isOnline, message } = useOfflineIndicator();

  if (!showIndicator) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
      <Card className={`${
        isOnline 
          ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
          : 'bg-gradient-to-r from-orange-600 to-red-600'
      } border-0 text-white shadow-2xl`}>
        <div className="px-4 py-2 flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
      </Card>
    </div>
  );
}

// Combined PWA UI wrapper
export function PWAComponents() {
  return (
    <>
      <InstallPromptBanner />
      <UpdateNotification />
      <OfflineIndicator />
    </>
  );
}
