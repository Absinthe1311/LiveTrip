import { Request, Response } from 'express';
import { imageService } from '../services/imageService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  /**
   * 获取仪表板统计数据
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalSpots, hasImage, fromUserTrip] = await Promise.all([
        prisma.spot.count(),
        prisma.spot.count({
          where: {
            images: {
              some: {
                status: 'approved',
              },
            },
          },
        }),
        prisma.spot.count({
          where: {
            id: {
              in: await this.getSpotIdsFromUserTrips(),
            },
          },
        }),
      ]);

      const noImage = totalSpots - hasImage;
      const pending = await prisma.spotImage.count({
        where: {
          status: 'pending',
        },
      });

      res.json({
        success: true,
        data: {
          totalSpots,
          hasImage,
          noImage,
          pending,
          fromUserTrip,
        },
      });
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      res.status(500).json({
        success: false,
        error: '获取统计数据失败',
      });
    }
  }

  /**
   * 获取景点配图状态列表
   */
  static async getSpotImageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status, keyword, city, page = 1, limit = 20 } = req.query;

      // 构建查询条件
      const where: any = {};

      if (keyword && typeof keyword === 'string') {
        where.name = {
          contains: keyword,
        };
      }

      if (city && city !== 'all') {
        where.city = city as string;
      }

      // 获取所有景点
      const spots = await prisma.spot.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          images: {
            select: {
              status: true,
              isPrimary: true,
            },
          },
        },
      });

      // 获取用户行程中的景点ID
      const userTripSpotIds = await this.getSpotIdsFromUserTrips();

      // 处理每个景点的配图状态
      const spotStatuses = spots.map((spot) => {
        const images = spot.images || [];
        const approvedImages = images.filter(img => img.status === 'approved');
        const pendingImages = images.filter(img => img.status === 'pending');
        const hasPrimary = images.some(img => img.isPrimary);

        let spotStatus: 'has-image' | 'no-image' | 'pending' = 'no-image';
        if (approvedImages.length > 0) {
          spotStatus = 'has-image';
        } else if (pendingImages.length > 0) {
          spotStatus = 'pending';
        }

        return {
          id: spot.id,
          name: spot.name,
          city: spot.city,
          rating: spot.rating || 0,
          viewCount: spot.reviewCount || 0,
          imageCount: images.length,
          approvedCount: approvedImages.length,
          hasPrimary,
          status: spotStatus,
          isFromUserTrip: userTripSpotIds.includes(spot.id),
        };
      });

      // 根据筛选条件过滤
      let filteredSpots = spotStatuses;
      if (status && status !== 'all') {
        if (status === 'from-user-trip') {
          filteredSpots = spotStatuses.filter(spot => spot.isFromUserTrip);
        } else {
          filteredSpots = spotStatuses.filter(spot => spot.status === status);
        }
      }

      // 优先级排序：用户行程景点 > 未配图 > 待审核 > 已配图
      filteredSpots.sort((a, b) => {
        // 用户行程景点优先
        if (a.isFromUserTrip && !b.isFromUserTrip) return -1;
        if (!a.isFromUserTrip && b.isFromUserTrip) return 1;

        // 未配图优先
        if (a.status === 'no-image' && b.status !== 'no-image') return -1;
        if (a.status !== 'no-image' && b.status === 'no-image') return 1;

        // 待审核优先
        if (a.status === 'pending' && b.status === 'has-image') return -1;
        if (a.status === 'has-image' && b.status === 'pending') return 1;

        return 0;
      });

      const total = await prisma.spot.count({ where });

      res.json({
        success: true,
        data: filteredSpots,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      console.error('获取景点配图状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取景点配图状态失败',
      });
    }
  }

  /**
   * 上传景点图片（管理员专用，无需审核）
   */
  static async uploadSpotImages(req: Request, res: Response): Promise<void> {
    try {
      const { spotId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        });
        return;
      }

      if (!req.files || !Array.isArray(req.files)) {
        res.status(400).json({
          success: false,
          error: '请选择要上传的图片',
        });
        return;
      }

      const files = req.files as Array<{
        buffer: Buffer;
        mimetype: string;
        size: number;
        originalname: string | string[];
      }>;
      const results = [];

      const spotIdStr = typeof spotId === 'string' ? spotId : spotId[0];

      for (const file of files) {
        try {
          const result = await imageService.uploadImage(
            spotIdStr,
            {
              buffer: file.buffer,
              mimetype: file.mimetype,
              size: file.size,
              originalname: typeof file.originalname === 'string' ? file.originalname : 'image.jpg',
            },
            userId,
            false, // 不自动设置主图
            'admin' // 管理员上传，自动审核通过
          );
          results.push(result);
        } catch (error) {
          console.error(`上传图片失败:`, error);
        }
      }

      res.json({
        success: true,
        data: {
          images: results,
          count: results.length,
        },
        message: `成功上传 ${results.length} 张图片`,
      });
    } catch (error) {
      console.error('上传景点图片失败:', error);
      res.status(500).json({
        success: false,
        error: '上传图片失败',
      });
    }
  }

  /**
   * 获取用户行程中的景点
   */
  static async getUserTripSpots(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const spotIds = await this.getSpotIdsFromUserTrips();

      const [spots, total] = await Promise.all([
        prisma.spot.findMany({
          where: {
            id: {
              in: spotIds,
            },
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            images: {
              select: {
                status: true,
                isPrimary: true,
              },
            },
          },
        }),
        Promise.resolve(spotIds.length),
      ]);

      const spotStatuses = spots.map((spot) => {
        const images = spot.images || [];
        const approvedImages = images.filter(img => img.status === 'approved');

        return {
          id: spot.id,
          name: spot.name,
          city: spot.city,
          rating: spot.rating || 0,
          imageCount: images.length,
          approvedCount: approvedImages.length,
          hasPrimary: images.some(img => img.isPrimary),
          status: approvedImages.length > 0 ? 'has-image' : 'no-image',
          isFromUserTrip: true,
        };
      });

      res.json({
        success: true,
        data: spotStatuses,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      console.error('获取用户行程景点失败:', error);
      res.status(500).json({
        success: false,
        error: '获取用户行程景点失败',
      });
    }
  }

  /**
   * 设置主图
   */
  static async setPrimaryImage(req: Request, res: Response): Promise<void> {
    try {
      const { spotId, imageId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        });
        return;
      }

      const imageIdStr = typeof imageId === 'string' ? imageId : imageId[0];
      await imageService.setAsPrimary(imageIdStr, userId, 'admin');

      res.json({
        success: true,
        message: '主图设置成功',
      });
    } catch (error) {
      console.error('设置主图失败:', error);
      res.status(500).json({
        success: false,
        error: '设置主图失败',
      });
    }
  }

  /**
   * 获取用户行程中的景点ID列表
   */
  private static async getSpotIdsFromUserTrips(): Promise<string[]> {
    try {
      // 获取所有行程中的景点
      const itineraries = await prisma.itineraryItem.findMany({
        distinct: ['name'],
        select: {
          name: true,
        },
      });

      // 根据景点名称查找对应的Spot记录
      const spotIds: string[] = [];

      for (const item of itineraries) {
        const spot = await prisma.spot.findFirst({
          where: {
            name: {
              contains: item.name,
            },
          },
        });

        if (spot && !spotIds.includes(spot.id)) {
          spotIds.push(spot.id);
        }
      }

      return spotIds;
    } catch (error) {
      console.error('获取用户行程景点ID失败:', error);
      return [];
    }
  }
}
