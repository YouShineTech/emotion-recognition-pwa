/**
 * Connection Manager Module
 *
 * Manages distributed session state across multiple server instances
 * Implements Requirement 8 (1000+ concurrent users) with Redis clustering
 */

import { createClient, RedisClientType } from 'redis';
import logger from '../../utils/logger';

export interface SessionData {
  sessionId: string;
  workerId: number;
  clientId?: string;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'inactive' | 'terminated';
  metadata?: Record<string, any>;
}

export interface ConnectionMetrics {
  totalSessions: number;
  activeSessions: number;
  inactiveSessions: number;
  averageSessionDuration: number;
  connectionsPerSecond: number;
}

export class ConnectionManagerModule {
  private redis: RedisClientType;
  private sessionPrefix = 'session:';
  private metricsPrefix = 'metrics:';
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(redisClient: RedisClientType) {
    this.redis = redisClient;
    this.startCleanupProcess();
  }

  /**
   * Create a new session
   */
  async createSession(sessionId: string, sessionData: Partial<SessionData>): Promise<SessionData> {
    const session: SessionData = {
      sessionId,
      workerId: process.pid,
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      ...sessionData,
    };

    try {
      // Store session in Redis with TTL (4 hours)
      await this.redis.setEx(
        `${this.sessionPrefix}${sessionId}`,
        4 * 60 * 60, // 4 hours TTL
        JSON.stringify(session)
      );

      // Update metrics
      await this.updateMetrics('session_created');

      logger.info(`Session created: ${sessionId} on worker ${process.pid}`);
      return session;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionData = await this.redis.get(`${this.sessionPrefix}${sessionId}`);

      if (!sessionData) {
        return null;
      }

      const session: SessionData = JSON.parse(sessionData);

      // Update last activity
      session.lastActivity = new Date();
      await this.redis.setEx(
        `${this.sessionPrefix}${sessionId}`,
        4 * 60 * 60,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const updatedSession = {
        ...session,
        ...updates,
        lastActivity: new Date(),
      };

      await this.redis.setEx(
        `${this.sessionPrefix}${sessionId}`,
        4 * 60 * 60,
        JSON.stringify(updatedSession)
      );

      return true;
    } catch (error) {
      logger.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Close session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      // Mark as terminated
      session.status = 'terminated';
      session.lastActivity = new Date();

      await this.redis.setEx(
        `${this.sessionPrefix}${sessionId}`,
        60, // Keep for 1 minute for cleanup
        JSON.stringify(session)
      );

      // Update metrics
      await this.updateMetrics('session_closed');

      logger.info(`Session closed: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error('Failed to close session:', error);
      return false;
    }
  }

  /**
   * Get active session count
   */
  async getActiveSessionCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      let activeCount = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);
          if (session.status === 'active') {
            activeCount++;
          }
        }
      }

      return activeCount;
    } catch (error) {
      logger.error('Failed to get active session count:', error);
      return 0;
    }
  }

  /**
   * Get total session count
   */
  async getTotalSessionCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      return keys.length;
    } catch (error) {
      logger.error('Failed to get total session count:', error);
      return 0;
    }
  }

  /**
   * Get connection metrics
   */
  async getConnectionMetrics(): Promise<ConnectionMetrics> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      let activeSessions = 0;
      let inactiveSessions = 0;
      let totalDuration = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);

          if (session.status === 'active') {
            activeSessions++;
          } else {
            inactiveSessions++;
          }

          // Calculate session duration
          const duration = new Date().getTime() - new Date(session.createdAt).getTime();
          totalDuration += duration;
        }
      }

      const totalSessions = keys.length;
      const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      // Get connections per second from metrics
      const connectionsPerSecond = await this.getConnectionsPerSecond();

      return {
        totalSessions,
        activeSessions,
        inactiveSessions,
        averageSessionDuration: Math.round(averageSessionDuration / 1000), // Convert to seconds
        connectionsPerSecond,
      };
    } catch (error) {
      logger.error('Failed to get connection metrics:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        inactiveSessions: 0,
        averageSessionDuration: 0,
        connectionsPerSecond: 0,
      };
    }
  }

  /**
   * Cleanup sessions for a specific client
   */
  async cleanupClientSessions(clientId: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      let cleanedCount = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);

          if (session.clientId === clientId) {
            await this.closeSession(session.sessionId);
            cleanedCount++;
          }
        }
      }

      logger.info(`Cleaned up ${cleanedCount} sessions for client ${clientId}`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup client sessions:', error);
      return 0;
    }
  }

  /**
   * Get sessions by worker ID
   */
  async getSessionsByWorker(workerId: number): Promise<SessionData[]> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      const workerSessions: SessionData[] = [];

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);

          if (session.workerId === workerId) {
            workerSessions.push(session);
          }
        }
      }

      return workerSessions;
    } catch (error) {
      logger.error('Failed to get sessions by worker:', error);
      return [];
    }
  }

  /**
   * Update connection metrics
   */
  private async updateMetrics(event: string): Promise<void> {
    try {
      const now = new Date();
      const minuteKey = `${this.metricsPrefix}${event}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

      await this.redis.incr(minuteKey);
      await this.redis.expire(minuteKey, 3600); // Keep for 1 hour
    } catch (error) {
      logger.error('Failed to update metrics:', error);
    }
  }

  /**
   * Get connections per second
   */
  private async getConnectionsPerSecond(): Promise<number> {
    try {
      const now = new Date();
      const minuteKey = `${this.metricsPrefix}session_created:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

      const connectionsThisMinute = await this.redis.get(minuteKey);
      return connectionsThisMinute ? Math.round(parseInt(connectionsThisMinute) / 60) : 0;
    } catch (error) {
      logger.error('Failed to get connections per second:', error);
      return 0;
    }
  }

  /**
   * Start cleanup process for expired sessions
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(
      async () => {
        try {
          const keys = await this.redis.keys(`${this.sessionPrefix}*`);
          let cleanedCount = 0;

          for (const key of keys) {
            const sessionData = await this.redis.get(key);
            if (sessionData) {
              const session: SessionData = JSON.parse(sessionData);
              const lastActivity = new Date(session.lastActivity);
              const now = new Date();

              // Clean up sessions inactive for more than 1 hour
              if (now.getTime() - lastActivity.getTime() > 60 * 60 * 1000) {
                await this.redis.del(key);
                cleanedCount++;
              }
            }
          }

          if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} expired sessions`);
          }
        } catch (error) {
          logger.error('Error during session cleanup:', error);
        }
      },
      5 * 60 * 1000
    ); // Run every 5 minutes
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close sessions for this worker
    try {
      const workerSessions = await this.getSessionsByWorker(process.pid);
      for (const session of workerSessions) {
        await this.closeSession(session.sessionId);
      }
      logger.info(`Cleaned up ${workerSessions.length} sessions for worker ${process.pid}`);
    } catch (error) {
      logger.error('Error during connection manager cleanup:', error);
    }
  }
}
