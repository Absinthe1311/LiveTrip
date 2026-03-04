// 行程管理路由 - 定义行程的增删改查API端点
import { Router } from 'express';
import { getUserTrips, getTripById, deleteTrip, saveTrip, updateTripHotel, updateDayRestaurant, calculateRealTimeBudget } from '../controllers/tripController';

const router = Router();

// GET /api/trips - 获取用户的所有行程
router.get('/', getUserTrips);

// POST /api/trips - 保存行程
router.post('/', saveTrip);

// POST /api/trips/calculate-budget - 计算实时预算
router.post('/calculate-budget', calculateRealTimeBudget);

// GET /api/trips/:id - 获取单个行程详情
router.get('/:id', getTripById);

// PUT /api/trips/:id/hotel - 更新行程的酒店信息
router.put('/:id/hotel', updateTripHotel);

// PUT /api/trips/:tripId/days/:dayNumber/restaurant - 更新某一天的餐厅信息
router.put('/:tripId/days/:dayNumber/restaurant', updateDayRestaurant);

// DELETE /api/trips/:id - 删除行程
router.delete('/:id', deleteTrip);

export default router;
