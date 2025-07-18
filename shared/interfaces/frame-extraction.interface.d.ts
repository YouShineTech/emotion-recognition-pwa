import { MediaStreamData } from './media-relay.interface';
export interface FrameExtractionModule {
    extractVideoFrame(streamData: MediaStreamData): Promise<ExtractedVideoFrame>;
    extractAudioChunk(streamData: MediaStreamData): Promise<ExtractedAudioChunk>;
    setExtractionRate(framesPerSecond: number): void;
    setQuality(quality: 'low' | 'medium' | 'high'): void;
}
export interface ExtractedVideoFrame {
    sessionId: string;
    timestamp: number;
    imageData: ImageData;
    width: number;
    height: number;
    format: 'RGBA' | 'RGB24';
}
export interface ExtractedAudioChunk {
    sessionId: string;
    timestamp: number;
    audioBuffer: AudioBuffer;
    duration: number;
    sampleRate: 44100 | 48000;
    channels: 1 | 2;
}
