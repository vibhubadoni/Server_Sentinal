import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { findClientById, addMetric, getMetricsByClientId, getAllMetrics } from '../db/memory-store';

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
    networkRxBytes?: number;
    networkTxBytes?: number;
    loadAverage?: number[];
    processCount?: number;
    processes?: Array<{ pid: number; name: string; cpu: number; mem: number }>;
  };
}

export class MetricsService {
  async ingestMetrics(data: MetricData) {
    const { clientId, timestamp, metrics: metricData } = data;

    const client = findClientById(clientId);

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    if (!client.isActive) {
      throw new NotFoundError('Client is inactive');
    }

    const metric = addMetric({
      clientId,
      timestamp,
      cpuPercent: metricData.cpu,
      memoryPercent: metricData.memory,
      diskPercent: metricData.disk,
      memoryUsedMb: metricData.memoryUsedMb,
      memoryTotalMb: metricData.memoryTotalMb,
      diskUsedGb: metricData.diskUsedGb,
      diskTotalGb: metricData.diskTotalGb,
      networkRxBytes: metricData.networkRxBytes,
      networkTxBytes: metricData.networkTxBytes,
      loadAverage: metricData.loadAverage || [],
      processCount: metricData.processCount,
      topProcesses: metricData.processes || [],
    });

    // Update client last seen
    client.lastSeen = new Date();

    logger.debug({ clientId, metricId: metric.id }, 'Metric ingested');

    return metric;
  }

  async queryMetrics(query: any) {
    const { clientId, page = 1, limit = 100 } = query;

    let metricsData;

    if (clientId) {
      metricsData = getMetricsByClientId(clientId, limit * page);
    } else {
      metricsData = getAllMetrics(limit * page);
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = metricsData.slice(start, end);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: metricsData.length,
        totalPages: Math.ceil(metricsData.length / limit),
      },
    };
  }

  async getLatestMetrics(clientId: string, count = 1) {
    return getMetricsByClientId(clientId, count);
  }

  async getAggregatedMetrics(clientId?: string, hours = 1) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    let metricsData;
    if (clientId) {
      metricsData = getMetricsByClientId(clientId, 1000);
    } else {
      metricsData = getAllMetrics(1000);
    }

    const recentMetrics = metricsData.filter((m) => m.metricTime >= since);

    if (recentMetrics.length === 0) {
      return {
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0,
        maxCpu: 0,
        maxMemory: 0,
        maxDisk: 0,
        count: 0,
      };
    }

    const avgCpu =
      recentMetrics.reduce((sum, m) => sum + (m.cpuPercent || 0), 0) / recentMetrics.length;
    const avgMemory =
      recentMetrics.reduce((sum, m) => sum + (m.memoryPercent || 0), 0) / recentMetrics.length;
    const avgDisk =
      recentMetrics.reduce((sum, m) => sum + (m.diskPercent || 0), 0) / recentMetrics.length;

    const maxCpu = Math.max(...recentMetrics.map((m) => m.cpuPercent || 0));
    const maxMemory = Math.max(...recentMetrics.map((m) => m.memoryPercent || 0));
    const maxDisk = Math.max(...recentMetrics.map((m) => m.diskPercent || 0));

    return {
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgDisk: Math.round(avgDisk * 100) / 100,
      maxCpu: Math.round(maxCpu * 100) / 100,
      maxMemory: Math.round(maxMemory * 100) / 100,
      maxDisk: Math.round(maxDisk * 100) / 100,
      count: recentMetrics.length,
    };
  }
}

export default new MetricsService();
