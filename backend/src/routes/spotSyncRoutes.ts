// 景点同步路由 - 定义景点同步的API端点
import { Router } from 'express';
import { syncSpot, syncSpotsBatch } from '../controllers/spotSyncController';

const router = Router();

/**
 * 同步单个景点
 * POST /api/spots/sync
 */
router.post('/sync', syncSpot);

/**
 * 批量同步景点
 * POST /api/spots/sync/batch
 */
router.post('/sync/batch', syncSpotsBatch);

export default router;
