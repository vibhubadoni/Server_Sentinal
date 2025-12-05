import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { alertsApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

const severityColors: Record<string, string> = {
  CRITICAL: 'badge-danger',
  HIGH: 'badge-warning',
  MEDIUM: 'badge-info',
  LOW: 'badge-success',
};

export const AlertsPage = () => {
  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await alertsApi.query({ limit: 50 });
      return response.data.data;
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Alerts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and manage system alerts
        </p>
      </div>

      <div className="card">
        <div className="space-y-3">
          {alertsData && alertsData.length > 0 ? (
            alertsData.map((alert: any) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {alert.status === 'OPEN' && (
                      <AlertTriangle className="w-6 h-6 text-danger-500" />
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <CheckCircle className="w-6 h-6 text-warning-500" />
                    )}
                    {alert.status === 'CLOSED' && (
                      <XCircle className="w-6 h-6 text-success-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </h3>
                      <span className={`badge ${severityColors[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="badge badge-info">{alert.status}</span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>Client: {alert.client?.name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {alert.status === 'OPEN' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary text-sm"
                    >
                      Acknowledge
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No alerts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
