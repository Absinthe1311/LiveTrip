import { create } from 'zustand';
import type { FullItinerary } from '../api/client';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  role?: string;
  avatar?: string;
  nickname?: string;
}

interface AppState {
  currentItinerary: FullItinerary | null;
  setPlan: (itinerary: FullItinerary | null) => void;

  user: UserProfile | null;
  setProfile: (user: UserProfile | null) => void;

  isLoading: boolean;
  setLoad: (loading: boolean) => void;

  endTrip: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentItinerary: null,
  setPlan: (itinerary) => set({ currentItinerary: itinerary }),

  user: null,
  setProfile: (user) => set({ user }),

  isLoading: false,
  setLoad: (loading) => set({ isLoading: loading }),

  endTrip: () =>
    set((state) => {
      if (state.currentItinerary) {
        return {
          currentItinerary: {
            ...state.currentItinerary,
            status: 'completed',
          },
        };
      }
      return state;
    }),
}));
