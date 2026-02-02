// 行程规划服务 - 处理行程规划业务逻辑
import { CreatePlanRequest } from '../types';

export const createItinerary = async (userId: number, planData: CreatePlanRequest) => {
  // 模拟创建行程
  const itinerary = {
    id: Math.floor(Math.random() * 10000),
    user_id: userId,
    ...planData,
    start_date: new Date(planData.start_date),
    end_date: new Date(planData.end_date),
    created_at: new Date(),
    updated_at: new Date()
  };
  
  return itinerary;
};

export const getItineraryById = async (id: number) => {
  // 模拟获取行程
  return {
    id,
    user_id: 1,
    destination: '北京',
    start_date: new Date('2026-03-15'),
    end_date: new Date('2026-03-22'),
    travelers: 2,
    budget: 8000,
    preferences: {
      interests: ['历史文化', '美食'],
      pace: '慢游',
      energy_level: '中等'
    },
    created_at: new Date(),
    updated_at: new Date()
  };
};

export const adjustItinerary = async (adjustmentData: any) => {
  // 模拟调整行程
  return {
    success: true,
    message: '行程调整成功',
    adjusted_items: adjustmentData.adjustments
  };
};
