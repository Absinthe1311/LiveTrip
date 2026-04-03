// 用户认证路由 - 定义注册、登录等认证相关的 API 端点
import { Router } from 'express';
import { register, login, getCurrentUser, updateProfile, authenticateToken } from '../controllers/authController';

const router = Router();

// POST /api/auth/register - 用户注册
router.post('/register', register);

// POST /api/auth/login - 用户登录
router.post('/login', login);

// GET /api/auth/me - 获取当前用户信息
router.get('/me', getCurrentUser);

// PUT /api/auth/profile - 更新用户信息
router.put('/profile', authenticateToken, updateProfile);

export default router;
