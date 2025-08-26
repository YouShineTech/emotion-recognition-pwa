/**
 * Connection Manager Module Interfaces
 */
export interface IConnectionManagerModule {
    initialize(): Promise<void>;
    createSession(sessionId?: string): Promise<SessionInfo>;
    joinSession(sessionId: string, participantId: string, metadata?: any): Promise<ParticipantInfo>;
    leaveSession(sessionId: string, participantId: string): Promise<void>;
    closeSession(sessionId: string): Promise<void>;
    getSession(sessionId: string): Promise<SessionInfo | null>;
    getParticipant(participantId: string): ParticipantInfo | null;
    updateConnectionHealth(participantId: string, health: Partial<ConnectionHealth>): void;
    updateParticipantStatus(participantId: string, status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'): void;
    getActiveSessions(): SessionInfo[];
    getSessionStats(sessionId: string): any;
    getStats(): any;
    cleanup(): Promise<void>;
}
export interface ConnectionManagerConfig {
    sessionTimeout?: number;
    healthCheckInterval?: number;
    maxParticipantsPerSession?: number;
    connectionTimeout?: number;
    redisUrl?: string;
    cleanupInterval?: number;
}
export interface SessionInfo {
    sessionId: string;
    createdAt: Date;
    lastActivity: Date;
    participants: string[];
    status: 'active' | 'closed';
    metadata: any;
}
export interface ParticipantInfo {
    participantId: string;
    sessionId: string;
    joinedAt: Date;
    lastSeen: Date;
    status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
    connectionHealth: ConnectionHealth;
    metadata: any;
}
export interface ConnectionHealth {
    latency: number;
    packetLoss: number;
    bandwidth: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}
//# sourceMappingURL=connection-manager.interface.d.ts.map