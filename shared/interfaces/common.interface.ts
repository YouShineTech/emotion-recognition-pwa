// Common foundation types shared across multiple modules
// Version 1.0

/**
 * Base emotion classification result used by facial and audio analysis
 */
export interface EmotionScore {
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'neutral';
  confidence: number; // 0.0 to 1.0
  intensity: number; // 0.0 to 1.0
}

/**
 * 2D rectangular boundary used for face detection and overlay positioning
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 2D coordinate point used for facial landmarks and positioning
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Base error interface extended by all module-specific errors
 */
export interface ModuleError {
  code: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
  module: string;
}

/**
 * Generic API response wrapper used by all modules
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ModuleError;
  timestamp: Date;
  processingTime?: number;
}
