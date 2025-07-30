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

  async requestPermissions(): Promise<MediaCaptureResult> {
    // STUB: Mock implementation
    console.log('[MediaCaptureModule] Requesting permissions...');
    console.log('[DEBUG] About to return mock permission result');

    // Mock successful permission request
    return {
      success: true,
      data: null,
      timestamp: new Date(),
      availableDevices: [
        {
          deviceId: 'mock-camera-1',
          kind: 'videoinput',
          label: 'Mock Camera 1',
          groupId: 'group1',
        } as MediaDeviceInfo,
        {
          deviceId: 'mock-mic-1',
          kind: 'audioinput',
          label: 'Mock Microphone 1',
          groupId: 'group1',
        } as MediaDeviceInfo,
      ],
    };
  }

  async startCapture(config: CaptureConfig): Promise<any> {
    // STUB: Mock implementation
    console.log('[MediaCaptureModule] Starting capture with config:', config);
    console.log('[DEBUG] Video config:', config.video);
    console.log('[DEBUG] Audio config:', config.audio);

    // Create mock MediaStream (use global mock from setupTests)
    const mockStream = new MediaStream();
    this.currentStream = mockStream;
    console.log('[DEBUG] Created mock stream:', mockStream);

    return mockStream;
  }

  stopCapture(): void {
    // STUB: Mock implementation
    console.log('[MediaCaptureModule] Stopping capture...');

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    // STUB: Mock implementation
    console.log('[MediaCaptureModule] Switching to camera:', deviceId);

    // Mock camera switch
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  onError(callback: (error: MediaCaptureError) => void): void {
    this.errorCallback = callback;
  }

  // Mock method to trigger errors for testing
  private triggerError(error: MediaCaptureError): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
}
