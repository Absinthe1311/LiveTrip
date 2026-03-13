/**
 * 图片控制器
 * 处理图片相关的API请求
 */

import { Request, Response } from 'express';
import { imageService } from '../services/imageService';

export class ImageController {
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