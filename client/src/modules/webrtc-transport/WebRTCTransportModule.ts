// WebRTC Transport Module - Client Side
// Handles WebRTC peer connection and signaling

import {
  WebRTCTransportModule as IWebRTCTransportModule,
  TransportResult,
  WebRTCConfig,
  WebRTCError,
} from '@/shared/interfaces/webrtc-transport.interface';

export class WebRTCTransportModule implements IWebRTCTransportModule {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private stateChangeCallback: ((state: string) => void) | null = null;
  private dataReceivedCallback: ((data: any) => void) | null = null;
  private connectionId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  async initialize(config: WebRTCConfig): Promise<TransportResult> {
    try {
      console.log('[WebRTCTransportModule] Initializing with config:', config);

      // Create peer connection with provided configuration
      this.peerConnection = new RTCPeerConnection({
        iceServers: config.iceServers,
        iceCandidatePoolSize: 10,
      });

      // Set up connection state monitoring
      this.setupConnectionStateMonitoring();

      // Create data channel for overlay data
      this.dataChannel = this.peerConnection.createDataChannel('overlayData', {
        ordered: true,
        maxRetransmits: 3,
      });

      this.setupDataChannelHandlers();

      // Generate unique connection ID
      this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        data: null,
        timestamp: new Date(),
        connectionId: this.connectionId,
      };
    } catch (error) {
      const transportError: WebRTCError = {
        message: error instanceof Error ? error.message : 'Failed to initialize WebRTC transport',
        code: 'INITIALIZATION_ERROR',
        timestamp: new Date(),
        recoverable: true,
        module: 'WebRTCTransportModule',
        connectionState: 'failed',
        iceConnectionState: 'failed',
      };
      throw transportError;
    }
  }

  async attachMediaStream(stream: any): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('[WebRTCTransportModule] Attaching media stream...');

    try {
      // Remove existing tracks
      const senders = this.peerConnection.getSenders();
      senders.forEach(sender => {
        if (sender.track) {
          this.peerConnection!.removeTrack(sender);
        }
      });

      // Add new tracks
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        this.peerConnection!.addTrack(track, stream);
      });
    } catch (error) {
      const transportError: WebRTCError = {
        message: error instanceof Error ? error.message : 'Failed to attach media stream',
        code: 'MEDIA_ERROR',
        timestamp: new Date(),
        recoverable: true,
        module: 'WebRTCTransportModule',
        connectionState: this.getConnectionState(),
        iceConnectionState: this.getIceConnectionState(),
      };
      throw transportError;
    }
  }

  async sendData(data: any): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not available');
    }

    try {
      const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        connectionId: this.connectionId,
      });

      this.dataChannel.send(message);
    } catch (error) {
      const transportError: WebRTCError = {
        message: error instanceof Error ? error.message : 'Failed to send data',
        code: 'DATA_ERROR',
        timestamp: new Date(),
        recoverable: true,
        module: 'WebRTCTransportModule',
        connectionState: this.getConnectionState(),
        iceConnectionState: this.getIceConnectionState(),
      };
      throw transportError;
    }
  }

  onDataReceived(callback: (data: any) => void): void {
    this.dataReceivedCallback = callback;
  }

  disconnect(): void {
    console.log('[WebRTCTransportModule] Disconnecting...');

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.connectionId = '';
    this.reconnectAttempts = 0;
  }

  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'closed';
  }

  getIceConnectionState(): string {
    return this.peerConnection?.iceConnectionState || 'closed';
  }

  onStateChange(callback: (state: string) => void): void {
    this.stateChangeCallback = callback;
  }

  private setupConnectionStateMonitoring(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      console.log('[WebRTCTransportModule] Connection state changed:', state);

      if (this.stateChangeCallback) {
        this.stateChangeCallback(state);
      }

      // Handle connection failures
      if (state === 'failed' || state === 'disconnected') {
        this.handleConnectionFailure();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection!.iceConnectionState;
      console.log('[WebRTCTransportModule] ICE connection state:', iceState);

      if (iceState === 'failed' || iceState === 'disconnected') {
        this.handleConnectionFailure();
      }
    };
  }

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('[WebRTCTransportModule] Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('[WebRTCTransportModule] Data channel closed');
    };

    this.dataChannel.onerror = (error) => {
      console.error('[WebRTCTransportModule] Data channel error:', error);
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.dataReceivedCallback) {
          this.dataReceivedCallback(data);
        }
      } catch (error) {
        console.error('[WebRTCTransportModule] Error parsing received data:', error);
      }
    };
  }

  private handleConnectionFailure(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebRTCTransportModule] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      // Implement reconnection logic here
      // This would typically involve signaling server coordination
    } else {
      console.error('[WebRTCTransportModule] Max reconnection attempts reached');
      this.disconnect();
    }
  }

  // Additional methods for WebRTC signaling
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }
}
