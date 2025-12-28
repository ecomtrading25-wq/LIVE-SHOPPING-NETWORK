import { useState, useEffect, useCallback } from 'react';
import { pwaManager, pushManager, syncManager, type ServiceWorkerState } from '@/lib/pwa';

export interface UsePWAReturn {
  // Service Worker state
  state: ServiceWorkerState;
  isOnline: boolean;
  
  // Installation
  isInstallable: boolean;
  isInstalled: boolean;
  showInstallPrompt: () => Promise<'accepted' | 'dismissed' | null>;
  
  // Updates
  isUpdateAvailable: boolean;
  updateServiceWorker: () => Promise<void>;
  
  // Push Notifications
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  subscribeToPush: (vapidKey: string) => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;
  
  // Background Sync
  registerSync: (tag: string) => Promise<void>;
  
  // Cache management
  cacheSize: number;
  clearCaches: () => Promise<void>;
  refreshCacheSize: () => Promise<void>;
}

export function usePWA(): UsePWAReturn {
  const [state, setState] = useState<ServiceWorkerState>(pwaManager.getState());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [cacheSize, setCacheSize] = useState(0);

  // Update state
  const updateState = useCallback(() => {
    setState(pwaManager.getState());
  }, []);

  // Update cache size
  const refreshCacheSize = useCallback(async () => {
    const size = await pwaManager.getCacheSize();
    setCacheSize(size);
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    pwaManager.on('online', handleOnline);
    pwaManager.on('offline', handleOffline);

    // Installable listener
    const handleInstallable = (installable: boolean) => {
      setIsInstallable(installable);
    };

    pwaManager.on('installable', handleInstallable);

    // Installed listener
    const handleInstalled = () => {
      setIsInstallable(false);
    };

    pwaManager.on('installed', handleInstalled);

    // Update available listener
    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true);
      updateState();
    };

    pwaManager.on('updateAvailable', handleUpdateAvailable);

    // Controller change listener
    const handleControllerChange = () => {
      updateState();
    };

    pwaManager.on('controllerChange', handleControllerChange);

    // Initial state
    setIsInstallable(pwaManager.isInstallable());
    updateState();
    refreshCacheSize();

    // Cleanup
    return () => {
      pwaManager.off('online', handleOnline);
      pwaManager.off('offline', handleOffline);
      pwaManager.off('installable', handleInstallable);
      pwaManager.off('installed', handleInstalled);
      pwaManager.off('updateAvailable', handleUpdateAvailable);
      pwaManager.off('controllerChange', handleControllerChange);
    };
  }, [updateState, refreshCacheSize]);

  // Show install prompt
  const showInstallPrompt = useCallback(async () => {
    const result = await pwaManager.showInstallPrompt();
    if (result === 'accepted') {
      setIsInstallable(false);
    }
    return result;
  }, []);

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    await pwaManager.skipWaiting();
    setIsUpdateAvailable(false);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    const permission = await pushManager.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (vapidKey: string) => {
    return await pushManager.subscribe(vapidKey);
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    return await pushManager.unsubscribe();
  }, []);

  // Register background sync
  const registerSync = useCallback(async (tag: string) => {
    await syncManager.register(tag);
  }, []);

  // Clear caches
  const clearCaches = useCallback(async () => {
    await pwaManager.clearCaches();
    await refreshCacheSize();
  }, [refreshCacheSize]);

  return {
    state,
    isOnline,
    isInstallable,
    isInstalled: pwaManager.isInstalled(),
    showInstallPrompt,
    isUpdateAvailable,
    updateServiceWorker,
    notificationPermission,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    registerSync,
    cacheSize,
    clearCaches,
    refreshCacheSize
  };
}

// Hook for install prompt banner
export function useInstallPrompt() {
  const { isInstallable, showInstallPrompt, isInstalled } = usePWA();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner if installable and not dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (isInstallable && !dismissed && !isInstalled) {
      setShowBanner(true);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = useCallback(async () => {
    const result = await showInstallPrompt();
    if (result) {
      setShowBanner(false);
    }
  }, [showInstallPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  return {
    showBanner,
    handleInstall,
    handleDismiss
  };
}

// Hook for update notification
export function useUpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowNotification(true);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = useCallback(async () => {
    await updateServiceWorker();
    setShowNotification(false);
  }, [updateServiceWorker]);

  const handleDismiss = useCallback(() => {
    setShowNotification(false);
  }, []);

  return {
    showNotification,
    handleUpdate,
    handleDismiss
  };
}

// Hook for offline indicator
export function useOfflineIndicator() {
  const { isOnline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "Back online" message briefly
      setShowIndicator(true);
      const timer = setTimeout(() => {
        setShowIndicator(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return {
    showIndicator,
    isOnline,
    message: isOnline ? 'Back online' : 'You are offline'
  };
}
