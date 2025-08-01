// Unit tests for Media Capture Module
// Test scenarios based on design specifications

import { CaptureConfig } from '@/shared/interfaces/media-capture.interface';
import { MediaCaptureModule } from './MediaCaptureModule';

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
const mockEnumerateDevices = jest.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
  },
  writable: true,
});
describe('MediaCaptureModule', () => {
  let mediaCaptureModule: MediaCaptureModule;

  beforeEach(() => {
    mediaCaptureModule = new MediaCaptureModule();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mediaCaptureModule.stopCapture();
  });

  describe('requestPermissions', () => {
    it('should successfully request permissions and return available devices', async () => {
      const mockStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      };
      const mockDevices = [
        { kind: 'videoinput', label: 'Camera 1', deviceId: 'cam1' },
        { kind: 'audioinput', label: 'Microphone 1', deviceId: 'mic1' },
      ];

      mockGetUserMedia.mockResolvedValue(mockStream);
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      const result = await mediaCaptureModule.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.availableDevices).toHaveLength(2);
      expect(result.availableDevices[0].kind).toBe('videoinput');
      expect(result.availableDevices[1].kind).toBe('audioinput');
      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
    });

    it('should handle permission denied scenario', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(mediaCaptureModule.requestPermissions()).rejects.toThrow('Permission denied');
    });
  });

  describe('startCapture', () => {
    it('should start capture with valid configuration', async () => {
      const mockStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
        addEventListener: jest.fn(),
      };
      mockGetUserMedia.mockResolvedValue(mockStream);
      const config: CaptureConfig = {
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 },
          facingMode: 'user',
        },
        audio: {
          sampleRate: 48000,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      const stream = await mediaCaptureModule.startCapture(config);

      expect(stream).toBe(mockStream);
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 },
          facingMode: 'user',
        },
        audio: {
          sampleRate: 48000,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    });

    it('should handle device not found error', async () => {
      const error = new Error('Device not found');
      error.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(error);

      const config: CaptureConfig = {
        video: { width: 1920, height: 1080, frameRate: 30 },
      };

      await expect(mediaCaptureModule.startCapture(config)).rejects.toThrow('Device not found');
    });
  });

  describe('stopCapture', () => {
    it('should stop active capture and clean up resources', async () => {
      const mockStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
        addEventListener: jest.fn(),
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const config: CaptureConfig = {
        video: { width: 640, height: 480, frameRate: 30 },
      };

      await mediaCaptureModule.startCapture(config);
      expect(mediaCaptureModule.getCurrentStream()).toBe(mockStream);

      mediaCaptureModule.stopCapture();
      expect(mediaCaptureModule.getCurrentStream()).toBeNull();
      expect(mediaCaptureModule.getCurrentConfig()).toBeNull();
    });
  });

  describe('switchCamera', () => {
    it('should switch to specified camera device', async () => {
      const mockStream1 = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
        addEventListener: jest.fn(),
      };
      const mockStream2 = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
        addEventListener: jest.fn(),
      };

      mockGetUserMedia.mockResolvedValueOnce(mockStream1).mockResolvedValueOnce(mockStream2);

      const config: CaptureConfig = {
        video: { width: 640, height: 480, frameRate: 30, facingMode: 'user' },
      };

      await mediaCaptureModule.startCapture(config);
      const deviceId = 'mock-camera-2';
      await mediaCaptureModule.switchCamera(deviceId);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
          facingMode: 'user',
          deviceId: { exact: deviceId },
        },
        audio: false,
      });
    });

    it('should throw error when no active capture session', async () => {
      await expect(mediaCaptureModule.switchCamera('device-1')).rejects.toThrow('No active capture session');
    });
  });

  describe('error handling', () => {
    it('should trigger error callback when error occurs', async () => {
      const errorCallback = jest.fn();
      mediaCaptureModule.onError(errorCallback);

      const error = new Error('Test error');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      const config: CaptureConfig = {
        video: { width: 640, height: 480, frameRate: 30 },
      };

      try {
        await mediaCaptureModule.startCapture(config);
      } catch (e) {
        // Error is expected
      }

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NotAllowedError',
          message: 'Test error',
          module: 'MediaCaptureModule',
        })
      );
    });
  });
});
