import rateLimit from 'express-rate-limit';
import config from '../config/index.simple';
import { TooManyRequestsError } from '../utils/errors';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw new TooManyRequestsError(options.message as string);
  },
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, _next, options) => {
    throw new TooManyRequestsError(options.message as string);
  },
});

/**
 * Lenient rate limiter for metric ingestion
 */
export const metricsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Metric ingestion rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw new TooManyRequestsError(options.message as string);
  },
});
