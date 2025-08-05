/**
 * Test setup for Media Capture POC
 * Provides browser API mocks for Node.js testing environment
 */

// Mock MediaDevices API
const mockMediaDevices = {
  getUserMedia: jest.fn(),
  enumerateDevices: jest.fn(),
  getSupportedConstraints: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock MediaStream API
const mockMediaStream = {
  getTracks: jest.fn(() => []),
  getVideoTracks: jest.fn(() => []),
  getAudioTracks: jest.fn(() => []),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  clone: jest.fn(),
  active: true,
  id: 'mock-stream-id',
};

// Mock MediaStreamTrack
const mockMediaStreamTrack = {
  stop: jest.fn(),
  kind: 'video',
  label: 'Mock Camera',
  enabled: true,
  muted: false,
  readyState: 'live' as const,
};

// Setup global mocks
Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: mockMediaDevices,
  },
  writable: true,
});

Object.defineProperty(global, 'MediaStream', {
  value: jest.fn(() => mockMediaStream),
  writable: true,
});

Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

// Export mocks for use in tests
export { mockMediaDevices, mockMediaStream, mockMediaStreamTrack };
