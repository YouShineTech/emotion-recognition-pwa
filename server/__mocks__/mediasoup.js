// Manual mock for mediasoup module
module.exports = {
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
};
