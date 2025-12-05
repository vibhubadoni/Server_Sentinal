import axios, { AxiosInstance } from 'axios';
import { Logger } from 'pino';

interface TransportConfig {
  apiUrl: string;
  clientId: string;
  clientToken: string;
}

export class MetricsTransport {
  private client: AxiosInstance;
  private config: TransportConfig;
  private logger: Logger;

  constructor(config: TransportConfig & { logLevel?: string }, logger: Logger) {
    this.config = config;
    this.logger = logger;

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-client-token': config.clientToken,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug({ url: config.url, method: config.method }, 'HTTP request');
        return config;
      },
      (error) => {
        this.logger.error({ error }, 'HTTP request error');
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { url: response.config.url, status: response.status },
          'HTTP response'
        );
        return response;
      },
      (error) => {
        this.logger.error(
          {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
          },
          'HTTP response error'
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<void> {
    try {
      await this.client.get('/api/health');
      this.logger.info('API connection test successful');
    } catch (error) {
      this.logger.error({ error }, 'API connection test failed');
      throw error;
    }
  }

  /**
   * Send single metric
   */
  async sendMetric(data: any): Promise<void> {
    try {
      await this.client.post('/api/metrics/ingest', {
        clientId: this.config.clientId,
        ...data,
      });
    } catch (error) {
      this.logger.error({ error }, 'Failed to send metric');
      throw error;
    }
  }

  /**
   * Send batch of metrics
   */
  async sendBatch(metrics: any[]): Promise<void> {
    if (metrics.length === 0) {
      return;
    }

    try {
      // Send metrics one by one (API doesn't have batch endpoint yet)
      // In production, implement a proper batch endpoint
      for (const metric of metrics) {
        await this.sendMetric(metric);
      }

      this.logger.info({ count: metrics.length }, 'Batch sent successfully');
    } catch (error) {
      this.logger.error({ error, count: metrics.length }, 'Failed to send batch');
      throw error;
    }
  }

  /**
   * Send with retry logic
   */
  async sendWithRetry(data: any, maxRetries = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendMetric(data);
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          { attempt, maxRetries, error },
          'Metric send failed, retrying...'
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
