// 行程管理路由 - 定义行程的增删改查API端点
import { Router } from 'express';
import {
  listTrips,
  getTripById,
  delTrip,
  saveTrip,
  updHotel,
  setDayDining,
  calBudget,
  completeTrip,
} from '../controllers/tripController';
import { PackingController } from '../controllers/packingController';
import { authToken } from '../controllers/authController';
import {
  budgetStats,
  modBudget,
  updPrice,
  budgetLog,
} from '../controllers/budgetController';

const router = Router();

// GET /api/trips - 获取用户的所有行程
router.get('/', authToken, listTrips);

// POST /api/trips - 保存行程
router.post('/', authToken, saveTrip);

// POST /api/trips/calculate-budget - 计算实时预算
router.post('/calculate-budget', calBudget);

// GET /api/trips/:id - 获取单个行程详情
router.get('/:id', authToken, getTripById);

// PUT /api/trips/:id/hotel - 更新行程的酒店信息
router.put('/:id/hotel', authToken, updHotel);

// PUT /api/trips/:tripId/days/:dayNumber/restaurant - 更新某一天的餐厅信息
router.put('/:tripId/days/:dayNumber/restaurant', authToken, setDayDining);

// PUT /api/trips/:tripId/complete - 完成行程
router.put('/:tripId/complete', authToken, completeTrip);

// DELETE /api/trips/:id - 删除行程
router.delete('/:id', authToken, delTrip);

// ==================== 打包清单路由 ====================

// GET /api/trips/:tripId/packing - 获取行程的打包清单
router.get('/:tripId/packing', authToken, PackingController.packList);

// POST /api/trips/:tripId/packing/initialize - 初始化打包清单（添加默认预设物品）
router.post(
  '/:tripId/packing/initialize',
  authToken,
  PackingController.initPack
);

// POST /api/trips/:tripId/packing - 添加打包物品
router.post('/:tripId/packing', authToken, PackingController.addItem);

// GET /api/trips/:tripId/packing/progress - 获取打包进度
router.get('/:tripId/packing/progress', authToken, PackingController.packProgress);

// ==================== 预算管理路由 ====================

// GET /api/trips/:tripId/budget - 获取行程的实时预算状态
router.get('/:tripId/budget', authToken, budgetStats);

// PUT /api/trips/:tripId/budget - 调整总预算
router.put('/:tripId/budget', authToken, modBudget);

// PUT /api/trips/:tripId/budget/item - 更新项目价格
router.put('/:tripId/budget/item', authToken, updPrice);

// GET /api/trips/:tripId/budget/history - 获取预算变更历史
router.get('/:tripId/budget/history', authToken, budgetLog);

export default router;
