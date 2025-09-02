/**
 * Server Factory for Distributed Emotion Recognition System
 *
 * Creates individual server instances for cluster workers
 * Implements scalable architecture for Requirement 8 (1000+ users)
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';

// Import modules
import { MediaRelayModule } from './modules/media-relay/MediaRelayModule';
import { ConnectionManagerModule } from './modules/connection-manager/ConnectionManagerModule';
import { CircuitBreakerModule } from './modules/circuit-breaker/CircuitBreakerModule';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

/**
 * Create and configure a server instance
 */
export async function createServer() {
  const app = express();
  const server = createHttpServer(app);

  // Initialize Redis for session sharing across workers
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  try {
    await redis.connect();
    logger.info(`Worker ${process.pid}: Redis connected`);
  } catch (error) {
    logger.warn(
      `Worker ${process.pid}: Redis connection failed, running without session sharing:`,
      error
    );
  }

  // Socket.IO with Redis adapter for clustering
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Use Redis adapter for multi-instance Socket.IO if Redis is available
  if (redis.isReady) {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const pubClient = redis;
    const subClient = pubClient.duplicate();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info(`Worker ${process.pid}: Socket.IO Redis adapter configured`);
  }

  // Middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          mediaSrc: ["'self'", 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    })
  );

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize modules with circuit breakers
  const circuitBreaker = new CircuitBreakerModule();
  const connectionManager = new ConnectionManagerModule(redis as any);
  const mediaRelayModule = new MediaRelayModule({
    numWorkers: 2, // Reduced per instance since we have multiple instances
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  // Initialize media relay with circuit breaker protection
  try {
    await circuitBreaker.execute('mediaRelay', () => mediaRelayModule.initialize());
    logger.info(`Worker ${process.pid}: MediaRelayModule initialized`);
  } catch (error) {
    logger.error(`Worker ${process.pid}: Failed to initialize MediaRelayModule:`, error);
  }

  // Health check endpoint with detailed metrics
  app.get('/api/health', async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: process.pid,
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        connections: {
          active: await connectionManager.getActiveSessionCount(),
          total: await connectionManager.getTotalSessionCount(),
        },
        circuitBreakers: circuitBreaker.getStatus(),
        redis: redis.isReady ? 'connected' : 'disconnected',
      };

      res.json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Session management endpoints with rate limiting
  app.post('/api/sessions', async (req, res) => {
    try {
      // Check system capacity before creating new session
      const activeConnections = await connectionManager.getActiveSessionCount();
      const maxConnections = parseInt(process.env.MAX_CONNECTIONS_PER_WORKER || '100');

      if (activeConnections >= maxConnections) {
        return res.status(503).json({
          success: false,
          error: {
            code: 'CAPACITY_EXCEEDED',
            message: 'Server at capacity, please try again later',
            timestamp: new Date(),
            retryAfter: 30, // seconds
          },
        });
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create session with circuit breaker protection
      const session = await circuitBreaker.execute('createSession', async () => {
        const mediaSession = await mediaRelayModule.createSession(sessionId);
        await connectionManager.createSession(sessionId, {
          workerId: process.pid,
          createdAt: new Date(),
          lastActivity: new Date(),
        });
        return mediaSession;
      });

      logger.info(`Worker ${process.pid}: Created session ${sessionId}`);
      res.json({
        success: true,
        data: session,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_CREATION_FAILED',
          message: 'Failed to create session',
          timestamp: new Date(),
        },
      });
    }
  });

  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await connectionManager.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
            timestamp: new Date(),
          },
        });
      }

      res.json({
        success: true,
        data: session,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_RETRIEVAL_FAILED',
          message: 'Failed to retrieve session',
          timestamp: new Date(),
        },
      });
    }
  });

  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      const sessionId = req.params.id;

      await circuitBreaker.execute('closeSession', async () => {
        await mediaRelayModule.closeSession(sessionId);
        await connectionManager.closeSession(sessionId);
      });

      logger.info(`Worker ${process.pid}: Closed session ${sessionId}`);

      res.json({
        success: true,
        message: 'Session closed successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`Error closing session:`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_CLOSE_FAILED',
          message: 'Failed to close session',
          timestamp: new Date(),
        },
      });
    }
  });

  // WebSocket connection handling with connection limits
  io.on('connection', async socket => {
    const clientId = socket.id;
    logger.info(`Worker ${process.pid}: Client connected: ${clientId}`);

    // Check connection limits
    const activeConnections = await connectionManager.getActiveSessionCount();
    const maxConnections = parseInt(process.env.MAX_CONNECTIONS_PER_WORKER || '100');

    if (activeConnections >= maxConnections) {
      logger.warn(`Worker ${process.pid}: Connection limit reached, rejecting ${clientId}`);
      socket.emit('error', {
        code: 'CAPACITY_EXCEEDED',
        message: 'Server at capacity',
      });
      socket.disconnect(true);
      return;
    }

    // WebRTC signaling with error handling
    socket.on('offer', data => {
      logger.debug(`Worker ${process.pid}: Received offer from ${clientId}`);
      socket.broadcast.emit('offer', { ...data, from: clientId });
    });

    socket.on('answer', data => {
      logger.debug(`Worker ${process.pid}: Received answer from ${clientId}`);
      socket.broadcast.emit('answer', { ...data, from: clientId });
    });

    socket.on('ice-candidate', data => {
      logger.debug(`Worker ${process.pid}: Received ICE candidate from ${clientId}`);
      socket.broadcast.emit('ice-candidate', { ...data, from: clientId });
    });

    socket.on('disconnect', async reason => {
      logger.info(`Worker ${process.pid}: Client disconnected: ${clientId}, reason: ${reason}`);

      // Cleanup any associated sessions
      try {
        await connectionManager.cleanupClientSessions(clientId);
      } catch (error) {
        logger.error('Error cleaning up client sessions:', error);
      }
    });

    // Handle connection errors
    socket.on('error', error => {
      logger.error(`Worker ${process.pid}: Socket error for ${clientId}:`, error);
    });
  });

  // Global error handling
  app.use(
    (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date(),
        },
      });
    }
  );

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info(`Worker ${process.pid}: Shutting down gracefully...`);

    server.close(async () => {
      try {
        await mediaRelayModule.cleanup();
        await connectionManager.cleanup();
        if (redis.isReady) {
          await redis.quit();
        }
        logger.info(`Worker ${process.pid}: Shutdown complete`);
        process.exit(0);
      } catch (error) {
        logger.error(`Worker ${process.pid}: Error during shutdown:`, error);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return server;
}
