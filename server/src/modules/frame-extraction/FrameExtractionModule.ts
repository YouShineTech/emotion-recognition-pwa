/**
 * Frame Extraction Module
 *
 * Extracts video frames and audio samples from WebRTC streams
 * Uses FFmpeg for media processing and Redis for queuing
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import Redis from 'redis';
import {
  IFrameExtractionModule,
  ExtractionConfig,
  FrameData,
  AudioData,
  QualitySettings,
} from '@/shared/interfaces/frame-extraction.interface';

export class FrameExtractionModule extends EventEmitter implements IFrameExtractionModule {
  private config: ExtractionConfig;
  private redis: Redis.RedisClientType | null = null;
  private ffmpegProcesses: Map<string, ChildProcess> = new Map();
  private isInitialized = false;

  // Quality presets
  private readonly qualityPresets: Record<string, QualitySettings> = {
    low: {
      width: 320,
      height: 240,
      frameRate: 10,
      videoBitrate: '200k',
      audioBitrate: '64k',
    },
    medium: {
      width: 640,
      height: 480,
      frameRate: 15,
      videoBitrate: '500k',
      audioBitrate: '128k',
    },
    high: {
      width: 1280,
      height: 720,
      frameRate: 30,
      videoBitrate: '1000k',
      audioBitrate: '192k',
    },
  };

  constructor(config: ExtractionConfig = {}) {
    super();

    this.config = {
      frameRate: 10,
      quality: 'medium',
      audioSampleRate: 48000,
      audioChannels: 2,
      redisUrl: 'redis://localhost:6379',
      queueName: 'frame-processing',
      ffmpegPath: 'ffmpeg',
      ...config,
    };
  }

  /**
   * Initialize the frame extraction module
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Redis connection
      await this.initializeRedis();

      // Verify FFmpeg is available
      await this.verifyFFmpeg();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('FrameExtractionModule initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FrameExtractionModule:', error);
      throw error;
    }
  }

  /**
   * Start extracting frames from RTP stream
   */
  async startExtraction(sessionId: string, streamUrl: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized');
    }

    try {
      const qualitySettings = this.qualityPresets[this.config.quality];

      // Start video frame extraction
      await this.startVideoExtraction(sessionId, streamUrl, qualitySettings);

      // Start audio extraction
      await this.startAudioExtraction(sessionId, streamUrl, qualitySettings);

      this.emit('extractionStarted', { sessionId, streamUrl });
    } catch (error) {
      console.error('Failed to start extraction:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop extraction for a session
   */
  async stopExtraction(sessionId: string): Promise<void> {
    try {
      const videoProcessKey = `${sessionId}-video`;
      const audioProcessKey = `${sessionId}-audio`;

      // Stop video extraction process
      const videoProcess = this.ffmpegProcesses.get(videoProcessKey);
      if (videoProcess) {
        videoProcess.kill('SIGTERM');
        this.ffmpegProcesses.delete(videoProcessKey);
      }

      // Stop audio extraction process
      const audioProcess = this.ffmpegProcesses.get(audioProcessKey);
      if (audioProcess) {
        audioProcess.kill('SIGTERM');
        this.ffmpegProcesses.delete(audioProcessKey);
      }

      this.emit('extractionStopped', { sessionId });
    } catch (error) {
      console.error('Failed to stop extraction:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Update extraction quality settings
   */
  updateQuality(quality: 'low' | 'medium' | 'high'): void {
    this.config.quality = quality;
    this.emit('qualityUpdated', { quality });
  }

  /**
   * Get extraction statistics
   */
  getStats(): any {
    return {
      activeExtractions: this.ffmpegProcesses.size,
      quality: this.config.quality,
      frameRate: this.config.frameRate,
      qualitySettings: this.qualityPresets[this.config.quality],
    };
  }

  /**
   * Start video frame extraction using FFmpeg
   */
  private async startVideoExtraction(
    sessionId: string,
    streamUrl: string,
    quality: QualitySettings
  ): Promise<void> {
    const processKey = `${sessionId}-video`;

    const ffmpegArgs = [
      '-i',
      streamUrl,
      '-vf',
      `scale=${quality.width}:${quality.height}`,
      '-r',
      this.config.frameRate.toString(),
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-an', // No audio
      'pipe:1',
    ];

    const ffmpegProcess = spawn(this.config.ffmpegPath, ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.ffmpegProcesses.set(processKey, ffmpegProcess);

    // Handle video frame data
    let frameBuffer = Buffer.alloc(0);
    const frameSize = quality.width * quality.height * 4; // RGBA = 4 bytes per pixel

    ffmpegProcess.stdout?.on('data', (chunk: Buffer) => {
      frameBuffer = Buffer.concat([frameBuffer, chunk]);

      // Process complete frames
      while (frameBuffer.length >= frameSize) {
        const frameData = frameBuffer.slice(0, frameSize);
        frameBuffer = frameBuffer.slice(frameSize);

        const frame: FrameData = {
          sessionId,
          timestamp: Date.now(),
          width: quality.width,
          height: quality.height,
          format: 'rgba',
          data: frameData,
        };

        this.processFrame(frame);
      }
    });

    // Handle process errors
    ffmpegProcess.stderr?.on('data', data => {
      console.error(`FFmpeg video error (${sessionId}):`, data.toString());
    });

    ffmpegProcess.on('exit', code => {
      console.log(`Video extraction process exited with code ${code} for session ${sessionId}`);
      this.ffmpegProcesses.delete(processKey);
    });

    ffmpegProcess.on('error', error => {
      console.error(`Video extraction process error for session ${sessionId}:`, error);
      this.ffmpegProcesses.delete(processKey);
      this.emit('error', error);
    });
  }

  /**
   * Start audio extraction using FFmpeg
   */
  private async startAudioExtraction(
    sessionId: string,
    streamUrl: string,
    quality: QualitySettings
  ): Promise<void> {
    const processKey = `${sessionId}-audio`;

    const ffmpegArgs = [
      '-i',
      streamUrl,
      '-vn', // No video
      '-acodec',
      'pcm_s16le',
      '-ar',
      this.config.audioSampleRate.toString(),
      '-ac',
      this.config.audioChannels.toString(),
      '-f',
      'wav',
      'pipe:1',
    ];

    const ffmpegProcess = spawn(this.config.ffmpegPath, ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.ffmpegProcesses.set(processKey, ffmpegProcess);

    // Handle audio data
    let audioBuffer = Buffer.alloc(0);
    const chunkSize = this.config.audioSampleRate * this.config.audioChannels * 2; // 1 second of 16-bit audio

    ffmpegProcess.stdout?.on('data', (chunk: Buffer) => {
      audioBuffer = Buffer.concat([audioBuffer, chunk]);

      // Process audio chunks
      while (audioBuffer.length >= chunkSize) {
        const audioChunk = audioBuffer.slice(0, chunkSize);
        audioBuffer = audioBuffer.slice(chunkSize);

        const audioData: AudioData = {
          sessionId,
          timestamp: Date.now(),
          sampleRate: this.config.audioSampleRate,
          channels: this.config.audioChannels,
          format: 'pcm_s16le',
          data: audioChunk,
        };

        this.processAudio(audioData);
      }
    });

    // Handle process errors
    ffmpegProcess.stderr?.on('data', data => {
      console.error(`FFmpeg audio error (${sessionId}):`, data.toString());
    });

    ffmpegProcess.on('exit', code => {
      console.log(`Audio extraction process exited with code ${code} for session ${sessionId}`);
      this.ffmpegProcesses.delete(processKey);
    });

    ffmpegProcess.on('error', error => {
      console.error(`Audio extraction process error for session ${sessionId}:`, error);
      this.ffmpegProcesses.delete(processKey);
      this.emit('error', error);
    });
  }

  /**
   * Process extracted video frame
   */
  private async processFrame(frame: FrameData): Promise<void> {
    try {
      // Add to Redis queue for facial analysis
      if (this.redis) {
        const frameMessage = {
          type: 'frame',
          data: {
            sessionId: frame.sessionId,
            timestamp: frame.timestamp,
            width: frame.width,
            height: frame.height,
            format: frame.format,
            data: frame.data.toString('base64'),
          },
        };

        await this.redis.lPush(this.config.queueName, JSON.stringify(frameMessage));
      }

      // Emit frame event
      this.emit('frameExtracted', frame);
    } catch (error) {
      console.error('Error processing frame:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process extracted audio data
   */
  private async processAudio(audio: AudioData): Promise<void> {
    try {
      // Add to Redis queue for audio analysis
      if (this.redis) {
        const audioMessage = {
          type: 'audio',
          data: {
            sessionId: audio.sessionId,
            timestamp: audio.timestamp,
            sampleRate: audio.sampleRate,
            channels: audio.channels,
            format: audio.format,
            data: audio.data.toString('base64'),
          },
        };

        await this.redis.lPush(this.config.queueName, JSON.stringify(audioMessage));
      }

      // Emit audio event
      this.emit('audioExtracted', audio);
    } catch (error) {
      console.error('Error processing audio:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = Redis.createClient({ url: this.config.redisUrl });
      await this.redis.connect();
      console.log('Redis connected for frame processing queue');
    } catch (error) {
      console.warn('Redis connection failed, running without queue:', error);
      this.redis = null;
    }
  }

  /**
   * Verify FFmpeg is available
   */
  private async verifyFFmpeg(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.config.ffmpegPath, ['-version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      ffmpeg.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg not found or invalid (exit code: ${code})`));
        }
      });

      ffmpeg.on('error', error => {
        reject(new Error(`FFmpeg not available: ${error.message}`));
      });
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop all extraction processes
    for (const [sessionId, process] of this.ffmpegProcesses) {
      process.kill('SIGTERM');
    }
    this.ffmpegProcesses.clear();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    this.isInitialized = false;
    this.emit('cleanup');
  }
}

export default FrameExtractionModule;
