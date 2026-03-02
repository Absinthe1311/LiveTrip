// 目的地路由
import { Router } from 'express';
import {
  getCityAttractions,
  getSupportedCities,
  warmupCache,
  cleanExpiredCache,
} from '../controllers/destinationController';

const router = Router();

/**
 * 获取所有支持的城市列表
 * GET /api/destinations
 */
router.get('/', getSupportedCities);

/**
 * 预热所有城市的缓存
 * POST /api/destinations/warmup
 */
router.post('/warmup', warmupCache);

/**
 * 清理过期缓存
 * POST /api/destinations/cleanup
 */
router.post('/cleanup', cleanExpiredCache);

/**
 * 获取城市的热门景点列表
 * GET /api/destinations/:city
 */
router.get('/:city', getCityAttractions);

export default router;
