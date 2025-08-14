/**
 * Main Entry Point - Scalable Emotion Recognition PWA Backend
 *
 * Implements distributed cluster architecture to meet Requirement 8 (1000+ concurrent users)
 * Uses Node.js cluster module for horizontal scaling across CPU cores
 */

import ClusterManager from './cluster';
import logger from './utils/logger';

async function main() {
  try {
    logger.info('Starting Emotion Recognition PWA Server...');
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    const clusterManager = new ClusterManager();
    await clusterManager.initialize();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();
