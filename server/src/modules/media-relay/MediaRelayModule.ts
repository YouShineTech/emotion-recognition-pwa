/**
 * Media Relay Module (Mediasoup)
 *
 * Handles WebRTC media routing using Mediasoup SFU
 * Manages workers, routers, transports, and producers/consumers
 */

import * as mediasoup from 'mediasoup';
import {
  Worker,
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
  RtpCodecCapability,
} from 'mediasoup/node/lib/types';
import Redis from 'redis';
import {
  IMediaRelayModule,
  RelayConfig,
  SessionInfo,
  TransportInfo,
} from '@/shared/interfaces/media-relay.interface';

export class MediaRelayModule implements IMediaRelayModule {
  private workers: Worker[] = [];
  private routers: Map<string, Router> = new Map();
  private transports: Map<string, WebRtcTransport> = new Map();
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();
  private sessions: Map<string, SessionInfo> = new Map();
  private redis: Redis.RedisClientType | null = null;
  private config: RelayConfig;
  private currentWorkerIndex = 0;

  // Mediasoup codec configuration
  private readonly mediaCodecs: RtpCodecCapability[] = [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      parameters: {
        'x-google-start-bitrate': 1000,
      },
    },
    {
      kind: 'video',
      mimeType: 'video/H264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
        'x-google-start-bitrate': 1000,
      },
    },
  ];

  constructor(config: RelayConfig) {
    this.config = {
      numWorkers: require('os').cpus().length * 4,
      workerSettings: {
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 10000,
        rtcMaxPort: 59999,
      },
      webRtcTransportOptions: {
        listenIps: [{ ip: '0.0.0.0', announcedIp: undefined }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      },
      redisUrl: 'redis://localhost:6379',
      ...config,
    };
  }

  /**
   * Initialize Mediasoup workers and Redis connection
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Redis for session state sharing
      await this.initializeRedis();

      // Create Mediasoup workers
      await this.createWorkers();

      console.log(`MediaRelayModule initialized with ${this.workers.length} workers`);
    } catch (error) {
      console.error('Failed to initialize MediaRelayModule:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionId: string): Promise<SessionInfo> {
    try {
      // Get router for this session using round-robin
      const router = await this.getOrCreateRouter(sessionId);

      const sessionInfo: SessionInfo = {
        sessionId,
        routerId: router.id,
        participants: [],
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.sessions.set(sessionId, sessionInfo);

      // Store in Redis for multi-instance deployment
      if (this.redis) {
        await this.redis.setEx(`session:${sessionId}`, 3600, JSON.stringify(sessionInfo));
      }

      return sessionInfo;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Create WebRTC transport for a participant
   */
  async createTransport(
    sessionId: string,
    participantId: string,
    direction: 'send' | 'recv'
  ): Promise<TransportInfo> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const router = this.routers.get(session.routerId);
      if (!router) {
        throw new Error(`Router ${session.routerId} not found`);
      }

      const transport = await router.createWebRtcTransport(this.config.webRtcTransportOptions);
      const transportId = `${sessionId}-${participantId}-${direction}`;

      this.transports.set(transportId, transport);

      const transportInfo: TransportInfo = {
        id: transportId,
        sessionId,
        participantId,
        direction,
        dtlsParameters: transport.dtlsParameters,
        iceCandidates: transport.iceCandidates,
        iceParameters: transport.iceParameters,
        sctpParameters: transport.sctpParameters,
      };

      // Setup transport event handlers
      this.setupTransportHandlers(transport, transportId);

      return transportInfo;
    } catch (error) {
      console.error('Failed to create transport:', error);
      throw error;
    }
  }

  /**
   * Connect transport with DTLS parameters
   */
  async connectTransport(transportId: string, dtlsParameters: any): Promise<void> {
    try {
      const transport = this.transports.get(transportId);
      if (!transport) {
        throw new Error(`Transport ${transportId} not found`);
      }

      await transport.connect({ dtlsParameters });
    } catch (error) {
      console.error('Failed to connect transport:', error);
      throw error;
    }
  }

  /**
   * Create producer for media stream
   */
  async createProducer(
    transportId: string,
    rtpParameters: any,
    kind: 'audio' | 'video'
  ): Promise<string> {
    try {
      const transport = this.transports.get(transportId);
      if (!transport) {
        throw new Error(`Transport ${transportId} not found`);
      }

      const producer = await transport.produce({
        kind,
        rtpParameters,
      });

      const producerId = producer.id;
      this.producers.set(producerId, producer);

      // Setup producer event handlers
      this.setupProducerHandlers(producer, producerId);

      return producerId;
    } catch (error) {
      console.error('Failed to create producer:', error);
      throw error;
    }
  }

  /**
   * Create consumer for media stream
   */
  async createConsumer(
    transportId: string,
    producerId: string,
    rtpCapabilities: any
  ): Promise<any> {
    try {
      const transport = this.transports.get(transportId);
      if (!transport) {
        throw new Error(`Transport ${transportId} not found`);
      }

      const producer = this.producers.get(producerId);
      if (!producer) {
        throw new Error(`Producer ${producerId} not found`);
      }

      const router = transport.router;

      if (!router.canConsume({ producerId, rtpCapabilities })) {
        throw new Error('Cannot consume producer');
      }

      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start paused
      });

      const consumerId = consumer.id;
      this.consumers.set(consumerId, consumer);

      // Setup consumer event handlers
      this.setupConsumerHandlers(consumer, consumerId);

      return {
        id: consumerId,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      };
    } catch (error) {
      console.error('Failed to create consumer:', error);
      throw error;
    }
  }

  /**
   * Resume consumer
   */
  async resumeConsumer(consumerId: string): Promise<void> {
    try {
      const consumer = this.consumers.get(consumerId);
      if (!consumer) {
        throw new Error(`Consumer ${consumerId} not found`);
      }

      await consumer.resume();
    } catch (error) {
      console.error('Failed to resume consumer:', error);
      throw error;
    }
  }

  /**
   * Pause consumer
   */
  async pauseConsumer(consumerId: string): Promise<void> {
    try {
      const consumer = this.consumers.get(consumerId);
      if (!consumer) {
        throw new Error(`Consumer ${consumerId} not found`);
      }

      await consumer.pause();
    } catch (error) {
      console.error('Failed to pause consumer:', error);
      throw error;
    }
  }

  /**
   * Get router capabilities
   */
  getRouterCapabilities(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const router = this.routers.get(session.routerId);
    if (!router) {
      throw new Error(`Router ${session.routerId} not found`);
    }

    return router.rtpCapabilities;
  }

  /**
   * Close session and cleanup resources
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return;
      }

      // Close all transports for this session
      for (const [transportId, transport] of this.transports) {
        if (transportId.startsWith(sessionId)) {
          transport.close();
          this.transports.delete(transportId);
        }
      }

      // Close router if no other sessions are using it
      const router = this.routers.get(session.routerId);
      if (router) {
        // Check if any other sessions are using this router
        const otherSessions = Array.from(this.sessions.values()).filter(
          s => s.sessionId !== sessionId && s.routerId === session.routerId
        );

        if (otherSessions.length === 0) {
          router.close();
          this.routers.delete(session.routerId);
        }
      }

      this.sessions.delete(sessionId);

      // Remove from Redis
      if (this.redis) {
        await this.redis.del(`session:${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to close session:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const stats = {
      sessionId,
      participants: session.participants.length,
      transports: 0,
      producers: 0,
      consumers: 0,
    };

    // Count transports, producers, consumers for this session
    for (const transportId of this.transports.keys()) {
      if (transportId.startsWith(sessionId)) {
        stats.transports++;
      }
    }

    return stats;
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = Redis.createClient({ url: this.config.redisUrl || 'redis://localhost:6379' });
      await this.redis.connect();
      console.log('Redis connected for session state sharing');
    } catch (error) {
      console.warn('Redis connection failed, running without session sharing:', error);
      this.redis = null;
    }
  }

  /**
   * Create Mediasoup workers
   */
  private async createWorkers(): Promise<void> {
    for (let i = 0; i < this.config.numWorkers; i++) {
      const worker = await mediasoup.createWorker(this.config.workerSettings);

      worker.on('died', () => {
        console.error(`Mediasoup worker ${worker.pid} died, restarting...`);
        this.restartWorker(i);
      });

      this.workers.push(worker);
    }
  }

  /**
   * Get or create router for session
   */
  private async getOrCreateRouter(sessionId: string): Promise<Router> {
    // Use round-robin to distribute sessions across workers
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;

    const routerId = `router-${worker.pid}-${Date.now()}`;
    const router = await worker.createRouter({ mediaCodecs: this.mediaCodecs });

    this.routers.set(routerId, router);

    return router;
  }

  /**
   * Setup transport event handlers
   */
  private setupTransportHandlers(transport: WebRtcTransport, transportId: string): void {
    transport.on('dtlsstatechange', dtlsState => {
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        console.warn(`Transport ${transportId} DTLS state: ${dtlsState}`);
      }
    });

    transport.on('icestatechange', iceState => {
      if (iceState === 'failed' || iceState === 'closed') {
        console.warn(`Transport ${transportId} ICE state: ${iceState}`);
      }
    });
  }

  /**
   * Setup producer event handlers
   */
  private setupProducerHandlers(producer: Producer, producerId: string): void {
    producer.on('transportclose', () => {
      console.log(`Producer ${producerId} transport closed`);
      this.producers.delete(producerId);
    });
  }

  /**
   * Setup consumer event handlers
   */
  private setupConsumerHandlers(consumer: Consumer, consumerId: string): void {
    consumer.on('transportclose', () => {
      console.log(`Consumer ${consumerId} transport closed`);
      this.consumers.delete(consumerId);
    });

    consumer.on('producerclose', () => {
      console.log(`Consumer ${consumerId} producer closed`);
      this.consumers.delete(consumerId);
    });
  }

  /**
   * Restart a failed worker
   */
  private async restartWorker(index: number): Promise<void> {
    try {
      const newWorker = await mediasoup.createWorker(this.config.workerSettings);

      newWorker.on('died', () => {
        console.error(`Mediasoup worker ${newWorker.pid} died, restarting...`);
        this.restartWorker(index);
      });

      this.workers[index] = newWorker;
      console.log(`Worker ${index} restarted with PID ${newWorker.pid}`);
    } catch (error) {
      console.error(`Failed to restart worker ${index}:`, error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close all transports
    for (const transport of this.transports.values()) {
      transport.close();
    }
    this.transports.clear();

    // Close all routers
    for (const router of this.routers.values()) {
      router.close();
    }
    this.routers.clear();

    // Close all workers
    for (const worker of this.workers) {
      worker.close();
    }
    this.workers = [];

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    this.sessions.clear();
    this.producers.clear();
    this.consumers.clear();
  }
}

export default MediaRelayModule;
