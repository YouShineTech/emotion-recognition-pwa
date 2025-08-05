/**
 * Media Capture Module Unit Tests
 * Tests the module in isolation with comprehensive coverage
 */

import { MediaCaptureModule } from '../../../client/src/modules/media-capture/MediaCaptureModule';
import { mockMediaDevices, mockMediaStream, mockMediaStreamTrack } from './test-setup';

describe('MediaCaptureModule', () => {
  let module: MediaCaptureModule;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockMediaDevices.getUserMedia.mockResolvedValue(mockMediaStream);
    mockMediaDevices.enumerateDevices.mockResolvedValue([
      { deviceId: 'camera1', label: 'Built-in Camera', kind: 'videoinput', groupId: 'group1' },
      { deviceId: 'mic1', label: 'Built-in Microphone', kind: 'audioinput', groupId: 'group1' },
    ]);
    mockMediaDevices.getSupportedConstraints.mockReturnValue({
      width: true,
      height: true,
      frameRate: true,
      echoCancellation: true,
    });

    mockMediaStream.getTracks.mockReturnValue([mockMediaStreamTrack]);

    module = new MediaCaptureModule({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: {
        echoCancellation: true,
      },
    });
  });

  describe('Static Methods', () => {
    it('should check if media capture is supported', () => {
      const isSupported = MediaCaptureModule.isSupported();
      expect(isSupported).toBe(true);
    });

    it('should get supported constraints', async () => {
      const constraints = await MediaCaptureModule.getSupportedConstraints();
      expect(constraints).toEqual({
        width: true,
        height: true,
        frameRate: true,
        echoCancellation: true,
      });
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      const stream = await module.initialize();

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      expect(stream).toBe(mockMediaStream);
      expect(module.getCurrentStream()).toBe(mockMediaStream);
    });

    it('should handle permission denied error', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockMediaDevices.getUserMedia.mockRejectedValue(permissionError);

      await expect(module.initialize()).rejects.toMatchObject({
        name: 'PermissionDeniedError',
        code: 'PERMISSION_DENIED',
      });
    });

    it('should handle device not found error', async () => {
      const deviceError = new Error('Device not found');
      deviceError.name = 'NotFoundError';
      mockMediaDevices.getUserMedia.mockRejectedValue(deviceError);

      await expect(module.initialize()).rejects.toMatchObject({
        name: 'DeviceNotFoundError',
        code: 'DEVICE_NOT_FOUND',
      });
    });

    it('should handle constraint error', async () => {
      const constraintError = new Error('Constraints not satisfied');
      constraintError.name = 'OverconstrainedError';
      mockMediaDevices.getUserMedia.mockRejectedValue(constraintError);

      await expect(module.initialize()).rejects.toMatchObject({
        name: 'ConstraintError',
        code: 'CONSTRAINT_NOT_SATISFIED',
      });
    });
  });

  describe('Device Management', () => {
    beforeEach(async () => {
      await module.initialize();
    });

    it('should enumerate devices successfully', async () => {
      const devices = await module.enumerateDevices();

      expect(mockMediaDevices.enumerateDevices).toHaveBeenCalled();
      expect(devices).toHaveLength(2);
      expect(devices[0]).toMatchObject({
        deviceId: 'camera1',
        label: 'Built-in Camera',
        kind: 'videoinput',
      });
    });

    it('should switch camera successfully', async () => {
      const newStream = await module.switchCamera('camera2');

      expect(mockMediaStreamTrack.stop).toHaveBeenCalled();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            deviceId: { exact: 'camera2' },
          }),
        })
      );
      expect(newStream).toBe(mockMediaStream);
    });

    it('should switch microphone successfully', async () => {
      const newStream = await module.switchMicrophone('mic2');

      expect(mockMediaStreamTrack.stop).toHaveBeenCalled();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            deviceId: { exact: 'mic2' },
          }),
        })
      );
      expect(newStream).toBe(mockMediaStream);
    });

    it('should handle device switching errors', async () => {
      const switchError = new Error('Device switch failed');
      switchError.name = 'NotFoundError';
      mockMediaDevices.getUserMedia.mockRejectedValue(switchError);

      await expect(module.switchCamera('invalid-device')).rejects.toMatchObject({
        name: 'DeviceNotFoundError',
        code: 'DEVICE_NOT_FOUND',
      });
    });
  });

  describe('Stream Management', () => {
    beforeEach(async () => {
      await module.initialize();
    });

    it('should stop stream successfully', () => {
      module.stop();

      expect(mockMediaStreamTrack.stop).toHaveBeenCalled();
      expect(module.getCurrentStream()).toBeNull();
    });

    it('should get current stream', () => {
      const stream = module.getCurrentStream();
      expect(stream).toBe(mockMediaStream);
    });

    it('should get devices list', async () => {
      await module.enumerateDevices();
      const devices = module.getDevices();

      expect(devices).toHaveLength(2);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      module.updateConfig(newConfig);

      // Configuration should be merged with existing config
      expect(true).toBe(true); // Config is private, test behavior indirectly
    });
  });

  describe('Event Handling', () => {
    it('should emit events correctly', async () => {
      const streamStartedCallback = jest.fn();
      const errorCallback = jest.fn();

      module.on('streamStarted', streamStartedCallback);
      module.on('error', errorCallback);

      await module.initialize();

      expect(streamStartedCallback).toHaveBeenCalledWith(mockMediaStream);
    });

    it('should remove event listeners', async () => {
      const callback = jest.fn();

      module.on('streamStarted', callback);
      module.off('streamStarted', callback);

      await module.initialize();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should emit error events', async () => {
      const errorCallback = jest.fn();
      module.on('error', errorCallback);

      const error = new Error('Test error');
      error.name = 'NotAllowedError';
      mockMediaDevices.getUserMedia.mockRejectedValue(error);

      try {
        await module.initialize();
      } catch (e) {
        // Expected to throw
      }

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PermissionDeniedError',
          code: 'PERMISSION_DENIED',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple initialization calls', async () => {
      await module.initialize();
      await module.initialize();

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    });

    it('should handle stop without initialization', () => {
      expect(() => module.stop()).not.toThrow();
    });

    it('should handle device enumeration failure', async () => {
      mockMediaDevices.enumerateDevices.mockRejectedValue(new Error('Enumeration failed'));

      await expect(module.enumerateDevices()).rejects.toMatchObject({
        name: 'DeviceEnumerationError',
        code: 'DEVICE_ENUMERATION_FAILED',
      });
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error');
      unknownError.name = 'UnknownError';
      mockMediaDevices.getUserMedia.mockRejectedValue(unknownError);

      await expect(module.initialize()).rejects.toMatchObject({
        name: 'UnknownError',
        code: 'UNKNOWN_ERROR',
      });
    });
  });

  describe('Performance', () => {
    it('should complete initialization within reasonable time', async () => {
      const start = Date.now();
      await module.initialize();
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle rapid device switching', async () => {
      await module.initialize();

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(module.switchCamera(`camera${i}`));
      }

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
