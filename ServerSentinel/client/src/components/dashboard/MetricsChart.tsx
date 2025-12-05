import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { metricsApi } from '@/services/api';
import { format } from 'date-fns';

export const MetricsChart = () => {
  const { data: metricsData } = useQuery({
    queryKey: ['metrics', 'chart'],
    queryFn: async () => {
      const response = await metricsApi.query({
        limit: 50,
      });
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const chartData = metricsData?.map((metric: any) => ({
    time: format(new Date(metric.metricTime), 'HH:mm'),
    cpu: metric.cpuPercent,
    memory: metric.memoryPercent,
    disk: metric.diskPercent,
  })) || [];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        System Metrics
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="time" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#f9fafb',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="cpu" stroke="#0ea5e9" strokeWidth={2} name="CPU %" />
          <Line type="monotone" dataKey="memory" stroke="#22c55e" strokeWidth={2} name="Memory %" />
          <Line type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={2} name="Disk %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
