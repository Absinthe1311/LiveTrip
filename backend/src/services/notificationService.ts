// 推送通知服务 - 向用户发送环境感知通知
import { PrismaClient } from '@prisma/client';
import { SensorResult, SensorLevel } from './environmentSensorService';
import { sendToUser, getIO } from '../socket/socketService';

const prisma = new PrismaClient();

// 通知渠道枚举
export enum NotificationChannel {
  WEBSOCKET = 'websocket', // 实时推送
  IN_APP = 'in_app', // 站内通知
}

// 通知数据接口
interface NotificationData {
  type: string;
  title?: string;
  tripId?: string;
  tripTitle?: string;
  alerts?: SensorResult[];
  [key: string]: any;
}

class NotificationService {
  /**
   * 发送通知
   * @param userId 用户ID
   * @param sensorResult 感知结果
   * @param channels 通知渠道
   */
  async notify(
    userId: string,
    sensorResult: SensorResult,
    channels: NotificationChannel[] = [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
  ): Promise<void> {
    try {
      // 构建通知标题和内容
      const title = this.getNotificationTitle(sensorResult);
      const content = sensorResult.message;

      // 1. 站内通知（始终创建）
      if (channels.includes(NotificationChannel.IN_APP)) {
        await this.createInAppNotification(userId, {
          type: 'sensor',
          title,
          content,
          data: {
            spotId: sensorResult.spotId,
            spotName: sensorResult.spotName,
            sensorType: sensorResult.type,
            level: sensorResult.level,
            ...sensorResult.data,
          },
        });
      }

      // 2. WebSocket实时推送
      if (channels.includes(NotificationChannel.WEBSOCKET)) {
        await this.pushViaWebSocket(userId, {
          type: 'sensor:alert',
          title,
          content,
          level: sensorResult.level,
          spotId: sensorResult.spotId,
          spotName: sensorResult.spotName,
          sensorType: sensorResult.type,
          timestamp: new Date(),
          data: sensorResult.data,
        });
      }

      console.log(`✅ 已向用户 ${userId} 发送通知: ${title}`);
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  /**
   * 批量发送通知
   */
  async notifyBatch(
    userId: string,
    sensorResults: SensorResult[],
    channels: NotificationChannel[] = [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
  ): Promise<void> {
    // 过滤出需要通知的结果（warning和danger级别）
    const dangerousResults = sensorResults.filter(
      (r) => r.level === SensorLevel.WARNING || r.level === SensorLevel.DANGER
    );

    if (dangerousResults.length === 0) return;

    // 发送汇总通知
    const title = `环境感知提醒：发现 ${dangerousResults.length} 个需要注意的景点`;
    const content = dangerousResults.map((r) => r.message).join('\n');

    // 创建站内通知
    if (channels.includes(NotificationChannel.IN_APP)) {
      await this.createInAppNotification(userId, {
        type: 'sensor',
        title,
        content,
        data: {
          alerts: dangerousResults.map((r) => ({
            spotId: r.spotId,
            spotName: r.spotName,
            type: r.type,
            level: r.level,
            message: r.message,
          })),
        },
      });
    }

    // WebSocket推送
    if (channels.includes(NotificationChannel.WEBSOCKET)) {
      await this.pushViaWebSocket(userId, {
        type: 'sensor:alert',
        title,
        content,
        level: SensorLevel.WARNING,
        alerts: dangerousResults,
        timestamp: new Date(),
      });
    }

    console.log(`✅ 已向用户 ${userId} 发送批量通知: ${title}`);
  }

  /**
   * WebSocket 实时推送
   */
  private async pushViaWebSocket(userId: string, data: any): Promise<void> {
    try {
      sendToUser(userId, 'sensor:alert', data);
    } catch (error) {
      console.error('WebSocket推送失败:', error);
    }
  }

  /**
   * 站内通知
   */
  private async createInAppNotification(
    userId: string,
    data: {
      type: string;
      title: string;
      content: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          content: data.content,
          data: data.data ? JSON.stringify(data.data) : '{}',
        },
      });
    } catch (error) {
      console.error('创建站内通知失败:', error);
    }
  }

  /**
   * 获取通知标题
   */
  private getNotificationTitle(result: SensorResult): string {
    const levelText =
      result.level === SensorLevel.DANGER
        ? '⚠️ 紧急'
        : result.level === SensorLevel.WARNING
          ? '⚡ 警告'
          : 'ℹ️ 提示';

    const typeText =
      {
        rain: '降雨',
        crowd: '人流',
        temp: '温度',
        close: '关闭',
      }[result.type] || '环境';

    return `${levelText}：${result.spotName} ${typeText}提醒`;
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
  }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : {},
      })),
      total,
      unreadCount,
    };
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.update({
        where: { id: notificationId, userId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('标记通知已读失败:', error);
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
    }
  }
}

// 导出单例
export const notificationService = new NotificationService();
