// 通知控制器 - 处理通知相关请求
import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { sensorScheduler } from '../services/sensorScheduler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取用户通知列表
 * GET /api/notifications
 */
export const fetNotifs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取通知列表失败',
    });
  }
};

/**
 * 标记通知为已读
 * PUT /api/notifications/:id/read
 */
export const readAllNotifs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const id = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: '通知已标记为已读',
    });
  } catch (error: any) {
    console.error('标记通知已读失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '标记通知已读失败',
    });
  }
};

/**
 * 标记所有通知为已读
 * PUT /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: '所有通知已标记为已读',
    });
  } catch (error: any) {
    console.error('标记所有通知已读失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '标记所有通知已读失败',
    });
  }
};

/**
 * 手动触发环境感知
 * POST /api/sensor/run
 */
export const fireSensor = async (req: Request, res: Response) => {
  try {
    const { spotIds } = req.body;

    await sensorScheduler.triggerManualSensing(spotIds);

    res.json({
      success: true,
      message: '环境感知已触发',
    });
  } catch (error: any) {
    console.error('触发环境感知失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '触发环境感知失败',
    });
  }
};

/**
 * 删除单个通知
 * DELETE /api/notifications/:id
 */
export const delNotif = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const id = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    await prisma.notification.delete({
      where: { id, userId },
    });

    res.json({
      success: true,
      message: '通知已删除',
    });
  } catch (error: any) {
    console.error('删除通知失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除通知失败',
    });
  }
};

/**
 * 清空所有通知
 * DELETE /api/notifications/clear-all
 */
export const flushNotifs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: '所有通知已清空',
    });
  } catch (error: any) {
    console.error('清空通知失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '清空通知失败',
    });
  }
};
