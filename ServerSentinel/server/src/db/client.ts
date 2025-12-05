import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: e.duration }, 'Database query');
  });
}

prisma.$on('error', (e) => {
  logger.error({ error: e }, 'Database error');
});

prisma.$on('warn', (e) => {
  logger.warn({ warning: e }, 'Database warning');
});

export default prisma;

// Graceful shutdown
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};
