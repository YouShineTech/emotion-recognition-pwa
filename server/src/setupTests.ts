// Jest setup for server-side tests

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Different port for tests

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
    flushall: jest.fn().mockResolvedValue('OK')
  })
}));

// Mock Mediasoup
jest.mock('mediasoup', () => ({
  createWorker: jest.fn().mockResolvedValue({
    createRouter: jest.fn().mockResolvedValue({
      createWebRtcTransport: jest.fn().mockResolvedValue({
        connect: jest.fn().mockResolvedValue(undefined),
        produce: jest.fn().mockResolvedValue({
          id: 'producer-id',
          kind: 'video'
        }),
        consume: jest.fn().mockResolvedValue({
          id: 'consumer-id',
          kind: 'video'
        })
      })
    }),
    close: jest.fn().mockResolvedValue(undefined)
  })
}));

// Mock OpenCV
jest.mock('opencv4nodejs', () => ({
  imread: jest.fn().mockReturnValue({}),
  imwrite: jest.fn().mockReturnValue(true),
  CascadeClassifier: jest.fn().mockImplementation(() => ({
    detectMultiScale: jest.fn().mockReturnValue([])
  }))
}));

// Mock TensorFlow
jest.mock('@tensorflow/tfjs-node', () => ({
  loadLayersModel: jest.fn().mockResolvedValue({
    predict: jest.fn().mockReturnValue({
      dataSync: jest.fn().mockReturnValue([0.1, 0.2, 0.3, 0.4])
    })
  }),
  tensor: jest.fn().mockReturnValue({
    reshape: jest.fn().mockReturnThis(),
    expandDims: jest.fn().mockReturnThis()
  })
}));

// Mock child_process for external tools
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: {
      on: jest.fn(),
      pipe: jest.fn()
    },
    stderr: {
      on: jest.fn()
    },
    on: jest.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 100);
      }
    }),
    kill: jest.fn()
  }),
  exec: jest.fn((command, callback) => {
    callback(null, 'mock output', '');
  })
}));

// Global test setup
beforeAll(async () => {
  // Setup test database or other resources
});

afterAll(async () => {
  // Cleanup test resources
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(15000);