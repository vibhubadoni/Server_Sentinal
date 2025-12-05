import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// HTTP request metrics
export const httpRequestsTotal = new Counter({
  name: 'ss_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'ss_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Alert metrics
export const alertsCreatedTotal = new Counter({
  name: 'ss_alerts_created_total',
  help: 'Total number of alerts created',
  labelNames: ['severity', 'metric'],
});

export const alertsAcknowledgedTotal = new Counter({
  name: 'ss_alerts_acknowledged_total',
  help: 'Total number of alerts acknowledged',
});

export const alertsClosedTotal = new Counter({
  name: 'ss_alerts_closed_total',
  help: 'Total number of alerts closed',
});

export const openAlertsGauge = new Gauge({
  name: 'ss_open_alerts',
  help: 'Number of currently open alerts',
  labelNames: ['severity'],
});

// Metric ingestion
export const metricsIngestedTotal = new Counter({
  name: 'ss_metrics_ingested_total',
  help: 'Total number of metrics ingested',
  labelNames: ['client_id'],
});

export const metricIngestionDuration = new Histogram({
  name: 'ss_metric_ingestion_duration_seconds',
  help: 'Metric ingestion duration in seconds',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
});

// WebSocket metrics
export const wsConnectionsGauge = new Gauge({
  name: 'ss_ws_connections',
  help: 'Number of active WebSocket connections',
});

export const wsMessagesTotal = new Counter({
  name: 'ss_ws_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'],
});

// Notification metrics
export const notificationsSentTotal = new Counter({
  name: 'ss_notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['channel', 'status'],
});

export const notificationDeliveryDuration = new Histogram({
  name: 'ss_notification_delivery_duration_seconds',
  help: 'Notification delivery duration in seconds',
  labelNames: ['channel'],
  buckets: [0.1, 0.5, 1, 5, 10, 30],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'ss_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

/**
 * Middleware to track HTTP metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export { register };
