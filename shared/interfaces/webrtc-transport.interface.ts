/**
 * WebRTC Transport Module Interfaces
 */

export interface IWebRTCTransportModule {
  initialize(): Promise<void>;
  connect(sessionId: string): Promise<void>;
  disconnect(): void;
  sendData(data: any): boolean;
  addStream(stream: MediaStream): void;
  removeStream(stream: MediaStream): void;
  getConnectionState(): ConnectionState;
  getStats(): Promise<RTCStatsReport | null>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

export interface ConnectionConfig {
  iceServers?: RTCIceServer[];
  signalingUrl?: string;
  dataChannelName?: string;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'reconnecting';

export interface SignalingMessage {
  sessionId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
