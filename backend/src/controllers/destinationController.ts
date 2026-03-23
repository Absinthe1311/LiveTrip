// 目的地控制器 - 处理目的地相关请求
import { Request, Response } from 'express';
import { destinationCacheService } from '../services/destinationCacheService';

/**
 * 获取城市的热门景点列表
 * GET /api/destinations/:city
 */
export const getCityAttractions = async (req: Request, res: Response) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: '缺少城市参数',
      });
    }

    const cityName = Array.isArray(city) ? city[0] : city;

    console.log(`🔍 接收获取 ${cityName} 热门景点请求`);

    const attractions = await destinationCacheService.getCityAttractions(cityName);

    res.json({
      success: true,
      data: attractions,
      count: attractions.length,
    });
  } catch (error: any) {
    console.error('❌ 获取城市热门景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取城市热门景点失败',
    });
  }
};

/**
 * 获取所有支持的城市列表
 * GET /api/destinations
 */
export const getSupportedCities = async (req: Request, res: Response) => {
  try {
    console.log('🔍 接收获取支持城市列表请求');

    const cities = destinationCacheService.getSupportedCities();

    res.json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error: any) {
    console.error('❌ 获取支持城市列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取支持城市列表失败',
    });
  }
};

/**
 * 预热所有城市的缓存
 * POST /api/destinations/warmup
 */
export const warmupCache = async (req: Request, res: Response) => {
  try {
    console.log('🔥 接收预热缓存请求');

    // 异步执行预热
    destinationCacheService.warmupCache().catch((error) => {
      console.error('❌ 预热缓存失败:', error);
    });

    res.json({
      success: true,
      message: '缓存预热已启动',
    });
  } catch (error: any) {
    console.error('❌ 预热缓存失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '预热缓存失败',
    });
  }
};

/**
 * 清理过期缓存
 * POST /api/destinations/cleanup
 */
export const cleanExpiredCache = async (req: Request, res: Response) => {
  try {
    console.log('🧹 接收清理过期缓存请求');

    await destinationCacheService.cleanExpiredCache();

    res.json({
      success: true,
      message: '过期缓存已清理',
    });
  } catch (error: any) {
    console.error('❌ 清理过期缓存失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '清理过期缓存失败',
    });
  }
};

/**
 * 清理所有缓存（强制刷新）
 * POST /api/destinations/clear-all
 */
export const clearAllCache = async (req: Request, res: Response) => {
  try {
    console.log('🧹 接收清理所有缓存请求');

    await destinationCacheService.clearAllCache();

    res.json({
      success: true,
      message: '所有缓存已清理，下次访问将重新获取数据',
    });
  } catch (error: any) {
    console.error('❌ 清理所有缓存失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '清理所有缓存失败',
    });
  }
};
