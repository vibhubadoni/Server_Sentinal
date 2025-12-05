import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env.simple if it exists, otherwise use defaults
dotenv.config({ path: '.env.simple' });
dotenv.config(); // Fallback to .env

const configSchema = z.object({
  // JWT
  jwtSecret: z.string().default('simple-dev-secret-key-minimum-32-characters-long'),
  jwtRefreshSecret: z.string().default('simple-dev-refresh-secret-key-minimum-32-characters'),
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
  
  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  logPretty: z.coerce.boolean().default(true),
  
  // Security
  bcryptRounds: z.coerce.number().default(10),
});

const parseConfig = () => {
  try {
    return configSchema.parse({
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
      logLevel: process.env.LOG_LEVEL,
      logPretty: process.env.LOG_PRETTY,
      bcryptRounds: process.env.BCRYPT_ROUNDS,
    });
  } catch (error) {
    console.log('⚠️  Using default configuration (no .env file found)');
    // Return defaults
    return configSchema.parse({});
  }
};

export const config = parseConfig();

export default config;
