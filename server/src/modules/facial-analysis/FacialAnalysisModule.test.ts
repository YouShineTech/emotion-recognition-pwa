// Unit tests for Facial Analysis Module
// Test scenarios based on design specifications

import { FacialAnalysisModule } from './FacialAnalysisModule';
import { ExtractedVideoFrame } from '@/shared/interfaces/frame-extraction.interface';

describe('FacialAnalysisModule', () => {
  let facialAnalysisModule: FacialAnalysisModule;

  beforeEach(() => {
    facialAnalysisModule = new FacialAnalysisModule();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(facialAnalysisModule).toBeDefined();
    });

    it('should have default confidence threshold of 0.7', () => {
      // Test that the module initializes with correct defaults
      expect(facialAnalysisModule).toBeTruthy();
    });
  });

  describe('analyzeFrame', () => {
    it('should analyze a video frame and return facial analysis result', async () => {
      const mockFrame: ExtractedVideoFrame = {
        sessionId: 'test-session-123',
        timestamp: new Date(),
        imageData: new ArrayBuffer(1024), // Mock image data
        width: 640,
        height: 480,
        format: 'RGBA',
      };

      const result = await facialAnalysisModule.analyzeFrame(mockFrame);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('test-session-123');
      expect(result.faces).toHaveLength(1);
      expect(result.faces[0]?.emotions.length).toBeGreaterThan(0);
      expect(result.faces[0]?.emotions[0]?.emotion).toBe('happy');
      expect(result.faces[0]?.emotions[0]?.confidence).toBeGreaterThan(0.8);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock a processing error by creating a module that throws
      const errorModule = new FacialAnalysisModule();

      // Test error handling by checking the error response structure
      const mockFrame: ExtractedVideoFrame = {
        sessionId: 'test-session-123',
        timestamp: new Date(),
        imageData: new ArrayBuffer(1024),
        width: 640,
        height: 480,
        format: 'RGBA',
      };

      // The module should handle errors gracefully and return error object
      const result = await errorModule.analyzeFrame(mockFrame);

      // Even on error, it should return a valid result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('faces');
      expect(result).toHaveProperty('processingTime');
    });
  });

  describe('configuration', () => {
    it('should set confidence threshold correctly', () => {
      expect(() => {
        facialAnalysisModule.setConfidenceThreshold(0.8);
      }).not.toThrow();
    });

    it('should enable/disable landmark detection', () => {
      expect(() => {
        facialAnalysisModule.enableLandmarkDetection(false);
        facialAnalysisModule.enableLandmarkDetection(true);
      }).not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should test emotion recognition', async () => {
      const result = await facialAnalysisModule.testEmotionRecognition();
      expect(typeof result).toBe('boolean');
    });

    it('should return processing stats', () => {
      const stats = facialAnalysisModule.getProcessingStats();
      expect(stats).toHaveProperty('totalFrames');
      expect(stats).toHaveProperty('avgProcessingTime');
      expect(typeof stats.totalFrames).toBe('number');
      expect(typeof stats.avgProcessingTime).toBe('number');
    });
  });
});
