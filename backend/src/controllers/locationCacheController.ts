// 地点缓存控制器 - 处理地点缓存的API请求
import { Request, Response } from 'express';
import {
  searchLoc,
  hotLocs,
  flushCache,
} from '../services/locationCacheService';

/**
 * 搜索地点（带缓存）
 * GET /api/location/search?keywords=xxx
 */
export const findLoc = async (req: Request, res: Response) => {
  try {
    const { keywords } = req.query;

    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词',
      });
    }

    const userId = (req.headers['x-user-id'] as string) || 'default-user';

    // 调用缓存服务
    const result = await searchLoc(keywords, userId);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '搜索失败',
    });
  }
};

/**
 * 获取热门搜索地点
 * GET /api/location/popular?limit=10
 */
export const getPopularfindLocs = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await hotLocs(limit);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取热门地点失败',
    });
  }
};

/**
 * 清空所有缓存
 * DELETE /api/location/cache
 */
export const clearLocs = async (req: Request, res: Response) => {
  try {
    const result = await flushCache();

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '清空缓存失败',
    });
  }
};
