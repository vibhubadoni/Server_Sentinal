// In-Memory Database - No external database needed!
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Data stores
export const users = new Map<string, any>();
export const clients = new Map<string, any>();
export const metrics = new Map<string, any>();
export const alerts = new Map<string, any>();
export const refreshTokens = new Map<string, any>();

// Initialize with sample data
export const initializeData = async () => {
  // Create sample users
  const adminId = uuidv4();
  const operatorId = uuidv4();
  const viewerId = uuidv4();

  const passwordHash = await bcrypt.hash('password123', 10);

  users.set(adminId, {
    id: adminId,
    email: 'admin@serversentinel.io',
    passwordHash,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    lastLogin: null,
  });

  users.set(operatorId, {
    id: operatorId,
    email: 'operator@serversentinel.io',
    passwordHash,
    role: 'operator',
    firstName: 'Operator',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    lastLogin: null,
  });

  users.set(viewerId, {
    id: viewerId,
    email: 'viewer@serversentinel.io',
    passwordHash,
    role: 'viewer',
    firstName: 'Viewer',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    lastLogin: null,
  });

  // Create sample clients
  const client1Id = uuidv4();
  const client2Id = uuidv4();
  const client3Id = uuidv4();

  const clientToken = await bcrypt.hash('demo-token', 10);

  clients.set(client1Id, {
    id: client1Id,
    name: 'Production Server 1',
    tokenHash: clientToken,
    hostname: 'prod-server-01',
    ipAddress: '10.0.1.10',
    osType: 'Linux',
    osVersion: 'Ubuntu 22.04',
    agentVersion: '1.0.0',
    thresholdCpu: 85,
    thresholdMemory: 85,
    thresholdDisk: 90,
    isActive: true,
    lastSeen: new Date(),
    createdAt: new Date(),
  });

  clients.set(client2Id, {
    id: client2Id,
    name: 'Database Server',
    tokenHash: clientToken,
    hostname: 'db-server-01',
    ipAddress: '10.0.2.10',
    osType: 'Linux',
    osVersion: 'Ubuntu 22.04',
    agentVersion: '1.0.0',
    thresholdCpu: 75,
    thresholdMemory: 80,
    thresholdDisk: 85,
    isActive: true,
    lastSeen: new Date(),
    createdAt: new Date(),
  });

  clients.set(client3Id, {
    id: client3Id,
    name: 'Application Server',
    tokenHash: clientToken,
    hostname: 'app-server-01',
    ipAddress: '10.0.3.10',
    osType: 'Linux',
    osVersion: 'CentOS 8',
    agentVersion: '1.0.0',
    thresholdCpu: 85,
    thresholdMemory: 85,
    thresholdDisk: 90,
    isActive: true,
    lastSeen: new Date(),
    createdAt: new Date(),
  });

  // Create sample metrics
  const now = new Date();
  [client1Id, client2Id, client3Id].forEach((clientId) => {
    for (let i = 0; i < 20; i++) {
      const metricId = uuidv4();
      const metricTime = new Date(now.getTime() - i * 30000); // Every 30 seconds

      metrics.set(metricId, {
        id: metricId,
        clientId,
        metricTime,
        cpuPercent: 40 + Math.random() * 30,
        memoryPercent: 50 + Math.random() * 25,
        diskPercent: 60 + Math.random() * 20,
        memoryUsedMb: 8000 + Math.random() * 4000,
        memoryTotalMb: 16000,
        diskUsedGb: 300 + Math.random() * 100,
        diskTotalGb: 500,
        networkRxBytes: Math.floor(Math.random() * 1000000),
        networkTxBytes: Math.floor(Math.random() * 500000),
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
        processCount: 150 + Math.floor(Math.random() * 50),
      });
    }
  });

  // Create sample alerts
  const alert1Id = uuidv4();
  const alert2Id = uuidv4();

  alerts.set(alert1Id, {
    id: alert1Id,
    clientId: client1Id,
    metric: 'cpu',
    value: 92.5,
    threshold: 85,
    severity: 'CRITICAL',
    status: 'OPEN',
    title: 'High CPU Usage on Production Server 1',
    message: 'CPU usage is at 92.5%, exceeding threshold of 85%',
    createdAt: new Date(now.getTime() - 300000), // 5 minutes ago
    acknowledgedBy: null,
    acknowledgedAt: null,
  });

  alerts.set(alert2Id, {
    id: alert2Id,
    clientId: client2Id,
    metric: 'memory',
    value: 88.3,
    threshold: 80,
    severity: 'HIGH',
    status: 'OPEN',
    title: 'High Memory Usage on Database Server',
    message: 'Memory usage is at 88.3%, exceeding threshold of 80%',
    createdAt: new Date(now.getTime() - 180000), // 3 minutes ago
    acknowledgedBy: null,
    acknowledgedAt: null,
  });

  console.log('✅ In-memory database initialized with sample data');
  console.log(`   Users: ${users.size}`);
  console.log(`   Clients: ${clients.size}`);
  console.log(`   Metrics: ${metrics.size}`);
  console.log(`   Alerts: ${alerts.size}`);
};

// Helper functions
export const findUserByEmail = (email: string) => {
  return Array.from(users.values()).find((u) => u.email === email);
};

export const findClientById = (id: string) => {
  return clients.get(id);
};

export const getAllClients = () => {
  return Array.from(clients.values());
};

export const getMetricsByClientId = (clientId: string, limit = 50) => {
  return Array.from(metrics.values())
    .filter((m) => m.clientId === clientId)
    .sort((a, b) => b.metricTime.getTime() - a.metricTime.getTime())
    .slice(0, limit);
};

export const getAllMetrics = (limit = 100) => {
  return Array.from(metrics.values())
    .sort((a, b) => b.metricTime.getTime() - a.metricTime.getTime())
    .slice(0, limit);
};

export const getAlerts = (filters: any = {}) => {
  let result = Array.from(alerts.values());

  if (filters.status) {
    result = result.filter((a) => a.status === filters.status);
  }

  if (filters.severity) {
    result = result.filter((a) => a.severity === filters.severity);
  }

  if (filters.clientId) {
    result = result.filter((a) => a.clientId === filters.clientId);
  }

  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const addMetric = (metricData: any) => {
  const id = uuidv4();
  const metric = {
    id,
    ...metricData,
    metricTime: new Date(metricData.timestamp),
  };
  metrics.set(id, metric);

  // Check thresholds and create alerts
  checkThresholds(metric);

  return metric;
};

const checkThresholds = (metric: any) => {
  const client = clients.get(metric.clientId);
  if (!client) return;

  // Check CPU
  if (metric.cpuPercent > client.thresholdCpu) {
    const recentAlerts = Array.from(alerts.values()).filter(
      (a) =>
        a.clientId === metric.clientId &&
        a.metric === 'cpu' &&
        a.status === 'OPEN' &&
        new Date().getTime() - a.createdAt.getTime() < 600000 // 10 minutes
    );

    if (recentAlerts.length === 0) {
      const alertId = uuidv4();
      alerts.set(alertId, {
        id: alertId,
        clientId: metric.clientId,
        metric: 'cpu',
        value: metric.cpuPercent,
        threshold: client.thresholdCpu,
        severity: metric.cpuPercent > client.thresholdCpu + 10 ? 'CRITICAL' : 'HIGH',
        status: 'OPEN',
        title: `High CPU Usage on ${client.name}`,
        message: `CPU usage is at ${metric.cpuPercent.toFixed(1)}%, exceeding threshold of ${client.thresholdCpu}%`,
        createdAt: new Date(),
        acknowledgedBy: null,
        acknowledgedAt: null,
      });
    }
  }

  // Similar checks for memory and disk...
};
