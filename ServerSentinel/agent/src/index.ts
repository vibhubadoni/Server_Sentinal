import dotenv from 'dotenv';
import pino from 'pino';
import { MetricsCollector } from './collectors/metrics-collector';
import { MetricsTransport } from './transport/metrics-transport';

dotenv.config();

// Configuration
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  clientId: process.env.CLIENT_ID || '',
  clientToken: process.env.CLIENT_TOKEN || '',
  collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '5000'),
  batchSize: parseInt(process.env.BATCH_SIZE || '12'),
  batchSendInterval: parseInt(process.env.BATCH_SEND_INTERVAL || '60000'),
  logLevel: (process.env.LOG_LEVEL || 'info') as pino.Level,
  logPretty: process.env.LOG_PRETTY === 'true',
};

// Validate configuration
if (!config.clientId || !config.clientToken) {
  console.error('❌ CLIENT_ID and CLIENT_TOKEN are required');
  process.exit(1);
}

// Initialize logger
const logger = pino({
  level: config.logLevel,
  ...(config.logPretty && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  }),
});

// Initialize components
const collector = new MetricsCollector(logger);
const transport = new MetricsTransport(config, logger);

// Metrics buffer
let metricsBuffer: any[] = [];
let collectionTimer: NodeJS.Timeout;
let sendTimer: NodeJS.Timeout;

/**
 * Collect metrics and add to buffer
 */
async function collectMetrics() {
  try {
    const metrics = await collector.collect();
    
    metricsBuffer.push({
      timestamp: new Date().toISOString(),
      metrics,
    });

    logger.debug({ bufferSize: metricsBuffer.length }, 'Metrics collected');

    // Send immediately if buffer is full
    if (metricsBuffer.length >= config.batchSize) {
      await sendMetrics();
    }
  } catch (error) {
    logger.error({ error }, 'Failed to collect metrics');
  }
}

/**
 * Send buffered metrics to API
 */
async function sendMetrics() {
  if (metricsBuffer.length === 0) {
    return;
  }

  const batch = [...metricsBuffer];
  metricsBuffer = [];

  try {
    await transport.sendBatch(batch);
    logger.info({ count: batch.length }, 'Metrics sent successfully');
  } catch (error) {
    logger.error({ error, count: batch.length }, 'Failed to send metrics');
    // Re-add to buffer for retry (keep last 100 to avoid memory issues)
    metricsBuffer = [...batch, ...metricsBuffer].slice(0, 100);
  }
}

/**
 * Start the agent
 */
async function start() {
  logger.info(
    {
      clientId: config.clientId,
      apiUrl: config.apiUrl,
      collectionInterval: config.collectionInterval,
      batchSize: config.batchSize,
    },
    '🚀 ServerSentinel Agent starting'
  );

  // Test API connectivity
  try {
    await transport.testConnection();
    logger.info('✅ API connection successful');
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to API');
    process.exit(1);
  }

  // Start collection timer
  collectionTimer = setInterval(collectMetrics, config.collectionInterval);

  // Start send timer
  sendTimer = setInterval(sendMetrics, config.batchSendInterval);

  // Collect initial metrics
  await collectMetrics();

  logger.info('✅ Agent started successfully');
}

/**
 * Stop the agent gracefully
 */
async function stop() {
  logger.info('Stopping agent...');

  // Clear timers
  if (collectionTimer) clearInterval(collectionTimer);
  if (sendTimer) clearInterval(sendTimer);

  // Send remaining metrics
  await sendMetrics();

  logger.info('Agent stopped');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  stop();
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  stop();
});

// Start the agent
start().catch((error) => {
  logger.error({ error }, 'Failed to start agent');
  process.exit(1);
});
