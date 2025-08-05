/**
 * Audio Analysis Module Interfaces
 */

export interface IAudioAnalysisModule {
  initialize(): Promise<void>;
  analyzeAudio(
    audioData: Buffer,
    sessionId: string,
    timestamp: number
  ): Promise<AudioEmotionResult>;
  analyzeBatch(
    audioChunks: Array<{ data: Buffer; sessionId: string; timestamp: number }>
  ): Promise<AudioEmotionResult[]>;
  setVAD(enabled: boolean): void;
  updateConfig(config: Partial<AudioAnalysisConfig>): void;
  getStats(): any;
  cleanup(): Promise<void>;
}

export interface AudioAnalysisConfig {
  pythonPath?: string;
  modelType?: 'fast' | 'accurate';
  sampleRate?: number;
  confidenceThreshold?: number;
  vadThreshold?: number;
  tempDir?: string;
  modelPath?: string;
}

export interface AudioEmotionResult {
  sessionId: string;
  timestamp: number;
  emotion: string;
  confidence: number;
  scores: { [key: string]: number };
  features: AudioFeatures;
  voiceActivity: boolean;
  duration: number;
}

export interface AudioFeatures {
  mfcc: number[];
  spectralCentroid: number;
  zeroCrossingRate: number;
  energy: number;
}
