import { ApiResponse, EmotionScore } from './common.interface';
import { ExtractedAudioChunk } from './frame-extraction.interface';
export interface AudioAnalysisModule {
    analyzeAudio(chunk: ExtractedAudioChunk): Promise<AudioAnalysisResult>;
    setModel(modelType: 'fast' | 'accurate'): void;
    setLanguage(language: string): void;
}
export interface AudioAnalysisResult extends ApiResponse {
    sessionId: string;
    timestamp: Date;
    emotions: EmotionScore[];
    speechDetected: boolean;
    audioLevel: number;
    processingTime: number;
}
