// Test setup for client-side tests
// Jest configuration and global mocks

import 'jest-environment-jsdom';

// Mock MediaStream and related WebRTC APIs for testing
global.MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn().mockReturnValue([
    {
      stop: jest.fn(),
      kind: 'video',
      enabled: true,
    },
    {
      stop: jest.fn(),
      kind: 'audio',
      enabled: true,
    },
  ]),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  getVideoTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
  getAudioTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
}));

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream()),
    enumerateDevices: jest.fn().mockResolvedValue([
      {
        deviceId: 'mock-camera-1',
        kind: 'videoinput',
        label: 'Mock Camera 1',
        groupId: 'group1',
      },
      {
        deviceId: 'mock-mic-1',
        kind: 'audioinput',
        label: 'Mock Microphone 1',
        groupId: 'group1',
      },
    ]),
  },
});

// Mock RTCPeerConnection
const mockRTCPeerConnection = jest.fn().mockImplementation(() => ({
  createDataChannel: jest.fn().mockReturnValue({
    send: jest.fn(),
    close: jest.fn(),
    readyState: 'open',
    onmessage: null,
  }),
  addTrack: jest.fn(),
  close: jest.fn(),
  connectionState: 'connected',
  onconnectionstatechange: null,
  createOffer: jest.fn().mockResolvedValue({}),
  createAnswer: jest.fn().mockResolvedValue({}),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
}));

// Add static method
(mockRTCPeerConnection as any).generateCertificate = jest.fn().mockResolvedValue({});

global.RTCPeerConnection = mockRTCPeerConnection as any;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock Notification API
const mockNotification = jest.fn().mockImplementation((title, options) => ({
  title,
  ...options,
  close: jest.fn(),
}));

// Add static properties
Object.defineProperty(mockNotification, 'permission', {
  writable: true,
  value: 'granted',
});

Object.defineProperty(mockNotification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted'),
});

global.Notification = mockNotification as any;

// Mock Service Worker API
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({
      waiting: null,
      update: jest.fn(),
      unregister: jest.fn(),
    }),
    addEventListener: jest.fn(),
  },
});

// Mock Canvas API for overlay rendering
global.HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
});

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  writable: true,
  value: 640,
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  writable: true,
  value: 480,
});

// Mock window.matchMedia for PWA detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(display-mode: standalone)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Web Share API
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

// Console log suppression for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress console logs during tests unless explicitly needed
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods after each test
  console.log = originalConsoleLog;
  console.error = originalConsoleError;

  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
export const createMockVideoElement = (): HTMLVideoElement => {
  const video = document.createElement('video');
  Object.defineProperty(video, 'videoWidth', { value: 640 });
  Object.defineProperty(video, 'videoHeight', { value: 480 });
  return video;
};

export const createMockMediaStream = (): MediaStream => {
  return new MediaStream();
};

export const waitForAsync = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
