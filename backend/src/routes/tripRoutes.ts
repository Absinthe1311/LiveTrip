// 行程管理路由 - 定义行程的增删改查API端点
import { Router } from 'express';
import { getUserTrips, getTripById, deleteTrip, saveTrip } from '../controllers/tripController';

const router = Router();

// GET /api/trips - 获取用户的所有行程
router.get('/', getUserTrips);

// POST /api/trips - 保存行程
router.post('/', saveTrip);

// GET /api/trips/:id - 获取单个行程详情
router.get('/:id', getTripById);

// DELETE /api/trips/:id - 删除行程
router.delete('/:id', deleteTrip);

export default router;
