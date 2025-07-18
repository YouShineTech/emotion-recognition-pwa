// Facial Analysis Module Interface
// Version 1.0

import { ApiResponse, ModuleError, EmotionScore, BoundingBox, Point2D } from './common.interface';

export interface FacialAnalysisModule {
  analyzeFrame(frame: VideoFrame): Promise<FacialAnalysisResult>;
  setConfidenceThreshold(threshold: number): void;
  enableLandmarkDetection(enabled: boolean): void;
}

export interface VideoFrame {
  sessionId: string;
  timestamp: number;
  imageData: ImageData;
  width: number;
  height: number;
  format: 'RGBA' | 'RGB24';
}

export interface FacialAnalysisResult extends ApiResponse {
  sessionId: string;
  timestamp: number;
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