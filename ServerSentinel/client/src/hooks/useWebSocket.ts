import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useAlertsStore } from '@/store/alerts-store';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const useWebSocket = (enabled: boolean) => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const { addAlert, updateAlert } = useAlertsStore();

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    // Initialize WebSocket connection
    const socket = io(WS_URL, {
      path: '/ws',
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Alert events
    socket.on('alert', (event) => {
      console.log('Alert received:', event);
      
      if (event.type === 'ALERT_CREATED') {
        addAlert(event.alert);
        
        // Show toast notification
        const severityColors: Record<string, string> = {
          CRITICAL: '🔴',
          HIGH: '🟠',
          MEDIUM: '🟡',
          LOW: '🔵',
        };
        
        toast(
          `${severityColors[event.alert.severity] || '🔔'} ${event.alert.metric.toUpperCase()} Alert`,
          {
            duration: 5000,
            style: {
              background: event.alert.severity === 'CRITICAL' ? '#dc2626' : '#1f2937',
            },
          }
        );
      }
    });

    socket.on('alert:update', (event) => {
      console.log('Alert update received:', event);
      updateAlert(event.alertId, event.update);
    });

    socket.on('metric', (event) => {
      console.log('Metric update received:', event);
      // Handle metric updates if needed
    });

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    socket.on('pong', (data) => {
      console.log('Pong received:', data);
    });

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, accessToken, addAlert, updateAlert]);

  return {
    socket: socketRef.current,
    subscribeToClient: (clientId: string) => {
      socketRef.current?.emit('subscribe:client', clientId);
    },
    unsubscribeFromClient: (clientId: string) => {
      socketRef.current?.emit('unsubscribe:client', clientId);
    },
  };
};
