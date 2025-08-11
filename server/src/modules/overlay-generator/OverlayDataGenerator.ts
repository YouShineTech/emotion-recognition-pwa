/**
 * Overlay Data Generator Module
 *
 * Combines facial and audio emotion analysis results
 * Generates overlay data for real-time display
 */

import { EventEmitter } from 'events';
import {
  IOverlayDataGenerator,
  OverlayConfig,
  OverlayData,
  EmotionFusion,
  ColorMapping,
} from '@/shared/interfaces/overlay-data.interface';
import { FaceData } from '@/shared/interfaces/facial-analysis.interface';
import { AudioEmotionResult } from '@/shared/interfaces/audio-analysis.interface';

export class OverlayDataGenerator extends EventEmitter implements IOverlayDataGenerator {
  private config: OverlayConfig;
  private activeOverlays: Map<string, OverlayData> = new Map();
  private emotionHistory: Map<
    string,
    Array<{ emotion: string; confidence: number; timestamp: number }>
  > = new Map();

  // Color mapping for emotions
  private readonly colorMapping: ColorMapping = {
    happy: { r: 0, g: 255, b: 0, alpha: 0.8 }, // Green
    sad: { r: 0, g: 0, b: 255, alpha: 0.8 }, // Blue
    angry: { r: 255, g: 0, b: 0, alpha: 0.8 }, // Red
    fear: { r: 128, g: 0, b: 128, alpha: 0.8 }, // Purple
    surprise: { r: 255, g: 255, b: 0, alpha: 0.8 }, // Yellow
    disgust: { r: 165, g: 42, b: 42, alpha: 0.8 }, // Brown
    contempt: { r: 255, g: 165, b: 0, alpha: 0.8 }, // Orange
    neutral: { r: 128, g: 128, b: 128, alpha: 0.6 }, // Gray
    calm: { r: 173, g: 216, b: 230, alpha: 0.6 }, // Light Blue
  };

  constructor(config: OverlayConfig = {}) {
    super();

    this.config = {
      fusionWeights: {
        facial: 0.7,
        audio: 0.3,
      },
      confidenceThreshold: 0.5,
      overlayDuration: 2000, // 2 seconds
      smoothingWindow: 3, // 3 frames for smoothing
      maxOverlays: 10,
      ...config,
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Process facial analysis results and generate overlays
   */
  processFacialData(faceData: FaceData[]): OverlayData[] {
    const overlays: OverlayData[] = [];

    for (const face of faceData) {
      // Get corresponding audio data for fusion
      const audioData = this.getRecentAudioData(face.sessionId, face.timestamp);

      // Fuse facial and audio emotions
      const fusedEmotion = this.fuseEmotions(face.emotion, audioData);

      // Apply smoothing
      const smoothedEmotion = this.applySmoothingFilter(face.sessionId, fusedEmotion);

      // Generate overlay data
      const overlay = this.generateOverlay(face, smoothedEmotion);

      if (overlay) {
        overlays.push(overlay);
        this.activeOverlays.set(overlay.id, overlay);
      }
    }

    this.emit('overlaysGenerated', overlays);
    return overlays;
  }

  /**
   * Process audio analysis results
   */
  processAudioData(audioResult: AudioEmotionResult): void {
    // Store audio data for fusion with facial data
    this.storeAudioData(audioResult);

    // If no recent facial data, create audio-only overlay
    const recentFacialData = this.getRecentFacialData(audioResult.sessionId, audioResult.timestamp);

    if (!recentFacialData && audioResult.voiceActivity) {
      const audioOverlay = this.generateAudioOnlyOverlay(audioResult);
      if (audioOverlay) {
        this.activeOverlays.set(audioOverlay.id, audioOverlay);
        this.emit('overlaysGenerated', [audioOverlay]);
      }
    }
  }

  /**
   * Get all active overlays for a session
   */
  getActiveOverlays(sessionId: string): OverlayData[] {
    const sessionOverlays: OverlayData[] = [];

    for (const overlay of this.activeOverlays.values()) {
      if (overlay.sessionId === sessionId && !this.isExpired(overlay)) {
        sessionOverlays.push(overlay);
      }
    }

    return sessionOverlays;
  }

  /**
   * Update overlay configuration
   */
  updateConfig(newConfig: Partial<OverlayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Clear overlays for a session
   */
  clearSession(sessionId: string): void {
    const toRemove: string[] = [];

    for (const [id, overlay] of this.activeOverlays) {
      if (overlay.sessionId === sessionId) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.activeOverlays.delete(id));
    this.emotionHistory.delete(sessionId);

    this.emit('sessionCleared', { sessionId });
  }

  /**
   * Get overlay generation statistics
   */
  getStats(): any {
    return {
      activeOverlays: this.activeOverlays.size,
      maxOverlays: this.config.maxOverlays,
      overlayDuration: this.config.overlayDuration || 5000,
      fusionWeights: this.config.fusionWeights,
      confidenceThreshold: this.config.confidenceThreshold,
    };
  }

  /**
   * Fuse facial and audio emotion results
   */
  private fuseEmotions(facialEmotion: any, audioData: AudioEmotionResult | null): EmotionFusion {
    const facialWeight = this.config.fusionWeights?.facial || 0.7;
    const audioWeight = this.config.fusionWeights?.audio || 0.3;

    if (!audioData || !audioData.voiceActivity) {
      // Use only facial data
      return {
        emotion: facialEmotion.emotion,
        confidence: facialEmotion.confidence,
        sources: ['facial'],
        fusionScore: facialEmotion.confidence,
      };
    }

    // Combine facial and audio emotions
    const combinedScores: { [key: string]: number } = {};

    // Add facial emotion scores
    for (const [emotion, score] of Object.entries(facialEmotion.scores)) {
      combinedScores[emotion] = (score as number) * facialWeight;
    }

    // Add audio emotion scores
    for (const [emotion, score] of Object.entries(audioData.scores)) {
      if (combinedScores[emotion] !== undefined) {
        combinedScores[emotion] += (score as number) * audioWeight;
      } else {
        combinedScores[emotion] = (score as number) * audioWeight;
      }
    }

    // Find dominant emotion
    const dominantEmotion = Object.entries(combinedScores).reduce((a, b) =>
      (combinedScores[a[0]] || 0) > (combinedScores[b[0]] || 0) ? a : b
    );

    // Calculate fusion confidence
    const facialConfidence = facialEmotion.confidence * facialWeight;
    const audioConfidence = audioData.confidence * audioWeight;
    const fusionScore = facialConfidence + audioConfidence;

    return {
      emotion: dominantEmotion[0],
      confidence: dominantEmotion[1],
      sources: ['facial', 'audio'],
      fusionScore,
      combinedScores,
    };
  }

  /**
   * Apply smoothing filter to reduce emotion flickering
   */
  private applySmoothingFilter(sessionId: string, emotion: EmotionFusion): EmotionFusion {
    if (!this.emotionHistory.has(sessionId)) {
      this.emotionHistory.set(sessionId, []);
    }

    const history = this.emotionHistory.get(sessionId)!;

    // Add current emotion to history
    history.push({
      emotion: emotion.emotion,
      confidence: emotion.confidence,
      timestamp: Date.now(),
    });

    // Keep only recent history
    const cutoff = Date.now() - (this.config.smoothingWindow || 5) * 1000;
    const recentHistory = history.filter(h => h.timestamp > cutoff);
    this.emotionHistory.set(sessionId, recentHistory);

    if (recentHistory.length < (this.config.smoothingWindow || 5)) {
      return emotion; // Not enough history for smoothing
    }

    // Calculate smoothed emotion
    const emotionCounts: { [key: string]: number } = {};
    let totalConfidence = 0;

    for (const historyItem of recentHistory) {
      emotionCounts[historyItem.emotion] = (emotionCounts[historyItem.emotion] || 0) + 1;
      totalConfidence += historyItem.confidence;
    }

    // Find most frequent emotion
    const mostFrequent = Object.entries(emotionCounts).reduce((a, b) =>
      (emotionCounts[a[0]] || 0) > (emotionCounts[b[0]] || 0) ? a : b
    );

    const avgConfidence = totalConfidence / recentHistory.length;

    return {
      ...emotion,
      emotion: mostFrequent[0],
      confidence: avgConfidence,
    };
  }

  /**
   * Generate overlay data from face data and emotion
   */
  private generateOverlay(face: FaceData, emotion: EmotionFusion): OverlayData | null {
    if (emotion.confidence < (this.config.confidenceThreshold || 0.5)) {
      return null; // Skip low confidence emotions
    }

    const color = this.colorMapping[emotion.emotion] || this.colorMapping.neutral;

    // Adjust alpha based on confidence
    const adjustedAlpha = Math.max(0.3, Math.min(1.0, emotion.confidence));

    const overlay: OverlayData = {
      id: `overlay-${face.sessionId}-${face.timestamp}-${Date.now()}`,
      sessionId: face.sessionId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (this.config.overlayDuration || 5000),
      type: 'emotion',
      position: {
        x: face.boundingBox.x,
        y: face.boundingBox.y,
        width: face.boundingBox.width,
        height: face.boundingBox.height,
      },
      emotion: {
        label: emotion.emotion,
        confidence: emotion.confidence,
        color: {
          r: color?.r || 255,
          g: color?.g || 255,
          b: color?.b || 255,
          alpha: adjustedAlpha,
        },
      },
      metadata: {
        faceId: face.faceId,
        sources: emotion.sources,
        fusionScore: emotion.fusionScore,
      },
    };

    return overlay;
  }

  /**
   * Generate audio-only overlay when no facial data is available
   */
  private generateAudioOnlyOverlay(audioResult: AudioEmotionResult): OverlayData | null {
    if (audioResult.confidence < (this.config.confidenceThreshold || 0.5)) {
      return null;
    }

    const color = this.colorMapping[audioResult.emotion] || this.colorMapping.neutral;

    const overlay: OverlayData = {
      id: `audio-overlay-${audioResult.sessionId}-${audioResult.timestamp}`,
      sessionId: audioResult.sessionId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (this.config.overlayDuration || 5000),
      type: 'audio-emotion',
      position: {
        x: 10, // Fixed position for audio-only overlays
        y: 10,
        width: 200,
        height: 50,
      },
      emotion: {
        label: audioResult.emotion,
        confidence: audioResult.confidence,
        color: {
          r: color?.r || 255,
          g: color?.g || 255,
          b: color?.b || 255,
          alpha: Math.max(0.3, audioResult.confidence),
        },
      },
      metadata: {
        sources: ['audio'],
        voiceActivity: audioResult.voiceActivity,
        duration: audioResult.duration,
      },
    };

    return overlay;
  }

  /**
   * Get recent audio data for fusion
   */
  private getRecentAudioData(sessionId: string, timestamp: number): AudioEmotionResult | null {
    // This would typically query a cache or database
    // For now, return null (would be implemented with proper data storage)
    return null;
  }

  /**
   * Get recent facial data
   */
  private getRecentFacialData(sessionId: string, timestamp: number): FaceData | null {
    // This would typically query a cache or database
    // For now, return null (would be implemented with proper data storage)
    return null;
  }

  /**
   * Store audio data for fusion
   */
  private storeAudioData(audioResult: AudioEmotionResult): void {
    // This would typically store in a cache or database
    // Implementation would depend on the storage strategy
  }

  /**
   * Check if overlay is expired
   */
  private isExpired(overlay: OverlayData): boolean {
    return Date.now() > overlay.expiresAt;
  }

  /**
   * Start cleanup timer to remove expired overlays
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const toRemove: string[] = [];

      for (const [id, overlay] of this.activeOverlays) {
        if (this.isExpired(overlay)) {
          toRemove.push(id);
        }
      }

      toRemove.forEach(id => this.activeOverlays.delete(id));

      if (toRemove.length > 0) {
        this.emit('overlaysExpired', toRemove);
      }
    }, 1000); // Check every second
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.activeOverlays.clear();
    this.emotionHistory.clear();
    this.removeAllListeners();
  }
}

export default OverlayDataGenerator;
