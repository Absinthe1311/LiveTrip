// 酒店和餐厅推荐 API - 封装推荐相关的后端调用
import apiClient from './client';

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

// 餐厅信息（预留）
export interface Restaurant {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;
  rating?: number;
  distance: number;
}

// 餐厅推荐请求（预留）
export interface RestaurantRecommendRequest {
  daySpots: Array<Array<{
    name: string;
    location: string;
  }>>;
}

// 餐厅推荐响应（预留）
export interface RestaurantRecommendResponse {
  success: boolean;
  data: Array<Restaurant[]>;
  error?: string;
}

// ==================== API 函数 ====================

/**
 * 获取酒店推荐
 * @param spots 行程中所有景点的坐标信息
 * @param budget 用户预算
 * @returns 酒店推荐列表
 */
export const getHotelRecommendations = async (
  spots: Array<{ name: string; location: string }>,
  budget: number
): Promise<HotelRecommendResponse> => {
  const response = await apiClient.post<HotelRecommendResponse>('/recommendations/hotels', {
    spots,
    budget,
  });
  return response.data;
};

/**
 * 获取餐厅推荐（预留接口）
 * @param daySpots 按天分组的景点数据
 * @returns 每天的餐厅推荐列表
 */
export const getRestaurantRecommendations = async (
  daySpots: Array<Array<{ name: string; location: string }>>
): Promise<RestaurantRecommendResponse> => {
  const response = await apiClient.post<RestaurantRecommendResponse>('/recommendations/restaurants', {
    daySpots,
  });
  return response.data;
};
