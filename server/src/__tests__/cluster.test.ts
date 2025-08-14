/**
 * Cluster Manager Tests
 *
 * Tests for horizontal scaling and worker management
 */

import cluster from 'cluster';
import os from 'os';

// Mock cluster and os modules
jest.mock('cluster', () => ({
  isPrimary: true,
  fork: jest.fn(),
  on: jest.fn(),
  workers: {},
}));

jest.mock('os', () => ({
  cpus: jest.fn().mockReturnValue(new Array(4)), // Mock 4 CPU cores
}));

// Mock the server creation
jest.mock('../server', () => ({
  createServer: jest.fn().mockResolvedValue({
    listen: jest.fn((port, callback) => callback()),
    connections: 0,
  }),
}));

describe('Cluster Manager', () => {
  let ClusterManager: any;
  let mockWorker: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset cluster mock
    (cluster as any).isPrimary = true;
    (cluster as any).workers = {};

    // Mock worker
    mockWorker = {
      process: { pid: 12345 },
      on: jest.fn(),
      kill: jest.fn(),
      disconnect: jest.fn(),
      isDead: jest.fn().mockReturnValue(false),
      exitedAfterDisconnect: false,
    };

    (cluster.fork as jest.Mock).mockReturnValue(mockWorker);

    // Re-import ClusterManager after mocks are set up
    delete require.cache[require.resolve('../cluster')];
    ClusterManager = require('../cluster').default;
  });

  describe('Master Process Initialization', () => {
    it('should fork correct number of workers based on CPU count', async () => {
      const clusterManager = new ClusterManager();

      // Mock environment variable
      process.env.MAX_WORKERS = '8';

      await clusterManager.initialize();

      expect(cluster.fork).toHaveBeenCalledTimes(8);
    });

    it('should use default worker count when MAX_WORKERS not set', async () => {
      delete process.env.MAX_WORKERS;

      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Should use numCPUs * 2 = 4 * 2 = 8
      expect(cluster.fork).toHaveBeenCalledTimes(8);
    });

    it('should set up event listeners for worker management', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      expect(cluster.on).toHaveBeenCalledWith('exit', expect.any(Function));
    });

    it('should track worker metrics', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      const metrics = clusterManager.getMetrics();
      expect(metrics.workers).toBeGreaterThan(0);
      expect(metrics.totalConnections).toBe(0);
      expect(metrics.totalMemory).toBe(0);
    });
  });

  describe('Worker Process Management', () => {
    it('should restart worker when it dies unexpectedly', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Get the exit handler
      const exitHandler = (cluster.on as jest.Mock).mock.calls.find(call => call[0] === 'exit')[1];

      // Simulate worker death
      exitHandler(mockWorker, 1, 'SIGTERM');

      // Should fork a new worker (original + replacement)
      expect(cluster.fork).toHaveBeenCalledTimes(9); // 8 original + 1 replacement
    });

    it('should not restart worker on intentional shutdown', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      const exitHandler = (cluster.on as jest.Mock).mock.calls.find(call => call[0] === 'exit')[1];

      // Simulate intentional shutdown
      mockWorker.exitedAfterDisconnect = true;
      exitHandler(mockWorker, 0, null);

      // Should not fork replacement worker
      expect(cluster.fork).toHaveBeenCalledTimes(8); // Only original workers
    });

    it('should handle worker message events', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Verify worker message handler is set up
      expect(mockWorker.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('Worker Process (Non-Master)', () => {
    beforeEach(() => {
      (cluster as any).isPrimary = false;
    });

    it('should start server when running as worker', async () => {
      const { createServer } = require('../server');

      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      expect(createServer).toHaveBeenCalled();
    });

    it('should handle server startup errors', async () => {
      const { createServer } = require('../server');
      createServer.mockRejectedValue(new Error('Server startup failed'));

      const clusterManager = new ClusterManager();

      // Mock process.exit to prevent actual exit during test
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      await clusterManager.initialize();

      expect(process.exit).toHaveBeenCalledWith(1);

      // Restore original process.exit
      process.exit = originalExit;
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should monitor worker health periodically', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Fast-forward time to trigger health check
      jest.advanceTimersByTime(10000);

      // Health monitoring should be active (tested indirectly through metrics)
      const metrics = clusterManager.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should restart unresponsive workers', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Simulate unresponsive worker by advancing time significantly
      jest.advanceTimersByTime(35000); // More than 30 second threshold

      // Should attempt to kill unresponsive worker
      expect(mockWorker.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should restart workers using excessive memory', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Simulate high memory usage message
      const messageHandler = mockWorker.on.mock.calls.find((call: any) => call[0] === 'message')[1];

      messageHandler({
        type: 'metrics',
        data: {
          memoryUsage: 600 * 1024 * 1024, // 600MB (exceeds 500MB limit)
          cpuUsage: 1000,
          connections: 50,
        },
      });

      // Fast-forward to trigger health check
      jest.advanceTimersByTime(10000);

      expect(mockWorker.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('Graceful Shutdown', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle SIGTERM gracefully', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Mock process event listeners
      const processListeners: { [key: string]: Function } = {};
      const originalOn = process.on;
      process.on = jest.fn((event: string, handler: Function) => {
        processListeners[event] = handler;
        return process;
      });

      await clusterManager.initialize();

      // Trigger SIGTERM
      if (processListeners.SIGTERM) {
        processListeners.SIGTERM();
      }

      expect(mockWorker.disconnect).toHaveBeenCalled();

      // Restore original process.on
      process.on = originalOn;
    });

    it('should force kill workers after timeout', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Mock workers that don't exit gracefully
      (cluster as any).workers = { 1: mockWorker };
      mockWorker.isDead.mockReturnValue(false);

      // Simulate graceful shutdown timeout
      jest.advanceTimersByTime(11000); // More than 10 second timeout

      expect(mockWorker.kill).toHaveBeenCalledWith('SIGKILL');
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and aggregate worker metrics', async () => {
      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Simulate metrics from multiple workers
      const messageHandler = mockWorker.on.mock.calls.find((call: any) => call[0] === 'message')[1];

      messageHandler({
        type: 'metrics',
        data: {
          memoryUsage: 100 * 1024 * 1024, // 100MB
          cpuUsage: 5000,
          connections: 25,
        },
      });

      const metrics = clusterManager.getMetrics();
      expect(metrics.totalMemory).toBeGreaterThan(0);
      expect(metrics.totalConnections).toBeGreaterThan(0);
    });

    it('should provide accurate worker count', async () => {
      process.env.MAX_WORKERS = '4';

      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      const metrics = clusterManager.getMetrics();
      expect(metrics.workers).toBe(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle worker fork failures', async () => {
      (cluster.fork as jest.Mock).mockImplementation(() => {
        throw new Error('Fork failed');
      });

      const clusterManager = new ClusterManager();

      // Should not throw, but handle gracefully
      await expect(clusterManager.initialize()).resolves.not.toThrow();
    });

    it('should handle missing worker PID', async () => {
      const workerWithoutPid = {
        ...mockWorker,
        process: {},
      };

      (cluster.fork as jest.Mock).mockReturnValue(workerWithoutPid);

      const clusterManager = new ClusterManager();
      await clusterManager.initialize();

      // Should handle gracefully without crashing
      const metrics = clusterManager.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
