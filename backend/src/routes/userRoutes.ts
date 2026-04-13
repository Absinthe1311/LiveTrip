/**
 * 用户路由
 * 定义用户信息相关的API端点
 */

import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../controllers/authController';
import { handleSingleImageUpload } from '../middleware/fileUploadMiddleware';

const router = Router();

/**
 * 获取用户完整信息
 * GET /api/users/profile
 */
router.get('/profile', authenticateToken, UserController.getProfile);

/**
 * 更新用户基本信息
 * PUT /api/users/profile
 */
router.put('/profile', authenticateToken, UserController.updateProfile);

/**
 * 上传头像
 * POST /api/users/avatar
 */
router.post('/avatar', authenticateToken, handleSingleImageUpload, UserController.uploadAvatar);

export default router;
