// API路由聚合 - 统一管理所有API路由
import { Router } from 'express';
import planRoutes from './planRoutes';
import iotRoutes from './iotRoutes';
import authRoutes from './authRoutes';

const router = Router();

// 挂载路由
router.use(planRoutes);
router.use(iotRoutes);
router.use('/auth', authRoutes);

export default router;
