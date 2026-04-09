// 热门目的地路由 - 优化版本
import { Router } from 'express';
import { getHotCities, getCitySpots, getCityAllSpots } from '../controllers/destinationController';

const router = Router();

/**
 * 获取热门城市列表
 * GET /api/destinations/cities
 */
router.get('/cities', getHotCities);

/**
 * 获取指定城市的热门景点（用于首页展示）
 * GET /api/destinations/cities/:city/spots?limit=9
 */
router.get('/cities/:city/spots', getCitySpots);

/**
 * 获取指定城市的所有热门景点（用于城市详情页）
 * GET /api/destinations/cities/:city/all?page=1&pageSize=12
 */
router.get('/cities/:city/all', getCityAllSpots);

export default router;
