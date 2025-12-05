import { Router } from 'express';
import authRoutes from './auth.routes';
import metricsRoutes from './metrics.routes';
import alertsRoutes from './alerts.routes';
import clientsRoutes from './clients.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/metrics', metricsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/clients', clientsRoutes);

export default router;
