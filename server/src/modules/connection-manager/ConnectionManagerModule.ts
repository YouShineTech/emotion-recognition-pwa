/**
 * Connection Manager Module
 *
 * Manages WebRTC connections, session lifecycle, and health monitoring
 * Handles connection state, reconnection, and resource cleanup
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'redis';
import {
  IConnectionManagerModule,
  ConnectionManagerConfig,
  SessionInfo,
  ConnectionHealth,
  ParticipantInfo,
} from '@/shared/interfaces/connection-manager.interface';

export class ConnectionManagerModule extends EventEmitter implements IConnectionManagerModule {
  private config: ConnectionManagerConfig;
  private sessions: Map<string, SessionInfo> = new Map();
  private participants: Map<string, ParticipantInfo> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private redis: Redis.RedisClientType | null = null;
  private isInitialized = false;

  constructor(config: ConnectionManagerConfig = {}) {
    super();

    this.config = {
      sessionTimeout: 300000, // 5 minutes
      healthCheckInterval: 30000, // 30 seconds
      maxParticipantsPerSession: 50,
      connectionTimeout: 10000, // 10 seconds
      redisUrl: 'redis://localhost:6379',
      cleanupInterval: 60000, // 1 minute
      ...config,
    };
  }

  /**
   * Initialize the connection manager
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Redis for session state sharing
      await this.initializeRedis();

      // Start cleanup timer
      this.startCleanupTimer();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('ConnectionManagerModule initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ConnectionManagerModule:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionId?: string): Promise<SessionInfo> {
    if (!this.isInitialized) {
      throw new Error('Connection manager not initialized');
    }

    const id = sessionId || uuidv4();

    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    const session: SessionInfo = {
      sessionId: id,
      createdAt: new Date(),
      lastActivity: new Date(),
      participants: [],
      status: 'active',
      metadata: {},
    };

    this.sessions.set(id, session);

    // Store in Redis for multi-instance deployment
    if (this.redis) {
      await this.redis.setEx(
        `session:${id}`,
        (this.config.sessionTimeout || 300000) / 1000,
        JSON.stringify(session)
      );
    }

    this.emit('sessionCreated', session);
    return session;
  }

  /**
   * Join a session as a participant
   */
  async joinSession(
    sessionId: string,
    participantId: string,
    metadata: any = {}
  ): Promise<ParticipantInfo> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.participants.length >= (this.config.maxParticipantsPerSession || 10)) {
      throw new Error(`Session ${sessionId} is full`);
    }

    if (session.participants.includes(participantId)) {
      throw new Error(`Participant ${participantId} already in session`);
    }

    const participant: ParticipantInfo = {
      participantId,
      sessionId,
      joinedAt: new Date(),
      lastSeen: new Date(),
      status: 'connecting',
      connectionHealth: {
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        quality: 'unknown',
      },
      metadata,
    };

    // Update session
    session.participants.push(participantId);
    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);

    // Store participant
    this.participants.set(participantId, participant);

    // Start health monitoring
    this.startHealthMonitoring(participantId);

    // Update Redis
    if (this.redis) {
      await this.redis.setEx(
        `session:${sessionId}`,
        (this.config.sessionTimeout || 300000) / 1000,
        JSON.stringify(session)
      );
      await this.redis.setEx(
        `participant:${participantId}`,
        (this.config.sessionTimeout || 300000) / 1000,
        JSON.stringify(participant)
      );
    }

    this.emit('participantJoined', { session, participant });
    return participant;
  }

  /**
   * Leave a session
   */
  async leaveSession(sessionId: string, participantId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    const participant = this.participants.get(participantId);

    if (!session || !participant) {
      return; // Already left or doesn't exist
    }

    // Remove participant from session
    session.participants = session.participants.filter(id => id !== participantId);
    session.lastActivity = new Date();

    // Update participant status
    participant.status = 'disconnected';
    participant.lastSeen = new Date();

    // Stop health monitoring
    this.stopHealthMonitoring(participantId);

    // Clean up if session is empty
    if (session.participants.length === 0) {
      await this.closeSession(sessionId);
    } else {
      this.sessions.set(sessionId, session);

      // Update Redis
      if (this.redis) {
        await this.redis.setEx(
          `session:${sessionId}`,
          (this.config.sessionTimeout || 300000) / 1000,
          JSON.stringify(session)
        );
      }
    }

    // Remove participant
    this.participants.delete(participantId);

    // Remove from Redis
    if (this.redis) {
      await this.redis.del(`participant:${participantId}`);
    }

    this.emit('participantLeft', { sessionId, participantId, session });
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return; // Already closed or doesn't exist
    }

    // Disconnect all participants
    for (const participantId of session.participants) {
      await this.leaveSession(sessionId, participantId);
    }

    // Update session status
    session.status = 'closed';
    session.lastActivity = new Date();

    // Remove from active sessions
    this.sessions.delete(sessionId);

    // Remove from Redis
    if (this.redis) {
      await this.redis.del(`session:${sessionId}`);
    }

    this.emit('sessionClosed', session);
  }

  /**
   * Get session information
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    let session = this.sessions.get(sessionId);

    if (!session && this.redis) {
      // Try to load from Redis
      try {
        const sessionData = await this.redis.get(`session:${sessionId}`);
        if (sessionData) {
          session = JSON.parse(sessionData);
          this.sessions.set(sessionId, session!);
        }
      } catch (error) {
        console.error('Error loading session from Redis:', error);
      }
    }

    return session || null;
  }

  /**
   * Get participant information
   */
  getParticipant(participantId: string): ParticipantInfo | null {
    return this.participants.get(participantId) || null;
  }

  /**
   * Update participant connection health
   */
  updateConnectionHealth(participantId: string, health: Partial<ConnectionHealth>): void {
    const participant = this.participants.get(participantId);

    if (participant) {
      participant.connectionHealth = { ...participant.connectionHealth, ...health };
      participant.lastSeen = new Date();

      // Determine connection quality
      const { latency, packetLoss } = participant.connectionHealth;

      if (latency < 100 && packetLoss < 0.01) {
        participant.connectionHealth.quality = 'excellent';
      } else if (latency < 200 && packetLoss < 0.05) {
        participant.connectionHealth.quality = 'good';
      } else if (latency < 500 && packetLoss < 0.1) {
        participant.connectionHealth.quality = 'fair';
      } else {
        participant.connectionHealth.quality = 'poor';
      }

      this.emit('connectionHealthUpdated', { participantId, health: participant.connectionHealth });
    }
  }

  /**
   * Update participant status
   */
  updateParticipantStatus(
    participantId: string,
    status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  ): void {
    const participant = this.participants.get(participantId);

    if (participant) {
      participant.status = status;
      participant.lastSeen = new Date();

      this.emit('participantStatusChanged', { participantId, status });
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).filter(session => session.status === 'active');
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    const participants = session.participants.map(id => this.participants.get(id)).filter(Boolean);

    return {
      sessionId,
      participantCount: participants.length,
      createdAt: session.createdAt,
      duration: Date.now() - session.createdAt.getTime(),
      connectionQualities: participants.map(p => ({
        participantId: p!.participantId,
        quality: p!.connectionHealth.quality,
        latency: p!.connectionHealth.latency,
      })),
    };
  }

  /**
   * Get overall statistics
   */
  getStats(): any {
    const activeSessions = this.getActiveSessions();
    const totalParticipants = this.participants.size;

    const connectionQualities = Array.from(this.participants.values()).reduce(
      (acc, p) => {
        acc[p.connectionHealth.quality] = (acc[p.connectionHealth.quality] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    return {
      activeSessions: activeSessions.length,
      totalParticipants,
      connectionQualities,
      averageSessionSize: totalParticipants / (activeSessions.length || 1),
    };
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = Redis.createClient({ url: this.config.redisUrl || 'redis://localhost:6379' });
      await this.redis.connect();
      console.log('Redis connected for session state sharing');
    } catch (error) {
      console.warn('Redis connection failed, running without session sharing:', error);
      this.redis = null;
    }
  }

  /**
   * Start health monitoring for a participant
   */
  private startHealthMonitoring(participantId: string): void {
    const healthCheck = setInterval(() => {
      const participant = this.participants.get(participantId);

      if (!participant) {
        this.stopHealthMonitoring(participantId);
        return;
      }

      const timeSinceLastSeen = Date.now() - participant.lastSeen.getTime();

      if (timeSinceLastSeen > (this.config.connectionTimeout || 60000)) {
        // Participant appears to be disconnected
        participant.status = 'disconnected';
        this.emit('participantTimeout', { participantId, timeSinceLastSeen });

        // Auto-remove after timeout
        setTimeout(() => {
          this.leaveSession(participant.sessionId, participantId);
        }, 5000);
      }
    }, this.config.healthCheckInterval);

    this.healthChecks.set(participantId, healthCheck);
  }

  /**
   * Stop health monitoring for a participant
   */
  private stopHealthMonitoring(participantId: string): void {
    const healthCheck = this.healthChecks.get(participantId);

    if (healthCheck) {
      clearInterval(healthCheck);
      this.healthChecks.delete(participantId);
    }
  }

  /**
   * Start cleanup timer for expired sessions
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired sessions and participants
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const sessionsToClose: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const timeSinceActivity = now - session.lastActivity.getTime();

      if (timeSinceActivity > (this.config.sessionTimeout || 300000)) {
        sessionsToClose.push(sessionId);
      }
    }

    for (const sessionId of sessionsToClose) {
      console.log(`Cleaning up expired session: ${sessionId}`);
      await this.closeSession(sessionId);
    }

    if (sessionsToClose.length > 0) {
      this.emit('sessionsCleanedUp', { count: sessionsToClose.length });
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.closeSession(sessionId);
    }

    // Stop all health checks
    for (const healthCheck of this.healthChecks.values()) {
      clearInterval(healthCheck);
    }
    this.healthChecks.clear();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    this.sessions.clear();
    this.participants.clear();
    this.isInitialized = false;

    this.emit('cleanup');
  }
}

export default ConnectionManagerModule;
