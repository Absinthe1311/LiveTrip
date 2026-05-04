/**
 * 用户路由
 * 定义用户信息相关的API端点
 */

import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authToken } from '../controllers/authController';
import { handleSingleImageUpload } from '../middleware/fileUploadMiddleware';

const router = Router();

/**
 * 获取用户完整信息
 * GET /api/users/profile
 */
router.get('/profile', authToken, UserController.userInfo);

/**
 * 更新用户基本信息
 * PUT /api/users/profile
 */
router.put('/profile', authToken, UserController.saveProfile);

/**
 * 上传头像
 * POST /api/users/avatar
 */
router.post('/avatar', authToken, handleSingleImageUpload, UserController.uploadAvatar);

export default router;
