/**
 * Mock Signaling Server for WebRTC Transport POC
 * Simulates Socket.IO signaling server for testing
 */

import { WebSocketServer, WebSocket } from 'ws';
import chalk from 'chalk';

export class MockSignalingServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private sessions: Map<string, Set<string>> = new Map();

  constructor(private port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(chalk.gray(`   📡 Mock signaling: Client ${clientId} connected`));

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error(chalk.red('   ❌ Mock signaling: Invalid message'), error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(chalk.gray(`   📡 Mock signaling: Client ${clientId} disconnected`));
      });

      ws.on('error', error => {
        console.error(chalk.red('   ❌ Mock signaling: WebSocket error'), error);
      });

      // Send connection confirmation
      this.sendToClient(clientId, { type: 'connected', clientId });
    });

    console.log(chalk.gray(`   🚀 Mock signaling server started on port ${this.port}`));
  }

  private handleMessage(clientId: string, message: any): void {
    console.log(chalk.gray(`   📨 Mock signaling: Received from ${clientId}:`, message.type));

    switch (message.type) {
      case 'join-session':
        this.handleJoinSession(clientId, message);
        break;
      case 'offer':
        this.handleOffer(clientId, message);
        break;
      case 'answer':
        this.handleAnswer(clientId, message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(clientId, message);
        break;
      default:
        console.log(chalk.yellow(`   ⚠️  Mock signaling: Unknown message type: ${message.type}`));
    }
  }

  private handleJoinSession(clientId: string, message: any): void {
    const { sessionId } = message;

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }

    this.sessions.get(sessionId)!.add(clientId);

    this.sendToClient(clientId, {
      type: 'session-joined',
      sessionId,
      participants: Array.from(this.sessions.get(sessionId)!),
    });

    console.log(chalk.gray(`   🏠 Mock signaling: Client ${clientId} joined session ${sessionId}`));
  }

  private handleOffer(clientId: string, message: any): void {
    const { sessionId, offer } = message;

    // Simulate offer/answer exchange
    setTimeout(() => {
      this.sendToClient(clientId, {
        type: 'answer',
        sessionId,
        answer: {
          type: 'answer',
          sdp: 'mock-answer-sdp',
        },
      });
    }, 100);

    console.log(chalk.gray(`   🤝 Mock signaling: Processed offer for session ${sessionId}`));
  }

  private handleAnswer(clientId: string, message: any): void {
    const { sessionId } = message;
    console.log(chalk.gray(`   ✅ Mock signaling: Processed answer for session ${sessionId}`));
  }

  private handleIceCandidate(clientId: string, message: any): void {
    const { sessionId, candidate } = message;

    // Echo ICE candidate back (simulating peer exchange)
    setTimeout(() => {
      this.sendToClient(clientId, {
        type: 'ice-candidate',
        sessionId,
        candidate: {
          candidate: 'mock-ice-candidate',
          sdpMLineIndex: 0,
          sdpMid: '0',
        },
      });
    }, 50);

    console.log(
      chalk.gray(`   🧊 Mock signaling: Processed ICE candidate for session ${sessionId}`)
    );
  }

  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async stop(): Promise<void> {
    return new Promise(resolve => {
      this.wss.close(() => {
        console.log(chalk.gray('   🛑 Mock signaling server stopped'));
        resolve();
      });
    });
  }
}
