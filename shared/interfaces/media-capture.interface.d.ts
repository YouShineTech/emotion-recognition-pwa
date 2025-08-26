/**
 * Media Capture Module Interfaces
 */
export interface IMediaCaptureModule {
    initialize(): Promise<MediaStream>;
    requestPermissions(): Promise<{
        success: boolean;
        error?: string;
    }>;
    startCapture(config?: CaptureConfig): Promise<MediaStream>;
    stopCapture(): void;
    stop(): void;
    switchCamera(deviceId: string): Promise<MediaStream>;
    switchMicrophone(deviceId: string): Promise<MediaStream>;
    enumerateDevices(): Promise<DeviceInfo[]>;
    getCurrentStream(): MediaStream | null;
    getDevices(): DeviceInfo[];
    updateConfig(config: Partial<CaptureConfig>): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
}
export interface CaptureConfig {
    video?: MediaTrackConstraints;
    audio?: MediaTrackConstraints;
}
export interface DeviceInfo {
    deviceId: string;
    label: string;
    kind: 'videoinput' | 'audioinput' | 'audiooutput';
    groupId: string;
}
export interface CaptureError {
    name: string;
    message: string;
    code: string;
}
//# sourceMappingURL=media-capture.interface.d.ts.map