import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import alertsService from '../services/alerts.service';
import { z } from 'zod';

export const queryAlertsSchema = z.object({
  clientId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  from: z.string().datetime().transform((val) => new Date(val)).optional(),
  to: z.string().datetime().transform((val) => new Date(val)).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const alertIdSchema = z.object({
  id: z.string().uuid(),
});

export class AlertsController {
  query = asyncHandler(async (req: Request, res: Response) => {
    const result = await alertsService.queryAlerts(req.query as any);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const alert = await alertsService.getAlertById(id);

    res.json({
      success: true,
      data: alert,
    });
  });

  acknowledge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const alert = await alertsService.acknowledgeAlert(id, userId);

    res.json({
      success: true,
      data: alert,
    });
  });

  close = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const alert = await alertsService.closeAlert(id, userId);

    res.json({
      success: true,
      data: alert,
    });
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    const clientId = req.query.clientId as string | undefined;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

    const stats = await alertsService.getAlertStats(clientId, hours);

    res.json({
      success: true,
      data: stats,
    });
  });
}

export default new AlertsController();
