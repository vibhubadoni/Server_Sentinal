import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import authService from '../services/auth.service.simple';
import clientsService from '../services/clients.service.simple';
import metricsService from '../services/metrics.service.simple';
import alertsService from '../services/alerts.service.simple';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      storage: 'in-memory',
    },
  });
});

// ===== AUTH ROUTES =====
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  '/auth/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/auth/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.userId);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  })
);

router.get('/auth/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

// ===== CLIENTS ROUTES =====
const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  hostname: z.string().optional(),
  ipAddress: z.string().optional(),
  osType: z.string().optional(),
  osVersion: z.string().optional(),
});

router.get(
  '/clients',
  authenticate,
  asyncHandler(async (req, res) => {
    const clients = await clientsService.getAllClients();
    res.json({ success: true, data: clients });
  })
);

router.post(
  '/clients',
  authenticate,
  authorize('superadmin', 'admin', 'operator'),
  validate({ body: createClientSchema }),
  asyncHandler(async (req, res) => {
    const result = await clientsService.registerClient(req.body);
    res.status(201).json({ success: true, data: result });
  })
);

router.get(
  '/clients/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await clientsService.getClientStats();
    res.json({ success: true, data: stats });
  })
);

router.get(
  '/clients/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const client = await clientsService.getClientById(req.params.id);
    res.json({ success: true, data: client });
  })
);

// ===== METRICS ROUTES =====
const ingestMetricSchema = z.object({
  clientId: z.string(),
  timestamp: z.string().transform((val) => new Date(val)),
  metrics: z.object({
    cpu: z.number().optional(),
    memory: z.number().optional(),
    disk: z.number().optional(),
    memoryUsedMb: z.number().optional(),
    memoryTotalMb: z.number().optional(),
    diskUsedGb: z.number().optional(),
    diskTotalGb: z.number().optional(),
    networkRxBytes: z.number().optional(),
    networkTxBytes: z.number().optional(),
    loadAverage: z.array(z.number()).optional(),
    processCount: z.number().optional(),
  }),
});

router.post(
  '/metrics/ingest',
  validate({ body: ingestMetricSchema }),
  asyncHandler(async (req, res) => {
    const metric = await metricsService.ingestMetrics(req.body);
    res.status(201).json({ success: true, data: metric });
  })
);

router.get(
  '/metrics',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await metricsService.queryMetrics(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  })
);

router.get(
  '/metrics/latest/:clientId',
  authenticate,
  asyncHandler(async (req, res) => {
    const count = req.query.count ? parseInt(req.query.count as string) : 1;
    const metrics = await metricsService.getLatestMetrics(req.params.clientId, count);
    res.json({ success: true, data: metrics });
  })
);

router.get(
  '/metrics/aggregated',
  authenticate,
  asyncHandler(async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 1;
    const stats = await metricsService.getAggregatedMetrics(clientId, hours);
    res.json({ success: true, data: stats });
  })
);

// ===== ALERTS ROUTES =====
router.get(
  '/alerts',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await alertsService.queryAlerts(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  })
);

router.get(
  '/alerts/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const stats = await alertsService.getAlertStats(clientId, hours);
    res.json({ success: true, data: stats });
  })
);

router.get(
  '/alerts/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const alert = await alertsService.getAlertById(req.params.id);
    res.json({ success: true, data: alert });
  })
);

router.post(
  '/alerts/:id/acknowledge',
  authenticate,
  authorize('admin', 'operator'),
  asyncHandler(async (req, res) => {
    const alert = await alertsService.acknowledgeAlert(req.params.id, req.user!.userId);
    res.json({ success: true, data: alert });
  })
);

router.post(
  '/alerts/:id/close',
  authenticate,
  authorize('admin', 'operator'),
  asyncHandler(async (req, res) => {
    const alert = await alertsService.closeAlert(req.params.id, req.user!.userId);
    res.json({ success: true, data: alert });
  })
);

export default router;
