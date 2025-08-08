/**
 * PWA Shell Module Interfaces
 */

export interface IPWAShellModule {
  canInstall(): boolean;
  install(): Promise<boolean>;
  isInstalled(): boolean;
  isOnline(): boolean;
  requestNotificationPermission(): Promise<NotificationPermission>;
  showNotification(title: string, options?: NotificationConfig): Promise<void>;
  subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null>;
  unsubscribeFromPush(): Promise<boolean>;
  checkForUpdates(): Promise<boolean>;
  applyUpdate(): Promise<void>;
  getVersion(): Promise<string>;
  clearCache(): Promise<void>;
  getCacheInfo(): Promise<any>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  cleanup(): void;
}

export interface PWAConfig {
  serviceWorkerPath?: string;
  enableNotifications?: boolean;
  enableOfflineSupport?: boolean;
  updateCheckInterval?: number;
  cacheStrategy?: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationConfig {
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}
