import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Database
  databaseUrl: z.string().url(),
  
  // Redis
  redisUrl: z.string().url(),
  
  // JWT
  jwtSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('15m'),
  jwtRefreshExpiresIn: z.string().default('7d'),
  
  // Server
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  host: z.string().default('0.0.0.0'),
  
  // CORS
  corsOrigin: z.string().default('http://localhost:5173'),
  
  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(60000),
  rateLimitMaxRequests: z.coerce.number().default(100),
  
  // FCM
  fcmServerKey: z.string().optional(),
  fcmProjectId: z.string().optional(),
  
  // Sentry
  sentryDsn: z.string().optional(),
  sentryEnvironment: z.string().optional(),
  
  // Prometheus
  prometheusPort: z.coerce.number().default(9090),
  
  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  logPretty: z.coerce.boolean().default(false),
  
  // Worker
  workerConcurrency: z.coerce.number().default(5),
  notificationRetryAttempts: z.coerce.number().default(3),
  notificationRetryDelay: z.coerce.number().default(5000),
  
  // Security
  bcryptRounds: z.coerce.number().default(12),
});

const parseConfig = () => {
  try {
    return configSchema.parse({
      databaseUrl: process.env.DATABASE_URL,
      redisUrl: process.env.REDIS_URL,
      jwtSecret: process.env.JWT_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN,
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      host: process.env.HOST,
      corsOrigin: process.env.CORS_ORIGIN,
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
      fcmServerKey: process.env.FCM_SERVER_KEY,
      fcmProjectId: process.env.FCM_PROJECT_ID,
      sentryDsn: process.env.SENTRY_DSN,
      sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
      prometheusPort: process.env.PROMETHEUS_PORT,
      logLevel: process.env.LOG_LEVEL,
      logPretty: process.env.LOG_PRETTY,
      workerConcurrency: process.env.WORKER_CONCURRENCY,
      notificationRetryAttempts: process.env.NOTIFICATION_RETRY_ATTEMPTS,
      notificationRetryDelay: process.env.NOTIFICATION_RETRY_DELAY,
      bcryptRounds: process.env.BCRYPT_ROUNDS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid configuration:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseConfig();

export default config;
