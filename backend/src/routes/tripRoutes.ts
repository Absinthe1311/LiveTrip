// 行程管理路由 - 定义行程的增删改查API端点
import { Router } from 'express';
import { getUserTrips, getTripById, deleteTrip, saveTrip, updateTripHotel, updateDayRestaurant, calculateRealTimeBudget, completeTrip } from '../controllers/tripController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

// GET /api/trips - 获取用户的所有行程
router.get('/', authenticateToken, getUserTrips);

// POST /api/trips - 保存行程
router.post('/', authenticateToken, saveTrip);

// POST /api/trips/calculate-budget - 计算实时预算
router.post('/calculate-budget', calculateRealTimeBudget);

// GET /api/trips/:id - 获取单个行程详情
router.get('/:id', authenticateToken, getTripById);

// PUT /api/trips/:id/hotel - 更新行程的酒店信息
router.put('/:id/hotel', authenticateToken, updateTripHotel);

// PUT /api/trips/:tripId/days/:dayNumber/restaurant - 更新某一天的餐厅信息
router.put('/:tripId/days/:dayNumber/restaurant', authenticateToken, updateDayRestaurant);

// PUT /api/trips/:tripId/complete - 完成行程
router.put('/:tripId/complete', authenticateToken, completeTrip);

// DELETE /api/trips/:id - 删除行程
router.delete('/:id', authenticateToken, deleteTrip);

export default router;
