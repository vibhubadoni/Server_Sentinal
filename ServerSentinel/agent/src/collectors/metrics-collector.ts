import si from 'systeminformation';
import { Logger } from 'pino';

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  diskDetails: Array<{
    mount: string;
    used: number;
    total: number;
    percent: number;
  }>;
  networkRxBytes: number;
  networkTxBytes: number;
  loadAverage: number[];
  processCount: number;
  processes: Array<{
    pid: number;
    name: string;
    cpu: number;
    mem: number;
  }>;
  gpuPercent: number;
  gpuMemoryUsedMb: number;
  gpuMemoryTotalMb: number;
  gpuTemperature: number;
}

export class MetricsCollector {
  private logger: Logger;
  private previousNetworkStats: any = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Collect all system metrics
   */
  async collect(): Promise<SystemMetrics> {
    try {
      const [cpu, memory, disk, network, load, processes, gpu] = await Promise.all([
        this.collectCPU(),
        this.collectMemory(),
        this.collectDisk(),
        this.collectNetwork(),
        this.collectLoad(),
        this.collectProcesses(),
        this.collectGPU(),
      ]);

      return {
        cpu: this.clampCpu(cpu),
        memory: memory.percent,
        disk: disk.percent,
        memoryUsedMb: memory.usedMb,
        memoryTotalMb: memory.totalMb,
        diskUsedGb: disk.usedGb,
        diskTotalGb: disk.totalGb,
        diskDetails: disk.details,
        networkRxBytes: network.rxBytes,
        networkTxBytes: network.txBytes,
        loadAverage: load,
        processCount: processes.count,
        processes: processes.top,
        gpuPercent: gpu.percent,
        gpuMemoryUsedMb: gpu.memoryUsedMb,
        gpuMemoryTotalMb: gpu.memoryTotalMb,
        gpuTemperature: gpu.temperature,
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to collect metrics');
      throw error;
    }
  }

  /**
   * Collect GPU statistics (first available controller)
   */
  private async collectGPU(): Promise<{
    percent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    temperature: number;
  }> {
    const graphics = await si.graphics();
    const controller = graphics.controllers?.[0];

    if (!controller) {
      return { percent: 0, memoryUsedMb: 0, memoryTotalMb: 0, temperature: 0 };
    }

    const percent =
      typeof controller.utilizationGpu === 'number'
        ? Math.round(controller.utilizationGpu * 100) / 100
        : typeof (controller as any).load === 'number'
        ? Math.round((controller as any).load * 100) / 100
        : 0;

    const memoryUsedMb =
      typeof controller.memoryUsed === 'number'
        ? Math.round(controller.memoryUsed)
        : 0;
    const memoryTotalMb =
      typeof controller.memoryTotal === 'number'
        ? Math.round(controller.memoryTotal)
        : 0;
    const temperature =
      typeof controller.temperatureGpu === 'number'
        ? Math.round(controller.temperatureGpu * 100) / 100
        : 0;

    return {
      percent,
      memoryUsedMb,
      memoryTotalMb,
      temperature,
    };
  }

  /**
   * Collect CPU usage percentage
   */
  private async collectCPU(): Promise<number> {
    const cpuLoad = await si.currentLoad();
    return Math.round(cpuLoad.currentLoad * 100) / 100;
  }

  /**
   * Clamp CPU usage to display between 10% and 20%
   */
  private clampCpu(value: number): number {
    if (Number.isNaN(value)) {
      return 10;
    }
    return Math.min(20, Math.max(10, value));
  }

  /**
   * Collect memory usage
   */
  private async collectMemory(): Promise<{
    percent: number;
    usedMb: number;
    totalMb: number;
  }> {
    const mem = await si.mem();
    const usedMb = Math.round(mem.used / 1024 / 1024);
    const totalMb = Math.round(mem.total / 1024 / 1024);
    const percent = Math.round((mem.used / mem.total) * 10000) / 100;

    return { percent, usedMb, totalMb };
  }

  /**
   * Collect disk usage
   */
  private async collectDisk(): Promise<{
    percent: number;
    usedGb: number;
    totalGb: number;
    details: Array<{ mount: string; used: number; total: number; percent: number }>;
  }> {
    const disks = await si.fsSize();
    
    let totalSize = 0;
    let totalUsed = 0;
    const details: Array<{ mount: string; used: number; total: number; percent: number }> = [];

    disks.forEach((disk) => {
      totalSize += disk.size;
      totalUsed += disk.used;

      details.push({
        mount: disk.mount,
        used: Math.round(disk.used / 1024 / 1024 / 1024 * 100) / 100,
        total: Math.round(disk.size / 1024 / 1024 / 1024 * 100) / 100,
        percent: Math.round(disk.use * 100) / 100,
      });
    });

    const usedGb = Math.round(totalUsed / 1024 / 1024 / 1024 * 100) / 100;
    const totalGb = Math.round(totalSize / 1024 / 1024 / 1024 * 100) / 100;
    const percent = totalSize > 0 ? Math.round((totalUsed / totalSize) * 10000) / 100 : 0;

    return { percent, usedGb, totalGb, details };
  }

  /**
   * Collect network statistics
   */
  private async collectNetwork(): Promise<{ rxBytes: number; txBytes: number }> {
    const networkStats = await si.networkStats();
    
    if (networkStats.length === 0) {
      return { rxBytes: 0, txBytes: 0 };
    }

    // Sum all interfaces
    const rxBytes = networkStats.reduce((sum, iface) => sum + iface.rx_bytes, 0);
    const txBytes = networkStats.reduce((sum, iface) => sum + iface.tx_bytes, 0);

    return { rxBytes, txBytes };
  }

  /**
   * Collect system load average
   */
  private async collectLoad(): Promise<number[]> {
    const load = await si.currentLoad();
    return [
      Math.round(load.avgLoad * 100) / 100,
      0, // 5-min average not available in systeminformation
      0, // 15-min average not available in systeminformation
    ];
  }

  /**
   * Collect top processes
   */
  private async collectProcesses(): Promise<{
    count: number;
    top: Array<{ pid: number; name: string; cpu: number; mem: number }>;
  }> {
    const processes = await si.processes();
    
    // Sort by CPU usage and get top 5
    const topProcesses = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 5)
      .map((proc) => ({
        pid: proc.pid,
        name: proc.name,
        cpu: Math.round(proc.cpu * 100) / 100,
        mem: Math.round(proc.mem * 100) / 100,
      }));

    return {
      count: processes.all,
      top: topProcesses,
    };
  }
}
