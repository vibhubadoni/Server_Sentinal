import { Router } from 'express';
import authController, {
  loginSchema,
  refreshSchema,
  registerSchema,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';

const router = Router();

// Public routes with rate limiting
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);

router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);

// Protected routes
router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.me);

// Admin only
router.post(
  '/register',
  authenticate,
  authorize('superadmin', 'admin'),
  validate({ body: registerSchema }),
  authController.register
);

export default router;
