import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientPreferencesState {
  currentClientId: string | null;
  setCurrentClientId: (clientId: string | null) => void;
}

export const useClientPreferencesStore = create<ClientPreferencesState>()(
  persist(
    (set) => ({
      currentClientId: null,
      setCurrentClientId: (clientId) => set({ currentClientId: clientId }),
    }),
    {
      name: 'client-preferences',
    }
  )
);

