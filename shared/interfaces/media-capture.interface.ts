// Media Capture Module Interface
// Version 1.0

import { ApiResponse, ModuleError } from './common.interface';

export interface MediaCaptureModule {
  requestPermissions(): Promise<MediaCaptureResult>;
  startCapture(config: CaptureConfig): Promise<any>; // MediaStream in browser
  stopCapture(): void;
  switchCamera(deviceId: string): Promise<void>;
  onError(callback: (error: MediaCaptureError) => void): void;
}

export interface CaptureConfig {
  video: {
    width: { min: number; ideal: number; max: number };
    height: { min: number; ideal: number; max: number };
    frameRate: { min: number; ideal: number; max: number };
    facingMode: 'user' | 'environment';
  };
  audio: {
    sampleRate: 44100 | 48000;
    channelCount: 1 | 2;
    echoCancellation: boolean;
    noiseSuppression: boolean;
  };
  deviceId?: string;
}

export interface MediaCaptureResult extends ApiResponse {
  stream?: any; // MediaStream in browser
  availableDevices: any[]; // MediaDeviceInfo[] in browser
}

export interface MediaCaptureError extends ModuleError {
  type: 'NotAllowedError' | 'NotFoundError' | 'OverconstrainedError' | 'DeviceError';
  deviceId?: string;
}
