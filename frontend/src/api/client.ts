// API 客户端 - 封装所有后端 API 调用
import axios from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    if (config.data) {
      console.log('📦 Request Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url);
    console.log('📦 Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);
    console.error('Error Details:', error.response?.data);
    return Promise.reject(error);
  }
);

// ==================== 类型定义 ====================

// 景点项
export interface AttractionItem {
  name: string;
  time: string;
  location: string;
  estimated_cost: number;
  description: string;
  type?: string;
  address?: string;
}

// 每日行程
export interface DailyItinerary {
  day: number;
  date: string;
  attractions: AttractionItem[];
  daily_cost: number;
}

// 完整行程
export interface FullItinerary {
  itinerary: DailyItinerary[];
  total_cost: number;
  budget_breakdown: {
    transportation: number;
    accommodation: number;
    dining: number;
    tickets: number;
  };
  total_distance?: number;
  summary?: {
    origin?: string;
    destination: string;
    days: number;
    budget?: number;
    start_date: string;
    end_date: string;
  };
}

// 行程规划请求
export interface PlanRequest {
  origin?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number;
  preferences?: {
    interests?: string;
  };
}

// 行程规划响应
export interface PlanResponse {
  success: boolean;
  data: FullItinerary;
}

// IoT 景点数据
export interface IoTSpotData {
  id: string;
  name: string;
  crowdLevel: number;
  temperature: number;
  rainProbability: number;
  isOpen: boolean;
}

// IoT 数据响应
export interface IoTDataResponse {
  success: boolean;
  data: {
    timestamp: number;
    spots: IoTSpotData[];
  };
}

// 备选景点数据
export interface AlternativeSpot {
  id: string;
  amapId: string;
  name: string;
  location: string;
  address: string | null;
  city: string;
  category: string | null;
  ticketPrice: number | null;
  openTime: string | null;
  rating: number | null;
  description: string | null;
  isOutdoor: boolean | null;
  iotData?: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  };
}

// 备选景点响应
export interface AlternativeSpotsResponse {
  success: boolean;
  data: AlternativeSpot[];
  count: number;
}

// 行程调整请求
export interface AdjustRequest {
  itinerary: FullItinerary;
  reason: 'crowd' | 'weather' | 'closed';
  targetAttractionId: string;
}

// 行程调整响应
export interface AdjustResponse {
  success: boolean;
  data: {
    adjustedItinerary: FullItinerary;
    adjustments: Array<{
      day: number;
      originalAttraction: AttractionItem;
      newAttraction: AttractionItem;
      reason: string;
    }>;
    message: string;
  };
}

// ==================== API 函数 ====================

/**
 * 创建行程规划
 */
export const createPlan = async (request: PlanRequest): Promise<PlanResponse> => {
  const response = await apiClient.post<PlanResponse>('/plan', request);
  return response.data;
};

/**
 * 获取 IoT 数据
 */
export const getIoTData = async (): Promise<IoTDataResponse> => {
  const response = await apiClient.get<IoTDataResponse>('/iot/data');
  return response.data;
};

/**
 * 获取备选景点
 * @param spotId 原景点ID
 * @param city 城市名称
 * @param excludeSpotIds 需要排除的景点ID列表（如行程中的景点）
 */
export const getAlternativeSpots = async (
  spotId: string,
  city: string,
  excludeSpotIds: string[] = []
): Promise<AlternativeSpotsResponse> => {
  const response = await apiClient.get<AlternativeSpotsResponse>(`/spots/alternatives/${spotId}`, {
    params: { 
      city,
      excludeSpotIds: JSON.stringify(excludeSpotIds)
    }
  });
  return response.data;
};

/**
 * 更新备选关系（替换景点时调用）
 * @param oldSpotId 被替换的景点ID
 * @param newSpotId 新景点ID
 * @param city 城市名称
 */
export const updateAlternativeRelations = async (oldSpotId: string, newSpotId: string, city: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>('/spots/alternatives/update', {
    oldSpotId,
    newSpotId,
    city
  });
  return response.data;
};

/**
 * 调整行程
 */
export const adjustItinerary = async (request: AdjustRequest): Promise<AdjustResponse> => {
  const response = await apiClient.post<AdjustResponse>('/adjust', request);
  return response.data;
};

// ==================== 行程管理 API ====================

/**
 * 获取用户的所有行程
 */
export const getUserTrips = async () => {
  const response = await apiClient.get('/trips');
  return response.data;
};

/**
 * 获取单个行程详情
 */
export const getTripById = async (id: string) => {
  const response = await apiClient.get(`/trips/${id}`);
  return response.data;
};

/**
 * 删除行程
 */
export const deleteTrip = async (id: string) => {
  const response = await apiClient.delete(`/trips/${id}`);
  return response.data;
};

/**
 * 保存行程
 */
export const saveTrip = async (tripData: any) => {
  const response = await apiClient.post('/trips', tripData);
  return response.data;
};

// ==================== 地点缓存 API ====================

/**
 * 搜索地点（带缓存）
 */
export const searchLocation = async (keywords: string) => {
  const response = await apiClient.get('/location/search', {
    params: { keywords },
  });
  return response.data;
};

/**
 * 获取热门搜索地点
 */
export const getPopularLocations = async (limit: number = 10) => {
  const response = await apiClient.get('/location/popular', {
    params: { limit },
  });
  return response.data;
};

// ==================== 收藏功能 API ====================

/**
 * 获取收藏列表
 */
export const getFavorites = async (includeIoT: boolean = true) => {
  const response = await apiClient.get('/favorites', {
    params: { includeIoT },
  });
  return response.data;
};

/**
 * 添加收藏
 */
export const addFavorite = async (spotId: string, notes?: string) => {
  const response = await apiClient.post('/favorites', {
    spotId,
    notes,
  });
  return response.data;
};

/**
 * 取消收藏
 */
export const removeFavorite = async (spotId: string) => {
  const response = await apiClient.delete(`/favorites/${spotId}`);
  return response.data;
};

/**
 * 检查是否已收藏
 */
export const checkFavorite = async (spotId: string) => {
  const response = await apiClient.get(`/favorites/check/${spotId}`);
  return response.data;
};

/**
 * 获取收藏数量
 */
export const getFavoriteCount = async () => {
  const response = await apiClient.get('/favorites/count');
  return response.data;
};

// ==================== 景点同步 API ====================

/**
 * 同步景点到数据库
 */
export const syncSpot = async (spotData: {
  name: string;
  city: string;
  category?: string;
  ticketPrice?: number;
  openTime?: string;
  rating?: number;
  description?: string;
  isOutdoor?: boolean;
  location?: string;
}) => {
  const response = await apiClient.post('/spots/sync', spotData);
  return response.data;
};

// ==================== 目的地 API ====================

/**
 * 获取城市的热门景点列表
 */
export const getCityAttractions = async (city: string) => {
  const response = await apiClient.get(`/destinations/${city}`);
  return response.data;
};

/**
 * 获取所有支持的城市列表
 */
export const getSupportedCities = async () => {
  const response = await apiClient.get('/destinations');
  return response.data;
};

// ==================== 导出 ====================

export default apiClient;
