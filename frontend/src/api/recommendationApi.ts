// 酒店和餐厅推荐 API - 封装推荐相关的后端调用
import apiClient from './client';
import { getCache, setCache } from '../utils/amapCache';

// ==================== 类型定义 ====================

// 酒店信息
export interface Hotel {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;           // 酒店类型/档次
  rating?: number;        // 高德评分
  avgDistance: number;    // 到各天景点的平均距离（km）
  distanceDetails: number[]; // 到每天景点的平均距离明细
}

// 酒店推荐请求
export interface HotelRecommendRequest {
  spots: Array<{
    name: string;
    location: string;
  }>;
  budget: number;
}

// 酒店推荐响应
export interface HotelRecommendResponse {
  success: boolean;
  data: Hotel[];
  count: number;
  error?: string;
}

// 餐厅信息
export interface Restaurant {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;           // 菜系/类型
  rating?: number;        // 高德评分
  distance: number;       // 距中心点距离（m）
}

// 每天餐厅推荐结果
export interface DayRestaurantRecommendation {
  day: number;
  date: string;
  centerSpot: string;     // 中心点景点名称
  centerLocation: string; // 中心点坐标
  restaurants: Restaurant[];
}

// 餐厅推荐请求
export interface RestaurantRecommendRequest {
  days: Array<{
    day: number;
    date: string;
    spots: Array<{
      name: string;
      location: string;
    }>;
  }>;
}

// 餐厅推荐响应
export interface RestaurantRecommendResponse {
  success: boolean;
  data: DayRestaurantRecommendation[];
  count: number;
  error?: string;
}

// ==================== API 函数 ====================

/**
 * 获取酒店推荐
 * @param spots 行程中所有景点的坐标信息
 * @param budget 用户预算
 * @param tripId 行程ID(可选,如果提供则优先使用数据库缓存)
 * @returns 酒店推荐列表
 */
export const getHotelRecommendations = async (
  spots: Array<{ name: string; location: string }>,
  budget: number,
  tripId?: string
): Promise<HotelRecommendResponse> => {
  // 生成缓存键
  const cacheKey = spots.map(s => s.location).sort().join(',');

  // 尝试从前端内存缓存获取
  const cached = getCache('hotels', cacheKey, budget);
  if (cached) {
    console.log('✅ [前端缓存] 使用内存缓存的酒店推荐');
    return cached;
  }

  // 调用API
  console.log('📡 [API调用] 获取酒店推荐', tripId ? `(tripId: ${tripId})` : '');
  const response = await apiClient.post<HotelRecommendResponse>('/recommendations/hotels', {
    spots,
    budget,
    tripId, // 传递tripId给后端
  });

  // 保存到前端内存缓存
  if (response.data.success) {
    setCache('hotels', [cacheKey, budget], response.data);
  }

  return response.data;
};

/**
 * 获取餐厅推荐（按天）
 * @param days 每天的行程数据
 * @param tripId 行程ID(可选,如果提供则优先使用数据库缓存)
 * @returns 每天的餐厅推荐列表
 */
export const getRestaurantRecommendations = async (
  days: Array<{
    day: number;
    date: string;
    spots: Array<{ name: string; location: string }>;
  }>,
  tripId?: string
): Promise<RestaurantRecommendResponse> => {
  // 生成缓存键
  const cacheKey = days.map(d =>
    `${d.day}_${d.spots.map(s => s.location).sort().join(',')}`
  ).join('|');

  // 尝试从前端内存缓存获取
  const cached = getCache('restaurants', cacheKey);
  if (cached) {
    console.log('✅ [前端缓存] 使用内存缓存的餐厅推荐');
    return cached;
  }

  // 调用API
  console.log('📡 [API调用] 获取餐厅推荐', tripId ? `(tripId: ${tripId})` : '');
  const response = await apiClient.post<RestaurantRecommendResponse>('/recommendations/restaurants', {
    days,
    tripId, // 传递tripId给后端
  });

  // 保存到前端内存缓存
  if (response.data.success) {
    setCache('restaurants', [cacheKey], response.data);
  }

  return response.data;
};
