/**
 * Overlay Renderer Module
 *
 * Renders emotion overlays on video streams using Canvas API
 * Supports responsive rendering and multiple overlay types
 */

import {
  IOverlayRendererModule,
  RendererConfig,
  OverlayData,
  RenderStats,
} from '@/shared/interfaces/overlay-renderer.interface';

export class OverlayRendererModule implements IOverlayRendererModule {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private config: RendererConfig;
  private activeOverlays: Map<string, OverlayData> = new Map();
  private animationFrameId: number | null = null;
  private renderStats: RenderStats = {
    framesRendered: 0,
    averageFPS: 0,
    lastRenderTime: 0,
  };
  private fpsHistory: number[] = [];
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor(canvas: HTMLCanvasElement, config: RendererConfig = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }

    this.context = context;
    this.config = {
      renderMode: 'canvas',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      borderWidth: 2,
      cornerRadius: 8,
      shadowBlur: 4,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      animationDuration: 300,
      maxOverlays: 20,
      ...config,
    };

    this.setupCanvas();
    this.startRenderLoop();
  }

  /**
   * Add overlay to be rendered
   */
  addOverlay(overlay: OverlayData): void {
    this.activeOverlays.set(overlay.id, overlay);
    this.emit('overlayAdded', overlay);
  }

  /**
   * Remove overlay from rendering
   */
  removeOverlay(overlayId: string): void {
    const overlay = this.activeOverlays.get(overlayId);
    if (overlay) {
      this.activeOverlays.delete(overlayId);
      this.emit('overlayRemoved', overlay);
    }
  }

  /**
   * Update existing overlay
   */
  updateOverlay(overlay: OverlayData): void {
    if (this.activeOverlays.has(overlay.id)) {
      this.activeOverlays.set(overlay.id, overlay);
      this.emit('overlayUpdated', overlay);
    }
  }

  /**
   * Clear all overlays
   */
  clearOverlays(): void {
    const count = this.activeOverlays.size;
    this.activeOverlays.clear();
    this.emit('overlaysCleared', { count });
  }

  /**
   * Clear overlays for specific session
   */
  clearSessionOverlays(sessionId: string): void {
    const toRemove: string[] = [];

    for (const [id, overlay] of this.activeOverlays) {
      if (overlay.sessionId === sessionId) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.activeOverlays.delete(id));
    this.emit('sessionOverlaysCleared', { sessionId, count: toRemove.length });
  }

  /**
   * Update renderer configuration
   */
  updateConfig(newConfig: Partial<RendererConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupCanvas();
    this.emit('configUpdated', this.config);
  }

  /**
   * Resize canvas and update rendering
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.setupCanvas();
    this.emit('canvasResized', { width, height });
  }

  /**
   * Get current render statistics
   */
  getStats(): RenderStats {
    return { ...this.renderStats };
  }

  /**
   * Get active overlays count
   */
  getActiveOverlaysCount(): number {
    return this.activeOverlays.size;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Setup canvas properties
   */
  private setupCanvas(): void {
    // Set canvas style for responsive rendering
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'contain';

    // Setup context properties
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.font = `${this.config.fontSize}px ${this.config.fontFamily}`;

    // Enable anti-aliasing
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      this.renderFrame(timestamp);
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  /**
   * Render a single frame
   */
  private renderFrame(timestamp: number): void {
    // Calculate FPS
    if (this.renderStats.lastRenderTime > 0) {
      const deltaTime = timestamp - this.renderStats.lastRenderTime;
      const fps = 1000 / deltaTime;

      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 60) {
        // Keep last 60 frames
        this.fpsHistory.shift();
      }

      this.renderStats.averageFPS =
        this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }

    this.renderStats.lastRenderTime = timestamp;
    this.renderStats.framesRendered++;

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Remove expired overlays
    this.removeExpiredOverlays();

    // Render active overlays
    for (const overlay of this.activeOverlays.values()) {
      this.renderOverlay(overlay, timestamp);
    }
  }

  /**
   * Render a single overlay
   */
  private renderOverlay(overlay: OverlayData, timestamp: number): void {
    const { position, emotion, type } = overlay;

    // Calculate scale factors for responsive rendering
    const scaleX = this.canvas.width / 1920; // Assume 1920x1080 reference
    const scaleY = this.canvas.height / 1080;

    const scaledX = position.x * scaleX;
    const scaledY = position.y * scaleY;
    const scaledWidth = position.width * scaleX;
    const scaledHeight = position.height * scaleY;

    // Calculate animation progress
    const age = timestamp - overlay.timestamp;
    const animationProgress = Math.min(age / this.config.animationDuration, 1);
    const fadeProgress = this.calculateFadeProgress(overlay, timestamp);

    // Apply animation and fade effects
    const alpha = emotion.color.alpha * fadeProgress;

    this.context.save();

    // Apply animation transform
    if (animationProgress < 1) {
      const scale = 0.8 + 0.2 * animationProgress; // Scale from 80% to 100%
      this.context.translate(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2);
      this.context.scale(scale, scale);
      this.context.translate(-scaledWidth / 2, -scaledHeight / 2);
    } else {
      this.context.translate(scaledX, scaledY);
    }

    if (type === 'emotion') {
      this.renderEmotionOverlay(overlay, scaledWidth, scaledHeight, alpha);
    } else if (type === 'audio-emotion') {
      this.renderAudioEmotionOverlay(overlay, scaledWidth, scaledHeight, alpha);
    }

    this.context.restore();
  }

  /**
   * Render emotion overlay (face-based)
   */
  private renderEmotionOverlay(
    overlay: OverlayData,
    width: number,
    height: number,
    alpha: number
  ): void {
    const { emotion } = overlay;
    const color = `rgba(${emotion.color.r}, ${emotion.color.g}, ${emotion.color.b}, ${alpha})`;
    const borderColor = `rgba(${emotion.color.r}, ${emotion.color.g}, ${emotion.color.b}, ${alpha * 1.2})`;

    // Draw bounding box
    this.drawRoundedRect(0, 0, width, height, this.config.cornerRadius, borderColor, color);

    // Draw emotion label
    const labelY = -this.config.fontSize - 8;
    const labelText = `${emotion.label} (${Math.round(emotion.confidence * 100)}%)`;

    this.drawLabel(labelText, width / 2, labelY, color, borderColor);
  }

  /**
   * Render audio-only emotion overlay
   */
  private renderAudioEmotionOverlay(
    overlay: OverlayData,
    width: number,
    height: number,
    alpha: number
  ): void {
    const { emotion } = overlay;
    const color = `rgba(${emotion.color.r}, ${emotion.color.g}, ${emotion.color.b}, ${alpha})`;
    const borderColor = `rgba(${emotion.color.r}, ${emotion.color.g}, ${emotion.color.b}, ${alpha * 1.2})`;

    // Draw background
    this.drawRoundedRect(0, 0, width, height, this.config.cornerRadius, borderColor, color);

    // Draw audio icon and label
    const labelText = `🎤 ${emotion.label} (${Math.round(emotion.confidence * 100)}%)`;

    this.context.fillStyle = 'white';
    this.context.fillText(labelText, width / 2, height / 2);
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    strokeColor: string,
    fillColor?: string
  ): void {
    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.lineTo(x + width - radius, y);
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.context.lineTo(x + width, y + height - radius);
    this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.context.lineTo(x + radius, y + height);
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.context.lineTo(x, y + radius);
    this.context.quadraticCurveTo(x, y, x + radius, y);
    this.context.closePath();

    if (fillColor) {
      this.context.fillStyle = fillColor;
      this.context.fill();
    }

    this.context.strokeStyle = strokeColor;
    this.context.lineWidth = this.config.borderWidth;
    this.context.stroke();
  }

  /**
   * Draw text label with background
   */
  private drawLabel(
    text: string,
    x: number,
    y: number,
    backgroundColor: string,
    borderColor: string
  ): void {
    const metrics = this.context.measureText(text);
    const padding = 8;
    const labelWidth = metrics.width + padding * 2;
    const labelHeight = this.config.fontSize + padding;

    // Draw label background
    this.drawRoundedRect(
      x - labelWidth / 2,
      y - labelHeight / 2,
      labelWidth,
      labelHeight,
      this.config.cornerRadius / 2,
      borderColor,
      backgroundColor
    );

    // Draw text
    this.context.fillStyle = 'white';
    this.context.fillText(text, x, y);
  }

  /**
   * Calculate fade progress for overlay aging
   */
  private calculateFadeProgress(overlay: OverlayData, timestamp: number): number {
    const totalDuration = overlay.expiresAt - overlay.timestamp;
    const remaining = overlay.expiresAt - timestamp;
    const fadeStartRatio = 0.8; // Start fading at 80% of lifetime

    if (remaining > totalDuration * fadeStartRatio) {
      return 1.0; // Full opacity
    }

    const fadeProgress = remaining / (totalDuration * (1 - fadeStartRatio));
    return Math.max(0, Math.min(1, fadeProgress));
  }

  /**
   * Remove expired overlays
   */
  private removeExpiredOverlays(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, overlay] of this.activeOverlays) {
      if (now > overlay.expiresAt) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => {
      const overlay = this.activeOverlays.get(id);
      this.activeOverlays.delete(id);
      this.emit('overlayExpired', overlay);
    });
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.activeOverlays.clear();
    this.eventListeners.clear();
    this.fpsHistory = [];
  }
}

export default OverlayRendererModule;
