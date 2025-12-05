import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Activity, Server, AlertTriangle, TrendingUp } from 'lucide-react';
import { clientsApi, alertsApi, metricsApi } from '@/services/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { CurrentMachineChart } from '@/components/dashboard/CurrentMachineChart';
import { CurrentMachineSelector } from '@/components/dashboard/CurrentMachineSelector';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export const DashboardPage = () => {
  const { data: clientStats } = useQuery({
    queryKey: ['clientStats'],
    queryFn: async () => {
      const response = await clientsApi.getStats();
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: alertStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: async () => {
      const response = await alertsApi.getStats();
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: metricsData } = useQuery({
    queryKey: ['aggregatedMetrics'],
    queryFn: async () => {
      const response = await metricsApi.getAggregated(undefined, 1);
      return response.data.data;
    },
    refetchInterval: 10000,
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Real-time monitoring overview
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Active Clients"
          value={clientStats?.recentlyActive || 0}
          total={clientStats?.active || 0}
          icon={Server}
          color="primary"
        />
        <StatsCard
          title="Open Alerts"
          value={alertStats?.byStatus.open || 0}
          total={alertStats?.total || 0}
          icon={AlertTriangle}
          color="danger"
        />
        <StatsCard
          title="Avg CPU Usage"
          value={`${metricsData?.avgCpu.toFixed(1) || 0}%`}
          icon={Activity}
          color="warning"
        />
        <StatsCard
          title="Avg Memory"
          value={`${metricsData?.avgMemory.toFixed(1) || 0}%`}
          icon={TrendingUp}
          color="success"
        />
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart />
        <RecentAlerts />
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        <CurrentMachineSelector />
        <CurrentMachineChart />
      </motion.div>
    </motion.div>
  );
};
