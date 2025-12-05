import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Server, Plus, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { clientsApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { useClientPreferencesStore } from '@/store/client-preferences';

export const ClientsPage = () => {
  const queryClient = useQueryClient();
  const { currentClientId, setCurrentClientId } = useClientPreferencesStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    hostname: '',
    ipAddress: '',
    osType: '',
    osVersion: '',
  });
  const [createdClient, setCreatedClient] = useState<{
    client: any;
    token: string;
  } | null>(null);

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await clientsApi.getAll();
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        name: formState.name.trim(),
      };

      if (formState.hostname.trim()) payload.hostname = formState.hostname.trim();
      if (formState.ipAddress.trim()) payload.ipAddress = formState.ipAddress.trim();
      if (formState.osType.trim()) payload.osType = formState.osType.trim();
      if (formState.osVersion.trim()) payload.osVersion = formState.osVersion.trim();

      const response = await clientsApi.create(payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setCreatedClient(data);
      setFormState({
        name: '',
        hostname: '',
        ipAddress: '',
        osType: '',
        osVersion: '',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      return;
    }
    createClientMutation.mutate();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCreatedClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage monitored servers
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setCreatedClient(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-5 h-5" />
          Add Client
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientsData?.map((client: any) => (
          <motion.div
            key={client.id}
            whileHover={{ scale: 1.02, y: -4 }}
            className="card cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <Server className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {client.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {client.hostname}
                  </p>
                </div>
              </div>
              <span
                className={`badge ${
                  client.isActive ? 'badge-success' : 'badge-danger'
                }`}
              >
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">OS:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {client.osType} {client.osVersion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Seen:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {client.lastSeen
                    ? formatDistanceToNow(new Date(client.lastSeen), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Register Client
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Create a new monitored machine and receive its one-time token.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. My-Laptop"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hostname</label>
                  <input
                    type="text"
                    className="input"
                    value={formState.hostname}
                    onChange={(e) => setFormState((prev) => ({ ...prev, hostname: e.target.value }))}
                    placeholder="DESKTOP-1234"
                  />
                </div>
                <div>
                  <label className="label">IP Address</label>
                  <input
                    type="text"
                    className="input"
                    value={formState.ipAddress}
                    onChange={(e) => setFormState((prev) => ({ ...prev, ipAddress: e.target.value }))}
                    placeholder="192.168.1.50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">OS Type</label>
                  <input
                    type="text"
                    className="input"
                    value={formState.osType}
                    onChange={(e) => setFormState((prev) => ({ ...prev, osType: e.target.value }))}
                    placeholder="Windows 11"
                  />
                </div>
                <div>
                  <label className="label">OS Version</label>
                  <input
                    type="text"
                    className="input"
                    value={formState.osVersion}
                    onChange={(e) => setFormState((prev) => ({ ...prev, osVersion: e.target.value }))}
                    placeholder="22H2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>

            {createClientMutation.isError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 p-3 text-xs text-red-800 dark:text-red-200">
                {(createClientMutation.error as AxiosError<any>)?.response?.data?.error
                  ?.message || 'Failed to create client. Please check your inputs and that you are logged in as an admin/operator.'}
              </div>
            )}

            {createdClient && (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/20 p-4">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  Client Created Successfully
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  Copy the ID and token below. The token will only be shown this one time.
                </p>
                <div className="space-y-2 font-mono text-xs">
                  <div>
                    <span className="font-semibold">Client ID:</span> {createdClient.client.id}
                  </div>
                  <div>
                    <span className="font-semibold">Token:</span> {createdClient.token}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
