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
  setCurrentItinerary: (itinerary: FullItinerary | null) => void;

  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  completeTrip: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentItinerary: null,
  setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary }),

  user: null,
  setUser: (user) => set({ user }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  completeTrip: () =>
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
