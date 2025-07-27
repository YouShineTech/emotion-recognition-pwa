// Frame Extraction Module Interface
// Version 1.0

import { MediaStreamData } from './media-relay.interface';

export interface FrameExtractionModule {
  extractVideoFrame(streamData: MediaStreamData): Promise<ExtractedVideoFrame>;
  extractAudioChunk(streamData: MediaStreamData): Promise<ExtractedAudioChunk>;
  setExtractionRate(framesPerSecond: number): void;
  setQuality(quality: 'low' | 'medium' | 'high'): void;
}

export interface ExtractedVideoFrame {
  sessionId: string;
  timestamp: Date;
  imageData: any; // ImageData in browser
  width: number;
  height: number;
  format: 'RGBA' | 'RGB24';
}

export interface ExtractedAudioChunk {
  sessionId: string;
  timestamp: Date;
  audioBuffer: any; // AudioBuffer in browser
  duration: number;
  sampleRate: 44100 | 48000;
  channels: 1 | 2;
}
