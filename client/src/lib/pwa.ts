// PWA utilities for service worker registration and management

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.emit('installable', true);
    });

    // Track installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.emit('installed', true);
      console.log('[PWA] App installed successfully');
    });

    // Track online/offline status
    window.addEventListener('online', () => {
      this.emit('online', true);
      this.saveLastOnlineTime();
    });

    window.addEventListener('offline', () => {
      this.emit('online', false);
    });

    // Save last online time
    if (navigator.onLine) {
      this.saveLastOnlineTime();
    }
  }

  private saveLastOnlineTime() {
    try {
      localStorage.setItem('lastOnlineTime', Date.now().toString());
    } catch (error) {
      console.error('[PWA] Failed to save last online time:', error);
    }
  }

  // Register service worker
  async register(scriptUrl: string = '/sw-advanced.js'): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(scriptUrl, {
        scope: '/',
        updateViaCache: 'none'
      });

      this.swRegistration = registration;
      console.log('[PWA] Service worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.emit('updateAvailable', registration);
            console.log('[PWA] Update available');
          }
        });
      });

      // Start periodic update checks (every hour)
      this.startUpdateChecks(registration);

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.emit('controllerChange', true);
        console.log('[PWA] Controller changed, reloading...');
        window.location.reload();
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      return null;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.swRegistration) {
      console.warn('[PWA] No service worker registered');
      return false;
    }

    try {
      const success = await this.swRegistration.unregister();
      if (success) {
        this.swRegistration = null;
        this.stopUpdateChecks();
        console.log('[PWA] Service worker unregistered');
      }
      return success;
    } catch (error) {
      console.error('[PWA] Failed to unregister service worker:', error);
      return false;
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (!this.swRegistration) {
      console.warn('[PWA] No service worker registered');
      return;
    }

    try {
      await this.swRegistration.update();
      console.log('[PWA] Checking for updates...');
    } catch (error) {
      console.error('[PWA] Failed to check for updates:', error);
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (!this.swRegistration?.waiting) {
      console.warn('[PWA] No waiting service worker');
      return;
    }

    this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Start periodic update checks
  private startUpdateChecks(registration: ServiceWorkerRegistration) {
    this.stopUpdateChecks();
    
    this.updateCheckInterval = window.setInterval(() => {
      registration.update().catch((error) => {
        console.error('[PWA] Update check failed:', error);
      });
    }, 60 * 60 * 1000); // Check every hour
  }

  // Stop periodic update checks
  private stopUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  // Show install prompt
  async showInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return null;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      } else {
        console.log('[PWA] User dismissed install prompt');
      }

      this.deferredPrompt = null;
      return outcome;
    } catch (error) {
      console.error('[PWA] Failed to show install prompt:', error);
      return null;
    }
  }

  // Check if app is installable
  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  // Check if app is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Get service worker state
  getState(): ServiceWorkerState {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: this.swRegistration !== null,
      isUpdateAvailable: this.swRegistration?.waiting !== null && this.swRegistration?.waiting !== undefined,
      registration: this.swRegistration
    };
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[PWA] Cache API not supported');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Failed to clear caches:', error);
    }
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }

      return totalSize;
    } catch (error) {
      console.error('[PWA] Failed to get cache size:', error);
      return 0;
    }
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager();

// Push notification utilities
export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;

  constructor(registration: ServiceWorkerRegistration | null = null) {
    this.registration = registration;
  }

  setRegistration(registration: ServiceWorkerRegistration) {
    this.registration = registration;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'PushManager' in window && 'Notification' in window;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    if (this.getPermission() !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('[Push] Subscribed:', subscription);
      return subscription;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const success = await subscription.unsubscribe();
        console.log('[Push] Unsubscribed:', success);
        return success;
      }
      return false;
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Push] Failed to get subscription:', error);
      return null;
    }
  }

  // Show local notification
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    if (this.getPermission() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    await this.registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Background sync utilities
export class BackgroundSyncManager {
  private registration: ServiceWorkerRegistration | null = null;

  constructor(registration: ServiceWorkerRegistration | null = null) {
    this.registration = registration;
  }

  setRegistration(registration: ServiceWorkerRegistration) {
    this.registration = registration;
  }

  // Check if background sync is supported
  isSupported(): boolean {
    return 'sync' in ServiceWorkerRegistration.prototype;
  }

  // Register a sync event
  async register(tag: string): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    if (!this.isSupported()) {
      throw new Error('Background sync not supported');
    }

    try {
      await (this.registration as any).sync.register(tag);
      console.log('[Sync] Registered:', tag);
    } catch (error) {
      console.error('[Sync] Registration failed:', error);
      throw error;
    }
  }

  // Get registered sync tags
  async getTags(): Promise<string[]> {
    if (!this.registration) {
      return [];
    }

    if (!this.isSupported()) {
      return [];
    }

    try {
      return await (this.registration as any).sync.getTags();
    } catch (error) {
      console.error('[Sync] Failed to get tags:', error);
      return [];
    }
  }
}

// Export instances
export const pushManager = new PushNotificationManager();
export const syncManager = new BackgroundSyncManager();

// Initialize PWA
export async function initializePWA() {
  try {
    const registration = await pwaManager.register();
    
    if (registration) {
      pushManager.setRegistration(registration);
      syncManager.setRegistration(registration);
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Initialization failed:', error);
    return null;
  }
}
