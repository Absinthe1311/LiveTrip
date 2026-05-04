/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：控制器重构
 */
import { Request, Response } from 'express';

import { getPrismaClient } from '../lib/prisma';
import { cloudinaryService } from '../services/cloudinaryService';
import { imageService } from '../services/imageService';

const prisma = getPrismaClient();

interface SpotImagesResponse {
  approved: SpotImageItem[];
  pending: SpotImageItem[];
  rejected: SpotImageItem[];
}

interface SpotImageItem {
  id: string;
  cloudinaryUrl: string;
  cloudinaryId: string;
  source: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  uploaderName: string | null;
  createdAt: string;
}

interface AdminSpotListResponse {
  items: AdminSpotListItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface PendingImagesResponse {
  items: PendingImageItem[];
  total: number;
}

interface PendingImageItem {
  id: string;
  cloudinaryUrl: string;
  spotId: string;
  spotName: string;
  uploaderName: string;
  uploaderEmail: string;
  createdAt: string;
}

interface AdminSpotListItem {
  id: string;
  name: string;
  city: string;
  approvedImageCount: number;
  pendingImageCount: number;
  coverImageUrl: string | null;
}

export class AdminController {
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    const stats = await Promise.all([
      prisma.spot.count(),
      prisma.spot.count({ where: { image: { status: 'approved' } } }),
      prisma.spot.count({ where: { id: { in: await this.getSpotIdsFromUserTrips() } } }),
    ]).catch((err) => {
      console.error('仪表板统计查询失败:', err);
      res.status(500).json({ success: false, error: '查询失败' });
      return null;
    });

    if (!stats) return;

    const [total, hasImg, fromTrip] = stats;
    const pending = await prisma.spotImage.count({ where: { status: 'pending' } }).catch(() => 0);

    res.json({
      success: true,
      data: {
        totalSpots: total,
        hasImage: hasImg,
        noImage: total - hasImg,
        pending,
        fromUserTrip: fromTrip,
      },
    });
  }

  static async uploadSpotImages(req: Request, res: Response): Promise<void> {
    const { spotId } = req.params;
    const userId = (req as any).user?.userId;
    const files = req.files as Array<{
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string | string[];
    }>;
    const results = [];
    const spotIdStr = typeof spotId === 'string' ? spotId : spotId[0];

    for (const file of files) {
      const result = await imageService
        .uploadImage(
          spotIdStr,
          {
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size,
            originalname: typeof file.originalname === 'string' ? file.originalname : 'image.jpg',
          },
          userId,
          false,
          'admin'
        )
        .catch((err) => {
          console.error('图片上传失败:', err);
          return null;
        });
      if (result) results.push(result);
    }

    res.json({
      success: true,
      data: { images: results, count: results.length },
      message: `成功上传 ${results.length} 张图片`,
    });
  }

  static async getSpotImageStatus(req: Request, res: Response): Promise<void> {
    const { status, keyword, city, page = 1, limit = 20 } = req.query;
    const where: any = {};
    if (keyword && typeof keyword === 'string') where.name = { contains: keyword };
    if (city && city !== 'all') where.city = city as string;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const spots = await prisma.spot.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: { image: { select: { status: true, isPrimary: true } } },
    });

    const tripIds = await this.getSpotIdsFromUserTrips();

    const statuses = spots.map((spot) => {
      const im = spot.image;
      const approved = im && im.status === 'approved';
      const primary = im && im.isPrimary;
      let stat: 'has-image' | 'no-image' | 'pending' = 'no-image';
      if (approved) stat = 'has-image';
      else if (im && im.status === 'pending') stat = 'pending';
      return {
        id: spot.id,
        name: spot.name,
        city: spot.city,
        rating: spot.rating || 0,
        viewCount: 0,
        imageCount: im ? 1 : 0,
        approvedCount: approved ? 1 : 0,
        hasPrimary: primary || false,
        status: stat,
        isFromUserTrip: tripIds.includes(spot.id),
      };
    });

    let list = statuses;
    if (status && status !== 'all') {
      list =
        status === 'from-user-trip'
          ? statuses.filter((s) => s.isFromUserTrip)
          : statuses.filter((s) => s.status === status);
    }

    // 注意：排序逻辑产品说要优先展示用户行程的景点，再按状态排
    list.sort((a, b) => {
      if (a.isFromUserTrip && !b.isFromUserTrip) return -1;
      if (!a.isFromUserTrip && b.isFromUserTrip) return 1;
      if (a.status === 'no-image' && b.status !== 'no-image') return -1;
      if (a.status !== 'no-image' && b.status === 'no-image') return 1;
      if (a.status === 'pending' && b.status === 'has-image') return -1;
      if (a.status === 'has-image' && b.status === 'pending') return 1;
      return 0;
    });

    const total = await prisma.spot.count({ where });
    res.json({
      success: true,
      data: list,
      pagination: { total, page: pageNum, limit: limitNum },
    });
  }

  static async setPrimaryImage(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    const { imageId } = req.params;
    const imageIdStr = typeof imageId === 'string' ? imageId : imageId[0];

    const ok = await imageService.setAsPrimary(imageIdStr, userId, 'admin').catch((err) => {
      console.error('设置主图失败:', err);
      res.status(500).json({ success: false, message: '设置主图失败' });
      return null;
    });

    if (ok) res.json({ success: true, message: '设置成功' });
  }

  static async getUserTripSpots(req: Request, res: Response): Promise<void> {
    const fail = (msg: string) => res.status(500).json({ success: false, error: msg });

    const { page = 1, limit = 20 } = req.query;
    const spotIds = await this.getSpotIdsFromUserTrips();

    const result = await Promise.all([
      prisma.spot.findMany({
        where: { id: { in: spotIds } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { image: { select: { status: true, isPrimary: true } } },
      }),
      Promise.resolve(spotIds.length),
    ]).catch(() => {
      fail('获取用户行程景点失败');
      return null;
    });

    if (!result) return;
    const [spots, total] = result;

    const spotStatuses = spots.map((spot) => {
      const img = spot.image;
      const approved = img && img.status === 'approved';
      return {
        id: spot.id,
        name: spot.name,
        city: spot.city,
        rating: spot.rating || 0,
        imageCount: img ? 1 : 0,
        approvedCount: approved ? 1 : 0,
        hasPrimary: img && img.isPrimary,
        status: approved ? 'has-image' : 'no-image',
        isFromUserTrip: true,
      };
    });

    res.json({
      success: true,
      data: spotStatuses,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  }

  static async getSpots(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const queryResult = await Promise.all([
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
              uploader: { select: { username: true } },
            },
          },
        },
      }),
      prisma.spot.count(),
    ]).catch((err) => {
      console.error('获取景点列表失败:', err);
      res.status(500).json({ success: false, message: '获取景点列表失败' });
      return null;
    });

    if (!queryResult) return;
    const [spots, total] = queryResult;

    const items: AdminSpotListItem[] = spots.map((spot) => {
      const img = spot.image;
      const approved = img && img.status === 'approved';
      return {
        id: spot.id,
        name: spot.name,
        city: spot.city,
        approvedImageCount: approved ? 1 : 0,
        pendingImageCount: img && img.status === 'pending' ? 1 : 0,
        coverImageUrl: approved ? img.url : null,
      };
    });

    res.json({
      success: true,
      data: { items, total, page, pageSize },
      message: '获取景点列表成功',
    });
  }

  static async reviewImage(req: Request, res: Response): Promise<void> {
    const fail = (msg: string) => res.status(500).json({ success: false, message: msg });

    const { imageId } = req.params;
    const imageIdStr = Array.isArray(imageId) ? imageId[0] : imageId;
    const { action, note } = req.body;
    const user = (req as any).user;

    if (!imageIdStr) {
      res.status(400).json({ success: false, message: '图片ID不能为空' });
      return;
    }
    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: '操作类型无效' });
      return;
    }
    if (action === 'reject' && !note) {
      res.status(400).json({ success: false, message: '拒绝时必须填写原因' });
      return;
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = await prisma.spotImage
      .update({
        where: { id: imageIdStr },
        data: {
          status,
          reviewedBy: user.userId,
          reviewNote: note || null,
          reviewedAt: new Date(),
        },
      })
      .catch((err) => {
        console.error('审核图片失败:', err);
        fail('审核图片失败');
        return null;
      });

    if (!updated) return;

    res.json({
      success: true,
      message: action === 'approve' ? '图片已通过审核' : '图片已拒绝',
    });
  }

  static async getSpotImages(req: Request, res: Response): Promise<void> {
    const { spotId } = req.params;
    const spotIdStr = Array.isArray(spotId) ? spotId[0] : spotId;
    if (!spotIdStr) {
      res.status(400).json({ success: false, message: '景点ID不能为空' });
      return;
    }

    const images = await prisma.spotImage.findMany({
      where: { spotId: spotIdStr },
      include: { uploader: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const formatImage = (img: any): SpotImageItem => {
      const match = img.url?.match(/\/upload\/(.+)\.[a-z]+$/);
      return {
        id: img.id,
        cloudinaryUrl: img.url || '',
        cloudinaryId: match ? match[1] : '',
        source: img.source as 'admin' | 'user',
        status: img.status as 'pending' | 'approved' | 'rejected',
        uploaderName: img.uploader?.username || null,
        createdAt: img.createdAt.toISOString(),
      };
    };
    const response: SpotImagesResponse = {
      approved: images.filter((img) => img.status === 'approved').map(formatImage),
      pending: images.filter((img) => img.status === 'pending').map(formatImage),
      rejected: images.filter((img) => img.status === 'rejected').map(formatImage),
    };

    res.json({ success: true, data: response, message: '获取景点图片成功' });
  }

  static async deleteImage(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;
    const imageIdStr = Array.isArray(imageId) ? imageId[0] : imageId;
    if (!imageIdStr) {
      res.status(400).json({ success: false, message: '图片ID不能为空' });
      return;
    }

    const image = await prisma.spotImage.findUnique({ where: { id: imageIdStr } });
    if (!image) {
      res.status(404).json({ success: false, message: '图片不存在' });
      return;
    }

    const match = image.url?.match(/\/upload\/(.+)\.[a-z]+$/);
    const cloudinaryId = match ? match[1] : null;

    if (cloudinaryId) {
      await cloudinaryService
        .deleteImage(cloudinaryId)
        .catch((err) => console.error('Cloudinary 删除失败:', err));
    }

    const deleted = await prisma.spotImage
      .delete({
        where: { id: imageIdStr },
      })
      .catch((err) => {
        console.error('删除图片失败:', err);
        res.status(500).json({ success: false, message: '删除图片失败' });
        return null;
      });

    if (deleted) res.json({ success: true, message: '图片删除成功' });
  }

  static async getPendingImages(req: Request, res: Response): Promise<void> {
    const fail = (msg: string) => res.status(500).json({ success: false, message: msg });

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await Promise.all([
      prisma.spotImage.findMany({
        where: { status: 'pending' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          spot: { select: { id: true, name: true } },
          uploader: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.spotImage.count({ where: { status: 'pending' } }),
    ]).catch((err) => {
      console.error('获取待审核图片失败:', err);
      fail('获取待审核图片失败');
      return null;
    });

    if (!result) return;
    const [images, total] = result;

    const items: PendingImageItem[] = images.map((img) => ({
      id: img.id,
      cloudinaryUrl: img.url || '',
      spotId: img.spot.id,
      spotName: img.spot.name,
      uploaderName: img.uploader?.username || '未知',
      uploaderEmail: img.uploader?.email || '未知',
      createdAt: img.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: { items, total },
      message: '获取待审核图片成功',
    });
  }

  private static async getSpotIdsFromUserTrips(): Promise<string[]> {
    const items = await prisma.itineraryItem
      .findMany({
        distinct: ['name'],
        select: { name: true },
      })
      .catch(() => []);

    const ids: string[] = [];
    for (const itineraryItem of items) {
      const spot = await prisma.spot
        .findFirst({
          where: { name: itineraryItem.name },
        })
        .catch(() => null);
      if (spot && !ids.includes(spot.id)) ids.push(spot.id);
    }

    return ids;
  }
}
