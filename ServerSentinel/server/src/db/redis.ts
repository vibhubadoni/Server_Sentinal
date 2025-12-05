import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect on READONLY errors
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis error');
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

export default redis;

// Pub/Sub client (separate connection)
export const redisPubSub = new Redis(config.redisUrl);

export const disconnectRedis = async () => {
  await redis.quit();
  await redisPubSub.quit();
  logger.info('Redis connections closed');
};
