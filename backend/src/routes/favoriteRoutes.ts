// 收藏路由 - 定义收藏相关的API端点
import { Router } from 'express';
import {
  myFavs,
  addFav,
  delFav,
  chkFav,
  myFavsCount,
} from '../controllers/favoriteController';

const router = Router();

/**
 * 获取收藏列表
 * GET /api/favorites
 * Query: includeIoT=true (可选，是否包含IoT数据)
 */
router.get('/', myFavs);

/**
 * 获取收藏数量
 * GET /api/favorites/count
 */
router.get('/count', myFavsCount);

/**
 * 检查是否已收藏
 * GET /api/favorites/check/:spotId
 */
router.get('/check/:spotId', chkFav);

/**
 * 添加收藏
 * POST /api/favorites
 * Body: { spotId: string, notes?: string }
 */
router.post('/', addFav);

/**
 * 取消收藏
 * DELETE /api/favorites/:spotId
 */
router.delete('/:spotId', delFav);

export default router;
