/**
 * Audio Analysis Module
 *
 * Processes audio streams for emotion recognition using ML models
 * Integrates with Python-based librosa and TensorFlow for feature extraction and classification
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import {
  IAudioAnalysisModule,
  AudioAnalysisConfig,
  AudioEmotionResult,
  AudioFeatures,
} from '@/shared/interfaces/audio-analysis.interface';

export class AudioAnalysisModule extends EventEmitter implements IAudioAnalysisModule {
  private config: AudioAnalysisConfig;
  private isInitialized = false;
  private pythonProcess: ChildProcess | null = null;
  private tempDir: string;
  private modelPath: string;
  private vadEnabled = true;

  // Emotion labels (RAVDESS dataset standard)
  private readonly emotionLabels = [
    'neutral',
    'calm',
    'happy',
    'sad',
    'angry',
    'fearful',
    'disgust',
    'surprised',
  ];

  // Sliding window configuration
  private readonly windowConfig = {
    windowSize: 1.0, // 1 second
    overlap: 0.5, // 50% overlap
    minDuration: 0.5, // Minimum audio duration to analyze
  };

  constructor(config: AudioAnalysisConfig = {}) {
    super();

    this.config = {
      pythonPath: 'python3',
      modelType: 'fast', // 'fast' (MobileNet) or 'accurate' (ResNet)
      sampleRate: 48000,
      confidenceThreshold: 0.6,
      vadThreshold: 0.5,
      tempDir: '/tmp/audio-analysis',
      modelPath: './models/audio-emotion',
      ...config,
    };

    this.tempDir = this.config.tempDir || '/tmp/audio-analysis';
    this.modelPath = this.config.modelPath || './models/audio-emotion';
  }

  /**
   * Initialize the audio analysis module
   */
  async initialize(): Promise<void> {
    try {
      // Verify Python and dependencies
      await this.verifyPythonEnvironment();

      // Create temporary directory
      await this.createTempDirectory();

      // Load ML model
      await this.loadModel();

      // Start Python analysis process
      await this.startPythonProcess();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('AudioAnalysisModule initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioAnalysisModule:', error);
      throw error;
    }
  }

  /**
   * Analyze audio chunk for emotions
   */
  async analyzeAudio(
    audioData: Buffer,
    sessionId: string,
    timestamp: number
  ): Promise<AudioEmotionResult> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized');
    }

    try {
      // Apply Voice Activity Detection
      if (this.vadEnabled) {
        const hasVoice = await this.detectVoiceActivity(audioData);
        if (!hasVoice) {
          return this.createSilenceResult(sessionId, timestamp);
        }
      }

      // Save audio to temporary file
      const audioId = `${sessionId}-${timestamp}`;
      const audioPath = path.join(this.tempDir, `${audioId}.wav`);
      await this.saveAudioFile(audioData, audioPath);

      // Extract features and predict emotion
      const result = await this.processAudioFile(audioPath, sessionId, timestamp);

      // Cleanup temporary file
      await fs.unlink(audioPath).catch(() => {}); // Ignore errors

      this.emit('audioAnalyzed', { sessionId, result });
      return result;
    } catch (error) {
      console.error('Error analyzing audio:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process multiple audio chunks in batch
   */
  async analyzeBatch(
    audioChunks: Array<{ data: Buffer; sessionId: string; timestamp: number }>
  ): Promise<AudioEmotionResult[]> {
    const results = await Promise.all(
      audioChunks.map(chunk => this.analyzeAudio(chunk.data, chunk.sessionId, chunk.timestamp))
    );

    return results;
  }

  /**
   * Enable/disable Voice Activity Detection
   */
  setVAD(enabled: boolean): void {
    this.vadEnabled = enabled;
    this.emit('vadToggled', { enabled });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AudioAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get analysis statistics
   */
  getStats(): any {
    return {
      isInitialized: this.isInitialized,
      modelType: this.config.modelType,
      sampleRate: this.config.sampleRate,
      confidenceThreshold: this.config.confidenceThreshold,
      vadEnabled: this.vadEnabled,
      windowConfig: this.windowConfig,
    };
  }

  /**
   * Detect voice activity in audio data
   */
  private async detectVoiceActivity(audioData: Buffer): Promise<boolean> {
    try {
      // Simple energy-based VAD (would be replaced with py-webrtcvad in production)
      const samples = new Int16Array(audioData.buffer);
      let energy = 0;

      for (let i = 0; i < samples.length; i++) {
        energy += samples[i] * samples[i];
      }

      const avgEnergy = energy / samples.length;
      const threshold = this.config.vadThreshold * 1000000; // Adjust threshold

      return avgEnergy > threshold;
    } catch (error) {
      console.warn('VAD error, assuming voice present:', error);
      return true;
    }
  }

  /**
   * Save audio buffer to WAV file
   */
  private async saveAudioFile(audioData: Buffer, filePath: string): Promise<void> {
    // Create WAV header
    const sampleRate = this.config.sampleRate;
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = audioData.length;
    const fileSize = 36 + dataSize;

    const header = Buffer.alloc(44);

    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);

    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const wavFile = Buffer.concat([header, audioData]);
    await fs.writeFile(filePath, wavFile);
  }

  /**
   * Process audio file with Python ML pipeline
   */
  private async processAudioFile(
    audioPath: string,
    sessionId: string,
    timestamp: number
  ): Promise<AudioEmotionResult> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Python process not available'));
        return;
      }

      const request = {
        action: 'analyze',
        audioPath,
        sessionId,
        timestamp,
        config: {
          modelType: this.config.modelType,
          sampleRate: this.config.sampleRate,
        },
      };

      // Send request to Python process
      this.pythonProcess.stdin?.write(JSON.stringify(request) + '\n');

      // Set up one-time response handler
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());

          if (response.sessionId === sessionId && response.timestamp === timestamp) {
            this.pythonProcess?.stdout?.off('data', responseHandler);

            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          reject(new Error(`Failed to parse Python response: ${error}`));
        }
      };

      this.pythonProcess.stdout?.on('data', responseHandler);

      // Timeout after 5 seconds
      setTimeout(() => {
        this.pythonProcess?.stdout?.off('data', responseHandler);
        reject(new Error('Audio analysis timeout'));
      }, 5000);
    });
  }

  /**
   * Create result for silence/no voice detected
   */
  private createSilenceResult(sessionId: string, timestamp: number): AudioEmotionResult {
    const scores: { [key: string]: number } = {};
    this.emotionLabels.forEach(label => {
      scores[label] = label === 'neutral' ? 1.0 : 0.0;
    });

    return {
      sessionId,
      timestamp,
      emotion: 'neutral',
      confidence: 1.0,
      scores,
      features: {
        mfcc: [],
        spectralCentroid: 0,
        zeroCrossingRate: 0,
        energy: 0,
      },
      voiceActivity: false,
      duration: this.windowConfig.windowSize,
    };
  }

  /**
   * Verify Python environment and dependencies
   */
  private async verifyPythonEnvironment(): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn(
        this.config.pythonPath || 'python3',
        ['-c', 'import librosa, tensorflow, numpy; print("OK")'],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      let output = '';
      python.stdout?.on('data', data => {
        output += data.toString();
      });

      python.on('exit', code => {
        if (code === 0 && output.includes('OK')) {
          resolve();
        } else {
          reject(new Error('Python dependencies not available (librosa, tensorflow, numpy)'));
        }
      });

      python.on('error', error => {
        reject(new Error(`Python not available: ${error.message}`));
      });
    });
  }

  /**
   * Create temporary directory for processing
   */
  private async createTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${error}`);
    }
  }

  /**
   * Load ML model (verify model files exist)
   */
  private async loadModel(): Promise<void> {
    try {
      const modelFile = path.join(this.modelPath, `${this.config.modelType}_model.h5`);
      await fs.access(modelFile);
      console.log(`Audio emotion model loaded: ${modelFile}`);
    } catch (error) {
      console.warn(`Model file not found: ${this.modelPath}, using default model`);
    }
  }

  /**
   * Start Python analysis process
   */
  private async startPythonProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Python script for audio emotion analysis
      const pythonScript = path.join(__dirname, 'audio_emotion_analyzer.py');

      this.pythonProcess = spawn(this.config.pythonPath || 'python3', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.pythonProcess.stdout?.on('data', data => {
        const output = data.toString().trim();
        if (output === 'READY') {
          resolve();
        }
      });

      this.pythonProcess.stderr?.on('data', data => {
        console.error('Python process error:', data.toString());
      });

      this.pythonProcess.on('exit', code => {
        console.log(`Python process exited with code ${code}`);
        this.pythonProcess = null;
      });

      this.pythonProcess.on('error', error => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Send initialization message
      const initMessage = {
        action: 'init',
        config: {
          modelPath: this.modelPath,
          modelType: this.config.modelType,
          emotionLabels: this.emotionLabels,
        },
      };

      this.pythonProcess.stdin?.write(JSON.stringify(initMessage) + '\n');
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Terminate Python process
    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
    }

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

export default AudioAnalysisModule;
