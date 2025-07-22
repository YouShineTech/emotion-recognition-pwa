// Main Server Entry Point
// Emotion Recognition PWA Backend

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import modules
import { MediaRelayModule } from './modules/media-relay/MediaRelayModule';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);
app.use(express.json());

// Initialize modules
const mediaRelayModule = new MediaRelayModule();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeConnections: mediaRelayModule.getActiveSessionCount(),
    resourceUsage: mediaRelayModule.getResourceUsage(),
  });
});

// Session management endpoints
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = await mediaRelayModule.createSession(sessionId);

    logger.info(`Created session: ${sessionId}`);
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

app.get('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;

  // STUB: Mock session status
  res.json({
    success: true,
    data: {
      sessionId,
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date(),
    },
    timestamp: new Date(),
  });
});

app.delete('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;

  try {
    mediaRelayModule.closeSession(sessionId);
    logger.info(`Closed session: ${sessionId}`);

    res.json({
      success: true,
      message: 'Session closed successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Error closing session ${sessionId}:`, error);
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

// WebSocket connection handling
io.on('connection', socket => {
  logger.info(`Client connected: ${socket.id}`);

  // WebRTC signaling
  socket.on('offer', data => {
    logger.debug(`Received offer from ${socket.id}`);
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', data => {
    logger.debug(`Received answer from ${socket.id}`);
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', data => {
    logger.debug(`Received ICE candidate from ${socket.id}`);
    socket.broadcast.emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date(),
    },
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Emotion Recognition PWA Server started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
