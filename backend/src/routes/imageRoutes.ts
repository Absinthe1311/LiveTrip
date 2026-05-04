/**
 * 图片路由
 * 处理图片相关的API路由
 */

import express from 'express';
import { ImageController } from '../controllers/imageController';
import { onePicUp } from '../middleware/fileUploadMiddleware';
import { authToken } from '../controllers/authController';

const router = express.Router();

/**
 * 上传博客内容图片（不需要spotId）
 * POST /api/images/blog-upload
 */
router.post('/blog-upload', authToken, onePicUp, ImageController.blogImgUpload);

/**
 * 上传图片（管理员和用户共用）
 * POST /api/images/upload
 */
router.post('/upload', authToken, onePicUp, ImageController.imgUpload);

/**
 * 根据景点ID批量获取图片（从数据库查询）
 * POST /images/batch-by-ids
 */
router.post('/batch-by-ids', ImageController.batchgetSpotImgsByIds);

/**
 * 获取景点的所有图片
 * GET /images/spot/:spotId
 */
router.get('/spot/:spotId', ImageController.getSpotImgs);

export default router;
