/**
 * 分享相关路由
 */

import { Router } from 'express';
import { shareTrip, getSharedTrip, copyTrip } from '../controllers/shareController';

const router = Router();

/**
 * 分享行程
 * POST /api/trips/:id/share
 * 无需认证,但需要验证用户权限
 */
router.post('/trips/:id/share', shareTrip);

/**
 * 获取公开行程
 * GET /api/trips/shared/:token
 * 无需认证,任何人都可以访问
 */
router.get('/trips/shared/:token', getSharedTrip);

/**
 * 复刻公开行程
 * POST /api/trips/shared/:token/clone
 * 需要认证,只有登录用户可以复刻
 */
router.post('/trips/shared/:token/clone', copyTrip);

export default router;
