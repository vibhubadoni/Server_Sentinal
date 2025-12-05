import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { metricsApi } from '@/services/api';
import { format } from 'date-fns';
import { useClientPreferencesStore } from '@/store/client-preferences';

export const CurrentMachineChart = () => {
  const { currentClientId } = useClientPreferencesStore();
  const enabled = Boolean(currentClientId);

  const { data: metricsData } = useQuery({
    queryKey: ['metrics', 'currentMachine', currentClientId],
    enabled,
    queryFn: async () => {
      const response = await metricsApi.getLatest(currentClientId!, 40);
      return response.data.data;
    },
    refetchInterval: 15000,
  });

  const chartData =
    useMemo(
      () =>
        metricsData
          ?.slice()
          .reverse()
          .map((metric: any) => ({
            time: format(new Date(metric.metricTime), 'HH:mm:ss'),
            cpu: metric.cpuPercent ?? 0,
            memory: metric.memoryPercent ?? 0,
            gpu: metric.gpuPercent ?? 0,
          })) ?? [],
      [metricsData]
    );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Current Machine
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live CPU / GPU / Memory usage
          </p>
        </div>
        {currentClientId && (
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {currentClientId}
          </span>
        )}
      </div>

      {!enabled ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Select a client to view its live metrics from the dropdown below.
        </div>
      ) : chartData.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Waiting for metrics...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="time" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
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
            <Line type="monotone" dataKey="gpu" stroke="#a855f7" strokeWidth={2} name="GPU %" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

