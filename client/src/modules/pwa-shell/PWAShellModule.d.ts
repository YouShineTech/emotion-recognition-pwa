/**
 * PWA Shell Module
 *
 * Manages Progressive Web App functionality including service worker,
 * app installation, offline support, and push notifications
 */
import { IPWAShellModule, PWAConfig, NotificationConfig } from '@/shared/interfaces/pwa-shell.interface';
export declare class PWAShellModule implements IPWAShellModule {
    private config;
    private serviceWorker;
    private installPrompt;
    private onlineStatus;
    private eventListeners;
    constructor(config?: PWAConfig);
    /**
     * Initialize PWA functionality
     */
    private initialize;
    /**
     * Check if app can be installed
     */
    canInstall(): boolean;
    /**
     * Trigger app installation
     */
    install(): Promise<boolean>;
    /**
     * Check if app is installed
     */
    isInstalled(): boolean;
    /**
     * Check if device is online
     */
    isOnline(): boolean;
    /**
     * Request notification permission
     */
    requestNotificationPermission(): Promise<NotificationPermission>;
    /**
     * Show notification
     */
    showNotification(title: string, options?: NotificationConfig): Promise<void>;
    /**
     * Subscribe to push notifications
     */
    subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null>;
    /**
     * Unsubscribe from push notifications
     */
    unsubscribeFromPush(): Promise<boolean>;
    /**
     * Check for app updates
     */
    checkForUpdates(): Promise<boolean>;
    /**
     * Apply pending updates
     */
    applyUpdate(): Promise<void>;
    /**
     * Get app version information
     */
    getVersion(): Promise<string>;
    /**
     * Clear app cache
     */
    clearCache(): Promise<void>;
    /**
     * Get cache usage information
     */
    getCacheInfo(): Promise<any>;
    /**
     * Add event listener
     */
    on(event: string, callback: (...args: any[]) => void): void;
    /**
     * Remove event listener
     */
    off(event: string, callback: (...args: any[]) => void): void;
    /**
     * Register service worker
     */
    private registerServiceWorker;
    /**
     * Setup install prompt handling
     */
    private setupInstallPrompt;
    /**
     * Setup network detection
     */
    private setupNetworkDetection;
    /**
     * Setup automatic update checking
     */
    private setupUpdateChecking;
    /**
     * Convert VAPID key to Uint8Array
     */
    private urlBase64ToUint8Array;
    /**
     * Emit event to listeners
     */
    private emit;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export default PWAShellModule;
//# sourceMappingURL=PWAShellModule.d.ts.map