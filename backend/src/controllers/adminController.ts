import { Request, Response } from 'express';
import { imageService } from '../services/imageService';
import { cloudinaryService } from '../services/cloudinaryService';
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

/**
 * 管理员景点列表项接口
 */
interface AdminSpotListItem {
  id: string;
  name: string;
  city: string;
  approvedImageCount: number;
  pendingImageCount: number;
  coverImageUrl: string | null;
}

/**
 * 管理员景点列表响应接口
 */
interface AdminSpotListResponse {
  items: AdminSpotListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 景点图片项接口
 */
interface SpotImageItem {
  id: string;
  cloudinaryUrl: string;
  cloudinaryId: string;
  source: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  uploaderName: string | null;
  createdAt: string;
}

/**
 * 景点图片响应接口
 */
interface SpotImagesResponse {
  approved: SpotImageItem[];
  pending: SpotImageItem[];
  rejected: SpotImageItem[];
}

/**
 * 待审核图片项接口
 */
interface PendingImageItem {
  id: string;
  cloudinaryUrl: string;
  spotId: string;
  spotName: string;
  uploaderName: string;
  uploaderEmail: string;
  createdAt: string;
}

/**
 * 待审核图片响应接口
 */
interface PendingImagesResponse {
  items: PendingImageItem[];
  total: number;
}

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
            image: {
              status: 'approved',
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
          image: {
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
        const image = spot.image;
        const hasApproved = image && image.status === 'approved';
        const hasPending = image && image.status === 'pending';
        const hasPrimary = image && image.isPrimary;

        let spotStatus: 'has-image' | 'no-image' | 'pending' = 'no-image';
        if (hasApproved) {
          spotStatus = 'has-image';
        } else if (hasPending) {
          spotStatus = 'pending';
        }

        return {
          id: spot.id,
          name: spot.name,
          city: spot.city,
          rating: spot.rating || 0,
          viewCount: 0,  // reviewCount已删除
          imageCount: image ? 1 : 0,
          approvedCount: hasApproved ? 1 : 0,
          hasPrimary: hasPrimary || false,
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
          image: {
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
        const image = spot.image;
        const hasApproved = image && image.status === 'approved';

        return {
          id: spot.id,
          name: spot.name,
          city: spot.city,
          rating: spot.rating || 0,
          imageCount: image ? 1 : 0,
          approvedCount: hasApproved ? 1 : 0,
          hasPrimary: image && image.isPrimary,
          status: hasApproved ? 'has-image' : 'no-image',
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
          message: '请先登录',
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
        message: '设置主图失败',
      });
    }
  }

  /**
   * 获取景点列表（管理员）
   * GET /api/admin/spots
   */
  static async getSpots(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const [spots, total] = await Promise.all([
        prisma.spot.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
          image: {
              select: {
                id: true,
                url: true,
                status: true,
                source: true,
                createdAt: true,
                uploader: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
        }),
        prisma.spot.count(),
      ]);

      const items: AdminSpotListItem[] = spots.map((spot) => {
        const image = spot.image;
        const isApproved = image && image.status === 'approved';
        const isPending = image && image.status === 'pending';
        const coverImage = isApproved ? image.url : null;

        return {
          id: spot.id,
          name: spot.name,
          city: spot.city,
          approvedImageCount: isApproved ? 1 : 0,
          pendingImageCount: isPending ? 1 : 0,
          coverImageUrl: coverImage,
        };
      });

      const response: AdminSpotListResponse = {
        items,
        total,
        page,
        pageSize,
      };

      res.json({
        success: true,
        data: response,
        message: '获取景点列表成功',
      });
    } catch (error) {
      console.error('获取景点列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取景点列表失败',
      });
    }
  }

  /**
   * 获取景点图片列表（管理员）
   * GET /api/admin/spots/:spotId/images
   */
  static async getSpotImages(req: Request, res: Response): Promise<void> {
    try {
      const { spotId } = req.params;
      const spotIdStr = Array.isArray(spotId) ? spotId[0] : spotId;

      if (!spotIdStr) {
        res.status(400).json({
          success: false,
          message: '景点ID不能为空',
        });
        return;
      }

      const images = await prisma.spotImage.findMany({
        where: { spotId: spotIdStr },
        include: {
          uploader: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const extractCloudinaryId = (url: string): string => {
        const match = url.match(/\/upload\/(.+)\.[a-z]+$/);
        return match ? match[1] : '';
      };

      const formatImage = (img: any): SpotImageItem => ({
        id: img.id,
        cloudinaryUrl: img.url || '',
        cloudinaryId: extractCloudinaryId(img.url || ''),
        source: img.source as 'admin' | 'user',
        status: img.status as 'pending' | 'approved' | 'rejected',
        uploaderName: img.uploader?.username || null,
        createdAt: img.createdAt.toISOString(),
      });

      const response: SpotImagesResponse = {
        approved: images.filter((img) => img.status === 'approved').map(formatImage),
        pending: images.filter((img) => img.status === 'pending').map(formatImage),
        rejected: images.filter((img) => img.status === 'rejected').map(formatImage),
      };

      res.json({
        success: true,
        data: response,
        message: '获取景点图片成功',
      });
    } catch (error) {
      console.error('获取景点图片失败:', error);
      res.status(500).json({
        success: false,
        message: '获取景点图片失败',
      });
    }
  }

  /**
   * 审核图片（管理员）
   * PUT /api/admin/images/:imageId/review
   */
  static async reviewImage(req: Request, res: Response): Promise<void> {
    try {
      const { imageId } = req.params;
      const imageIdStr = Array.isArray(imageId) ? imageId[0] : imageId;
      const { action, note } = req.body;
      const user = (req as any).user;

      if (!imageIdStr) {
        res.status(400).json({
          success: false,
          message: '图片ID不能为空',
        });
        return;
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        res.status(400).json({
          success: false,
          message: '操作类型无效',
        });
        return;
      }

      if (action === 'reject' && !note) {
        res.status(400).json({
          success: false,
          message: '拒绝时必须填写原因',
        });
        return;
      }

      const status = action === 'approve' ? 'approved' : 'rejected';

      await prisma.spotImage.update({
        where: { id: imageIdStr },
        data: {
          status,
          reviewedBy: user.userId,
          reviewNote: note || null,
          reviewedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: action === 'approve' ? '图片已通过审核' : '图片已拒绝',
      });
    } catch (error) {
      console.error('审核图片失败:', error);
      res.status(500).json({
        success: false,
        message: '审核图片失败',
      });
    }
  }

  /**
   * 删除图片（管理员）
   * DELETE /api/admin/images/:imageId
   */
  static async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { imageId } = req.params;
      const imageIdStr = Array.isArray(imageId) ? imageId[0] : imageId;

      if (!imageIdStr) {
        res.status(400).json({
          success: false,
          message: '图片ID不能为空',
        });
        return;
      }

      // 查询图片信息
      const image = await prisma.spotImage.findUnique({
        where: { id: imageIdStr },
      });

      if (!image) {
        res.status(404).json({
          success: false,
          message: '图片不存在',
        });
        return;
      }

      // 从 Cloudinary 删除
      const extractCloudinaryId = (url: string): string | null => {
        const match = url.match(/\/upload\/(.+)\.[a-z]+$/);
        return match ? match[1] : null;
      };

      const cloudinaryId = extractCloudinaryId(image.url || '');

      try {
        if (cloudinaryId) {
          await cloudinaryService.deleteImage(cloudinaryId);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary 删除失败:', cloudinaryError);
        // 继续删除数据库记录
      }

      // 删除数据库记录
      await prisma.spotImage.delete({
        where: { id: imageIdStr },
      });

      res.json({
        success: true,
        message: '图片删除成功',
      });
    } catch (error) {
      console.error('删除图片失败:', error);
      res.status(500).json({
        success: false,
        message: '删除图片失败',
      });
    }
  }

  /**
   * 获取待审核图片列表（管理员）
   * GET /api/admin/images/pending
   */
  static async getPendingImages(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const [images, total] = await Promise.all([
        prisma.spotImage.findMany({
          where: { status: 'pending' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            spot: {
              select: {
                id: true,
                name: true,
              },
            },
            uploader: {
              select: {
                username: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.spotImage.count({
          where: { status: 'pending' },
        }),
      ]);

      const items: PendingImageItem[] = images.map((img) => ({
        id: img.id,
        cloudinaryUrl: img.url || '',
        spotId: img.spot.id,
        spotName: img.spot.name,
        uploaderName: img.uploader?.username || '未知',
        uploaderEmail: img.uploader?.email || '未知',
        createdAt: img.createdAt.toISOString(),
      }));

      const response: PendingImagesResponse = {
        items,
        total,
      };

      res.json({
        success: true,
        data: response,
        message: '获取待审核图片成功',
      });
    } catch (error) {
      console.error('获取待审核图片失败:', error);
      res.status(500).json({
        success: false,
        message: '获取待审核图片失败',
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
        // 使用精确匹配，避免错误匹配
        const spot = await prisma.spot.findFirst({
          where: {
            name: item.name, // 精确匹配
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
