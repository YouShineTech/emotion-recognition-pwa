import { AudioAnalysisResult } from './audio-analysis.interface';
import { BoundingBox } from './common.interface';
import { FacialAnalysisResult } from './facial-analysis.interface';
export interface OverlayDataGenerator {
    generateOverlay(facialResult: FacialAnalysisResult, audioResult: AudioAnalysisResult): Promise<OverlayData>;
    setOverlayStyle(style: OverlayStyle): void;
}
export interface OverlayData {
    sessionId: string;
    timestamp: Date;
    facialOverlays: FacialOverlay[];
    audioOverlay: AudioOverlay;
    totalProcessingTime: number;
}
export interface FacialOverlay {
    faceId: string;
    boundingBox: BoundingBox;
    emotionLabel: string;
    confidence: number;
    color: string;
}
export interface AudioOverlay {
    emotionLabel: string;
    confidence: number;
    position: 'top' | 'bottom' | 'side';
}
export interface OverlayStyle {
    colors: Record<string, string>;
    opacity: number;
    fontSize: number;
    borderWidth: number;
}
