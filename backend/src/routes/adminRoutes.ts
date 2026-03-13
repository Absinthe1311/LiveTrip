import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { requireAdmin } from '../middleware/adminAuthMiddleware';
import { authenticateToken } from '../controllers/authController';
import { uploadImage } from '../middleware/fileUploadMiddleware';

const router = Router();

// 所有管理员路由都需要先验证 token
router.use(authenticateToken);

// 仪表板统计
router.get('/dashboard/stats', requireAdmin, AdminController.getDashboardStats);

// 景点配图状态
router.get('/spots/image-status', requireAdmin, AdminController.getSpotImageStatus);

// 景点列表（新增）
router.get('/spots', requireAdmin, AdminController.getSpots);

// 景点图片列表（新增）
router.get('/spots/:spotId/images', requireAdmin, AdminController.getSpotImages);

// 上传景点图片
router.post('/spots/:spotId/upload-images', requireAdmin, uploadImage, AdminController.uploadSpotImages);

// 用户行程景点
router.get('/spots/from-user-trips', requireAdmin, AdminController.getUserTripSpots);

// 设置主图
router.put('/spots/:spotId/set-primary/:imageId', requireAdmin, AdminController.setPrimaryImage);

// 审核图片（新增）
router.put('/images/:imageId/review', requireAdmin, AdminController.reviewImage);

// 删除图片（新增）
router.delete('/images/:imageId', requireAdmin, AdminController.deleteImage);

// 待审核图片列表（新增）
router.get('/images/pending', requireAdmin, AdminController.getPendingImages);

export default router;
