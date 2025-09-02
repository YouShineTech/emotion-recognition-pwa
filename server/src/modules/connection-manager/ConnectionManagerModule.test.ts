/**
 * Connection Manager Module Tests
 *
 * Tests for distributed session management and scalability features
 */

import { ConnectionManagerModule, SessionData } from './ConnectionManagerModule';
import { createClient, RedisClientType } from 'redis';

// Mock Redis client
const mockRedis = {
  isReady: true,
  setEx: jest.fn(),
  get: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
} as any;

describe('ConnectionManagerModule', () => {
  let connectionManager: ConnectionManagerModule;

  beforeEach(() => {
    jest.clearAllMocks();
    connectionManager = new ConnectionManagerModule(mockRedis);
  });

  afterEach(async () => {
    await connectionManager.cleanup();
  });

  describe('Session Management', () => {
    it('should create a new session', async () => {
      const sessionId = 'test-session-1';
      const sessionData = {
        workerId: 12345,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockRedis.setEx.mockResolvedValue('OK');

      const result = await connectionManager.createSession(sessionId, sessionData);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
      expect(result.workerId).toBe(12345);
      expect(result.status).toBe('active');
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `session:${sessionId}`,
        4 * 60 * 60, // 4 hours TTL
        expect.any(String)
      );
    });

    it('should get an existing session', async () => {
      const sessionId = 'test-session-2';
      const mockSessionData: SessionData = {
        sessionId,
        workerId: 12345,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSessionData));
      mockRedis.setEx.mockResolvedValue('OK');

      const result = await connectionManager.getSession(sessionId);

      expect(result).toBeDefined();
      expect(result?.sessionId).toBe(sessionId);
      expect(result?.status).toBe('active');
      expect(mockRedis.get).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should return null for non-existent session', async () => {
      const sessionId = 'non-existent-session';
      mockRedis.get.mockResolvedValue(null);

      const result = await connectionManager.getSession(sessionId);

      expect(result).toBeNull();
    });

    it('should update session data', async () => {
      const sessionId = 'test-session-3';
      const existingSession: SessionData = {
        sessionId,
        workerId: 12345,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedis.setEx.mockResolvedValue('OK');

      const updates = { status: 'inactive' as const };
      const result = await connectionManager.updateSession(sessionId, updates);

      expect(result).toBe(true);
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `session:${sessionId}`,
        4 * 60 * 60,
        expect.stringContaining('"status":"inactive"')
      );
    });

    it('should close a session', async () => {
      const sessionId = 'test-session-4';
      const existingSession: SessionData = {
        sessionId,
        workerId: 12345,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedis.setEx.mockResolvedValue('OK');

      const result = await connectionManager.closeSession(sessionId);

      expect(result).toBe(true);
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `session:${sessionId}`,
        60, // 1 minute TTL for cleanup
        expect.stringContaining('"status":"terminated"')
      );
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should get active session count', async () => {
      const mockSessions = [
        { sessionId: 'session1', status: 'active' },
        { sessionId: 'session2', status: 'active' },
        { sessionId: 'session3', status: 'terminated' },
      ];

      mockRedis.keys.mockResolvedValue([
        'session:session1',
        'session:session2',
        'session:session3',
      ]);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockSessions[0]))
        .mockResolvedValueOnce(JSON.stringify(mockSessions[1]))
        .mockResolvedValueOnce(JSON.stringify(mockSessions[2]));

      const count = await connectionManager.getActiveSessionCount();

      expect(count).toBe(2); // Only active sessions
    });

    it('should get total session count', async () => {
      mockRedis.keys.mockResolvedValue(['session:1', 'session:2', 'session:3']);

      const count = await connectionManager.getTotalSessionCount();

      expect(count).toBe(3);
    });

    it('should get connection metrics', async () => {
      const now = new Date();
      const mockSessions = [
        {
          sessionId: 'session1',
          status: 'active',
          createdAt: new Date(now.getTime() - 60000), // 1 minute ago
        },
        {
          sessionId: 'session2',
          status: 'inactive',
          createdAt: new Date(now.getTime() - 120000), // 2 minutes ago
        },
      ];

      mockRedis.keys.mockResolvedValue(['session:session1', 'session:session2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockSessions[0]))
        .mockResolvedValueOnce(JSON.stringify(mockSessions[1]));
      mockRedis.get.mockResolvedValueOnce('5'); // connections per second

      const metrics = await connectionManager.getConnectionMetrics();

      expect(metrics.totalSessions).toBe(2);
      expect(metrics.activeSessions).toBe(1);
      expect(metrics.inactiveSessions).toBe(1);
      expect(metrics.averageSessionDuration).toBeGreaterThan(0);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup sessions for a specific client', async () => {
      const clientId = 'client-123';
      const mockSessions = [
        { sessionId: 'session1', clientId, status: 'active' },
        { sessionId: 'session2', clientId: 'other-client', status: 'active' },
      ];

      mockRedis.keys.mockResolvedValue(['session:session1', 'session:session2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockSessions[0]))
        .mockResolvedValueOnce(JSON.stringify(mockSessions[1]));
      mockRedis.setEx.mockResolvedValue('OK');

      const cleanedCount = await connectionManager.cleanupClientSessions(clientId);

      expect(cleanedCount).toBe(1); // Only one session for the client
    });

    it('should get sessions by worker ID', async () => {
      const workerId = 12345;
      const mockSessions = [
        { sessionId: 'session1', workerId, status: 'active' },
        { sessionId: 'session2', workerId: 67890, status: 'active' },
      ];

      mockRedis.keys.mockResolvedValue(['session:session1', 'session:session2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockSessions[0]))
        .mockResolvedValueOnce(JSON.stringify(mockSessions[1]));

      const workerSessions = await connectionManager.getSessionsByWorker(workerId);

      expect(workerSessions).toHaveLength(1);
      expect(workerSessions[0]?.workerId).toBe(workerId);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedis.setEx.mockRejectedValue(new Error('Redis connection failed'));

      await expect(connectionManager.createSession('test-session', {})).rejects.toThrow(
        'Session creation failed'
      );
    });

    it('should handle malformed session data', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await connectionManager.getSession('test-session');

      expect(result).toBeNull();
    });

    it('should return 0 for metrics when Redis fails', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const count = await connectionManager.getActiveSessionCount();
      expect(count).toBe(0);

      const totalCount = await connectionManager.getTotalSessionCount();
      expect(totalCount).toBe(0);
    });
  });

  describe('Scalability Features', () => {
    it('should support high-frequency session operations', async () => {
      mockRedis.setEx.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          sessionId: 'test',
          workerId: 123,
          status: 'active',
          createdAt: new Date(),
          lastActivity: new Date(),
        })
      );

      // Simulate 100 concurrent operations
      const operations = Array.from({ length: 100 }, (_, i) =>
        connectionManager.createSession(`session-${i}`, { workerId: i })
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(100);
      expect(mockRedis.setEx).toHaveBeenCalledTimes(100);
    });

    it('should handle session TTL correctly for cleanup', async () => {
      const sessionId = 'expiring-session';
      mockRedis.setEx.mockResolvedValue('OK');

      await connectionManager.createSession(sessionId, {});

      // Verify TTL is set to 4 hours for active sessions
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `session:${sessionId}`,
        4 * 60 * 60,
        expect.any(String)
      );
    });
  });
});
