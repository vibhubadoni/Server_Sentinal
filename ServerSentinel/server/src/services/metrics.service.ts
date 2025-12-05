import prisma from '../db/client';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export interface MetricData {
  clientId: string;
  timestamp: Date;
  metrics: {
    cpu?: number;
    memory?: number;
    disk?: number;
    memoryUsedMb?: number;
    memoryTotalMb?: number;
    diskUsedGb?: number;
    diskTotalGb?: number;
    diskDetails?: Array<{ mount: string; used: number; total: number; percent: number }>;
    networkRxBytes?: number;
    networkTxBytes?: number;
    loadAverage?: number[];
    processCount?: number;
    processes?: Array<{ pid: number; name: string; cpu: number; mem: number }>;
    gpu?: number;
    gpuMemoryUsedMb?: number;
    gpuMemoryTotalMb?: number;
    gpuTemperature?: number;
  };
}

export interface MetricQuery {
  clientId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export class MetricsService {
  /**
   * Ingest metrics from agent
   */
  async ingestMetrics(data: MetricData) {
    const { clientId, timestamp, metrics } = data;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, isActive: true },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    if (!client.isActive) {
      throw new NotFoundError('Client is inactive');
    }

    // Insert metric
    const metric = await prisma.metric.create({
      data: {
        clientId,
        metricTime: timestamp,
        cpuPercent: metrics.cpu,
        memoryPercent: metrics.memory,
        memoryUsedMb: metrics.memoryUsedMb ? BigInt(metrics.memoryUsedMb) : null,
        memoryTotalMb: metrics.memoryTotalMb ? BigInt(metrics.memoryTotalMb) : null,
        diskPercent: metrics.disk,
        diskUsedGb: metrics.diskUsedGb ? BigInt(metrics.diskUsedGb) : null,
        diskTotalGb: metrics.diskTotalGb ? BigInt(metrics.diskTotalGb) : null,
        diskDetails: metrics.diskDetails || [],
        networkRxBytes: metrics.networkRxBytes ? BigInt(metrics.networkRxBytes) : null,
        networkTxBytes: metrics.networkTxBytes ? BigInt(metrics.networkTxBytes) : null,
        loadAverage: metrics.loadAverage || [],
        processCount: metrics.processCount,
        topProcesses: metrics.processes || [],
        gpuPercent: metrics.gpu,
        gpuMemoryUsedMb: metrics.gpuMemoryUsedMb ? BigInt(metrics.gpuMemoryUsedMb) : null,
        gpuMemoryTotalMb: metrics.gpuMemoryTotalMb ? BigInt(metrics.gpuMemoryTotalMb) : null,
        gpuTemperature: metrics.gpuTemperature,
      },
    });

    logger.debug({ clientId, metricId: metric.id }, 'Metric ingested');

    return metric;
  }

  /**
   * Batch ingest metrics
   */
  async ingestMetricsBatch(clientId: string, metricsData: MetricData[]) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, isActive: true },
    });

    if (!client || !client.isActive) {
      throw new NotFoundError('Client not found or inactive');
    }

    const metrics = metricsData.map((data) => ({
      clientId,
      metricTime: data.timestamp,
      cpuPercent: data.metrics.cpu,
      memoryPercent: data.metrics.memory,
      memoryUsedMb: data.metrics.memoryUsedMb ? BigInt(data.metrics.memoryUsedMb) : null,
      memoryTotalMb: data.metrics.memoryTotalMb ? BigInt(data.metrics.memoryTotalMb) : null,
      diskPercent: data.metrics.disk,
      diskUsedGb: data.metrics.diskUsedGb ? BigInt(data.metrics.diskUsedGb) : null,
      diskTotalGb: data.metrics.diskTotalGb ? BigInt(data.metrics.diskTotalGb) : null,
      diskDetails: data.metrics.diskDetails || [],
      networkRxBytes: data.metrics.networkRxBytes ? BigInt(data.metrics.networkRxBytes) : null,
      networkTxBytes: data.metrics.networkTxBytes ? BigInt(data.metrics.networkTxBytes) : null,
      loadAverage: data.metrics.loadAverage || [],
      processCount: data.metrics.processCount,
      topProcesses: data.metrics.processes || [],
      gpuPercent: data.metrics.gpu,
      gpuMemoryUsedMb: data.metrics.gpuMemoryUsedMb ? BigInt(data.metrics.gpuMemoryUsedMb) : null,
      gpuMemoryTotalMb: data.metrics.gpuMemoryTotalMb ? BigInt(data.metrics.gpuMemoryTotalMb) : null,
      gpuTemperature: data.metrics.gpuTemperature,
    }));

    await prisma.metric.createMany({
      data: metrics,
      skipDuplicates: true,
    });

    logger.info({ clientId, count: metrics.length }, 'Batch metrics ingested');

    return { count: metrics.length };
  }

  /**
   * Query metrics with filters and pagination
   */
  async queryMetrics(query: MetricQuery) {
    const { clientId, from, to, page = 1, limit = 100 } = query;

    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (from || to) {
      where.metricTime = {};
      if (from) where.metricTime.gte = from;
      if (to) where.metricTime.lte = to;
    }

    const [metrics, total] = await Promise.all([
      prisma.metric.findMany({
        where,
        orderBy: { metricTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          clientId: true,
          metricTime: true,
          cpuPercent: true,
          memoryPercent: true,
          diskPercent: true,
          memoryUsedMb: true,
          memoryTotalMb: true,
          diskUsedGb: true,
          diskTotalGb: true,
          loadAverage: true,
          processCount: true,
          gpuPercent: true,
          gpuTemperature: true,
        },
      }),
      prisma.metric.count({ where }),
    ]);

    return {
      data: metrics.map((m) => ({
        ...m,
        memoryUsedMb: m.memoryUsedMb ? Number(m.memoryUsedMb) : null,
        memoryTotalMb: m.memoryTotalMb ? Number(m.memoryTotalMb) : null,
        diskUsedGb: m.diskUsedGb ? Number(m.diskUsedGb) : null,
        diskTotalGb: m.diskTotalGb ? Number(m.diskTotalGb) : null,
        gpuPercent: m.gpuPercent,
        gpuTemperature: m.gpuTemperature,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get latest metrics for a client
   */
  async getLatestMetrics(clientId: string, count = 1) {
    const metrics = await prisma.metric.findMany({
      where: { clientId },
      orderBy: { metricTime: 'desc' },
      take: count,
    });

    return metrics.map((m) => ({
      ...m,
      memoryUsedMb: m.memoryUsedMb ? Number(m.memoryUsedMb) : null,
      memoryTotalMb: m.memoryTotalMb ? Number(m.memoryTotalMb) : null,
      diskUsedGb: m.diskUsedGb ? Number(m.diskUsedGb) : null,
      diskTotalGb: m.diskTotalGb ? Number(m.diskTotalGb) : null,
      networkRxBytes: m.networkRxBytes ? Number(m.networkRxBytes) : null,
      networkTxBytes: m.networkTxBytes ? Number(m.networkTxBytes) : null,
      gpuPercent: m.gpuPercent,
      gpuMemoryUsedMb: m.gpuMemoryUsedMb ? Number(m.gpuMemoryUsedMb) : null,
      gpuMemoryTotalMb: m.gpuMemoryTotalMb ? Number(m.gpuMemoryTotalMb) : null,
      gpuTemperature: m.gpuTemperature,
    }));
  }

  /**
   * Get aggregated metrics for dashboard
   */
  async getAggregatedMetrics(clientId?: string, hours = 1) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const where: any = {
      metricTime: { gte: since },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    const metrics = await prisma.metric.findMany({
      where,
      select: {
        cpuPercent: true,
        memoryPercent: true,
        diskPercent: true,
        gpuPercent: true,
      },
    });

    if (metrics.length === 0) {
      return {
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0,
        maxCpu: 0,
        maxMemory: 0,
        maxDisk: 0,
        count: 0,
        avgGpu: 0,
        maxGpu: 0,
      };
    }

    const avgCpu =
      metrics.reduce((sum, m) => sum + (m.cpuPercent || 0), 0) / metrics.length;
    const avgMemory =
      metrics.reduce((sum, m) => sum + (m.memoryPercent || 0), 0) / metrics.length;
    const avgDisk =
      metrics.reduce((sum, m) => sum + (m.diskPercent || 0), 0) / metrics.length;

    const avgGpu =
      metrics.reduce((sum, m) => sum + (m.gpuPercent || 0), 0) / metrics.length;

    const maxCpu = Math.max(...metrics.map((m) => m.cpuPercent || 0));
    const maxMemory = Math.max(...metrics.map((m) => m.memoryPercent || 0));
    const maxDisk = Math.max(...metrics.map((m) => m.diskPercent || 0));
    const maxGpu = Math.max(...metrics.map((m) => m.gpuPercent || 0));

    return {
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgDisk: Math.round(avgDisk * 100) / 100,
      avgGpu: Math.round(avgGpu * 100) / 100,
      maxCpu: Math.round(maxCpu * 100) / 100,
      maxMemory: Math.round(maxMemory * 100) / 100,
      maxDisk: Math.round(maxDisk * 100) / 100,
      maxGpu: Math.round(maxGpu * 100) / 100,
      count: metrics.length,
    };
  }
}

export default new MetricsService();
