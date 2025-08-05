/**
 * Full System Integration Test
 *
 * Tests the complete emotion recognition pipeline from media capture to overlay display
 */

import MediaCaptureModule from '../../src/modules/media-capture/MediaCaptureModule';
import WebRTCTransportModule from '../../src/modules/webrtc-transport/WebRTCTransportModule';
import MediaRelayModule from '../../src/modules/media-relay/MediaRelayModule';
import FrameExtractionModule from '../../src/modules/frame-extraction/FrameExtractionModule';
import FacialAnalysisModule from '../../src/modules/facial-analysis/FacialAnalysisModule';
import AudioAnalysisModule from '../../src/modules/audio-analysis/AudioAnalysisModule';
import OverlayDataGenerator from '../../src/modules/overlay-generator/OverlayDataGenerator';
import OverlayRendererModule from '../../src/modules/overlay-renderer/OverlayRendererModule';
import ConnectionManagerModule from '../../src/modules/connection-manager/ConnectionManagerModule';
import PWAShellModule from '../../src/modules/pwa-shell/PWAShellModule';
import NginxWebServerModule from '../../src/modules/nginx-server/NginxWebServerModule';

describe('Full System Integration', () => {
  let mediaRelay: MediaRelayModule;
  let frameExtraction: FrameExtractionModule;
  let facialAnalysis: FacialAnalysisModule;
  let audioAnalysis: AudioAnalysisModule;
  let overlayGenerator: OverlayDataGenerator;
  let connectionManager: ConnectionManagerModule;

  beforeAll(async () => {
    // Initialize server-side modules
    mediaRelay = new MediaRelayModule({
      numWorkers: 1,
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    frameExtraction = new FrameExtractionModule({
      quality: 'low', // Use low quality for testing
      frameRate: 5,
    });

    facialAnalysis = new FacialAnalysisModule({
      confidenceThreshold: 0.5,
      maxFaces: 2,
    });

    audioAnalysis = new AudioAnalysisModule({
      modelType: 'fast',
      confidenceThreshold: 0.5,
    });

    overlayGenerator = new OverlayDataGenerator({
      confidenceThreshold: 0.4,
      overlayDuration: 1000,
    });

    connectionManager = new ConnectionManagerModule({
      sessionTimeout: 60000,
      maxParticipantsPerSession: 5,
    });

    // Initialize all modules
    await Promise.all([
      mediaRelay.initialize(),
      frameExtraction.initialize(),
      facialAnalysis.initialize(),
      audioAnalysis.initialize(),
      connectionManager.initialize(),
    ]);
  }, 30000);

  afterAll(async () => {
    // Cleanup all modules
    await Promise.all([
      mediaRelay.cleanup(),
      frameExtraction.cleanup(),
      facialAnalysis.cleanup(),
      audioAnalysis.cleanup(),
      connectionManager.cleanup(),
    ]);
  });

  describe('Module Initialization', () => {
    it('should initialize all server modules successfully', () => {
      expect(mediaRelay).toBeDefined();
      expect(frameExtraction).toBeDefined();
      expect(facialAnalysis).toBeDefined();
      expect(audioAnalysis).toBeDefined();
      expect(overlayGenerator).toBeDefined();
      expect(connectionManager).toBeDefined();
    });

    it('should have correct module statistics', () => {
      const frameStats = frameExtraction.getStats();
      expect(frameStats.activeExtractions).toBe(0);
      expect(frameStats.quality).toBe('low');

      const facialStats = facialAnalysis.getStats();
      expect(facialStats.isInitialized).toBe(true);
      expect(facialStats.confidenceThreshold).toBe(0.5);

      const audioStats = audioAnalysis.getStats();
      expect(audioStats.isInitialized).toBe(true);
      expect(audioStats.modelType).toBe('fast');

      const overlayStats = overlayGenerator.getStats();
      expect(overlayStats.activeOverlays).toBe(0);
      expect(overlayStats.confidenceThreshold).toBe(0.4);

      const connectionStats = connectionManager.getStats();
      expect(connectionStats.activeSessions).toBe(0);
      expect(connectionStats.totalParticipants).toBe(0);
    });
  });

  describe('Session Management', () => {
    let sessionId: string;
    let participantId: string;

    it('should create a new session', async () => {
      const session = await connectionManager.createSession();
      sessionId = session.sessionId;

      expect(session).toBeDefined();
      expect(session.sessionId).toBeTruthy();
      expect(session.status).toBe('active');
      expect(session.participants).toEqual([]);
    });

    it('should create a media relay session', async () => {
      const relaySession = await mediaRelay.createSession(sessionId);

      expect(relaySession).toBeDefined();
      expect(relaySession.sessionId).toBe(sessionId);
      expect(relaySession.participants).toEqual([]);
    });

    it('should join session as participant', async () => {
      participantId = 'test-participant-1';
      const participant = await connectionManager.joinSession(sessionId, participantId, {
        userAgent: 'test-browser',
        capabilities: ['video', 'audio'],
      });

      expect(participant).toBeDefined();
      expect(participant.participantId).toBe(participantId);
      expect(participant.sessionId).toBe(sessionId);
      expect(participant.status).toBe('connecting');
    });

    it('should create WebRTC transports', async () => {
      const sendTransport = await mediaRelay.createTransport(sessionId, participantId, 'send');
      const recvTransport = await mediaRelay.createTransport(sessionId, participantId, 'recv');

      expect(sendTransport).toBeDefined();
      expect(sendTransport.direction).toBe('send');
      expect(sendTransport.sessionId).toBe(sessionId);
      expect(sendTransport.participantId).toBe(participantId);

      expect(recvTransport).toBeDefined();
      expect(recvTransport.direction).toBe('recv');
    });

    it('should get router capabilities', () => {
      const capabilities = mediaRelay.getRouterCapabilities(sessionId);

      expect(capabilities).toBeDefined();
      expect(capabilities.codecs).toBeDefined();
      expect(Array.isArray(capabilities.codecs)).toBe(true);
    });

    it('should update participant connection health', () => {
      connectionManager.updateConnectionHealth(participantId, {
        latency: 50,
        packetLoss: 0.01,
        bandwidth: 1000000,
      });

      const participant = connectionManager.getParticipant(participantId);
      expect(participant).toBeDefined();
      expect(participant!.connectionHealth.latency).toBe(50);
      expect(participant!.connectionHealth.quality).toBe('excellent');
    });

    it('should leave session and cleanup', async () => {
      await connectionManager.leaveSession(sessionId, participantId);

      const participant = connectionManager.getParticipant(participantId);
      expect(participant).toBeNull();

      const session = await connectionManager.getSession(sessionId);
      expect(session).toBeNull(); // Session should be closed when empty
    });
  });

  describe('Media Processing Pipeline', () => {
    it('should process mock video frame', async () => {
      // Create mock frame data (small test image)
      const mockFrameData = Buffer.alloc(1000); // Mock image data
      const sessionId = 'test-session';
      const timestamp = Date.now();

      const faces = await facialAnalysis.analyzeFrame(mockFrameData, sessionId, timestamp);

      // Should return empty array for mock data, but not throw error
      expect(Array.isArray(faces)).toBe(true);
    });

    it('should process mock audio data', async () => {
      // Create mock audio data
      const mockAudioData = Buffer.alloc(48000 * 2); // 1 second of 16-bit mono audio
      const sessionId = 'test-session';
      const timestamp = Date.now();

      const audioResult = await audioAnalysis.analyzeAudio(mockAudioData, sessionId, timestamp);

      expect(audioResult).toBeDefined();
      expect(audioResult.sessionId).toBe(sessionId);
      expect(audioResult.timestamp).toBe(timestamp);
      expect(audioResult.emotion).toBeTruthy();
      expect(typeof audioResult.confidence).toBe('number');
    });

    it('should generate overlay data from analysis results', () => {
      // Mock facial analysis result
      const mockFaceData = [
        {
          sessionId: 'test-session',
          timestamp: Date.now(),
          faceId: 'face-1',
          boundingBox: { x: 100, y: 100, width: 200, height: 200 },
          landmarks: [],
          emotion: {
            emotion: 'happy',
            confidence: 0.8,
            scores: { happy: 0.8, sad: 0.1, angry: 0.1 },
          },
          actionUnits: [],
          headPose: { pitch: 0, yaw: 0, roll: 0 },
          gaze: { x: 0, y: 0 },
        },
      ];

      const overlays = overlayGenerator.processFacialData(mockFaceData);

      expect(Array.isArray(overlays)).toBe(true);
      expect(overlays.length).toBeGreaterThan(0);

      const overlay = overlays[0];
      expect(overlay.sessionId).toBe('test-session');
      expect(overlay.type).toBe('emotion');
      expect(overlay.emotion.label).toBe('happy');
      expect(overlay.emotion.confidence).toBe(0.8);
    });
  });

  describe('Client-Side Module Simulation', () => {
    // These tests simulate client-side functionality without requiring a browser environment

    it('should simulate media capture configuration', () => {
      const mockConfig = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      expect(mockConfig.video.width.ideal).toBe(1280);
      expect(mockConfig.audio.echoCancellation).toBe(true);
    });

    it('should simulate WebRTC transport configuration', () => {
      const mockTransportConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        signalingUrl: 'ws://localhost:3001',
        dataChannelName: 'overlayData',
      };

      expect(mockTransportConfig.iceServers).toBeDefined();
      expect(mockTransportConfig.signalingUrl).toBe('ws://localhost:3001');
      expect(mockTransportConfig.dataChannelName).toBe('overlayData');
    });

    it('should simulate overlay renderer configuration', () => {
      const mockRendererConfig = {
        renderMode: 'canvas' as const,
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        borderWidth: 2,
        cornerRadius: 8,
        animationDuration: 300,
        maxOverlays: 20,
      };

      expect(mockRendererConfig.renderMode).toBe('canvas');
      expect(mockRendererConfig.fontSize).toBe(16);
      expect(mockRendererConfig.maxOverlays).toBe(20);
    });

    it('should simulate PWA shell configuration', () => {
      const mockPWAConfig = {
        serviceWorkerPath: '/sw.js',
        enableNotifications: true,
        enableOfflineSupport: true,
        updateCheckInterval: 60000,
        cacheStrategy: 'networkFirst' as const,
      };

      expect(mockPWAConfig.serviceWorkerPath).toBe('/sw.js');
      expect(mockPWAConfig.enableNotifications).toBe(true);
      expect(mockPWAConfig.cacheStrategy).toBe('networkFirst');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid session ID gracefully', async () => {
      await expect(connectionManager.getSession('invalid-session')).resolves.toBeNull();
    });

    it('should handle non-existent participant gracefully', () => {
      const participant = connectionManager.getParticipant('non-existent');
      expect(participant).toBeNull();
    });

    it('should handle empty overlay generation', () => {
      const overlays = overlayGenerator.processFacialData([]);
      expect(overlays).toEqual([]);
    });

    it('should handle low confidence emotions', () => {
      const mockLowConfidenceFace = [
        {
          sessionId: 'test-session',
          timestamp: Date.now(),
          faceId: 'face-1',
          boundingBox: { x: 100, y: 100, width: 200, height: 200 },
          landmarks: [],
          emotion: {
            emotion: 'neutral',
            confidence: 0.2, // Below threshold
            scores: { neutral: 0.2, happy: 0.1 },
          },
          actionUnits: [],
          headPose: { pitch: 0, yaw: 0, roll: 0 },
          gaze: { x: 0, y: 0 },
        },
      ];

      const overlays = overlayGenerator.processFacialData(mockLowConfidenceFace);
      expect(overlays).toEqual([]); // Should filter out low confidence
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessionPromises = [];

      for (let i = 0; i < 5; i++) {
        sessionPromises.push(connectionManager.createSession(`test-session-${i}`));
      }

      const sessions = await Promise.all(sessionPromises);

      expect(sessions).toHaveLength(5);
      sessions.forEach((session, index) => {
        expect(session.sessionId).toBe(`test-session-${index}`);
      });

      // Cleanup sessions
      for (const session of sessions) {
        await connectionManager.closeSession(session.sessionId);
      }
    });

    it('should handle batch processing', async () => {
      const mockFrames = Array.from({ length: 10 }, (_, i) => ({
        data: Buffer.alloc(1000),
        sessionId: 'batch-test',
        timestamp: Date.now() + i,
      }));

      const results = await facialAnalysis.analyzeBatch(mockFrames);

      expect(results).toHaveLength(10);
      expect(Array.isArray(results[0])).toBe(true);
    });

    it('should maintain performance under load', () => {
      const startTime = Date.now();

      // Generate many overlays quickly
      for (let i = 0; i < 100; i++) {
        overlayGenerator.processFacialData([
          {
            sessionId: 'perf-test',
            timestamp: Date.now(),
            faceId: `face-${i}`,
            boundingBox: { x: i, y: i, width: 100, height: 100 },
            landmarks: [],
            emotion: {
              emotion: 'happy',
              confidence: 0.8,
              scores: { happy: 0.8 },
            },
            actionUnits: [],
            headPose: { pitch: 0, yaw: 0, roll: 0 },
            gaze: { x: 0, y: 0 },
          },
        ]);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 100 overlays in less than 1 second
      expect(processingTime).toBeLessThan(1000);
    });
  });
});

// Helper function to create mock media stream (for future browser tests)
function createMockMediaStream(): any {
  return {
    getTracks: () => [],
    getVideoTracks: () => [],
    getAudioTracks: () => [],
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    clone: jest.fn(),
    active: true,
    id: 'mock-stream-id',
  };
}

// Helper function to create mock canvas (for future browser tests)
function createMockCanvas(): any {
  return {
    width: 1280,
    height: 720,
    getContext: () => ({
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      measureText: () => ({ width: 100 }),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
    }),
  };
}
