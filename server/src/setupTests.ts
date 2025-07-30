// Test setup for server-side tests
// Jest configuration and global mocks

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

// Mock Mediasoup (conditional mock - only if module is used)
jest.mock(
  'mediasoup',
  () => ({
    createWorker: jest.fn().mockResolvedValue({
      pid: 12345,
      createRouter: jest.fn().mockResolvedValue({
        id: 'mock-router-id',
        createWebRtcTransport: jest.fn().mockResolvedValue({
          id: 'mock-transport-id',
          connect: jest.fn().mockResolvedValue(undefined),
          produce: jest.fn().mockResolvedValue({
            id: 'mock-producer-id',
            kind: 'video',
          }),
          consume: jest.fn().mockResolvedValue({
            id: 'mock-consumer-id',
            kind: 'video',
          }),
        }),
        createPlainTransport: jest.fn().mockResolvedValue({
          id: 'mock-plain-transport-id',
          connect: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    }),
    getSupportedRtpCapabilities: jest.fn().mockReturnValue({
      codecs: [
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
        },
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
        },
      ],
    }),
  }),
  { virtual: true }
);

// Mock child_process for OpenFace and Python integrations
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: {
      on: jest.fn(),
      pipe: jest.fn(),
    },
    stderr: {
      on: jest.fn(),
    },
    on: jest.fn((event, callback) => {
      if (event === 'close') {
        // Simulate successful process completion
        setTimeout(() => callback(0), 100);
      }
    }),
    kill: jest.fn(),
    pid: 12345,
  }),
  exec: jest.fn().mockImplementation((command, callback) => {
    // Simulate successful command execution
    setTimeout(() => callback(null, 'mock output', ''), 100);
  }),
}));

// Mock fs for file operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
    on: jest.fn(),
  }),
  createWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  }),
}));

// Mock Winston logger to prevent file system operations during tests
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  requestLogger: jest.fn((req, res, next) => next()),
}));

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    close: jest.fn(),
  })),
}));

// Mock Express for HTTP server testing
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.on = jest.fn();
  res.statusCode = 200;
  return res;
};

const mockRequest = (options: any = {}) => ({
  method: 'GET',
  url: '/',
  originalUrl: '/',
  params: {},
  query: {},
  body: {},
  headers: {},
  get: jest.fn().mockReturnValue('test-user-agent'),
  ip: '127.0.0.1',
  ...options,
});

// Global test utilities
export const createMockRequest = mockRequest;
export const createMockResponse = mockResponse;

export const createMockVideoFrame = (sessionId: string = 'test-session') => ({
  sessionId,
  timestamp: new Date(),
  imageData: new ArrayBuffer(1024),
  width: 640,
  height: 480,
  format: 'RGBA' as const,
});

export const createMockAudioChunk = (sessionId: string = 'test-session') => ({
  sessionId,
  timestamp: new Date(),
  audioBuffer: new ArrayBuffer(512),
  duration: 1000,
  sampleRate: 48000 as const,
  channels: 2 as const,
});

export const waitForAsync = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

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
