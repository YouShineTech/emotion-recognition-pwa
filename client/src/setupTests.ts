// Jest setup for client-side tests

// Mock WebRTC APIs
const mockRTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn(),
  createAnswer: jest.fn(),
  setLocalDescription: jest.fn(),
  setRemoteDescription: jest.fn(),
  addIceCandidate: jest.fn(),
  addTrack: jest.fn(),
  createDataChannel: jest.fn().mockReturnValue({
    send: jest.fn(),
    close: jest.fn(),
    readyState: 'open',
  }),
  close: jest.fn(),
  connectionState: 'connected',
  onconnectionstatechange: null,
}));

// Add the generateCertificate static method
(mockRTCPeerConnection as any).generateCertificate = jest.fn().mockResolvedValue({});

global.RTCPeerConnection = mockRTCPeerConnection as any;

global.RTCSessionDescription = jest.fn();
global.RTCIceCandidate = jest.fn();

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn(), kind: 'video' },
        { stop: jest.fn(), kind: 'audio' },
      ]),
    }),
    enumerateDevices: jest.fn().mockResolvedValue([
      { deviceId: 'camera1', kind: 'videoinput', label: 'Camera 1' },
      { deviceId: 'mic1', kind: 'audioinput', label: 'Microphone 1' },
    ]),
  },
});

// Mock MediaStream
const mockMediaStream = {
  getTracks: jest.fn().mockReturnValue([]),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
};
global.MediaStream = jest.fn().mockImplementation(() => mockMediaStream);

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
});

// Mock console methods for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is deprecated')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(10000);
