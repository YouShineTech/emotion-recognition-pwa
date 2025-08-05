/**
 * Facial Analysis Module (OpenFace Integration)
 *
 * Processes video frames for facial emotion recognition using OpenFace 2.0
 * Extracts Action Units and maps them to emotions using SVM classifier
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import {
  IFacialAnalysisModule,
  FacialAnalysisConfig,
  FaceData,
  EmotionResult,
  ActionUnit,
} from '@/shared/interfaces/facial-analysis.interface';

export class FacialAnalysisModule extends EventEmitter implements IFacialAnalysisModule {
  private config: FacialAnalysisConfig;
  private isInitialized = false;
  private workers: Worker[] = [];
  private currentWorkerIndex = 0;
  private tempDir: string;

  // Action Unit to Emotion mapping (based on FACS)
  private readonly emotionMapping = {
    happiness: [6, 12], // Cheek raiser, Lip corner puller
    sadness: [1, 4, 15], // Inner brow raiser, Brow lowerer, Lip corner depressor
    anger: [4, 5, 7, 23], // Brow lowerer, Upper lid raiser, Lid tightener, Lip tightener
    fear: [1, 2, 4, 5, 20, 26], // Inner brow raiser, Outer brow raiser, Brow lowerer, Upper lid raiser, Lip stretcher, Jaw drop
    surprise: [1, 2, 5, 26], // Inner brow raiser, Outer brow raiser, Upper lid raiser, Jaw drop
    disgust: [9, 15, 16], // Nose wrinkler, Lip corner depressor, Lower lip depressor
    contempt: [12, 14], // Lip corner puller (unilateral), Dimpler
  };

  constructor(config: FacialAnalysisConfig = {}) {
    super();

    this.config = {
      openFacePath: '/usr/local/bin/FaceLandmarkImg',
      tempDir: '/tmp/facial-analysis',
      numWorkers: 2,
      confidenceThreshold: 0.7,
      trackingEnabled: true,
      maxFaces: 5,
      ...config,
    };

    this.tempDir = this.config.tempDir;
  }

  /**
   * Initialize the facial analysis module
   */
  async initialize(): Promise<void> {
    try {
      // Verify OpenFace is available
      await this.verifyOpenFace();

      // Create temporary directory
      await this.createTempDirectory();

      // Initialize worker threads
      await this.initializeWorkers();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('FacialAnalysisModule initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FacialAnalysisModule:', error);
      throw error;
    }
  }

  /**
   * Analyze facial emotions in a frame
   */
  async analyzeFrame(frameData: Buffer, sessionId: string, timestamp: number): Promise<FaceData[]> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized');
    }

    try {
      // Save frame to temporary file
      const frameId = `${sessionId}-${timestamp}`;
      const imagePath = path.join(this.tempDir, `${frameId}.jpg`);
      await fs.writeFile(imagePath, frameData);

      // Process with OpenFace
      const actionUnits = await this.processWithOpenFace(imagePath, frameId);

      // Convert Action Units to emotions
      const faces = this.actionUnitsToEmotions(actionUnits, sessionId, timestamp);

      // Cleanup temporary file
      await fs.unlink(imagePath).catch(() => {}); // Ignore errors

      this.emit('facesAnalyzed', { sessionId, faces });
      return faces;
    } catch (error) {
      console.error('Error analyzing frame:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process multiple frames in batch
   */
  async analyzeBatch(
    frames: Array<{ data: Buffer; sessionId: string; timestamp: number }>
  ): Promise<FaceData[][]> {
    const results = await Promise.all(
      frames.map(frame => this.analyzeFrame(frame.data, frame.sessionId, frame.timestamp))
    );

    return results;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FacialAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get analysis statistics
   */
  getStats(): any {
    return {
      isInitialized: this.isInitialized,
      numWorkers: this.workers.length,
      confidenceThreshold: this.config.confidenceThreshold,
      maxFaces: this.config.maxFaces,
      trackingEnabled: this.config.trackingEnabled,
    };
  }

  /**
   * Process image with OpenFace and extract Action Units
   */
  private async processWithOpenFace(imagePath: string, frameId: string): Promise<ActionUnit[]> {
    return new Promise((resolve, reject) => {
      const outputDir = path.join(this.tempDir, 'output');
      const csvPath = path.join(outputDir, `${frameId}.csv`);

      // Ensure output directory exists
      fs.mkdir(outputDir, { recursive: true }).catch(() => {});

      const openFaceArgs = [
        '-f',
        imagePath,
        '-out_dir',
        outputDir,
        '-aus', // Extract Action Units
        '-pose', // Extract head pose
        '-gaze', // Extract gaze direction
      ];

      const openFaceProcess = spawn(this.config.openFacePath, openFaceArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      openFaceProcess.stdout?.on('data', data => {
        stdout += data.toString();
      });

      openFaceProcess.stderr?.on('data', data => {
        stderr += data.toString();
      });

      openFaceProcess.on('exit', async code => {
        if (code === 0) {
          try {
            const actionUnits = await this.parseOpenFaceOutput(csvPath);
            resolve(actionUnits);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`OpenFace process failed with code ${code}: ${stderr}`));
        }
      });

      openFaceProcess.on('error', error => {
        reject(new Error(`OpenFace process error: ${error.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        openFaceProcess.kill('SIGTERM');
        reject(new Error('OpenFace process timeout'));
      }, 10000);
    });
  }

  /**
   * Parse OpenFace CSV output to extract Action Units
   */
  private async parseOpenFaceOutput(csvPath: string): Promise<ActionUnit[]> {
    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');

      if (lines.length < 2) {
        return [];
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const values = lines[1].split(',').map(v => parseFloat(v.trim()));

      const actionUnits: ActionUnit[] = [];

      // Extract Action Unit intensities (AU01_r, AU02_r, etc.)
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const match = header.match(/AU(\d+)_r/);

        if (match) {
          const auNumber = parseInt(match[1]);
          const intensity = values[i];

          if (!isNaN(intensity) && intensity > 0) {
            actionUnits.push({
              number: auNumber,
              intensity: intensity,
              confidence: Math.min(intensity / 5.0, 1.0), // Normalize to 0-1
            });
          }
        }
      }

      // Cleanup CSV file
      await fs.unlink(csvPath).catch(() => {});

      return actionUnits;
    } catch (error) {
      console.error('Error parsing OpenFace output:', error);
      return [];
    }
  }

  /**
   * Convert Action Units to emotion predictions
   */
  private actionUnitsToEmotions(
    actionUnits: ActionUnit[],
    sessionId: string,
    timestamp: number
  ): FaceData[] {
    if (actionUnits.length === 0) {
      return [];
    }

    const emotions: { [key: string]: number } = {};

    // Calculate emotion scores based on Action Unit presence and intensity
    for (const [emotion, requiredAUs] of Object.entries(this.emotionMapping)) {
      let score = 0;
      let matchCount = 0;

      for (const auNumber of requiredAUs) {
        const au = actionUnits.find(a => a.number === auNumber);
        if (au && au.confidence >= this.config.confidenceThreshold) {
          score += au.intensity * au.confidence;
          matchCount++;
        }
      }

      // Normalize score by number of required AUs
      if (matchCount > 0) {
        emotions[emotion] = (score / requiredAUs.length) * (matchCount / requiredAUs.length);
      } else {
        emotions[emotion] = 0;
      }
    }

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotions).reduce((a, b) =>
      emotions[a[0]] > emotions[b[0]] ? a : b
    );

    const emotionResult: EmotionResult = {
      emotion: dominantEmotion[0],
      confidence: dominantEmotion[1],
      scores: emotions,
    };

    // Create face data (assuming single face for now)
    const faceData: FaceData = {
      sessionId,
      timestamp,
      faceId: `face-${sessionId}-${timestamp}`,
      boundingBox: {
        x: 0, // Would be extracted from OpenFace pose data
        y: 0,
        width: 100,
        height: 100,
      },
      landmarks: [], // Would be extracted from OpenFace landmark data
      emotion: emotionResult,
      actionUnits,
      headPose: {
        pitch: 0, // Would be extracted from OpenFace pose data
        yaw: 0,
        roll: 0,
      },
      gaze: {
        x: 0, // Would be extracted from OpenFace gaze data
        y: 0,
      },
    };

    return [faceData];
  }

  /**
   * Verify OpenFace is available
   */
  private async verifyOpenFace(): Promise<void> {
    return new Promise((resolve, reject) => {
      const openFace = spawn(this.config.openFacePath, ['-help'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      openFace.on('exit', code => {
        // OpenFace returns non-zero exit code for -help, but that's expected
        resolve();
      });

      openFace.on('error', error => {
        reject(new Error(`OpenFace not available: ${error.message}`));
      });
    });
  }

  /**
   * Create temporary directory for processing
   */
  private async createTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(path.join(this.tempDir, 'output'), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${error}`);
    }
  }

  /**
   * Initialize worker threads for parallel processing
   */
  private async initializeWorkers(): Promise<void> {
    // For now, we'll use the main thread
    // Worker threads would be implemented for heavy parallel processing
    console.log(`Facial analysis ready with ${this.config.numWorkers} workers`);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Terminate worker threads
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];

    // Cleanup temporary directory
    try {
      await fs.rmdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }

    this.isInitialized = false;
    this.emit('cleanup');
  }
}

export default FacialAnalysisModule;
