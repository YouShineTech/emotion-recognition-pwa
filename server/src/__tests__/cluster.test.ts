/**
 * Cluster Manager Tests
 *
 * Tests for horizontal scaling and worker management
 */

import cluster from 'cluster';

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
  let clusterManagerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ClusterManager = require('../cluster').default;
  });

  afterEach(async () => {
    // Clean up any cluster manager instance
    if (clusterManagerInstance && typeof clusterManagerInstance.shutdown === 'function') {
      await clusterManagerInstance.shutdown();
    }

    // Remove all listeners to prevent memory leaks
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');

    jest.useRealTimers();
    jest.clearAllTimers();
  });

  describe('Master Process Initialization', () => {
    it('should fork correct number of workers based on CPU count', async () => {
      clusterManagerInstance = new ClusterManager();

      // Mock environment variable
      process.env.MAX_WORKERS = '8';

      await clusterManagerInstance.initialize();

      expect(cluster.fork).toHaveBeenCalledTimes(8);
    });

    it('should use default worker count when MAX_WORKERS not set', async () => {
      delete process.env.MAX_WORKERS;

      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Should use numCPUs * 2 = 4 * 2 = 8
      expect(cluster.fork).toHaveBeenCalledTimes(8);
    });

    it('should set up event listeners for worker management', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      expect(cluster.on).toHaveBeenCalledWith('exit', expect.any(Function));
    });

    it('should track worker metrics', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      const metrics = clusterManagerInstance.getMetrics();
      expect(metrics.workers).toBeGreaterThan(0);
      expect(metrics.totalConnections).toBe(0);
      expect(metrics.totalMemory).toBe(0);
    });
  });

  describe('Worker Process Management', () => {
    it('should restart worker when it dies unexpectedly', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Get the exit handler
      const exitHandler = (cluster.on as jest.Mock).mock.calls.find(call => call[0] === 'exit')[1];

      // Simulate worker death
      exitHandler(mockWorker, 1, 'SIGTERM');

      // Should fork a new worker (original + replacement)
      expect(cluster.fork).toHaveBeenCalledTimes(9); // 8 original + 1 replacement
    });

    it('should not restart worker on intentional shutdown', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      const exitHandler = (cluster.on as jest.Mock).mock.calls.find(call => call[0] === 'exit')[1];

      // Simulate intentional shutdown
      mockWorker.exitedAfterDisconnect = true;
      exitHandler(mockWorker, 0, null);

      // Should not fork replacement worker
      expect(cluster.fork).toHaveBeenCalledTimes(8); // Only original workers
    });

    it('should handle worker message events', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Verify worker message handler is set up
      expect(mockWorker.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('Worker Process (Non-Master)', () => {
    beforeEach(() => {
      (cluster as any).isPrimary = false;
    });

    it('should start server when running as worker', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createServer } = require('../server');

      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      expect(createServer).toHaveBeenCalled();
    });

    it('should handle server startup errors', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createServer } = require('../server');
      createServer.mockRejectedValue(new Error('Server startup failed'));

      clusterManagerInstance = new ClusterManager();

      // Mock process.exit to prevent actual exit during test
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      await clusterManagerInstance.initialize();

      expect(process.exit).toHaveBeenCalledWith(1);

      // Restore original process.exit
      process.exit = originalExit;
    });
  });

  describe('Health Monitoring', () => {
    it('should monitor worker health periodically', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Fast-forward time to trigger health check
      jest.advanceTimersByTime(10000);

      // Health monitoring should be active (tested indirectly through metrics)
      const metrics = clusterManagerInstance.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should restart unresponsive workers', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Set up cluster workers mock for the health check
      (cluster as any).workers = { 12345: mockWorker };

      // Manually add worker to the internal workers map with old timestamp
      const oldTimestamp = new Date(Date.now() - 35000); // 35 seconds ago
      clusterManagerInstance.workers.set(12345, {
        connections: 0,
        memoryUsage: 100 * 1024 * 1024,
        cpuUsage: 1000,
        lastHealthCheck: oldTimestamp,
      });

      // Simulate unresponsive worker by advancing time significantly
      jest.advanceTimersByTime(35000); // More than 30 second threshold

      // Should attempt to kill unresponsive worker
      expect(mockWorker.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should restart workers using excessive memory', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Set up cluster workers mock
      (cluster as any).workers = { 12345: mockWorker };

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
    it('should handle SIGTERM gracefully', async () => {
      clusterManagerInstance = new ClusterManager();

      // Mock process event listeners
      const processListeners: { [key: string]: (...args: any[]) => void } = {};
      const originalOn = process.on;
      process.on = jest.fn((event: string, handler: (...args: any[]) => void) => {
        processListeners[event] = handler;
        return process;
      });

      await clusterManagerInstance.initialize();

      // Set up cluster workers mock
      (cluster as any).workers = { 12345: mockWorker };

      // Trigger SIGTERM
      if (processListeners.SIGTERM) {
        processListeners.SIGTERM();
      }

      expect(mockWorker.disconnect).toHaveBeenCalled();

      // Restore original process.on
      process.on = originalOn;
    });

    it('should force kill workers after timeout', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Mock process.exit to prevent actual exit during test
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      // Mock workers that don't exit gracefully
      (cluster as any).workers = { 12345: mockWorker };
      mockWorker.isDead.mockReturnValue(false);

      // Start shutdown process (don't await as it will hang)
      clusterManagerInstance.shutdown();

      // Simulate graceful shutdown timeout
      jest.advanceTimersByTime(11000); // More than 10 second timeout

      expect(mockWorker.kill).toHaveBeenCalledWith('SIGKILL');
      expect(process.exit).toHaveBeenCalledWith(1);

      // Restore original process.exit
      process.exit = originalExit;
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and aggregate worker metrics', async () => {
      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

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

      const metrics = clusterManagerInstance.getMetrics();
      expect(metrics.totalMemory).toBeGreaterThan(0);
      expect(metrics.totalConnections).toBeGreaterThan(0);
    });

    it('should provide accurate worker count', async () => {
      process.env.MAX_WORKERS = '4';

      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Clear any existing workers and add exactly 4
      clusterManagerInstance.workers.clear();
      for (let i = 1; i <= 4; i++) {
        clusterManagerInstance.workers.set(12345 + i, {
          connections: 0,
          memoryUsage: 100 * 1024 * 1024,
          cpuUsage: 1000,
          lastHealthCheck: new Date(),
        });
      }

      const metrics = clusterManagerInstance.getMetrics();
      expect(metrics.workers).toBe(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle worker fork failures', async () => {
      (cluster.fork as jest.Mock).mockImplementation(() => {
        throw new Error('Fork failed');
      });

      clusterManagerInstance = new ClusterManager();

      // Should handle gracefully without throwing
      await expect(clusterManagerInstance.initialize()).resolves.toBeUndefined();
    });

    it('should handle missing worker PID', async () => {
      const workerWithoutPid = {
        ...mockWorker,
        process: {},
      };

      (cluster.fork as jest.Mock).mockReturnValue(workerWithoutPid);

      clusterManagerInstance = new ClusterManager();
      await clusterManagerInstance.initialize();

      // Should handle gracefully without crashing
      const metrics = clusterManagerInstance.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
