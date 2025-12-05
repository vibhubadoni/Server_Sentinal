import http from 'http';
import { createApp } from './app';
import config from './config';
import logger from './utils/logger';
import { disconnectDatabase } from './db/client';
import { disconnectRedis } from './db/redis';
import { initializeWebSocket } from './sockets';
import { notificationWorker } from './workers/notification.worker';
import * as Sentry from '@sentry/node';

// Initialize Sentry if configured
if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnvironment || config.nodeEnv,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
  });
  logger.info('Sentry initialized');
}

// Create Express app
const app = createApp();

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize WebSocket server
const wsServer = initializeWebSocket(httpServer);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close WebSocket connections
      wsServer.getIO().close();
      logger.info('WebSocket server closed');

      // Stop notification worker
      await notificationWorker.close();
      logger.info('Notification worker closed');

      // Disconnect from databases
      await disconnectDatabase();
      await disconnectRedis();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  Sentry.captureException(error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  Sentry.captureException(reason);
});

// Start server
const startServer = async () => {
  try {
    httpServer.listen(config.port, config.host, () => {
      logger.info(
        {
          port: config.port,
          host: config.host,
          env: config.nodeEnv,
        },
        '🚀 ServerSentinel API started'
      );
      logger.info(`📊 Metrics available at http://${config.host}:${config.port}/metrics`);
      logger.info(`🔌 WebSocket server listening on ws://${config.host}:${config.port}/ws`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    Sentry.captureException(error);
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, httpServer, wsServer };
