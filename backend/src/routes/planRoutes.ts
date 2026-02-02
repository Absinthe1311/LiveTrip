// 行程规划路由 - 定义行程规划相关的API端点
import { Router } from 'express';
import { createPlan, getItinerary, adjustItinerary } from '../controllers/planController';

const router = Router();

// POST /api/plan - 创建行程计划
router.post('/plan', createPlan);

// GET /api/itinerary/:id - 获取行程
router.get('/itinerary/:id', getItinerary);

// POST /api/adjust - 调整行程
router.post('/adjust', adjustItinerary);

export default router;
