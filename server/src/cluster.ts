/**
 * Cluster Manager for Scalable Emotion Recognition Server
 *
 * Implements horizontal scaling to meet Requirement 8 (1000+ concurrent users)
 * Uses Node.js cluster module to distribute load across CPU cores
 */

import cluster from 'cluster';
import os from 'os';
import logger from './utils/logger';
import { createServer } from './server';

const numCPUs = os.cpus().length;
const MAX_WORKERS = process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : numCPUs * 2;

interface WorkerMetrics {
  pid: number;
  connections: number;
  memoryUsage: number;
  cpuUsage: number;
  lastHealthCheck: Date;
}

class ClusterManager {
  private workers: Map<number, WorkerMetrics> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize cluster with worker processes
   */
  async initialize(): Promise<void> {
    if (cluster.isPrimary) {
      logger.info(`Master process ${process.pid} starting with ${MAX_WORKERS} workers`);

      // Fork workers
      for (let i = 0; i < MAX_WORKERS; i++) {
        this.forkWorker();
      }

      // Handle worker events
      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        this.workers.delete(worker.process.pid!);

        // Restart worker if not intentional shutdown
        if (code !== 0 && !worker.exitedAfterDisconnect) {
          logger.info('Restarting worker...');
          this.forkWorker();
        }
      });

      // Start health monitoring
      this.startHealthMonitoring();

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());
    } else {
      // Worker process - start the actual server
      await this.startWorker();
    }
  }

  /**
   * Fork a new worker process
   */
  private forkWorker(): void {
    try {
      const worker = cluster.fork();

      if (worker.process.pid) {
        this.workers.set(worker.process.pid, {
          pid: worker.process.pid,
          connections: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          lastHealthCheck: new Date(),
        });

        // Listen for worker metrics
        worker.on('message', message => {
          if (message.type === 'metrics' && worker.process.pid) {
            const metrics = this.workers.get(worker.process.pid);
            if (metrics) {
              Object.assign(metrics, message.data, { lastHealthCheck: new Date() });
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to fork worker:', error);
    }
  }

  /**
   * Start worker server instance
   */
  private async startWorker(): Promise<void> {
    try {
      const server = await createServer();
      const PORT = process.env.PORT || 3001;

      server.listen(PORT, () => {
        logger.info(`Worker ${process.pid} listening on port ${PORT}`);
      });

      // Send metrics to master periodically
      setInterval(() => {
        const memUsage = process.memoryUsage();
        process.send?.({
          type: 'metrics',
          data: {
            memoryUsage: memUsage.heapUsed,
            cpuUsage: process.cpuUsage().user,
            connections: (server as any).connections || 0,
          },
        });
      }, 5000);
    } catch (error) {
      logger.error('Failed to start worker:', error);
      process.exit(1);
    }
  }

  /**
   * Start health monitoring for all workers
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      const now = new Date();

      for (const [pid, metrics] of this.workers) {
        const timeSinceLastCheck = now.getTime() - metrics.lastHealthCheck.getTime();

        // Check if worker is unresponsive (no metrics for 30 seconds)
        if (timeSinceLastCheck > 30000) {
          logger.warn(`Worker ${pid} appears unresponsive, restarting...`);

          const worker = Object.values(cluster.workers || {}).find(w => w?.process.pid === pid);
          if (worker) {
            worker.kill('SIGTERM');
          }
        }

        // Check memory usage (restart if > 500MB per worker)
        if (metrics.memoryUsage > 500 * 1024 * 1024) {
          logger.warn(
            `Worker ${pid} using excessive memory (${Math.round(metrics.memoryUsage / 1024 / 1024)}MB), restarting...`
          );

          const worker = Object.values(cluster.workers || {}).find(w => w?.process.pid === pid);
          if (worker) {
            worker.kill('SIGTERM');
          }
        }
      }

      // Log cluster health
      const totalConnections = Array.from(this.workers.values()).reduce(
        (sum, w) => sum + w.connections,
        0
      );
      const totalMemory = Array.from(this.workers.values()).reduce(
        (sum, w) => sum + w.memoryUsage,
        0
      );

      logger.info(
        `Cluster Health: ${this.workers.size} workers, ${totalConnections} connections, ${Math.round(totalMemory / 1024 / 1024)}MB total memory`
      );
    }, 10000); // Check every 10 seconds
  }

  /**
   * Public shutdown method for testing
   */
  async shutdown(): Promise<void> {
    return this.gracefulShutdown();
  }

  /**
   * Graceful shutdown of all workers
   */
  private async gracefulShutdown(): Promise<void> {
    logger.info('Initiating graceful shutdown...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect all workers
    for (const worker of Object.values(cluster.workers || {})) {
      if (worker) {
        worker.disconnect();
      }
    }

    // Wait for workers to exit gracefully
    const shutdownTimeout = setTimeout(() => {
      logger.warn('Force killing remaining workers...');
      for (const worker of Object.values(cluster.workers || {})) {
        if (worker) {
          worker.kill('SIGKILL');
        }
      }
      process.exit(1);
    }, 10000);

    // Wait for all workers to exit
    const checkWorkers = setInterval(() => {
      const aliveWorkers = Object.values(cluster.workers || {}).filter(w => w && !w.isDead());
      if (aliveWorkers.length === 0) {
        clearInterval(checkWorkers);
        clearTimeout(shutdownTimeout);
        logger.info('All workers shut down gracefully');
        process.exit(0);
      }
    }, 100);
  }

  /**
   * Get cluster metrics for monitoring
   */
  getMetrics(): { workers: number; totalConnections: number; totalMemory: number } {
    const totalConnections = Array.from(this.workers.values()).reduce(
      (sum, w) => sum + w.connections,
      0
    );
    const totalMemory = Array.from(this.workers.values()).reduce(
      (sum, w) => sum + w.memoryUsage,
      0
    );

    return {
      workers: this.workers.size,
      totalConnections,
      totalMemory,
    };
  }
}

export default ClusterManager;
