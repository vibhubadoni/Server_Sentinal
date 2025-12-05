import { Router } from 'express';
import metricsController, {
  ingestMetricSchema,
  queryMetricsSchema,
} from '../controllers/metrics.controller';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authenticateClient } from '../middleware/client-auth';
import { metricsLimiter } from '../middleware/rate-limit';

const router = Router();

// Client routes (agent ingestion)
router.post(
  '/ingest',
  metricsLimiter,
  authenticateClient,
  validate({ body: ingestMetricSchema }),
  metricsController.ingest
);

// User routes (query metrics)
router.get(
  '/',
  authenticate,
  validate({ query: queryMetricsSchema }),
  metricsController.query
);

router.get('/latest/:clientId', authenticate, metricsController.getLatest);

router.get('/aggregated', authenticate, metricsController.getAggregated);

export default router;
