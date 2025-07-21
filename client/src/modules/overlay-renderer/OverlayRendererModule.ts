// Overlay Renderer Module - Client Side
// Canvas-based overlay rendering on video feed

import { OverlayRendererModule as IOverlayRendererModule, OverlayData } from '@/shared/interfaces';

export class OverlayRendererModule implements IOverlayRendererModule {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private renderingMode: 'canvas' | 'svg' = 'canvas';
  private maxOverlayAge: number = 2000; // 2 seconds
  private activeOverlays: Map<string, OverlayData> = new Map();

  initialize(videoElement: HTMLVideoElement): void {
    // STUB: Mock implementation
    console.log('[OverlayRendererModule] Initializing overlay renderer...');

    this.videoElement = videoElement;

    // Create canvas overlay
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;

    this.ctx = this.canvas.getContext('2d');

    if (this.videoElement.parentElement) {
      this.videoElement.parentElement.style.position = 'relative';
      this.videoElement.parentElement.appendChild(this.canvas);
    }

    console.log('[OverlayRendererModule] Overlay renderer initialized');
  }

  renderOverlay(overlayData: OverlayData): void {
    // STUB: Mock implementation
    console.log('[OverlayRendererModule] Rendering overlay...');

    if (!this.ctx || !this.canvas) {
      console.error('[OverlayRendererModule] Renderer not initialized');
      return;
    }

    // Store overlay data
    this.activeOverlays.set(overlayData.sessionId, overlayData);

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render facial overlays
    overlayData.facialOverlays.forEach(overlay => {
      this.drawBoundingBox(
        overlay.boundingBox,
        overlay.color,
        overlay.emotionLabel,
        overlay.confidence
      );
    });

    // Render audio overlay
    if (overlayData.audioOverlay) {
      this.drawAudioIndicator(overlayData.audioOverlay);
    }

    // Clean up old overlays
    this.cleanupOldOverlays();
  }

  clearOverlays(): void {
    // STUB: Mock implementation
    console.log('[OverlayRendererModule] Clearing all overlays...');

    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.activeOverlays.clear();
  }

  setRenderingMode(mode: 'canvas' | 'svg'): void {
    this.renderingMode = mode;
    console.log(`[OverlayRendererModule] Rendering mode set to ${mode}`);
  }

  setMaxOverlayAge(milliseconds: number): void {
    this.maxOverlayAge = milliseconds;
    console.log(`[OverlayRendererModule] Max overlay age set to ${milliseconds}ms`);
  }

  // Private methods for rendering
  private drawBoundingBox(
    boundingBox: any,
    color: string,
    label: string,
    confidence: number
  ): void {
    if (!this.ctx) return;

    const { x, y, width, height } = boundingBox;

    // Draw bounding box
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Draw label background
    const labelText = `${label} (${Math.round(confidence * 100)}%)`;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y - 20, labelText.length * 8, 20);

    // Draw label text
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(labelText, x + 2, y - 5);
  }

  private drawAudioIndicator(audioOverlay: any): void {
    if (!this.ctx || !this.canvas) return;

    const { emotionLabel, confidence, position } = audioOverlay;

    let x = 10;
    let y = 30;

    if (position === 'top') {
      y = 30;
    } else if (position === 'bottom') {
      y = this.canvas.height - 30;
    }

    // Draw audio indicator
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x, y - 20, 200, 25);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Audio: ${emotionLabel} (${Math.round(confidence * 100)}%)`, x + 5, y);
  }

  private cleanupOldOverlays(): void {
    const now = Date.now();
    for (const [sessionId, overlay] of this.activeOverlays.entries()) {
      const age = now - overlay.timestamp.getTime();
      if (age > this.maxOverlayAge) {
        this.activeOverlays.delete(sessionId);
      }
    }
  }

  private applyOpacity(color: string, opacity: number): string {
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Public utility methods
  getActiveOverlayCount(): number {
    return this.activeOverlays.size;
  }

  resizeCanvas(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  destroy(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.activeOverlays.clear();
    console.log('[OverlayRendererModule] Destroyed');
  }
}
