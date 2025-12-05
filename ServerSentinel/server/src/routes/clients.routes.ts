import { Router } from 'express';
import clientsController, {
  createClientSchema,
  updateClientSchema,
  clientIdSchema,
} from '../controllers/clients.controller';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', clientsController.getAll);

router.get('/stats', clientsController.getStats);

router.get('/:id', validate({ params: clientIdSchema }), clientsController.getById);

// Admin/Operator only
router.post(
  '/',
  authorize('superadmin', 'admin', 'operator'),
  validate({ body: createClientSchema }),
  clientsController.create
);

router.put(
  '/:id',
  authorize('superadmin', 'admin', 'operator'),
  validate({ params: clientIdSchema, body: updateClientSchema }),
  clientsController.update
);

router.delete(
  '/:id',
  authorize('superadmin', 'admin'),
  validate({ params: clientIdSchema }),
  clientsController.delete
);

router.post(
  '/:id/deactivate',
  authorize('superadmin', 'admin'),
  validate({ params: clientIdSchema }),
  clientsController.deactivate
);

router.post(
  '/:id/regenerate-token',
  authorize('superadmin', 'admin'),
  validate({ params: clientIdSchema }),
  clientsController.regenerateToken
);

export default router;
