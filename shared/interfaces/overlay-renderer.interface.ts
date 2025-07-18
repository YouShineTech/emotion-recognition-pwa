// Overlay Renderer Module Interface
// Version 1.0

import { OverlayData } from './overlay-data.interface';

export interface OverlayRendererModule {
  initialize(videoElement: any): void; // HTMLVideoElement in browser
  renderOverlay(overlayData: OverlayData): void;
  clearOverlays(): void;
  setRenderingMode(mode: 'canvas' | 'svg'): void;
  setMaxOverlayAge(milliseconds: number): void;
}

export interface RenderingConfig {
  mode: 'canvas' | 'svg';
  maxOverlayAge: number;
  smoothing: boolean;
  fadeEffect: boolean;
}
