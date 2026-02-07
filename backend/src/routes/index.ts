// API路由聚合 - 统一管理所有API路由
import { Router } from 'express';
import planRoutes from './planRoutes';
import iotRoutes from './iotRoutes';
import authRoutes from './authRoutes';
import tripRoutes from './tripRoutes';
import locationCacheRoutes from './locationCacheRoutes';

const router = Router();

// 挂载路由
router.use(planRoutes);
router.use(iotRoutes);
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/location', locationCacheRoutes);

export default router;
