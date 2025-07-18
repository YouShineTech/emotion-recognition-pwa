// Connection Manager Module Interface
// Version 1.0

import { ProcessingStats } from './common.interface';

export interface ConnectionManagerModule {
  createSession(userId?: string): Promise<SessionInfo>;
  monitorConnection(sessionId: string): void;
  handleReconnection(sessionId: string): Promise<boolean>;
  closeSession(sessionId: string): void;
  getConnectionHealth(sessionId: string): ConnectionHealth;
  onConnectionIssue(callback: (issue: ConnectionIssue) => void): void;
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  createdAt: Date;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
  processingStats: ProcessingStats;
}

export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  packetLoss: number;
  bandwidth: number;
  lastCheck: Date;
}

export interface ConnectionIssue {
  sessionId: string;
  type: 'timeout' | 'disconnect' | 'error' | 'degraded';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}
