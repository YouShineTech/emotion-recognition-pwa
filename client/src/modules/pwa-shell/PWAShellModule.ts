// PWA Shell Module - Client Side
// Progressive Web App features and lifecycle management

import { PWAShellModule as IPWAShellModule } from '@/shared/interfaces/pwa-shell.interface';

export class PWAShellModule implements IPWAShellModule {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;
  private isOnline: boolean = navigator.onLine;

  async initialize(): Promise<void> {
    // STUB: Mock implementation
    console.log('[PWAShellModule] Initializing PWA shell...');

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWAShellModule] Service worker registered');
      } catch (error) {
        console.error('[PWAShellModule] Service worker registration failed:', error);
      }
    }

    // Set up event listeners
    this.setupEventListeners();

    // Check if app is installable
    this.checkInstallability();

    console.log('[PWAShellModule] PWA shell initialized');
  }

  async installApp(): Promise<boolean> {
    // STUB: Mock implementation
    console.log('[PWAShellModule] Attempting to install app...');

    if (this.deferredPrompt) {
      // Show install prompt
      this.deferredPrompt.prompt();

      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`[PWAShellModule] User response to install prompt: ${outcome}`);

      this.deferredPrompt = null;
      return outcome === 'accepted';
    }

    console.log('[PWAShellModule] App installation not available');
    return false;
  }

  handleOffline(): void {
    // STUB: Mock implementation
    console.log('[PWAShellModule] Handling offline state...');

    this.isOnline = false;

    // Show offline notification
    this.showNotification('You are offline. Some features may be unavailable.', 'warning');

    // Update UI
    this.updateOfflineUI();
  }

  async updateApp(): Promise<boolean> {
    // STUB: Mock implementation
    console.log('[PWAShellModule] Checking for app updates...');

    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      // Update available
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[PWAShellModule] App update applied');
      return true;
    }

    console.log('[PWAShellModule] No updates available');
    return false;
  }

  async requestNotificationPermission(): Promise<boolean> {
    // STUB: Mock implementation
    console.log('[PWAShellModule] Requesting notification permission...');

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log(`[PWAShellModule] Notification permission: ${permission}`);
      return permission === 'granted';
    }

    console.log('[PWAShellModule] Notifications not supported');
    return false;
  }

  showNotification(message: string, type: 'info' | 'warning' | 'error'): void {
    // STUB: Mock implementation
    console.log(`[PWAShellModule] ${type.toUpperCase()}: ${message}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      border-radius: 5px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;

    // Set color based on type
    switch (type) {
      case 'info':
        notification.style.backgroundColor = '#007bff';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = '#000';
        break;
      case 'error':
        notification.style.backgroundColor = '#dc3545';
        break;
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 5000);
  }

  // Private methods
  private setupEventListeners(): void {
    // Handle online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[PWAShellModule] Back online');
      this.showNotification('You are back online!', 'info');
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Handle beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredPrompt = event;
      console.log('[PWAShellModule] Install prompt deferred');
    });

    // Handle service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWAShellModule] Service worker updated');
        window.location.reload();
      });
    }
  }

  private checkInstallability(): void {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWAShellModule] App is running in standalone mode');
      return;
    }

    // Check if install prompt is available
    if (this.deferredPrompt) {
      console.log('[PWAShellModule] App is installable');
    }
  }

  private updateOfflineUI(): void {
    // Update UI elements for offline state
    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ff9800;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    offlineIndicator.textContent = 'Offline Mode';

    document.body.appendChild(offlineIndicator);
  }

  private async sendPushNotification(title: string, body: string): Promise<void> {
    // STUB: Mock implementation
    console.log(`[PWAShellModule] Sending push notification: ${title} - ${body}`);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
      });
    }
  }

  // Public utility methods
  isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  async getAppVersion(): Promise<string> {
    // STUB: Mock implementation
    return '1.0.0';
  }

  async shareContent(title: string, text: string, url: string): Promise<boolean> {
    // STUB: Mock implementation
    console.log(`[PWAShellModule] Sharing: ${title} - ${text} - ${url}`);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        console.error('[PWAShellModule] Share failed:', error);
        return false;
      }
    }

    console.log('[PWAShellModule] Web Share API not supported');
    return false;
  }
}
