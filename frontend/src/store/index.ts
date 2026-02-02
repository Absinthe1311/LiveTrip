import { create } from 'zustand';

// 全局状态管理
interface AppState {
  // 当前行程
  currentItinerary: any | null;
  setCurrentItinerary: (itinerary: any) => void;

  // 用户信息
  user: any | null;
  setUser: (user: any) => void;

  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentItinerary: null,
  setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary }),

  user: null,
  setUser: (user) => set({ user }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
