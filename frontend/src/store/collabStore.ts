// 协同规划状态管理 - 使用Zustand管理协同规划的全局状态
import { create } from 'zustand';

// ==================== 类型定义 ====================

export interface CollabRoom {
  id: string;
  tripId: string;
  hostId: string;
  phase: 'EDITING' | 'LOCKED';
  inviteToken: string;
  inviteExpiresAt: string;
  createdAt: string;
  updatedAt: string;
  trip?: any;
  host?: {
    id: string;
    username: string;
    avatar: string;
  };
}

export interface TripMember {
  id: string;
  roomId: string;
  userId: string;
  role: 'HOST' | 'COLLABORATOR';
  assignedDays: string; // JSON数组
  joinedAt: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export interface DraftRoute {
  id: string;
  roomId: string;
  userId: string;
  dayNumber: number;
  spotSequence: string; // JSON数组
  polylineData: string; // JSON
  isSubmitted: boolean;
  version: number;
  updatedAt: string;
}

export interface CollabMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export interface SpotStat {
  id: string;
  name: string;
  location: string;
  category: string | null;
  count: number;
}

export interface CursorPosition {
  userId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

// ==================== Store状态接口 ====================

interface CollabState {
  // 当前房间
  currentRoom: CollabRoom | null;
  setRoom: (room: CollabRoom | null) => void;

  // 成员列表
  members: TripMember[];
  setMems: (members: TripMember[]) => void;
  addMem: (member: TripMember) => void;
  delMem: (userId: string) => void;

  // 我的草案
  myDrafts: Map<number, DraftRoute>; // key: dayNumber
  setDrafts: (drafts: DraftRoute[]) => void;
  updDraft: (draft: DraftRoute) => void;

  // 其他人的实时光标
  otherCursors: Map<string, CursorPosition>; // key: userId
  shiftCursor: (userId: string, position: CursorPosition) => void;
  delCursor: (userId: string) => void;

  // 可见图层
  visibleLayers: Set<string>; // userId集合
  toggleLayer: (userId: string) => void;
  setVisibleLayers: (layers: Set<string>) => void;

  // 消息列表
  messages: CollabMessage[];
  setMsgs: (messages: CollabMessage[]) => void;
  msgIn: (message: CollabMessage) => void;

  // 景点统计（仅Host）
  spotStats: SpotStat[];
  setSpotStats: (stats: SpotStat[]) => void;

  // 当前选中的天数
  currentDay: number;
  setCurrentDay: (day: number) => void;

  // 在线用户ID集合
  onlineUsers: Set<string>;
  setOnlineUsers: (users: Set<string>) => void;
  addOnline: (userId: string) => void;
  popUser: (userId: string) => void;

  // 重置状态
  reset: () => void;
}

// ==================== Store实现 ====================

export const useCollab = create<CollabState>((set) => ({
  // 当前房间
  currentRoom: null,
  setRoom: (room) => set({ currentRoom: room }),

  // 成员列表
  members: [],
  setMems: (members) => set({ members }),
  addMem: (member) =>
    set((state) => ({
      members: [...state.members, member],
    })),
  delMem: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  // 我的草案
  myDrafts: new Map(),
  setDrafts: (drafts) => {
    const map = new Map<number, DraftRoute>();
    drafts.forEach((draft) => {
      map.set(draft.dayNumber, draft);
    });
    set({ myDrafts: map });
  },
  updDraft: (draft) =>
    set((state) => {
      const newMap = new Map(state.myDrafts);
      newMap.set(draft.dayNumber, draft);
      return { myDrafts: newMap };
    }),

  // 其他人的实时光标
  otherCursors: new Map(),
  shiftCursor: (userId, position) =>
    set((state) => {
      const newMap = new Map(state.otherCursors);
      newMap.set(userId, position);
      return { otherCursors: newMap };
    }),
  delCursor: (userId) =>
    set((state) => {
      const newMap = new Map(state.otherCursors);
      newMap.delete(userId);
      return { otherCursors: newMap };
    }),

  // 可见图层
  visibleLayers: new Set(),
  toggleLayer: (userId) =>
    set((state) => {
      const newSet = new Set(state.visibleLayers);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return { visibleLayers: newSet };
    }),
  setVisibleLayers: (layers) => set({ visibleLayers: layers }),

  // 消息列表
  messages: [],
  setMsgs: (messages) => set({ messages }),
  msgIn: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // 景点统计
  spotStats: [],
  setSpotStats: (stats) => set({ spotStats: stats }),

  // 当前选中的天数
  currentDay: 1,
  setCurrentDay: (day) => set({ currentDay: day }),

  // 在线用户
  onlineUsers: new Set(),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnline: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    }),
  popUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    }),

  // 重置状态
  reset: () =>
    set({
      currentRoom: null,
      members: [],
      myDrafts: new Map(),
      otherCursors: new Map(),
      visibleLayers: new Set(),
      messages: [],
      spotStats: [],
      currentDay: 1,
      onlineUsers: new Set(),
    }),
}));
