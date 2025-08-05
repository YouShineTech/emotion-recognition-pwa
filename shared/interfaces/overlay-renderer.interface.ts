/**
 * Overlay Renderer Module Interfaces
 */

export interface IOverlayRendererModule {
  addOverlay(overlay: OverlayData): void;
  removeOverlay(overlayId: string): void;
  updateOverlay(overlay: OverlayData): void;
  clearOverlays(): void;
  clearSessionOverlays(sessionId: string): void;
  updateConfig(config: Partial<RendererConfig>): void;
  resize(width: number, height: number): void;
  getStats(): RenderStats;
  getActiveOverlaysCount(): number;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  cleanup(): void;
}

export interface RendererConfig {
  renderMode?: 'canvas' | 'svg';
  fontSize?: number;
  fontFamily?: string;
  borderWidth?: number;
  cornerRadius?: number;
  shadowBlur?: number;
  shadowColor?: string;
  animationDuration?: number;
  maxOverlays?: number;
}

export interface OverlayData {
  id: string;
  sessionId: string;
  timestamp: number;
  expiresAt: number;
  type: 'emotion' | 'audio-emotion';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  emotion: {
    label: string;
    confidence: number;
    color: {
      r: number;
      g: number;
      b: number;
      alpha: number;
    };
  };
  metadata?: any;
}

export interface RenderStats {
  framesRendered: number;
  averageFPS: number;
  lastRenderTime: number;
}
