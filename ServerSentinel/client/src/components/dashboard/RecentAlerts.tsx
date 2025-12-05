import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { alertsApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

const severityColors: Record<string, string> = {
  CRITICAL: 'badge-danger',
  HIGH: 'badge-warning',
  MEDIUM: 'badge-info',
  LOW: 'badge-success',
};

export const RecentAlerts = () => {
  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: async () => {
      const response = await alertsApi.query({
        limit: 5,
        status: 'OPEN',
      });
      return response.data.data;
    },
    refetchInterval: 10000,
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Alerts
        </h3>
        <span className="badge badge-danger">{alertsData?.length || 0} Open</span>
      </div>

      <div className="space-y-3">
        {alertsData && alertsData.length > 0 ? (
          alertsData.map((alert: any, index: number) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {alert.title}
                    </p>
                    <span className={`badge ${severityColors[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {alert.client?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No open alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};
