import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import metricsService from '../services/metrics.service';
import { z } from 'zod';

export const ingestMetricSchema = z.object({
  clientId: z.string().uuid(),
  timestamp: z.string().datetime().transform((val) => new Date(val)),
  metrics: z.object({
    cpu: z.number().min(0).max(100).optional(),
    memory: z.number().min(0).max(100).optional(),
    disk: z.number().min(0).max(100).optional(),
    memoryUsedMb: z.number().optional(),
    memoryTotalMb: z.number().optional(),
    diskUsedGb: z.number().optional(),
    diskTotalGb: z.number().optional(),
    diskDetails: z.array(z.object({
      mount: z.string(),
      used: z.number(),
      total: z.number(),
      percent: z.number(),
    })).optional(),
    networkRxBytes: z.number().optional(),
    networkTxBytes: z.number().optional(),
    loadAverage: z.array(z.number()).optional(),
    processCount: z.number().optional(),
    processes: z.array(z.object({
      pid: z.number(),
      name: z.string(),
      cpu: z.number(),
      mem: z.number(),
    })).optional(),
    gpu: z.number().min(0).max(100).optional(),
    gpuMemoryUsedMb: z.number().optional(),
    gpuMemoryTotalMb: z.number().optional(),
    gpuTemperature: z.number().optional(),
  }),
});

export const queryMetricsSchema = z.object({
  clientId: z.string().uuid().optional(),
  from: z.string().datetime().transform((val) => new Date(val)).optional(),
  to: z.string().datetime().transform((val) => new Date(val)).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(100),
});

export class MetricsController {
  ingest = asyncHandler(async (req: Request, res: Response) => {
    const metric = await metricsService.ingestMetrics(req.body);

    res.status(201).json({
      success: true,
      data: metric,
    });
  });

  query = asyncHandler(async (req: Request, res: Response) => {
    const result = await metricsService.queryMetrics(req.query as any);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  getLatest = asyncHandler(async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const count = req.query.count ? parseInt(req.query.count as string) : 1;

    const metrics = await metricsService.getLatestMetrics(clientId, count);

    res.json({
      success: true,
      data: metrics,
    });
  });

  getAggregated = asyncHandler(async (req: Request, res: Response) => {
    const clientId = req.query.clientId as string | undefined;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 1;

    const stats = await metricsService.getAggregatedMetrics(clientId, hours);

    res.json({
      success: true,
      data: stats,
    });
  });
}

export default new MetricsController();
