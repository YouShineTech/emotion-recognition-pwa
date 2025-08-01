// PWA Shell Module - Client Side
// Progressive Web App features and lifecycle management

import { PWAShellModule as IPWAShellModule } from '@/shared/interfaces/pwa-shell.interface';

export class PWAShellModule implements IPWAShellModule {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;
  private isOnline: boolean = navigator.onLine;
  private notificationPermission: NotificationPermission = 'default';

  async initialize(): Promise<void> {
    console.log('[PWAShellModule] Initializing PWA shell...');

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWAShellModule] Service worker registered');

        // Check for updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          console.log('[PWAShellModule] Service worker update found');
          this.handleServiceWorkerUpdate();
        });
      } catch (error) {
        console.error('[PWAShellModule] Service worker registration failed:', error);
      }
    }

    // Set up event listeners
    this.setupEventListeners();

    // Check if app is installable
    this.checkInstallability();

    // Request notification permission
    await this.requestNotificationPermission();

    console.log('[PWAShellModule] PWA shell initialized');
  }

  async installApp(): Promise<boolean> {
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
    console.log('[PWAShellModule] Handling offline state...');

    this.isOnline = false;

    // Show offline notification
    this.showNotification('You are offline. Some features may be unavailable.', 'warning');

    // Update UI
    this.updateOfflineUI();
  }

  async updateApp(): Promise<boolean> {
    console.log('[PWAShellModule] Checking for app updates...');

    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      // Update available
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[PWAShellModule] App update applied');
      return true;
    }

    // Check for updates
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
        console.log('[PWAShellModule] Service worker update check completed');
      } catch (error) {
        console.error('[PWAShellModule] Update check failed:', error);
      }
    }

    console.log('[PWAShellModule] No updates available');
    return false;
  }

  async requestNotificationPermission(): Promise<boolean> {
    console.log('[PWAShellModule] Requesting notification permission...');

    if (!('Notification' in window)) {
      console.log('[PWAShellModule] Notifications not supported');
      return false;
    }

    try {
      this.notificationPermission = await Notification.requestPermission();
      console.log(`[PWAShellModule] Notification permission: ${this.notificationPermission}`);
      return this.notificationPermission === 'granted';
    } catch (error) {
      console.error('[PWAShellModule] Notification permission request failed:', error);
      return false;
    }
  }

  showNotification(message: string, type: 'info' | 'warning' | 'error'): void {
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
      transition: opacity 0.3s ease;
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
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

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

      // Show install button
      this.showInstallButton();
    });

    // Handle service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWAShellModule] Service worker updated');
        window.location.reload();
      });
    }

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWAShellModule] App was installed');
      this.deferredPrompt = null;
      this.showNotification('App installed successfully!', 'info');
    });
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

  private handleServiceWorkerUpdate(): void {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      console.log('[PWAShellModule] Service worker update available');
      this.showNotification('App update available. Click to update.', 'info');
    }
  }

  private updateOfflineUI(): void {
    // Remove existing offline indicator
    const existingIndicator = document.getElementById('offline-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create offline indicator
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
      transition: opacity 0.3s ease;
    `;
    offlineIndicator.textContent = 'Offline Mode';

    document.body.appendChild(offlineIndicator);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      offlineIndicator.style.opacity = '0';
      setTimeout(() => {
        if (offlineIndicator.parentElement) {
          offlineIndicator.parentElement.removeChild(offlineIndicator);
        }
      }, 300);
    }, 3000);
  }

  private showInstallButton(): void {
    const installButton = document.createElement('button');
    installButton.textContent = 'Install App';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      cursor: pointer;
      z-index: 1000;
    `;

    installButton.addEventListener('click', async () => {
      const installed = await this.installApp();
      if (installed) {
        installButton.remove();
      }
    });

    document.body.appendChild(installButton);
  }

  private async sendPushNotification(title: string, body: string): Promise<void> {
    console.log(`[PWAShellModule] Sending push notification: ${title} - ${body}`);

    if (this.notificationPermission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        });
      } catch (error) {
        console.error('[PWAShellModule] Push notification failed:', error);
      }
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
    // Get version from manifest or package.json
    try {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      return manifest.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  async shareContent(title: string, text: string, url: string): Promise<boolean> {
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

  async cacheResources(resources: string[]): Promise<void> {
    if ('caches' in window && this.serviceWorkerRegistration) {
      try {
        const cache = await caches.open('app-cache-v1');
        await cache.addAll(resources);
        console.log('[PWAShellModule] Resources cached successfully');
      } catch (error) {
        console.error('[PWAShellModule] Cache failed:', error);
      }
    }
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[PWAShellModule] Cache cleared');
      } catch (error) {
        console.error('[PWAShellModule] Cache clear failed:', error);
      }
    }
  }
}
