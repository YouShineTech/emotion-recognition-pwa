/**
 * WebRTC Transport Module
 * Handles WebRTC transport configuration and management
 */

export interface WebRTCTransportConfig {
  iceServers?: RTCIceServer[];
  signalingUrl?: string;
  dataChannelName?: string;
}

export interface TransportInfo {
  direction: 'send' | 'recv';
  sessionId: string;
  participantId: string;
  transportId: string;
}

export class WebRTCTransportModule {
  private config: WebRTCTransportConfig;
  private isInitialized = false;
  private transports = new Map<string, TransportInfo>();

  constructor(config: WebRTCTransportConfig = {}) {
    this.config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      signalingUrl: 'ws://localhost:3001',
      dataChannelName: 'overlayData',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.transports.clear();
    this.isInitialized = false;
  }

  createTransport(
    sessionId: string,
    participantId: string,
    direction: 'send' | 'recv'
  ): TransportInfo {
    const transportId = `${sessionId}-${participantId}-${direction}`;
    const transport: TransportInfo = {
      direction,
      sessionId,
      participantId,
      transportId,
    };

    this.transports.set(transportId, transport);
    return transport;
  }

  getTransport(transportId: string): TransportInfo | undefined {
    return this.transports.get(transportId);
  }

  getConfig(): WebRTCTransportConfig {
    return this.config;
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      activeTransports: this.transports.size,
      config: this.config,
    };
  }
}

export default WebRTCTransportModule;
