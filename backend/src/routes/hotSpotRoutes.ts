// 热门景点路由
import { Router } from 'express';
import { hotSpots, hotCities, hotCitiesWithSpots } from '../controllers/hotSpotController';

const router = Router();

/**
 * 获取热门景点
 * GET /api/hot-spots
 */
router.get('/', hotSpots);

/**
 * 获取热门城市列表
 * GET /api/hot-cities
 */
router.get('/cities', hotCities);

/**
 * 获取热门城市列表（包含景点信息和评分）
 * GET /api/hot-spots/cities
 */
router.get('/cities', hotCitiesWithSpots);

export default router;
