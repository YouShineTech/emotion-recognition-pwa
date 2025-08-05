/**
 * Overlay Data Generator Interfaces
 */

export interface IOverlayDataGenerator {
  processFacialData(faceData: any[]): OverlayData[];
  processAudioData(audioResult: any): void;
  getActiveOverlays(sessionId: string): OverlayData[];
  updateConfig(config: Partial<OverlayConfig>): void;
  clearSession(sessionId: string): void;
  getStats(): any;
  cleanup(): void;
}

export interface OverlayConfig {
  fusionWeights?: {
    facial: number;
    audio: number;
  };
  confidenceThreshold?: number;
  overlayDuration?: number;
  smoothingWindow?: number;
  maxOverlays?: number;
}

export interface OverlayData {
  id: string;
  sessionId: string;
  timestamp: number;
  expiresAt: number;
  type: 'emotion' | 'audio-emotion';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  emotion: {
    label: string;
    confidence: number;
    color: {
      r: number;
      g: number;
      b: number;
      alpha: number;
    };
  };
  metadata?: any;
}

export interface EmotionFusion {
  emotion: string;
  confidence: number;
  sources: string[];
  fusionScore: number;
  combinedScores?: { [key: string]: number };
}

export interface ColorMapping {
  [emotion: string]: {
    r: number;
    g: number;
    b: number;
    alpha: number;
  };
}
