/**
 * 图片控制器
 * 处理图片相关的API请求
 */

import { Request, Response } from 'express';
import { imageService } from '../services/imageService';
import { cloudinaryService } from '../services/cloudinaryService';
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

/**
 * 上传图片响应接口
 */
interface UploadImageResponse {
  imageId: string;
  cloudinaryUrl: string;
  status: 'approved' | 'pending';
}

export class ImageController {
  /**
   * 上传博客内容图片（不需要spotId）
   * POST /api/images/blog-upload
   */
  static async uploadBlogImage(req: Request, res: Response): Promise<void> {
    try {
      console.log('📤 上传博客图片请求');
      console.log('📦 req.file:', req.file ? '文件存在' : '文件不存在');
      console.log('👤 req.user:', req.user);

      const user = (req as any).user;

      // 验证用户是否登录
      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          message: '请先登录',
        });
        return;
      }

      // 验证文件是否上传
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择要上传的图片',
        });
        return;
      }

      // 上传到 Cloudinary 博客文件夹
      const cloudinaryResult = await cloudinaryService.uploadImage(
        req.file.buffer,
        'blogs/content'
      );

      // 直接返回图片URL，不需要存储到数据库
      res.status(200).json({
        success: true,
        data: {
          url: cloudinaryResult.cloudinaryUrl,
          cloudinaryId: cloudinaryResult.cloudinaryId,
        },
        message: '博客图片上传成功',
      });
    } catch (error: any) {
      console.error('上传博客图片失败:', error);
      res.status(500).json({
        success: false,
        message: '上传博客图片失败',
        error: error.message,
      });
    }
  }

  /**
   * 上传图片（管理员和用户共用）
   * POST /api/images/upload
   */
  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      console.log('📤 上传图片请求');
      console.log('📦 req.body:', req.body);
      console.log('📦 req.file:', req.file ? '文件存在' : '文件不存在');
      console.log('👤 req.user:', req.user);

      const { spotId } = req.body;
      const user = (req as any).user;

      // 验证用户是否登录
      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          message: '请先登录',
        });
        return;
      }

      // 验证 spotId
      if (!spotId) {
        res.status(400).json({
          success: false,
          message: '景点ID不能为空',
        });
        return;
      }

      // 验证文件是否上传
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择要上传的图片',
        });
        return;
      }

      // 验证景点是否存在
      const spot = await prisma.spot.findUnique({
        where: { id: spotId },
      });

      if (!spot) {
        res.status(400).json({
          success: false,
          message: '景点不存在',
        });
        return;
      }

      // 根据用户角色确定文件夹和状态
      const isAdmin = user.role === 'admin';
      const folder = isAdmin ? 'spots/admin' : 'spots/user';
      const source = isAdmin ? 'admin' : 'user';
      const status = isAdmin ? 'approved' : 'pending';

      // 上传到 Cloudinary
      const cloudinaryResult = await cloudinaryService.uploadImage(
        req.file.buffer,
        folder
      );

      // 写入数据库
      const image = await prisma.spotImage.create({
        data: {
          spotId,
          url: cloudinaryResult.cloudinaryUrl,
          source,
          status,
          priority: isAdmin ? 10 : 5,
          isPrimary: false,
          fileHash: '',
          uploadedBy: user.userId,
          viewCount: 0,
          likeCount: 0,
          reportCount: 0,
        },
      });

      const response: UploadImageResponse = {
        imageId: image.id,
        cloudinaryUrl: cloudinaryResult.cloudinaryUrl,
        status: status as 'approved' | 'pending',
      };

      res.status(200).json({
        success: true,
        data: response,
        message: '图片上传成功',
      });
    } catch (error: any) {
      console.error('上传图片失败:', error);
      res.status(500).json({
        success: false,
        message: '上传图片失败',
      });
    }
  }

  /**
   * 获取景点封面图片
   */
  static async getSpotCoverImage(req: Request, res: Response): Promise<void> {
    try {
      const { spotName } = req.params;
      const { city } = req.query;

      if (!spotName) {
        res.status(400).json({
          success: false,
          message: '景点名称不能为空',
        });
        return;
      }

      const spotNameStr = Array.isArray(spotName) ? spotName[0] : spotName;
      const cityStr = city ? (Array.isArray(city) ? city[0] : city) : undefined;
      const cityStrToUse = cityStr ? String(cityStr) : undefined;

      const imageUrl = await imageService.getSpotCoverImage(
        decodeURIComponent(spotNameStr),
        cityStrToUse ? decodeURIComponent(cityStrToUse) : undefined
      );

      if (imageUrl) {
        res.status(200).json({
          success: true,
          data: {
            spotName: decodeURIComponent(spotNameStr),
            city: cityStrToUse ? decodeURIComponent(cityStrToUse) : undefined,
            imageUrl: imageUrl,
          },
        });
      } else {
        res.status(404).json({
          success: false,
          message: '未找到景点图片',
          data: {
            spotName: decodeURIComponent(spotNameStr),
            city: cityStrToUse ? decodeURIComponent(cityStrToUse) : undefined,
            imageUrl: null,
          },
        });
      }
    } catch (error: any) {
      console.error('获取景点封面图片失败:', error);
      res.status(500).json({
        success: false,
        message: '获取景点封面图片失败',
        error: error.message,
      });
    }
  }

  /**
   * 搜索Unsplash图片
   */
  static async searchUnsplashImages(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.params;
      const { city, perPage } = req.query;

      if (!keyword) {
        res.status(400).json({
          success: false,
          message: '搜索关键词不能为空',
        });
        return;
      }

      const keywordStr = Array.isArray(keyword) ? keyword[0] : keyword;
      const cityStr = city ? (Array.isArray(city) ? city[0] : city) : undefined;
      const cityStrToUse = cityStr ? String(cityStr) : undefined;
      const perPageNum = perPage ? parseInt(String(Array.isArray(perPage) ? perPage[0] : perPage)) : 5;

      const images = await imageService.searchUnsplashImages(
        decodeURIComponent(keywordStr),
        cityStrToUse ? decodeURIComponent(cityStrToUse) : undefined,
        perPageNum
      );

      res.status(200).json({
        success: true,
        data: {
          keyword: decodeURIComponent(keywordStr),
          city: cityStrToUse ? decodeURIComponent(cityStrToUse) : undefined,
          images: images,
          count: images.length,
        },
      });
    } catch (error: any) {
      console.error('搜索Unsplash图片失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索Unsplash图片失败',
        error: error.message,
      });
    }
  }

  /**
   * 批量获取景点图片
   */
  static async batchGetSpotImages(req: Request, res: Response): Promise<void> {
    try {
      const { spots } = req.body;

      if (!Array.isArray(spots) || spots.length === 0) {
        res.status(400).json({
          success: false,
          message: '景点列表不能为空',
        });
        return;
      }

      const imageMap = await imageService.batchGetSpotImages(spots);

      res.status(200).json({
        success: true,
        data: {
          images: Object.fromEntries(imageMap),
          count: imageMap.size,
        },
      });
    } catch (error: any) {
      console.error('批量获取景点图片失败:', error);
      res.status(500).json({
        success: false,
        message: '批量获取景点图片失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取景点的所有图片
   */
  static async getSpotImages(req: Request, res: Response): Promise<void> {
    try {
      const { spotId } = req.params;

      if (!spotId) {
        res.status(400).json({
          success: false,
          message: '景点ID不能为空',
        });
        return;
      }

      const spotIdStr = Array.isArray(spotId) ? spotId[0] : spotId;

      const result = await imageService.getSpotImages(spotIdStr);

      res.status(200).json({
        success: true,
        data: {
          spotId: spotIdStr,
          images: result.images,
          total: result.total,
          page: result.page,
          limit: result.limit,
          count: result.images.length,
        },
      });
    } catch (error: any) {
      console.error('获取景点图片失败:', error);
      res.status(500).json({
        success: false,
        message: '获取景点图片失败',
        error: error.message,
      });
    }
  }
}