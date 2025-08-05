/**
 * Frame Extraction Module Interfaces
 */

export interface IFrameExtractionModule {
  initialize(): Promise<void>;
  startExtraction(sessionId: string, streamUrl: string): Promise<void>;
  stopExtraction(sessionId: string): Promise<void>;
  updateQuality(quality: 'low' | 'medium' | 'high'): void;
  getStats(): any;
  cleanup(): Promise<void>;
}

export interface ExtractionConfig {
  frameRate?: number;
  quality?: 'low' | 'medium' | 'high';
  audioSampleRate?: number;
  audioChannels?: number;
  redisUrl?: string;
  queueName?: string;
  ffmpegPath?: string;
}

export interface QualitySettings {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: string;
  audioBitrate: string;
}

export interface FrameData {
  sessionId: string;
  timestamp: number;
  width: number;
  height: number;
  format: string;
  data: Buffer;
}

export interface AudioData {
  sessionId: string;
  timestamp: number;
  sampleRate: number;
  channels: number;
  format: string;
  data: Buffer;
}
