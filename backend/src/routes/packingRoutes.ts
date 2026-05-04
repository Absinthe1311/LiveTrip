/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：路由重构
 */

/**
 * 打包清单路由
 * 处理打包清单相关的API路由
 */

import express from 'express';
import { PackingController } from '../controllers/packingController';
import { authenticateToken } from '../controllers/authController';

const router = express.Router();

/**
 * 获取行程的打包清单
 * GET /api/trips/:tripId/packing
 */
router.get('/trips/:tripId/packing', authenticateToken, PackingController.getPackingList);

/**
 * 初始化打包清单（添加默认预设物品）
 * POST /api/trips/:tripId/packing/initialize
 */
router.post(
  '/trips/:tripId/packing/initialize',
  authenticateToken,
  PackingController.initializePackingList
);

/**
 * 添加打包物品
 * POST /api/trips/:tripId/packing
 */
router.post('/trips/:tripId/packing', authenticateToken, PackingController.addPackingItem);

/**
 * 批量保存打包清单
 * POST /api/trips/:tripId/packing/batch
 */
router.post(
  '/trips/:tripId/packing/batch',
  authenticateToken,
  PackingController.batchSavePackingList
);

/**
 * 更新打包物品状态
 * PATCH /api/packing/:itemId
 */
router.patch('/packing/:itemId', authenticateToken, PackingController.updatePackingItem);

/**
 * 删除打包物品
 * DELETE /api/packing/:itemId
 */
router.delete('/packing/:itemId', authenticateToken, PackingController.deletePackingItem);

/**
 * 获取所有分类
 * GET /api/packing/categories
 */
router.get('/packing/categories', PackingController.getCategories);

/**
 * 获取打包进度
 * GET /api/trips/:tripId/packing/progress
 */
router.get(
  '/trips/:tripId/packing/progress',
  authenticateToken,
  PackingController.getPackingProgress
);

export default router;
