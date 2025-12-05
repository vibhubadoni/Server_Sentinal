import { useClientPreferencesStore } from '@/store/client-preferences';

export const useCurrentClient = () => {
  const { currentClientId, setCurrentClientId } = useClientPreferencesStore();
  return { currentClientId, setCurrentClientId };
};

