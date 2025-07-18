import { OverlayData } from './overlay-data.interface';
export interface OverlayRendererModule {
    initialize(videoElement: HTMLVideoElement): void;
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
