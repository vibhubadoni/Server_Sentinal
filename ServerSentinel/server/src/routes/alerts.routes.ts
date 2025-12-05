import { Router } from 'express';
import alertsController, {
  queryAlertsSchema,
  alertIdSchema,
} from '../controllers/alerts.controller';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', validate({ query: queryAlertsSchema }), alertsController.query);

router.get('/stats', alertsController.getStats);

router.get('/:id', validate({ params: alertIdSchema }), alertsController.getById);

router.post(
  '/:id/acknowledge',
  authorize('superadmin', 'admin', 'operator'),
  validate({ params: alertIdSchema }),
  alertsController.acknowledge
);

router.post(
  '/:id/close',
  authorize('superadmin', 'admin', 'operator'),
  validate({ params: alertIdSchema }),
  alertsController.close
);

export default router;
