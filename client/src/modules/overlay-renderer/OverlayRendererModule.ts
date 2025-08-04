// Overlay Renderer Module - Client Side
// Canvas-based overlay rendering on video feed

import { OverlayRendererModule as IOverlayRendererModule } from '@/shared/interfaces/overlay-renderer.interface';
import { OverlayData } from '@/shared/interfaces/overlay-data.interface';

export class OverlayRendererModule implements IOverlayRendererModule {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private renderingMode: 'canvas' | 'svg' = 'canvas';
  private maxOverlayAge: number = 2000; // 2 seconds
  private activeOverlays: Map<string, OverlayData> = new Map();
  private animationFrameId: number | null = null;
  private isRendering: boolean = false;

  initialize(videoElement: HTMLVideoElement): void {
    console.log('[OverlayRendererModule] Initializing overlay renderer...');

    this.videoElement = videoElement;

    // Create canvas overlay
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10';

    // Set initial dimensions
    this.updateCanvasDimensions();

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    if (this.videoElement.parentElement) {
      this.videoElement.parentElement.style.position = 'relative';
      this.videoElement.parentElement.appendChild(this.canvas);
    }

    // Start rendering loop
    this.startRendering();

    console.log('[OverlayRendererModule] Overlay renderer initialized');
  }

  renderOverlay(overlayData: OverlayData): void {
    if (!this.ctx || !this.canvas) {
      console.error('[OverlayRendererModule] Renderer not initialized');
      return;
    }

    // Store overlay data with timestamp
    this.activeOverlays.set(overlayData.sessionId, {
      ...overlayData,
      timestamp: new Date(),
    });

    // Trigger immediate render
    this.renderFrame();
  }

  clearOverlays(): void {
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

  private startRendering(): void {
    if (this.isRendering) return;

    this.isRendering = true;
    this.renderLoop();
  }

  private stopRendering(): void {
    this.isRendering = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderLoop(): void {
    if (!this.isRendering) return;

    this.renderFrame();
    this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  private renderFrame(): void {
    if (!this.ctx || !this.canvas || !this.videoElement) return;

    // Update canvas dimensions to match video
    this.updateCanvasDimensions();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Clean up old overlays
    this.cleanupOldOverlays();

    // Render all active overlays
    const now = Date.now();
    for (const [, overlay] of this.activeOverlays.entries()) {
      const age = now - overlay.timestamp.getTime();
      const opacity = Math.max(0, 1 - age / this.maxOverlayAge);

      if (opacity > 0) {
        // Render facial overlays
        overlay.facialOverlays.forEach(facialOverlay => {
          this.drawFacialOverlay(facialOverlay, opacity);
        });

        // Render audio overlay
        if (overlay.audioOverlay) {
          this.drawAudioOverlay(overlay.audioOverlay, opacity);
        }
      }
    }
  }

  private updateCanvasDimensions(): void {
    if (!this.canvas || !this.videoElement) return;

    const { videoWidth, videoHeight } = this.videoElement;
    if (videoWidth > 0 && videoHeight > 0) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
    }
  }

  private drawFacialOverlay(overlay: any, opacity: number): void {
    if (!this.ctx) return;

    const { boundingBox, color, emotionLabel, confidence } = overlay;

    // Apply opacity to color
    const rgbaColor = this.applyOpacity(color, opacity);

    // Draw bounding box
    this.ctx.strokeStyle = rgbaColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);

    // Draw label background
    const labelText = `${emotionLabel} (${Math.round(confidence * 100)}%)`;
    const textWidth = this.ctx.measureText(labelText).width;
    const labelHeight = 20;
    const labelY = boundingBox.y - labelHeight - 2;

    this.ctx.fillStyle = rgbaColor;
    this.ctx.fillRect(boundingBox.x, labelY, textWidth + 10, labelHeight);

    // Draw label text
    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.font = '14px Arial';
    this.ctx.fillText(labelText, boundingBox.x + 5, labelY + 14);

    // Draw facial landmarks if available
    if (overlay.landmarks) {
      this.drawLandmarks(overlay.landmarks, rgbaColor);
    }
  }

  private drawAudioOverlay(overlay: any, opacity: number): void {
    if (!this.ctx || !this.canvas) return;

    const { emotionLabel, confidence, position } = overlay;

    const x = 10;
    let y = 30;

    if (position === 'bottom') {
      y = this.canvas.height - 50;
    }

    // Draw background
    const text = `Audio: ${emotionLabel} (${Math.round(confidence * 100)}%)`;
    const textWidth = this.ctx.measureText(text).width;
    const padding = 10;

    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.7})`;
    this.ctx.fillRect(x, y, textWidth + padding * 2, 25);

    // Draw text
    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.font = '14px Arial';
    this.ctx.fillText(text, x + padding, y + 17);
  }

  private drawLandmarks(landmarks: any, color: string): void {
    if (!this.ctx || !landmarks.points) return;

    // Draw landmark points
    this.ctx.fillStyle = color;
    landmarks.points.forEach((point: any) => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      this.ctx.fill();
    });

    // Draw connections between landmarks (simplified)
    if (landmarks.connections) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      landmarks.connections.forEach((connection: any) => {
        this.ctx.beginPath();
        this.ctx.moveTo(connection.start.x, connection.start.y);
        this.ctx.lineTo(connection.end.x, connection.end.y);
        this.ctx.stroke();
      });
    }
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
    // Handle hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      return color.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${opacity})`);
    }

    // Default fallback
    return color;
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
    this.stopRendering();

    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }

    this.activeOverlays.clear();
    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;

    console.log('[OverlayRendererModule] Destroyed');
  }
}
