import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import logger from '../utils/logger';
import config from '../config/index.simple';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketServer {
  private io: Server;
  private connectedUsers: Map<string, Set<string>> = new Map();

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
  }

  private setupMiddleware() {
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

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);

      socket.on('subscribe:client', (clientId: string) => {
        socket.join(`client:${clientId}`);
        logger.debug({ userId, socketId: socket.id, clientId }, 'Subscribed to client');
      });

      socket.on('unsubscribe:client', (clientId: string) => {
        socket.leave(`client:${clientId}`);
        logger.debug({ userId, socketId: socket.id, clientId }, 'Unsubscribed from client');
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

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

      socket.emit('connected', {
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });
  }

  public broadcastAlert(alert: any) {
    const event = {
      type: 'ALERT_CREATED',
      alert: {
        id: alert.id,
        clientId: alert.clientId,
        metric: alert.metric,
        value: alert.value,
        severity: alert.severity,
        timestamp: new Date().toISOString(),
      },
    };

    this.io.emit('alert', event);

    if (alert.clientId) {
      this.io.to(`client:${alert.clientId}`).emit('alert', event);
    }

    logger.debug({ alertId: alert.id }, 'Alert broadcasted via WebSocket');
  }

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

  public sendMetricUpdate(clientId: string, metric: any) {
    const event = {
      type: 'METRIC_UPDATE',
      clientId,
      metric,
      timestamp: new Date().toISOString(),
    };

    this.io.to(`client:${clientId}`).emit('metric', event);
  }

  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  public getTotalConnectionCount(): number {
    return this.io.sockets.sockets.size;
  }

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
