import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/services/api';
import { useClientPreferencesStore } from '@/store/client-preferences';

export const CurrentMachineSelector = () => {
  const { currentClientId, setCurrentClientId } = useClientPreferencesStore();

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientsApi.getAll();
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const options = useMemo(
    () =>
      clientsData?.map((client: any) => ({
        label: client.name,
        value: client.id,
      })) || [],
    [clientsData]
  );

  return (
    <div className="card flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Current Machine
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose a client to view its live CPU / GPU / Memory metrics.
        </p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <select
          className="input md:max-w-sm"
          value={currentClientId || ''}
          onChange={(e) => setCurrentClientId(e.target.value || null)}
          disabled={isLoading}
        >
          <option value="">Select a client...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {currentClientId && (
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">
            ID: {currentClientId}
          </div>
        )}
      </div>
    </div>
  );
};

