// Client Entry Point
// Emotion Recognition PWA Frontend

import { MediaCaptureModule } from './modules/media-capture/MediaCaptureModule';
import { WebRTCTransportModule } from './modules/webrtc-transport/WebRTCTransportModule';

// Initialize modules
const mediaCaptureModule = new MediaCaptureModule();
const webrtcTransportModule = new WebRTCTransportModule();

// Application state
interface AppState {
  isConnected: boolean;
  sessionId: string | null;
  currentStream: MediaStream | null;
}

const appState: AppState = {
  isConnected: false,
  sessionId: null,
  currentStream: null,
};

// DOM elements
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const stopButton = document.getElementById('stop-button') as HTMLButtonElement;
const videoElement = document.getElementById('video-preview') as HTMLVideoElement;
const statusElement = document.getElementById('status') as HTMLDivElement;

// Initialize application
async function initializeApp(): Promise<void> {
  console.log('[App] Initializing Emotion Recognition PWA...');

  // Set up event listeners
  startButton.addEventListener('click', startEmotionRecognition);
  stopButton.addEventListener('click', stopEmotionRecognition);

  // Update UI
  updateUI();

  console.log('[App] Application initialized');
}

// Start emotion recognition session
async function startEmotionRecognition(): Promise<void> {
  try {
    updateStatus('Requesting permissions...');

    // Request media permissions
    const permissionResult = await mediaCaptureModule.requestPermissions();
    if (!permissionResult.success) {
      throw new Error('Permission denied');
    }

    updateStatus('Starting media capture...');

    // Start media capture
    const stream = await mediaCaptureModule.startCapture({
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 15, ideal: 30, max: 60 },
        facingMode: 'user',
      },
      audio: {
        sampleRate: 48000,
        channelCount: 2,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Display video preview
    videoElement.srcObject = stream;
    appState.currentStream = stream;

    updateStatus('Connecting to server...');

    // Initialize WebRTC connection
    const transportResult = await webrtcTransportModule.initialize({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      signalingUrl: 'ws://localhost:3001',
      sessionId: `session_${Date.now()}`,
      stunServers: ['stun:stun.l.google.com:19302'],
    });

    if (!transportResult.success) {
      throw new Error('Failed to initialize WebRTC connection');
    }

    // Attach media stream to WebRTC
    await webrtcTransportModule.attachMediaStream(stream);

    // Set up overlay data reception
    webrtcTransportModule.onDataReceived(overlayData => {
      console.log('[App] Received overlay data:', overlayData);
      // TODO: Render overlays on video
    });

    appState.isConnected = true;
    appState.sessionId = transportResult.connectionId || null;

    updateStatus('Connected - Emotion recognition active');
    updateUI();
  } catch (error) {
    console.error('[App] Error starting emotion recognition:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    updateStatus(`Error: ${errorMessage}`);
    stopEmotionRecognition();
  }
}

// Stop emotion recognition session
function stopEmotionRecognition(): void {
  console.log('[App] Stopping emotion recognition...');

  // Stop media capture
  mediaCaptureModule.stopCapture();

  // Disconnect WebRTC
  webrtcTransportModule.disconnect();

  // Clear video preview
  videoElement.srcObject = null;

  // Reset state
  appState.isConnected = false;
  appState.sessionId = null;
  appState.currentStream = null;

  updateStatus('Disconnected');
  updateUI();
}

// Update UI based on application state
function updateUI(): void {
  startButton.disabled = appState.isConnected;
  stopButton.disabled = !appState.isConnected;

  if (appState.isConnected) {
    startButton.textContent = 'Connected';
    stopButton.textContent = 'Stop Recognition';
  } else {
    startButton.textContent = 'Start Emotion Recognition';
    stopButton.textContent = 'Stop';
  }
}

// Update status message
function updateStatus(message: string): void {
  statusElement.textContent = message;
  console.log(`[App] Status: ${message}`);
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for testing
export { initializeApp, startEmotionRecognition, stopEmotionRecognition };
