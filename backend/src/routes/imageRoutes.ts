/**
 * 图片路由
 * 处理图片相关的API路由
 */

import express from 'express';
import { ImageController } from '../controllers/imageController';

const router = express.Router();

/**
 * 获取景点封面图片
 * GET /images/spot/:spotName/cover
 */
router.get('/spot/:spotName/cover', ImageController.getSpotCoverImage);

/**
 * 搜索Unsplash图片
 * GET /images/search/:keyword
 */
router.get('/search/:keyword', ImageController.searchUnsplashImages);

/**
 * 批量获取景点图片
 * POST /images/batch
 */
router.post('/batch', ImageController.batchGetSpotImages);

/**
 * 获取景点的所有图片
 * GET /images/spot/:spotId
 */
router.get('/spot/:spotId', ImageController.getSpotImages);

export default router;