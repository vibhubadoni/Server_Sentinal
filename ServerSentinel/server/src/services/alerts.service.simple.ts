import { NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';
import { alerts, getAlerts, clients } from '../db/memory-store';

export class AlertsService {
  async queryAlerts(query: any) {
    const { clientId, status, severity, page = 1, limit = 50 } = query;

    const filters: any = {};
    if (clientId) filters.clientId = clientId;
    if (status) filters.status = status;
    if (severity) filters.severity = severity;

    const allAlerts = getAlerts(filters);

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedAlerts = allAlerts.slice(start, end);

    // Add client info
    const alertsWithClient = paginatedAlerts.map((alert) => {
      const client = clients.get(alert.clientId);
      return {
        ...alert,
        client: client
          ? {
              id: client.id,
              name: client.name,
              hostname: client.hostname,
            }
          : null,
      };
    });

    return {
      data: alertsWithClient,
      pagination: {
        page,
        limit,
        total: allAlerts.length,
        totalPages: Math.ceil(allAlerts.length / limit),
      },
    };
  }

  async getAlertById(id: string) {
    const alert = alerts.get(id);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    const client = clients.get(alert.clientId);

    return {
      ...alert,
      client: client
        ? {
            id: client.id,
            name: client.name,
            hostname: client.hostname,
            ipAddress: client.ipAddress,
          }
        : null,
    };
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = alerts.get(alertId);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    if (alert.status === 'CLOSED') {
      throw new ForbiddenError('Cannot acknowledge closed alert');
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    logger.info({ alertId, userId }, 'Alert acknowledged');

    const client = clients.get(alert.clientId);

    return {
      ...alert,
      client: client
        ? {
            id: client.id,
            name: client.name,
          }
        : null,
    };
  }

  async closeAlert(alertId: string, userId: string) {
    const alert = alerts.get(alertId);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    alert.status = 'CLOSED';
    alert.resolvedAt = new Date();

    if (alert.status === 'OPEN') {
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
    }

    logger.info({ alertId, userId }, 'Alert closed');

    const client = clients.get(alert.clientId);

    return {
      ...alert,
      client: client
        ? {
            id: client.id,
            name: client.name,
          }
        : null,
    };
  }

  async getAlertStats(clientId?: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const filters: any = {};
    if (clientId) filters.clientId = clientId;

    const allAlerts = getAlerts(filters).filter((a) => a.createdAt >= since);

    const open = allAlerts.filter((a) => a.status === 'OPEN').length;
    const acknowledged = allAlerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
    const closed = allAlerts.filter((a) => a.status === 'CLOSED').length;

    const critical = allAlerts.filter((a) => a.severity === 'CRITICAL').length;
    const high = allAlerts.filter((a) => a.severity === 'HIGH').length;
    const medium = allAlerts.filter((a) => a.severity === 'MEDIUM').length;
    const low = allAlerts.filter((a) => a.severity === 'LOW').length;

    return {
      total: allAlerts.length,
      byStatus: {
        open,
        acknowledged,
        closed,
      },
      bySeverity: {
        critical,
        high,
        medium,
        low,
      },
    };
  }

  async getRecentAlerts(clientId: string, limit = 10) {
    const clientAlerts = getAlerts({ clientId }).slice(0, limit);

    return clientAlerts.map((alert) => {
      const client = clients.get(alert.clientId);
      return {
        ...alert,
        client: client
          ? {
              id: client.id,
              name: client.name,
            }
          : null,
      };
    });
  }
}

export default new AlertsService();
