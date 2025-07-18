import { ApiResponse, ModuleError } from './common.interface';
export interface WebRTCTransportModule {
    initialize(config: WebRTCConfig): Promise<TransportResult>;
    attachMediaStream(stream: MediaStream): Promise<void>;
    sendData(data: any): Promise<void>;
    onDataReceived(callback: (data: any) => void): void;
    disconnect(): void;
    getConnectionState(): RTCPeerConnectionState;
    onStateChange(callback: (state: RTCPeerConnectionState) => void): void;
}
export interface WebRTCConfig {
    iceServers: RTCIceServer[];
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
    connectionState: RTCPeerConnectionState;
    iceConnectionState: RTCIceConnectionState;
}
