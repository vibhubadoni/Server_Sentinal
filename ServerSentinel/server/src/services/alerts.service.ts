import prisma from '../db/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

export interface AlertQuery {
  clientId?: string;
  status?: string;
  severity?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export class AlertsService {
  /**
   * Query alerts with filters and pagination
   */
  async queryAlerts(query: AlertQuery) {
    const { clientId, status, severity, from, to, page = 1, limit = 50 } = query;

    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              hostname: true,
            },
          },
          acknowledgedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return {
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get alert by ID
   */
  async getAlertById(id: string) {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            hostname: true,
            ipAddress: true,
          },
        },
        acknowledgedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { id: true, status: true },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    if (alert.status === 'CLOSED') {
      throw new ForbiddenError('Cannot acknowledge closed alert');
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info({ alertId, userId }, 'Alert acknowledged');

    return updatedAlert;
  }

  /**
   * Close an alert
   */
  async closeAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { id: true, status: true },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'CLOSED',
        resolvedAt: new Date(),
        ...(alert.status === 'OPEN' && {
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
        }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info({ alertId, userId }, 'Alert closed');

    return updatedAlert;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(clientId?: string, hours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const where: any = {
      createdAt: { gte: since },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    const [total, open, acknowledged, closed, critical, high, medium, low] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.count({ where: { ...where, status: 'OPEN' } }),
      prisma.alert.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
      prisma.alert.count({ where: { ...where, status: 'CLOSED' } }),
      prisma.alert.count({ where: { ...where, severity: 'CRITICAL' } }),
      prisma.alert.count({ where: { ...where, severity: 'HIGH' } }),
      prisma.alert.count({ where: { ...where, severity: 'MEDIUM' } }),
      prisma.alert.count({ where: { ...where, severity: 'LOW' } }),
    ]);

    return {
      total,
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

  /**
   * Get recent alerts for a client
   */
  async getRecentAlerts(clientId: string, limit = 10) {
    return prisma.alert.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

export default new AlertsService();
