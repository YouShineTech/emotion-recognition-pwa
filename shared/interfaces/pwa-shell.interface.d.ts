export interface PWAShellModule {
    initialize(): Promise<void>;
    installApp(): Promise<boolean>;
    handleOffline(): void;
    updateApp(): Promise<boolean>;
    requestNotificationPermission(): Promise<boolean>;
    showNotification(message: string, type: 'info' | 'warning' | 'error'): void;
}
export interface PWAConfig {
    enableOfflineMode: boolean;
    enableNotifications: boolean;
    enableAutoUpdate: boolean;
    cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}
export interface InstallationPrompt {
    canInstall: boolean;
    platform: 'ios' | 'android' | 'desktop';
    installMethod: 'native' | 'manual';
}
