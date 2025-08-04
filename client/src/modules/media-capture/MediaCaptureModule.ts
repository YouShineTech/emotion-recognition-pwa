// Media Capture Module - Client Side
// Handles device media access and stream management

import {
  CaptureConfig,
  MediaCaptureModule as IMediaCaptureModule,
  MediaCaptureError,
  MediaCaptureResult,
} from '@/shared/interfaces/media-capture.interface';

export class MediaCaptureModule implements IMediaCaptureModule {
  private currentStream: MediaStream | null = null;
  private errorCallback: ((error: MediaCaptureError) => void) | null = null;
  private currentConfig: CaptureConfig | null = null;

  async requestPermissions(): Promise<MediaCaptureResult> {
    try {
      console.log('[MediaCaptureModule] Requesting media permissions...');

      // Request both camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());

      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      return {
        success: true,
        data: null,
        timestamp: new Date(),
        availableDevices: devices.filter(
          device => device.kind === 'videoinput' || device.kind === 'audioinput'
        ),
      };
    } catch (error) {
      const errorType =
        error instanceof Error && error.name === 'NotAllowedError'
          ? ('NotAllowedError' as const)
          : ('DeviceError' as const);

      const mediaError: MediaCaptureError = {
        type: errorType,
        message: error instanceof Error ? error.message : 'Permission denied',
        code: error instanceof Error && 'name' in error ? (error as any).name : 'UNKNOWN',
        timestamp: new Date(),
        recoverable: errorType !== 'NotAllowedError',
        module: 'MediaCaptureModule',
      };

      this.triggerError(mediaError);
      throw new Error('Permission denied');
    }
  }

  async startCapture(config: CaptureConfig): Promise<MediaStream> {
    try {
      console.log('[MediaCaptureModule] Starting capture with config:', config);

      // Stop any existing stream
      this.stopCapture();

      // Store current config
      this.currentConfig = config;

      // Request media stream with provided config
      const constraints: MediaStreamConstraints = {
        video: config.video
          ? {
              width: config.video.width,
              height: config.video.height,
              frameRate: config.video.frameRate,
              facingMode: config.video.facingMode,
              ...(config.deviceId && { deviceId: { exact: config.deviceId } }),
            }
          : false,
        audio: config.audio
          ? {
              sampleRate: config.audio.sampleRate,
              channelCount: config.audio.channelCount,
              echoCancellation: config.audio.echoCancellation,
              noiseSuppression: config.audio.noiseSuppression,
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;

      // Handle device disconnections
      stream.addEventListener('removetrack', this.handleTrackRemoval.bind(this));

      return stream;
    } catch (error) {
      let errorType: MediaCaptureError['type'];

      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorType = 'NotAllowedError';
            break;
          case 'NotFoundError':
            errorType = 'NotFoundError';
            break;
          case 'OverconstrainedError':
            errorType = 'OverconstrainedError';
            break;
          default:
            errorType = 'DeviceError';
        }
      } else {
        errorType = 'DeviceError';
      }

      const mediaError: MediaCaptureError = {
        type: errorType,
        message: error instanceof Error ? error.message : 'Failed to start capture',
        code: error instanceof Error && 'name' in error ? (error as any).name : 'UNKNOWN',
        timestamp: new Date(),
        recoverable: errorType !== 'NotAllowedError',
        module: 'MediaCaptureModule',
      };

      this.triggerError(mediaError);

      if (errorType === 'NotFoundError') {
        throw new Error('Device not found');
      }
      throw mediaError;
    }
  }

  stopCapture(): void {
    console.log('[MediaCaptureModule] Stopping capture...');

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop();
      });
      this.currentStream = null;
      this.currentConfig = null;
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    try {
      console.log('[MediaCaptureModule] Switching to camera:', deviceId);

      if (!this.currentConfig) {
        throw new Error('No active capture session');
      }

      // Update config with new device
      const newConfig: CaptureConfig = {
        ...this.currentConfig,
        deviceId,
      };

      // Restart capture with new device
      await this.startCapture(newConfig);
    } catch (error) {
      const mediaError: MediaCaptureError = {
        type: 'DeviceError',
        message: error instanceof Error ? error.message : 'Failed to switch camera',
        code: 'DEVICE_ERROR',
        timestamp: new Date(),
        recoverable: true,
        module: 'MediaCaptureModule',
      };

      this.triggerError(mediaError);
      throw new Error('No active capture session');
    }
  }

  onError(callback: (error: MediaCaptureError) => void): void {
    this.errorCallback = callback;
  }

  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  getCurrentConfig(): CaptureConfig | null {
    return this.currentConfig;
  }

  private handleTrackRemoval(event: Event): void {
    console.log('[MediaCaptureModule] Track removed:', event);

    const mediaError: MediaCaptureError = {
      type: 'DeviceError',
      message: 'Media device was disconnected',
      code: 'DEVICE_DISCONNECTED',
      timestamp: new Date(),
      recoverable: true,
      module: 'MediaCaptureModule',
    };

    this.triggerError(mediaError);
  }
  private triggerError(error: MediaCaptureError): void {
    console.error('[MediaCaptureModule] Error:', error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
}
