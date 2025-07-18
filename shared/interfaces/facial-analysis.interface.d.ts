import { ApiResponse, BoundingBox, EmotionScore, Point2D } from './common.interface';
import { ExtractedVideoFrame } from './frame-extraction.interface';
export interface FacialAnalysisModule {
    analyzeFrame(frame: ExtractedVideoFrame): Promise<FacialAnalysisResult>;
    setConfidenceThreshold(threshold: number): void;
    enableLandmarkDetection(enabled: boolean): void;
}
export interface FacialAnalysisResult extends ApiResponse {
    sessionId: string;
    timestamp: Date;
    faces: DetectedFace[];
    processingTime: number;
}
export interface DetectedFace {
    faceId: string;
    boundingBox: BoundingBox;
    landmarks?: FacialLandmarks;
    emotions: EmotionScore[];
    confidence: number;
}
export interface FacialLandmarks {
    points: Point2D[];
    eyeRegions: Point2D[][];
    mouthRegion: Point2D[];
    noseRegion: Point2D[];
}
