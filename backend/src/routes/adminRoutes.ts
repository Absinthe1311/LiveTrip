import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { chkAdmin } from '../middleware/adminAuthMiddleware';
import { authToken } from '../controllers/authController';
import { batchPicUp } from '../middleware/fileUploadMiddleware';

const router = Router();

// 所有管理员路由都需要先验证 token
router.use(authToken);

// 仪表板统计
router.get('/dashboard/stats', chkAdmin, AdminController.fetchDash);

// 景点配图状态
router.get('/spots/image-status', chkAdmin, AdminController.chkImgState);

// 景点列表（新增）
router.get('/spots', chkAdmin, AdminController.getSpots);

// 景点图片列表（新增）
router.get('/spots/:spotId/images', chkAdmin, AdminController.getSpotImgs);

// 上传景点图片
router.post(
  '/spots/:spotId/upload-images',
  chkAdmin,
  batchPicUp,
  AdminController.uploadImgs
);

// 用户行程景点
router.get('/spots/from-user-trips', chkAdmin, AdminController.fetchUserSpots);

// 设置主图
router.put('/spots/:spotId/set-primary/:imageId', chkAdmin, AdminController.setPImg);

// 审核图片（新增）
router.put('/images/:imageId/review', chkAdmin, AdminController.reviewImg);

// 删除图片（新增）
router.delete('/images/:imageId', chkAdmin, AdminController.delImg);

// 待审核图片列表（新增）
router.get('/images/pending', chkAdmin, AdminController.fetchPendingImgs);

export default router;
