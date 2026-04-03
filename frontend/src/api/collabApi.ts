// 协同规划API客户端 - 封装协同规划相关的API调用
import { apiClient } from './client';
import type {
  CollabRoom,
  TripMember,
  DraftRoute,
  CollabMessage,
  SpotStat,
} from '../store/collabStore';

// ==================== 景点API ====================

/**
 * 获取城市的所有景点
 * @param city 城市名称
 * @param limit 限制数量（默认50）
 * @returns 景点列表
 */
export const getCitySpots = async (city: string, limit: number = 50) => {
  const response = await apiClient.get(`/spots/city/${city}`, {
    params: { limit },
  });
  return response.data;
};

// ==================== 协同房间API ====================

/**
 * 创建协同房间
 * @param tripId 行程ID
 * @returns 房间信息和邀请链接
 */
export const createCollabRoom = async (tripId: string) => {
  const response = await apiClient.post('/collab/rooms', { tripId });
  return response.data;
};

/**
 * 通过邀请token加入协同房间
 * @param token 邀请token
 * @returns 房间信息
 */
export const joinCollabRoom = async (token: string) => {
  const response = await apiClient.post('/collab/rooms/join', { token });
  return response.data;
};

/**
 * 获取房间信息
 * @param roomId 房间ID
 * @returns 房间信息、成员列表、当前phase
 */
export const getCollabRoomInfo = async (roomId: string) => {
  const response = await apiClient.get(`/collab/rooms/${roomId}`);
  return response.data as { success: boolean; data: CollabRoom & { members: TripMember[] } };
};

/**
 * 获取景点统计（仅Host）
 * @param roomId 房间ID
 * @returns 景点统计列表
 */
export const getSpotStats = async (roomId: string) => {
  const response = await apiClient.get(`/collab/rooms/${roomId}/stats`);
  return response.data as { success: boolean; data: SpotStat[] };
};

/**
 * 锁定房间（仅Host）
 * @param roomId 房间ID
 * @returns 更新后的房间信息
 */
export const lockCollabRoom = async (roomId: string) => {
  const response = await apiClient.post(`/collab/rooms/${roomId}/lock`);
  return response.data;
};

// ==================== 草案API ====================

/**
 * 创建或更新草案
 * @param roomId 房间ID
 * @param dayNumber 天数
 * @param spotSequence 景点序列
 * @param polylineData 路线数据
 * @returns 草案信息
 */
export const upsertDraft = async (
  roomId: string,
  dayNumber: number,
  spotSequence: string[],
  polylineData: any
) => {
  const response = await apiClient.post('/collab/drafts', {
    roomId,
    dayNumber,
    spotSequence,
    polylineData,
  });
  return response.data;
};

/**
 * 提交草案
 * @param draftId 草案ID
 * @returns 更新后的草案信息
 */
export const submitDraft = async (draftId: string) => {
  const response = await apiClient.post(`/collab/drafts/${draftId}/submit`);
  return response.data;
};

/**
 * 获取用户的草案列表
 * @param roomId 房间ID
 * @returns 草案列表
 */
export const getUserDrafts = async (roomId: string) => {
  const response = await apiClient.get(`/collab/rooms/${roomId}/drafts`);
  return response.data as { success: boolean; data: DraftRoute[] };
};

/**
 * 获取所有成员的草案
 * @param roomId 房间ID
 * @returns 所有成员的草案
 */
export const getAllDrafts = async (roomId: string) => {
  const response = await apiClient.get(`/collab/rooms/${roomId}/drafts/all`);
  return response.data;
};

// ==================== 消息API ====================

/**
 * 发送消息
 * @param roomId 房间ID
 * @param content 消息内容
 * @returns 消息信息
 */
export const sendCollabMessage = async (roomId: string, content: string) => {
  const response = await apiClient.post('/collab/messages', { roomId, content });
  return response.data;
};

/**
 * 获取房间消息列表
 * @param roomId 房间ID
 * @returns 消息列表
 */
export const getCollabMessages = async (roomId: string) => {
  const response = await apiClient.get(`/collab/messages/${roomId}`);
  return response.data as { success: boolean; data: CollabMessage[] };
};
