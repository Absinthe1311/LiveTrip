// 推荐相关路由 - 酒店和餐厅推荐API
import { Router } from 'express';
import { getHotelRecommendations, getRestaurantRecommendations } from '../controllers/recommendationController';

const router = Router();

/**
 * 获取酒店推荐
 * POST /api/recommendations/hotels
 */
router.post('/hotels', getHotelRecommendations);

/**
 * 获取餐厅推荐
 * POST /api/recommendations/restaurants
 */
router.post('/restaurants', getRestaurantRecommendations);

export default router;
