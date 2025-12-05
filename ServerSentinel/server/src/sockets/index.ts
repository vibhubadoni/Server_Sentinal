import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import logger from '../utils/logger';
import config from '../config';
import { redisPubSub } from '../db/redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketServer {
  private io: Server;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin.split(','),
        credentials: true,
      },
      path: '/ws',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.subscribeToAlerts();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const payload = verifyAccessToken(token as string);
        socket.userId = payload.userId;
        socket.userRole = payload.role;

        logger.debug({ userId: payload.userId, socketId: socket.id }, 'WebSocket authenticated');
        next();
      } catch (error) {
        logger.error({ error }, 'WebSocket authentication failed');
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;

      logger.info({ userId, socketId: socket.id }, 'WebSocket client connected');

      // Track connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Handle subscription to specific clients
      socket.on('subscribe:client', (clientId: string) => {
        socket.join(`client:${clientId}`);
        logger.debug({ userId, socketId: socket.id, clientId }, 'Subscribed to client');
      });

      socket.on('unsubscribe:client', (clientId: string) => {
        socket.leave(`client:${clientId}`);
        logger.debug({ userId, socketId: socket.id, clientId }, 'Unsubscribed from client');
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info({ userId, socketId: socket.id, reason }, 'WebSocket client disconnected');

        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });

      // Send initial connection success
      socket.emit('connected', {
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Subscribe to Redis pub/sub for alert notifications
   */
  private subscribeToAlerts() {
    redisPubSub.subscribe('alert_created', (err) => {
      if (err) {
        logger.error({ error: err }, 'Failed to subscribe to alert_created channel');
      } else {
        logger.info('Subscribed to alert_created channel');
      }
    });

    redisPubSub.on('message', (channel, message) => {
      if (channel === 'alert_created') {
        try {
          const alert = JSON.parse(message);
          this.broadcastAlert(alert);
        } catch (error) {
          logger.error({ error, message }, 'Failed to parse alert message');
        }
      }
    });
  }

  /**
   * Broadcast alert to all connected users
   */
  public broadcastAlert(alert: any) {
    const event = {
      type: 'ALERT_CREATED',
      alert: {
        id: alert.alert_id,
        clientId: alert.client_id,
        metric: alert.metric,
        value: alert.value,
        severity: alert.severity,
        timestamp: new Date().toISOString(),
      },
    };

    // Broadcast to all connected clients
    this.io.emit('alert', event);

    // Also send to specific client room
    if (alert.client_id) {
      this.io.to(`client:${alert.client_id}`).emit('alert', event);
    }

    logger.debug({ alertId: alert.alert_id }, 'Alert broadcasted via WebSocket');
  }

  /**
   * Send alert update to specific users
   */
  public sendAlertUpdate(alertId: string, update: any, userIds?: string[]) {
    const event = {
      type: 'ALERT_UPDATED',
      alertId,
      update,
      timestamp: new Date().toISOString(),
    };

    if (userIds && userIds.length > 0) {
      userIds.forEach((userId) => {
        this.io.to(`user:${userId}`).emit('alert:update', event);
      });
    } else {
      this.io.emit('alert:update', event);
    }
  }

  /**
   * Send metric update to subscribers
   */
  public sendMetricUpdate(clientId: string, metric: any) {
    const event = {
      type: 'METRIC_UPDATE',
      clientId,
      metric,
      timestamp: new Date().toISOString(),
    };

    this.io.to(`client:${clientId}`).emit('metric', event);
  }

  /**
   * Get connected user count
   */
  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get total connection count
   */
  public getTotalConnectionCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): Server {
    return this.io;
  }
}

let wsServer: WebSocketServer;

export const initializeWebSocket = (httpServer: HttpServer): WebSocketServer => {
  wsServer = new WebSocketServer(httpServer);
  return wsServer;
};

export const getWebSocketServer = (): WebSocketServer => {
  if (!wsServer) {
    throw new Error('WebSocket server not initialized');
  }
  return wsServer;
};

export default { initializeWebSocket, getWebSocketServer };
