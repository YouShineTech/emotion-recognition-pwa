/**
 * Media Capture Module
 *
 * Handles camera and microphone access using getUserMedia API
 * Provides device enumeration, switching, and error handling
 */
import { IMediaCaptureModule, CaptureConfig, DeviceInfo } from '@/shared/interfaces/media-capture.interface';
export declare class MediaCaptureModule implements IMediaCaptureModule {
    private currentStream;
    private devices;
    private config;
    private eventListeners;
    constructor(config?: CaptureConfig);
    /**
     * Request permissions for media access
     */
    requestPermissions(): Promise<{
        success: boolean;
        error?: string;
        availableDevices?: DeviceInfo[];
    }>;
    /**
     * Start media capture with given configuration
     */
    startCapture(config?: CaptureConfig): Promise<MediaStream>;
    /**
     * Stop media capture
     */
    stopCapture(): void;
    /**
     * Initialize media capture and get user media stream
     */
    initialize(): Promise<MediaStream>;
    /**
     * Stop current media stream and cleanup resources
     */
    stop(): void;
    /**
     * Switch to a different camera device
     */
    switchCamera(deviceId: string): Promise<MediaStream>;
    /**
     * Switch to a different microphone device
     */
    switchMicrophone(deviceId: string): Promise<MediaStream>;
    /**
     * Get list of available media devices
     */
    enumerateDevices(): Promise<DeviceInfo[]>;
    /**
     * Get current media stream
     */
    getCurrentStream(): MediaStream | null;
    /**
     * Get available devices
     */
    getDevices(): DeviceInfo[];
    /**
     * Update capture configuration
     */
    updateConfig(newConfig: Partial<CaptureConfig>): void;
    /**
     * Add event listener
     */
    on(event: string, callback: (...args: any[]) => void): void;
    /**
     * Remove event listener
     */
    off(event: string, callback: (...args: any[]) => void): void;
    /**
     * Emit event to listeners
     */
    private emit;
    /**
     * Handle media errors and convert to CaptureError
     */
    private handleMediaError;
    /**
     * Setup device change listener
     */
    private setupDeviceChangeListener;
    /**
     * Check if media capture is supported
     */
    static isSupported(): boolean;
    /**
     * Get supported constraints
     */
    static getSupportedConstraints(): Promise<MediaTrackSupportedConstraints>;
}
export default MediaCaptureModule;
//# sourceMappingURL=MediaCaptureModule.d.ts.map