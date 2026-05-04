// 推荐相关路由 - 酒店和餐厅推荐API
import { Router } from 'express';
import {
  hotelRecs,
  restaurantRecs,
  findRestaurant,
  findHotel,
} from '../controllers/recommendationController';

const router = Router();

/**
 * 获取酒店推荐
 * POST /api/recommendations/hotels
 */
router.post('/hotels', hotelRecs);

/**
 * 自定义酒店搜索
 * POST /api/recommendations/hotels/custom
 */
router.post('/hotels/custom', findHotel);

/**
 * 获取餐厅推荐
 * POST /api/recommendations/restaurants
 */
router.post('/restaurants', restaurantRecs);

/**
 * 自定义餐厅搜索
 * POST /api/recommendations/restaurants/custom
 */
router.post('/restaurants/custom', findRestaurant);

export default router;
