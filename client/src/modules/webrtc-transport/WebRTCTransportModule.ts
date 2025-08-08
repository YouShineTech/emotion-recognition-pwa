/**
 * WebRTC Transport Module
 *
 * Handles WebRTC peer connections, signaling, and data channels
 * Manages connection state and automatic reconnection
 */

import { io, Socket } from 'socket.io-client';
import {
  IWebRTCTransportModule,
  ConnectionConfig,
  ConnectionState,
  SignalingMessage,
} from '@/shared/interfaces/webrtc-transport.interface';

export class WebRTCTransportModule implements IWebRTCTransportModule {
  private peerConnection: RTCPeerConnection | null = null;
  private socket: Socket | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: ConnectionConfig;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeouts = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private sessionId: string | null = null;

  constructor(config: ConnectionConfig) {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      signalingUrl: 'ws://localhost:3001',
      dataChannelName: 'overlayData',
      ...config,
    };
  }

  /**
   * Initialize WebRTC connection and signaling
   */
  async initialize(
    config?: any
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }
      await this.setupSignaling();
      this.setupPeerConnection();
      this.setupDataChannel();
      this.emit('initialized');
      return {
        success: true,
        ...(this.sessionId && { connectionId: this.sessionId }),
      };
    } catch (error) {
      this.emit('error', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Attach media stream to peer connection
   */
  async attachMediaStream(stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, stream);
    });

    this.emit('streamAttached', stream);
  }

  /**
   * Set up data received handler
   */
  onDataReceived(callback: (data: any) => void): void {
    this.on('dataReceived', callback);
  }

  /**
   * Initialize WebRTC connection and signaling (internal)
   */
  private async initializeInternal(): Promise<void> {
    try {
      await this.setupSignaling();
      this.setupPeerConnection();
      this.setupDataChannel();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Connect to remote peer
   */
  async connect(sessionId: string): Promise<void> {
    try {
      this.sessionId = sessionId;
      this.setConnectionState('connecting');

      // Join session via signaling
      this.socket?.emit('join-session', { sessionId });

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      this.socket?.emit('offer', {
        sessionId,
        offer: offer,
      });
    } catch (error) {
      this.setConnectionState('failed');
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from remote peer
   */
  disconnect(): void {
    this.cleanup();
    this.setConnectionState('disconnected');
    this.emit('disconnected');
  }

  /**
   * Send data through data channel
   */
  sendData(data: any): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        const message = JSON.stringify(data);
        this.dataChannel.send(message);
        return true;
      } catch (error) {
        this.emit('error', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Add media stream to connection
   */
  addStream(stream: MediaStream): void {
    if (this.peerConnection) {
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });
      this.emit('streamAdded', stream);
    }
  }

  /**
   * Remove media stream from connection
   */
  removeStream(stream: MediaStream): void {
    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      stream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track === track);
        if (sender) {
          this.peerConnection!.removeTrack(sender);
        }
      });
      this.emit('streamRemoved', stream);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Setup signaling connection
   */
  private async setupSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.signalingUrl, {
        transports: ['websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Signaling connected');
        resolve();
      });

      this.socket.on('connect_error', error => {
        console.error('Signaling connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Signaling disconnected');
        this.handleSignalingDisconnect();
      });

      // Handle signaling messages
      this.socket.on('offer', this.handleOffer.bind(this));
      this.socket.on('answer', this.handleAnswer.bind(this));
      this.socket.on('ice-candidate', this.handleIceCandidate.bind(this));
      this.socket.on('session-joined', this.handleSessionJoined.bind(this));
      this.socket.on('session-error', this.handleSessionError.bind(this));
    });
  }

  /**
   * Setup peer connection
   */
  private setupPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers || [],
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = event => {
      if (event.candidate && this.socket && this.sessionId) {
        this.socket.emit('ice-candidate', {
          sessionId: this.sessionId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      console.log('Connection state changed:', state);

      switch (state) {
        case 'connected':
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          break;
        case 'disconnected':
          this.setConnectionState('disconnected');
          this.attemptReconnect();
          break;
        case 'failed':
          this.setConnectionState('failed');
          this.attemptReconnect();
          break;
      }
    };

    // Handle remote streams
    this.peerConnection.ontrack = event => {
      this.emit('remoteStream', event.streams[0]);
    };

    // Handle data channel from remote peer
    this.peerConnection.ondatachannel = event => {
      const channel = event.channel;
      this.setupDataChannelHandlers(channel);
    };
  }

  /**
   * Setup data channel
   */
  private setupDataChannel(): void {
    if (this.peerConnection) {
      this.dataChannel = this.peerConnection.createDataChannel(
        this.config.dataChannelName || 'data',
        {
          ordered: true,
        }
      );

      this.setupDataChannelHandlers(this.dataChannel);
    }
  }

  /**
   * Setup data channel event handlers
   */
  private setupDataChannelHandlers(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('Data channel opened');
      this.emit('dataChannelOpen');
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      this.emit('dataChannelClose');
    };

    channel.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        this.emit('dataReceived', data);
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };

    channel.onerror = error => {
      console.error('Data channel error:', error);
      this.emit('dataChannelError', error);
    };
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(message: SignalingMessage): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(message.offer!);

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.socket?.emit('answer', {
        sessionId: message.sessionId,
        answer: answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(message: SignalingMessage): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(message.answer!);
    } catch (error) {
      console.error('Error handling answer:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(message: SignalingMessage): Promise<void> {
    try {
      await this.peerConnection!.addIceCandidate(message.candidate!);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle session joined confirmation
   */
  private handleSessionJoined(data: any): void {
    console.log('Session joined:', data);
    this.emit('sessionJoined', data);
  }

  /**
   * Handle session error
   */
  private handleSessionError(error: any): void {
    console.error('Session error:', error);
    this.emit('sessionError', error);
  }

  /**
   * Handle signaling disconnect
   */
  private handleSignalingDisconnect(): void {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState('failed');
      this.emit('reconnectFailed');
      return;
    }

    const timeout = this.reconnectTimeouts[this.reconnectAttempts] || 16000;
    this.reconnectAttempts++;

    console.log(
      `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${timeout}ms`
    );
    this.emit('reconnectAttempt', { attempt: this.reconnectAttempts, timeout });

    setTimeout(async () => {
      try {
        this.cleanup();
        await this.initialize();
        if (this.sessionId) {
          await this.connect(this.sessionId);
        }
      } catch (error) {
        console.error('Reconnect failed:', error);
        this.attemptReconnect();
      }
    }, timeout);
  }

  /**
   * Set connection state and emit event
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connectionStateChanged', state);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default WebRTCTransportModule;
