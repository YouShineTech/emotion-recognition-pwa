/**
 * Facial Analysis Module Interfaces
 */

export interface IFacialAnalysisModule {
  initialize(): Promise<void>;
  analyzeFrame(frameData: Buffer, sessionId: string, timestamp: number): Promise<FaceData[]>;
  analyzeBatch(
    frames: Array<{ data: Buffer; sessionId: string; timestamp: number }>
  ): Promise<FaceData[][]>;
  updateConfig(config: Partial<FacialAnalysisConfig>): void;
  getStats(): any;
  cleanup(): Promise<void>;
}

export interface FacialAnalysisConfig {
  openFacePath?: string;
  tempDir?: string;
  numWorkers?: number;
  confidenceThreshold?: number;
  trackingEnabled?: boolean;
  maxFaces?: number;
}

export interface FaceData {
  sessionId: string;
  timestamp: number;
  faceId: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: Array<{ x: number; y: number }>;
  emotion: EmotionResult;
  actionUnits: ActionUnit[];
  headPose: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  gaze: {
    x: number;
    y: number;
  };
}

export interface EmotionResult {
  emotion: string;
  confidence: number;
  scores: { [key: string]: number };
}

export interface ActionUnit {
  number: number;
  intensity: number;
  confidence: number;
}
