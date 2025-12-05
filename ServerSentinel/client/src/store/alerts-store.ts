import { create } from 'zustand';

interface Alert {
  id: string;
  clientId: string;
  metric: string;
  value: number;
  severity: string;
  timestamp: string;
}

interface AlertsState {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  updateAlert: (alertId: string, update: Partial<Alert>) => void;
  removeAlert: (alertId: string) => void;
  clearAlerts: () => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100 alerts
    })),

  updateAlert: (alertId, update) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, ...update } : alert
      ),
    })),

  removeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== alertId),
    })),

  clearAlerts: () => set({ alerts: [] }),
}));
