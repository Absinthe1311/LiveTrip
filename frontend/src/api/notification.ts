// 通知API服务
import apiClient from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  data: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * 获取通知列表
 */
export const fetNotifs = async (
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<NotificationListResponse> => {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  if (options.unreadOnly) params.append('unreadOnly', 'true');

  const response = await apiClient.get(`/notifications?${params.toString()}`);
  return response.data.data;
};

/**
 * 标记通知为已读
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/read`);
};

/**
 * 标记所有通知为已读
 */
export const readAll = async (): Promise<void> => {
  await apiClient.put('/notifications/read-all');
};
