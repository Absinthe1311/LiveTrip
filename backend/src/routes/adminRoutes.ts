import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { requireAdmin } from '../middleware/adminAuthMiddleware';
import { uploadImage } from '../middleware/fileUploadMiddleware';

const router = Router();

// 仪表板统计
router.get('/dashboard/stats', requireAdmin, AdminController.getDashboardStats);

// 景点配图状态
router.get('/spots/image-status', requireAdmin, AdminController.getSpotImageStatus);

// 上传景点图片
router.post('/spots/:spotId/upload-images', requireAdmin, uploadImage, AdminController.uploadSpotImages);

// 用户行程景点
router.get('/spots/from-user-trips', requireAdmin, AdminController.getUserTripSpots);

// 设置主图
router.put('/spots/:spotId/set-primary/:imageId', requireAdmin, AdminController.setPrimaryImage);

export default router;
