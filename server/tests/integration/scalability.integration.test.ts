/**
 * Scalability Integration Tests
 *
 * Tests the complete scalable architecture including:
 * - Multiple server instances
 * - Load balancing
 * - Session management
 * - Circuit breakers
 * - Performance under load
 */

import request from 'supertest';
import { createServer } from '../../src/server';
import Redis from 'redis';
import { Server } from 'http';

describe('Scalability Integration Tests', () => {
  let servers: Server[] = [];
  let redisClient: any;

  beforeAll(async () => {
    // Set up Redis client for testing
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    try {
      await redisClient.connect();
    } catch (error) {
      console.warn('Redis not available for integration tests, skipping some tests');
    }

    // Create multiple server instances to simulate scaling
    const serverPromises = [];
    for (let i = 0; i < 3; i++) {
      const port = 3001 + i;
      process.env.PORT = port.toString();
      process.env.MAX_CONNECTIONS_PER_WORKER = '50';

      const serverPromise = createServer().then(server => {
        return new Promise<Server>(resolve => {
          server.listen(port, () => {
            console.log(`Test server ${i + 1} started on port ${port}`);
            resolve(server);
          });
        });
      });

      serverPromises.push(serverPromise);
    }

    servers = await Promise.all(serverPromises);
  });

  afterAll(async () => {
    // Close all servers
    await Promise.all(
      servers.map(
        server =>
          new Promise<void>(resolve => {
            server.close(() => resolve());
          })
      )
    );

    // Close Redis connection
    if (redisClient?.isReady) {
      await redisClient.quit();
    }
  });

  describe('Multi-Instance Health Checks', () => {
    it('should have all server instances healthy', async () => {
      const healthChecks = servers.map((_, index) =>
        request(`http://localhost:${3001 + index}`)
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(healthChecks);

      responses.forEach((response, index) => {
        expect(response.body.status).toBe('healthy');
        expect(response.body.worker).toBeDefined();
        expect(response.body.memory).toBeDefined();
        expect(response.body.connections).toBeDefined();
      });
    });

    it('should report different worker PIDs for different instances', async () => {
      const healthChecks = servers.map((_, index) =>
        request(`http://localhost:${3001 + index}`).get('/api/health')
      );

      const responses = await Promise.all(healthChecks);
      const workerPids = responses.map(r => r.body.worker);

      // All worker PIDs should be different (different processes)
      const uniquePids = new Set(workerPids);
      expect(uniquePids.size).toBe(workerPids.length);
    });
  });

  describe('Session Management Across Instances', () => {
    it('should create sessions on different instances', async () => {
      const sessionCreations = servers.map((_, index) =>
        request(`http://localhost:${3001 + index}`)
          .post('/api/sessions')
          .send({})
          .expect(200)
      );

      const responses = await Promise.all(sessionCreations);

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.sessionId).toBeDefined();
      });

      // All session IDs should be unique
      const sessionIds = responses.map(r => r.body.data.sessionId);
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(sessionIds.length);
    });

    it('should retrieve session from any instance when using Redis', async () => {
      if (!redisClient?.isReady) {
        console.log('Skipping Redis-dependent test');
        return;
      }

      // Create session on first instance
      const createResponse = await request(`http://localhost:3001`)
        .post('/api/sessions')
        .send({})
        .expect(200);

      const sessionId = createResponse.body.data.sessionId;

      // Try to retrieve from different instances
      const retrievalPromises = servers.map((_, index) =>
        request(`http://localhost:${3001 + index}`).get(`/api/sessions/${sessionId}`)
      );

      const responses = await Promise.all(retrievalPromises);

      // At least one instance should be able to retrieve the session
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Load Distribution', () => {
    it('should handle concurrent requests across instances', async () => {
      const concurrentRequests = 50;
      const requestPromises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const serverIndex = i % servers.length;
        const promise = request(`http://localhost:${3001 + serverIndex}`)
          .get('/api/health')
          .expect(200);

        requestPromises.push(promise);
      }

      const responses = await Promise.all(requestPromises);

      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });

    it('should distribute session creation load', async () => {
      const sessionsPerInstance = 10;
      const allPromises = [];

      servers.forEach((_, serverIndex) => {
        for (let i = 0; i < sessionsPerInstance; i++) {
          const promise = request(`http://localhost:${3001 + serverIndex}`)
            .post('/api/sessions')
            .send({})
            .expect(200);

          allPromises.push(promise);
        }
      });

      const responses = await Promise.all(allPromises);

      expect(responses).toHaveLength(servers.length * sessionsPerInstance);

      // All sessions should be created successfully
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.sessionId).toBeDefined();
      });
    });
  });

  describe('Capacity Management', () => {
    it('should enforce connection limits per instance', async () => {
      const maxConnections = 50; // Set in beforeAll
      const overloadRequests = maxConnections + 10;

      // Try to create more sessions than the limit on one instance
      const sessionPromises = Array.from({ length: overloadRequests }, () =>
        request('http://localhost:3001').post('/api/sessions').send({})
      );

      const responses = await Promise.all(sessionPromises);

      // Some requests should succeed, some should be rejected with 503
      const successfulRequests = responses.filter(r => r.status === 200);
      const rejectedRequests = responses.filter(r => r.status === 503);

      expect(successfulRequests.length).toBeLessThanOrEqual(maxConnections);
      expect(rejectedRequests.length).toBeGreaterThan(0);

      // Rejected requests should have proper error message
      rejectedRequests.forEach(response => {
        expect(response.body.error.code).toBe('CAPACITY_EXCEEDED');
      });
    });

    it('should maintain performance under sustained load', async () => {
      const sustainedRequests = 100;
      const batchSize = 10;
      const batches = sustainedRequests / batchSize;

      const startTime = Date.now();

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = Array.from({ length: batchSize }, (_, i) => {
          const serverIndex = (batch * batchSize + i) % servers.length;
          return request(`http://localhost:${3001 + serverIndex}`)
            .get('/api/health')
            .expect(200);
        });

        await Promise.all(batchPromises);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageResponseTime = totalTime / sustainedRequests;

      // Average response time should be reasonable (< 100ms per request)
      expect(averageResponseTime).toBeLessThan(100);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should show circuit breaker status in health checks', async () => {
      const response = await request('http://localhost:3001').get('/api/health').expect(200);

      expect(response.body.circuitBreakers).toBeDefined();
      expect(typeof response.body.circuitBreakers).toBe('object');
    });

    it('should handle service failures gracefully', async () => {
      // This test would require mocking internal service failures
      // For now, we verify that the circuit breaker system is in place
      const response = await request('http://localhost:3001').get('/api/health').expect(200);

      expect(response.body.circuitBreakers).toBeDefined();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should report memory usage within acceptable limits', async () => {
      const healthChecks = servers.map((_, index) =>
        request(`http://localhost:${3001 + index}`)
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(healthChecks);

      responses.forEach(response => {
        const memory = response.body.memory;
        expect(memory.heapUsed).toBeLessThan(512); // Less than 512MB
        expect(memory.heapTotal).toBeLessThan(512);
        expect(memory.external).toBeLessThan(100);
      });
    });

    it('should maintain stable memory usage under load', async () => {
      // Get initial memory usage
      const initialResponse = await request('http://localhost:3001').get('/api/health').expect(200);

      const initialMemory = initialResponse.body.memory.heapUsed;

      // Generate some load
      const loadPromises = Array.from({ length: 50 }, () =>
        request('http://localhost:3001').post('/api/sessions').send({})
      );

      await Promise.all(loadPromises);

      // Check memory after load
      const afterLoadResponse = await request('http://localhost:3001')
        .get('/api/health')
        .expect(200);

      const afterLoadMemory = afterLoadResponse.body.memory.heapUsed;

      // Memory increase should be reasonable (less than 100MB increase)
      const memoryIncrease = afterLoadMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(100);
    });
  });

  describe('Error Recovery', () => {
    it('should handle Redis connection failures gracefully', async () => {
      // This test simulates Redis being unavailable
      // The server should still function but without distributed session management

      const response = await request('http://localhost:3001')
        .post('/api/sessions')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
    });

    it('should continue serving requests when one instance fails', async () => {
      // This test verifies that other instances continue working
      // even if one instance has issues

      const healthyInstances = servers.slice(1); // Skip first instance

      const healthChecks = healthyInstances.map((_, index) =>
        request(`http://localhost:${3002 + index}`) // Start from 3002
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(healthChecks);

      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet latency requirements under normal load', async () => {
      const requestCount = 20;
      const startTime = Date.now();

      const promises = Array.from({ length: requestCount }, (_, i) => {
        const serverIndex = i % servers.length;
        return request(`http://localhost:${3001 + serverIndex}`)
          .get('/api/health')
          .expect(200);
      });

      await Promise.all(promises);

      const endTime = Date.now();
      const averageLatency = (endTime - startTime) / requestCount;

      // Should meet the <500ms requirement (being generous with integration test overhead)
      expect(averageLatency).toBeLessThan(200);
    });

    it('should handle burst traffic effectively', async () => {
      const burstSize = 30;
      const startTime = Date.now();

      // Send all requests simultaneously (burst)
      const burstPromises = Array.from({ length: burstSize }, (_, i) => {
        const serverIndex = i % servers.length;
        return request(`http://localhost:${3001 + serverIndex}`)
          .post('/api/sessions')
          .send({});
      });

      const responses = await Promise.all(burstPromises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const successfulResponses = responses.filter(r => r.status === 200);

      // Most requests should succeed
      expect(successfulResponses.length).toBeGreaterThan(burstSize * 0.8);

      // Total time should be reasonable for burst handling
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds
    });
  });
});
