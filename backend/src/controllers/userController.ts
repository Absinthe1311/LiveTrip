/**
 * 用户信息控制器
 * 处理用户信息的CRUD操作
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { cloudinaryService } from '../services/cloudinaryService';

const prisma = getPrismaClient();

export class UserController {
  /**
   * 获取用户完整信息（含统计数据）
   * GET /api/users/profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授权，请先登录',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          nickname: true,
          gender: true,
          bio: true,
          role: true,
          totalTrips: true,
          totalCities: true,
          completedTrips: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error.message,
      });
    }
  }

  /**
   * 更新用户基本信息
   * PUT /api/users/profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { nickname, gender, bio } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授权，请先登录',
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          nickname,
          gender,
          bio,
        },
      });

      res.json({
        success: true,
        data: user,
        message: '用户信息更新成功',
      });
    } catch (error: any) {
      console.error('更新用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败',
        error: error.message,
      });
    }
  }

  /**
   * 上传头像
   * POST /api/users/avatar
   */
  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授权，请先登录',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择要上传的图片',
        });
        return;
      }

      // 上传到Cloudinary（将File转换为Buffer）
      const result = await cloudinaryService.uploadImage(req.file.buffer, 'avatars');

      // 更新用户头像
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          avatar: result.cloudinaryUrl,
        },
      });

      res.json({
        success: true,
        data: {
          url: result.cloudinaryUrl,
          publicId: result.cloudinaryId,
        },
        message: '头像上传成功',
      });
    } catch (error: any) {
      console.error('上传头像失败:', error);
      res.status(500).json({
        success: false,
        message: '上传头像失败',
        error: error.message,
      });
    }
  }

  /**
   * 更新用户统计数据
   * 内部方法，在创建/删除/完成行程时调用
   */
  static async updateUserStats(userId: string): Promise<void> {
    try {
      // 获取用户所有行程
      const trips = await prisma.trip.findMany({
        where: { userId },
        select: {
          id: true,
          destination: true,
          status: true,
        },
      });

      // 统计城市数（去重）
      const cities = new Set(trips.map(t => t.destination).filter(Boolean));

      // 统计已完成行程数
      const completedTrips = trips.filter(t => t.status === 'completed').length;

      // 更新用户统计
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalTrips: trips.length,
          totalCities: cities.size,
          completedTrips: completedTrips,
        },
      });

      console.log(`✅ 用户 ${userId} 统计数据已更新: ${trips.length} 行程, ${cities.size} 城市, ${completedTrips} 已完成`);
    } catch (error: any) {
      console.error('更新用户统计数据失败:', error);
    }
  }
}
