/**
 * 打包清单路由
 * 处理打包清单相关的API路由
 */

import express from 'express';
import { PackingController } from '../controllers/packingController';
import { authToken } from '../controllers/authController';

const router = express.Router();

/**
 * 获取行程的打包清单
 * GET /api/trips/:tripId/packing
 */
router.get('/trips/:tripId/packing', authToken, PackingController.packList);

/**
 * 初始化打包清单（添加默认预设物品）
 * POST /api/trips/:tripId/packing/initialize
 */
router.post(
  '/trips/:tripId/packing/initialize',
  authToken,
  PackingController.initPack
);

/**
 * 添加打包物品
 * POST /api/trips/:tripId/packing
 */
router.post('/trips/:tripId/packing', authToken, PackingController.addItem);

/**
 * 批量保存打包清单
 * POST /api/trips/:tripId/packing/batch
 */
router.post(
  '/trips/:tripId/packing/batch',
  authToken,
  PackingController.batchSave
);

/**
 * 更新打包物品状态
 * PATCH /api/packing/:itemId
 */
router.patch('/packing/:itemId', authToken, PackingController.updItem);

/**
 * 删除打包物品
 * DELETE /api/packing/:itemId
 */
router.delete('/packing/:itemId', authToken, PackingController.delItem);

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
  authToken,
  PackingController.packProgress
);

export default router;
