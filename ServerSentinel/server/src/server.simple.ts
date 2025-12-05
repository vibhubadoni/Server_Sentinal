import http from 'http';
import { createApp } from './app.simple';
import config from './config/index.simple';
import logger from './utils/logger';
import { initializeWebSocket } from './sockets/index.simple';
import { initializeData } from './db/memory-store';

// Create Express app
const app = createApp();

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize WebSocket server
const wsServer = initializeWebSocket(httpServer);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      wsServer.getIO().close();
      logger.info('WebSocket server closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

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
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

// Start server
const startServer = async () => {
  try {
    // Initialize in-memory database with sample data
    await initializeData();

    httpServer.listen(config.port, config.host, () => {
      logger.info(
        {
          port: config.port,
          host: config.host,
          env: config.nodeEnv,
        },
        '🚀 ServerSentinel API started'
      );
      logger.info(`📊 API available at http://${config.host}:${config.port}`);
      logger.info(`🔌 WebSocket server listening on ws://${config.host}:${config.port}/ws`);
      logger.info('');
      logger.info('✅ No external database needed - using in-memory storage');
      logger.info('✅ Sample data loaded and ready to use');
      logger.info('');
      logger.info('🔑 Login credentials:');
      logger.info('   Email: admin@serversentinel.io');
      logger.info('   Password: password123');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, httpServer, wsServer };
