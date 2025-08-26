/**
 * Media Relay Module Interfaces (Mediasoup)
 */
export interface IMediaRelayModule {
    initialize(): Promise<void>;
    createSession(sessionId: string): Promise<SessionInfo>;
    createTransport(sessionId: string, participantId: string, direction: 'send' | 'recv'): Promise<TransportInfo>;
    connectTransport(transportId: string, dtlsParameters: any): Promise<void>;
    createProducer(transportId: string, rtpParameters: any, kind: 'audio' | 'video'): Promise<string>;
    createConsumer(transportId: string, producerId: string, rtpCapabilities: any): Promise<any>;
    resumeConsumer(consumerId: string): Promise<void>;
    pauseConsumer(consumerId: string): Promise<void>;
    getRouterCapabilities(sessionId: string): any;
    closeSession(sessionId: string): Promise<void>;
    getSessionStats(sessionId: string): Promise<any>;
    cleanup(): Promise<void>;
}
export interface RelayConfig {
    numWorkers?: number;
    workerSettings?: any;
    webRtcTransportOptions?: any;
    redisUrl?: string;
}
export interface SessionInfo {
    sessionId: string;
    routerId: string;
    participants: string[];
    createdAt: Date;
    lastActivity: Date;
}
export interface TransportInfo {
    id: string;
    sessionId: string;
    participantId: string;
    direction: 'send' | 'recv';
    dtlsParameters: any;
    iceCandidates: any[];
    iceParameters: any;
    sctpParameters?: any;
}
//# sourceMappingURL=media-relay.interface.d.ts.map