// Media Relay Module Interface
// Version 1.0

export interface MediaRelayModule {
  createSession(sessionId: string): Promise<RelaySession>;
  routeStream(sessionId: string, stream: MediaStreamData): Promise<void>;
  subscribeToStream(sessionId: string, callback: (data: MediaStreamData) => void): void;
  closeSession(sessionId: string): void;
  getActiveSessionCount(): number;
  getResourceUsage(): ResourceMetrics;
}

export interface RelaySession {
  sessionId: string;
  createdAt: Date;
  isActive: boolean;
  routerId: string;
  transportId: string;
  producerId?: string;
}

export interface MediaStreamData {
  sessionId: string;
  timestamp: Date;
  videoFrame?: ArrayBuffer;
  audioChunk?: ArrayBuffer;
  rtpParameters?: any;
}

export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkBandwidth: number;
  activeConnections: number;
}
