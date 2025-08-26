/**
 * WebRTC Transport Module Interfaces
 */
export interface IWebRTCTransportModule {
    initialize(config?: any): Promise<{
        success: boolean;
        connectionId?: string;
        error?: string;
    }>;
    connect(sessionId: string): Promise<void>;
    disconnect(): void;
    sendData(data: any): boolean;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    attachMediaStream(stream: MediaStream): Promise<void>;
    onDataReceived(callback: (data: any) => void): void;
    getConnectionState(): ConnectionState;
    getStats(): Promise<RTCStatsReport | null>;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
}
export interface ConnectionConfig {
    iceServers?: RTCIceServer[];
    signalingUrl?: string;
    dataChannelName?: string;
}
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed' | 'reconnecting';
export interface SignalingMessage {
    sessionId: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}
//# sourceMappingURL=webrtc-transport.interface.d.ts.map