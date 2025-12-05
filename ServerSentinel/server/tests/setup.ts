// Jest setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

// Global test timeout
jest.setTimeout(10000);

// Mock external services
jest.mock('../src/workers/notification.worker', () => ({
  enqueueNotification: jest.fn(),
  notificationQueue: {
    add: jest.fn(),
  },
}));
