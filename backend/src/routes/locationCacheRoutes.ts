// 地点缓存路由 - 定义地点缓存的API端点
import { Router } from 'express';
import {
  searchLocation,
  getPopularSearchLocations,
  clearLocationCache,
} from '../controllers/locationCacheController';

const router = Router();

// GET /api/location/search?keywords=xxx - 搜索地点（带缓存）
router.get('/search', searchLocation);

// GET /api/location/popular?limit=10 - 获取热门搜索地点
router.get('/popular', getPopularSearchLocations);

// DELETE /api/location/cache - 清空所有缓存
router.delete('/cache', clearLocationCache);

export default router;
