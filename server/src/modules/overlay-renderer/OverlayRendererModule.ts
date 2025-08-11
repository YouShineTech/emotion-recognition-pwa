/**
 * Overlay Renderer Module
 * Handles rendering of emotion overlays on video streams
 */

export interface OverlayRendererConfig {
  renderMode: 'canvas' | 'svg';
  fontSize: number;
  fontFamily: string;
  borderWidth: number;
  cornerRadius: number;
  animationDuration: number;
  maxOverlays: number;
}

export interface OverlayData {
  sessionId: string;
  type: string;
  emotion: {
    label: string;
    confidence: number;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class OverlayRendererModule {
  private config: OverlayRendererConfig;
  private isInitialized = false;
  private activeOverlays = new Map<string, OverlayData>();

  constructor(config: Partial<OverlayRendererConfig> = {}) {
    this.config = {
      renderMode: 'canvas',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      borderWidth: 2,
      cornerRadius: 8,
      animationDuration: 300,
      maxOverlays: 20,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.activeOverlays.clear();
    this.isInitialized = false;
  }

  renderOverlay(overlayData: OverlayData): void {
    if (this.activeOverlays.size >= this.config.maxOverlays) {
      // Remove oldest overlay
      const firstKey = this.activeOverlays.keys().next().value;
      if (firstKey) {
        this.activeOverlays.delete(firstKey);
      }
    }

    const overlayId = `${overlayData.sessionId}-${Date.now()}`;
    this.activeOverlays.set(overlayId, overlayData);
  }

  removeOverlay(overlayId: string): void {
    this.activeOverlays.delete(overlayId);
  }

  getActiveOverlays(): OverlayData[] {
    return Array.from(this.activeOverlays.values());
  }

  getConfig(): OverlayRendererConfig {
    return this.config;
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      activeOverlays: this.activeOverlays.size,
      maxOverlays: this.config.maxOverlays,
      renderMode: this.config.renderMode,
    };
  }
}

export default OverlayRendererModule;
