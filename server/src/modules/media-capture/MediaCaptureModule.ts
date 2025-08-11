/**
 * Media Capture Module
 * Handles media capture configuration and constraints
 */

export interface MediaCaptureConfig {
  video?: {
    width?: { ideal: number };
    height?: { ideal: number };
    frameRate?: { ideal: number };
  };
  audio?: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
  };
}

export class MediaCaptureModule {
  private config: MediaCaptureConfig;
  private isInitialized = false;

  constructor(config: MediaCaptureConfig = {}) {
    this.config = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
      ...config,
    };
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  getConfig(): MediaCaptureConfig {
    return this.config;
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
    };
  }
}

export default MediaCaptureModule;
