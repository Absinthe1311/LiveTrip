// API路由聚合 - 统一管理所有API路由
import { Router } from 'express';
import planRoutes from './planRoutes';
import iotRoutes from './iotRoutes';
import authRoutes from './authRoutes';
import tripRoutes from './tripRoutes';
import locationCacheRoutes from './locationCacheRoutes';
import spotRoutes from './spotRoutes';
import favoriteRoutes from './favoriteRoutes';
import spotSyncRoutes from './spotSyncRoutes';
import destinationRoutes from './destinationRoutes';
import recommendationRoutes from './recommendationRoutes';
import advisorRoutes from './advisorRoutes';
import shareRoutes from './shareRoutes';
import imageRoutes from './imageRoutes';
import reviewRoutes from './reviewRoutes';
import blogRoutes from './blogRoutes';
import adminRoutes from './adminRoutes';
import hotSpotRoutes from './hotSpotRoutes';
import agentRoutes from './agentRoutes';
// import testRoutes from './testRoutes'; // 文件不存在，暂时注释
import collabRoutes from './collabRoutes';
import { PackingController } from '../controllers/packingController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

// 挂载路由
router.use(planRoutes);
router.use(iotRoutes);
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/location', locationCacheRoutes);
router.use('/spots', spotRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/spots', spotSyncRoutes);
router.use('/destinations', destinationRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/advisor', advisorRoutes);
router.use(shareRoutes);
router.use('/images', imageRoutes);
router.use('/reviews', reviewRoutes);
router.use('/blogs', blogRoutes);
router.use('/admin', adminRoutes);
router.use('/hot-spots', hotSpotRoutes);
router.use('/agent', agentRoutes);
// router.use('/test', testRoutes); // 文件不存在，暂时注释
router.use('/collab', collabRoutes);

// ==================== 打包清单独立路由 ====================
// PATCH /api/packing/:itemId - 更新打包物品状态
router.patch('/packing/:itemId', authenticateToken, PackingController.updatePackingItem);

// DELETE /api/packing/:itemId - 删除打包物品
router.delete('/packing/:itemId', authenticateToken, PackingController.deletePackingItem);

// GET /api/packing/categories - 获取所有分类
router.get('/packing/categories', PackingController.getCategories);

export default router;
