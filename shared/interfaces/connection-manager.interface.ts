// Connection Manager Module Interface
// Version 1.0

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

export interface ProcessingStats {
  framesProcessed: number;
  averageLatency: number;
  errorCount: number;
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  videoQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
  processingLoad: number; // 0.0 to 1.0
}
