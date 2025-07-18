export interface EmotionScore {
    emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'neutral';
    confidence: number;
    intensity: number;
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface Point2D {
    x: number;
    y: number;
}
export interface ModuleError {
    code: string;
    message: string;
    timestamp: Date;
    recoverable: boolean;
    module: string;
}
export interface ProcessingStats {
    framesProcessed: number;
    averageLatency: number;
    errorCount: number;
    qualityMetrics: QualityMetrics;
}
export interface QualityMetrics {
    videoQuality: 'low' | 'medium' | 'high';
    audioQuality: 'low' | 'medium' | 'high';
    processingLoad: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ModuleError;
    timestamp: Date;
    processingTime?: number;
}
export interface VersionedContract {
    version: string;
    contractId: string;
    lastUpdated: Date;
}
