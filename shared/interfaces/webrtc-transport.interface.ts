// WebRTC Transport Module Interface
// Version 1.0

import { ApiResponse, ModuleError } from './common.interface';

export interface WebRTCTransportModule {
  initialize(config: WebRTCConfig): Promise<TransportResult>;
  attachMediaStream(stream: any): Promise<void>; // MediaStream in browser, any for testing
  sendData(data: any): Promise<void>;
  onDataReceived(callback: (data: any) => void): void;
  disconnect(): void;
  getConnectionState(): string; // RTCPeerConnectionState in browser, string for testing
  onStateChange(callback: (state: string) => void): void;
}

export interface WebRTCConfig {
  iceServers: any[]; // RTCIceServer[] in browser
  signalingUrl: string;
  sessionId: string;
  stunServers: string[];
  turnServers?: {
    urls: string;
    username: string;
    credential: string;
  }[];
}

export interface TransportResult extends ApiResponse {
  connectionId?: string;
}

export interface WebRTCError extends ModuleError {
  connectionState: string; // RTCPeerConnectionState in browser
  iceConnectionState: string; // RTCIceConnectionState in browser
}
