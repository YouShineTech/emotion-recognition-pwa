// Audio Analysis Module Interface
// Version 1.0

import { ApiResponse, ModuleError, EmotionScore } from './common.interface';

export interface AudioAnalysisModule {
  analyzeAudio(chunk: AudioChunk): Promise<AudioAnalysisResult>;
  setModel(modelType: 'fast' | 'accurate'): void;
  setLanguage(language: string): void;
}

export interface AudioChunk {
  sessionId: string;
  timestamp: number;
  audioBuffer: AudioBuffer;
  duration: number;
  sampleRate: 44100 | 48000;
  channels: 1 | 2;
}

export interface AudioAnalysisResult extends ApiResponse {
  sessionId: string;
  timestamp: number;
  emotions: EmotionScore[];
  speechDetected: boolean;
  audioLevel: number;
  processingTime: number;
}