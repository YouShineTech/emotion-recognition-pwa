/**
 * PWA Shell Module
 *
 * Manages Progressive Web App functionality including service worker,
 * app installation, offline support, and push notifications
 */

import {
  IPWAShellModule,
  PWAConfig,
  InstallPromptEvent,
  NotificationConfig,
} from '@/shared/interfaces/pwa-shell.interface';

export class PWAShellModule implements IPWAShellModule {
  private config: PWAConfig;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private installPrompt: InstallPromptEvent | null = null;
  private onlineStatus = navigator.onLine;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor(config: PWAConfig = {}) {
    this.config = {
      serviceWorkerPath: '/sw.js',
      enableNotifications: true,
      enableOfflineSupport: true,
      updateCheckInterval: 60000, // 1 minute
      cacheStrategy: 'networkFirst',
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize PWA functionality
   */
  private async initialize(): Promise<void> {
    try {
      // Register service worker
      await this.registerServiceWorker();

      // Setup install prompt handling
      this.setupInstallPrompt();

      // Setup online/offline detection
      this.setupNetworkDetection();

      // Setup update checking
      this.setupUpdateChecking();

      // Request notification permission if enabled
      if (this.config.enableNotifications) {
        await this.requestNotificationPermission();
      }

      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize PWA Shell:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Trigger app installation
   */
  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      // Show the install prompt
      this.installPrompt.prompt();

      // Wait for user response
      const choiceResult = await this.installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        this.emit('appInstalled');
        return true;
      } else {
        this.emit('installDismissed');
        return false;
      }
    } catch (error) {
      console.error('Installation failed:', error);
      this.emit('error', error);
      return false;
    } finally {
      this.installPrompt = null;
    }
  }

  /**
   * Check if app is installed
   */
  isInstalled(): boolean {
    // Check if running in standalone mode
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.onlineStatus;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.emit('notificationPermissionChanged', permission);
    return permission;
  }

  /**
   * Show notification
   */
  async showNotification(title: string, options: NotificationConfig = {}): Promise<void> {
    if (!this.serviceWorker) {
      throw new Error('Service worker not available');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const notificationOptions: NotificationOptions = {
      ...(options.body && { body: options.body }),
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/badge-72x72.png',
      ...(options.data && { data: options.data }),
      ...(options.tag && { tag: options.tag }),
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      // vibrate: options.vibrate, // Not supported in standard NotificationOptions
      // actions: options.actions, // Not supported in standard NotificationOptions
    };

    await this.serviceWorker.showNotification(title, notificationOptions);
    this.emit('notificationShown', { title, options: notificationOptions });
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.serviceWorker) {
      throw new Error('Service worker not available');
    }

    try {
      const subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      this.emit('pushSubscribed', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorker) {
      return false;
    }

    try {
      const subscription = await this.serviceWorker.pushManager.getSubscription();

      if (subscription) {
        const success = await subscription.unsubscribe();
        if (success) {
          this.emit('pushUnsubscribed');
        }
        return success;
      }

      return true;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.serviceWorker) {
      return false;
    }

    try {
      await this.serviceWorker.update();
      return true;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  /**
   * Apply pending updates
   */
  async applyUpdate(): Promise<void> {
    if (!this.serviceWorker || !this.serviceWorker.waiting) {
      throw new Error('No update available');
    }

    // Send message to waiting service worker to skip waiting
    this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page to activate new service worker
    window.location.reload();
  }

  /**
   * Get app version information
   */
  async getVersion(): Promise<string> {
    if (!this.serviceWorker) {
      return 'unknown';
    }

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data.version || 'unknown');
      };

      this.serviceWorker!.active?.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);

      // Timeout after 5 seconds
      setTimeout(() => resolve('unknown'), 5000);
    });
  }

  /**
   * Clear app cache
   */
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      this.emit('cacheCleared');
    }
  }

  /**
   * Get cache usage information
   */
  async getCacheInfo(): Promise<any> {
    if (!('caches' in window)) {
      return { supported: false };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, entries: keys.length };
        })
      );

      return {
        supported: true,
        caches: cacheInfo,
        totalCaches: cacheNames.length,
      };
    } catch (error) {
      return { supported: true, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    try {
      this.serviceWorker = await navigator.serviceWorker.register(
        this.config.serviceWorkerPath || '/sw.js'
      );

      // Handle service worker updates
      this.serviceWorker.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorker!.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.emit('updateAvailable');
            }
          });
        }
      });

      console.log('Service worker registered successfully');
      this.emit('serviceWorkerRegistered');
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', event => {
      // Prevent the mini-infobar from appearing
      event.preventDefault();

      // Store the event for later use
      this.installPrompt = event as InstallPromptEvent;

      this.emit('installPromptAvailable');
    });

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emit('appInstalled');
    });
  }

  /**
   * Setup network detection
   */
  private setupNetworkDetection(): void {
    const updateOnlineStatus = () => {
      const wasOnline = this.onlineStatus;
      this.onlineStatus = navigator.onLine;

      if (wasOnline !== this.onlineStatus) {
        this.emit('networkStatusChanged', { isOnline: this.onlineStatus });

        if (this.onlineStatus) {
          this.emit('online');
        } else {
          this.emit('offline');
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /**
   * Setup automatic update checking
   */
  private setupUpdateChecking(): void {
    if (this.config.updateCheckInterval && this.config.updateCheckInterval > 0) {
      setInterval(() => {
        this.checkForUpdates();
      }, this.config.updateCheckInterval);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.eventListeners.clear();
    this.installPrompt = null;
  }
}

export default PWAShellModule;
