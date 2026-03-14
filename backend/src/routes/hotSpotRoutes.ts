// 热门景点路由
import { Router } from 'express';
import { getHotSpots, getHotCities } from '../controllers/hotSpotController';

const router = Router();

/**
 * 获取热门景点
 * GET /api/hot-spots
 */
router.get('/', getHotSpots);

/**
 * 获取热门城市列表
 * GET /api/hot-cities
 */
router.get('/cities', getHotCities);

export default router;
