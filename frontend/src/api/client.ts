// API 客户端 - 封装所有后端 API 调用
import axios from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api',
  timeout: 60000, // 增加到60秒，避免分享行程加载超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 导出 apiClient 供其他模块复用
export { apiClient };

// 请求拦截器 - 添加 token 和 userId 到请求头
apiClient.interceptors.request.use(
  (config) => {
    // 添加 token 到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加 userId 到请求头 (用于权限验证)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['x-user-id'] = user.id;
        }
      } catch (e) {
        console.warn('解析用户信息失败:', e);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== 类型定义 ====================

// 景点项
export interface AttractionItem {
  id?: string; // 景点ID（spotId，用于图片上传）- 后端返回的字段名
  name: string;
  time: string;
  location: string;
  estimated_cost: number;
  description: string;
  type?: string;
  address?: string;
  spotId?: string; // 兼容旧字段名
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

/**
 * 更新行程的酒店信息
 * @param tripId 行程ID
 * @param hotel 酒店信息
 */
export const updateTripHotel = async (tripId: string, hotel: any) => {
  const response = await apiClient.put(`/trips/${tripId}/hotel`, hotel);
  return response.data;
};

/**
 * 更新某一天的餐厅信息
 * @param tripId 行程ID
 * @param dayNumber 天数
 * @param restaurant 餐厅信息
 */
export const updateDayRestaurant = async (tripId: string, dayNumber: number, restaurant: any) => {
  const response = await apiClient.put(`/trips/${tripId}/days/${dayNumber}/restaurant`, restaurant);
  return response.data;
};

/**
 * 计算实时预算
 * @param options 预算计算选项
 */
export const calculateRealTimeBudget = async (options: {
  totalBudget: number;
  days: number;
  hotel?: any;
  restaurants?: Record<number, any>;
  spots?: Array<{ estimated_cost: number }>;
}) => {
  const response = await apiClient.post('/trips/calculate-budget', options);
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

// ==================== 分享相关 API ====================

/**
 * 分享行程
 * @param tripId 行程ID
 * @returns 分享链接信息
 */
export const shareTrip = async (tripId: string) => {
  const response = await apiClient.post(`/trips/${tripId}/share`);
  return response.data;
};

/**
 * 获取公开行程
 * @param token 分享token
 * @returns 行程只读数据
 */
export const getSharedTrip = async (token: string) => {
  const response = await apiClient.get(`/trips/shared/${token}`);
  return response.data;
};

/**
 * 复刻公开行程
 * @param token 分享token
 * @returns 新行程ID
 */
export const cloneSharedTrip = async (token: string) => {
  const response = await apiClient.post(`/trips/shared/${token}/clone`);
  return response.data;
};

/**
 * 完成行程
 * @param tripId 行程ID
 * @returns 更新后的行程信息
 */
export const completeTrip = async (tripId: string) => {
  const response = await apiClient.put(`/trips/${tripId}/complete`);
  return response.data;
};

// ==================== 图片相关 ====================

/**
 * 获取景点封面图片（带来源信息）
 * @param spotName 景点名称
 * @param city 城市（可选）
 * @returns 景点图片URL和来源信息
 */
export const getSpotCoverImage = async (spotName: string, city?: string) => {
  const params: any = {};
  if (city) params.city = city;
  const response = await apiClient.get(`/images/spot/${encodeURIComponent(spotName)}/cover`, { params });
  return response.data;
};

/**
 * 搜索Unsplash图片
 * @param keyword 搜索关键词
 * @param city 城市（可选）
 * @param perPage 每页数量
 * @returns 图片列表
 */
export const searchUnsplashImages = async (keyword: string, city?: string, perPage?: number) => {
  const params: any = {};
  if (city) params.city = city;
  if (perPage) params.perPage = perPage;
  const response = await apiClient.get(`/images/search/${encodeURIComponent(keyword)}`, { params });
  return response.data;
};

/**
 * 批量获取景点图片
 * @param spots 景点列表
 * @returns 图片映射
 */
export const batchGetSpotImages = async (spots: Array<{ name: string; city?: string }>) => {
  const response = await apiClient.post('/images/batch', { spots });
  return response.data;
};

// ==================== 评价相关 ====================

/**
 * 创建评价
 * @param data 评价数据
 * @returns 评价结果
 */
export const createReview = async (data: {
  spotId: string;
  userId: string;
  rating: number;
  comment?: string;
  images?: string[];
}) => {
  const response = await apiClient.post('/reviews', data);
  return response.data;
};

/**
 * 获取景点的所有评价
 * @param spotId 景点ID
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 评价列表
 */
export const getSpotReviews = async (spotId: string, page?: number, pageSize?: number) => {
  const params: any = {};
  if (page) params.page = page;
  if (pageSize) params.pageSize = pageSize;
  const response = await apiClient.get(`/reviews/spot/${spotId}`, { params });
  return response.data;
};

/**
 * 获取用户的评价
 * @param userId 用户ID
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 评价列表
 */
export const getUserReviews = async (userId: string, page?: number, pageSize?: number) => {
  const params: any = {};
  if (page) params.page = page;
  if (pageSize) params.pageSize = pageSize;
  const response = await apiClient.get(`/reviews/user/${userId}`, { params });
  return response.data;
};

/**
 * 删除评价
 * @param reviewId 评价ID
 * @param userId 用户ID
 * @returns 删除结果
 */
export const deleteReview = async (reviewId: string, userId: string) => {
  const response = await apiClient.delete(`/reviews/${reviewId}`, { data: { userId } });
  return response.data;
};

/**
 * 点赞/取消点赞评价
 * @param reviewId 评价ID
 * @param userId 用户ID
 * @returns 点赞结果
 */
export const toggleReviewLike = async (reviewId: string, userId: string) => {
  const response = await apiClient.post(`/reviews/${reviewId}/like`, { userId });
  return response.data;
};

/**
 * 批量获取景点的评价统计
 * @param spotIds 景点ID列表
 * @returns 评价统计
 */
export const getSpotReviewsStats = async (spotIds: string[]) => {
  const response = await apiClient.post('/reviews/stats', { spotIds });
  return response.data;
};

// ==================== Blog相关 ====================

/**
 * 创建博客文章
 * @param data 博客数据
 * @returns 博客文章
 */
export const createBlog = async (data: {
  userId: string;
  title: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  city?: string;
  spotIds?: string[];
  isPublished?: boolean;
}) => {
  const response = await apiClient.post('/blogs', data);
  return response.data;
};

/**
 * 获取博客文章列表
 * @param params 查询参数
 * @returns 博客列表
 */
export const getBlogPosts = async (params?: {
  userId?: string;
  city?: string;
  tags?: string[];
  isPublished?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'popular' | 'mostLiked';
}) => {
  const response = await apiClient.get('/blogs', { params });
  return response.data;
};

/**
 * 获取博客文章详情
 * @param id 博客ID
 * @returns 博客详情
 */
export const getBlogPostById = async (id: string) => {
  const response = await apiClient.get(`/blogs/${id}`);
  return response.data;
};

/**
 * 增加博客浏览量
 * @param id 博客ID
 * @returns 增加浏览量结果
 */
export const incrementBlogViewCount = async (id: string) => {
  const response = await apiClient.post(`/blogs/${id}/view`);
  return response.data;
};

/**
 * 更新博客文章
 * @param id 博客ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的博客
 */
export const updateBlog = async (id: string, userId: string, data: {
  title?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  city?: string;
  spotIds?: string[];
  isPublished?: boolean;
}) => {
  const response = await apiClient.put(`/blogs/${id}`, { userId, ...data });
  return response.data;
};

/**
 * 删除博客文章
 * @param id 博客ID
 * @param userId 用户ID
 * @returns 删除结果
 */
export const deleteBlog = async (id: string, userId: string) => {
  const response = await apiClient.delete(`/blogs/${id}`, { data: { userId } });
  return response.data;
};

/**
 * 点赞/取消点赞
 * @param postId 博客ID
 * @param userId 用户ID
 * @returns 点赞结果
 */
export const toggleLike = async (postId: string, userId: string) => {
  const response = await apiClient.post(`/blogs/${postId}/like`, { userId });
  return response.data;
};

/**
 * 添加评论
 * @param postId 博客ID
 * @param userId 用户ID
 * @param content 评论内容
 * @returns 评论
 */
export const addBlogComment = async (postId: string, userId: string, content: string) => {
  const response = await apiClient.post(`/blogs/${postId}/comments`, { userId, content });
  return response.data;
};

/**
 * 删除评论
 * @param commentId 评论ID
 * @param userId 用户ID
 * @returns 删除结果
 */
export const deleteBlogComment = async (commentId: string, userId: string) => {
  const response = await apiClient.delete(`/blogs/comments/${commentId}`, { data: { userId } });
  return response.data;
};

/**
 * 点赞/取消点赞评论
 * @param commentId 评论ID
 * @param userId 用户ID
 * @returns 点赞结果
 */
export const toggleBlogCommentLike = async (commentId: string, userId: string) => {
  const response = await apiClient.post(`/blogs/comments/${commentId}/like`, { userId });
  return response.data;
};

/**
 * 获取热门标签
 * @param limit 数量限制
 * @returns 热门标签列表
 */
export const getPopularTags = async (limit?: number) => {
  const params: any = {};
  if (limit) params.limit = limit;
  const response = await apiClient.get('/blogs/tags/popular', { params });
  return response.data;
};

/**
 * 获取热门目的地
 * @returns 热门目的地列表
 */
export const getHotDestinations = async () => {
  const response = await apiClient.get('/hot-spots');
  return response.data;
};

// ==================== 打包清单 API ====================

/**
 * 打包物品接口
 */
export interface PackingItem {
  id: string;
  tripId: string;
  itemName: string;
  category: string;
  isPacked: boolean;
  isSuggested: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 打包进度接口
 */
export interface PackingProgress {
  total: number;
  packed: number;
  percentage: number;
}

/**
 * 获取行程的打包清单
 * @param tripId 行程ID
 * @returns 打包清单
 */
export const getPackingList = async (tripId: string) => {
  const response = await apiClient.get(`/trips/${tripId}/packing`);
  return response.data;
};

/**
 * 初始化打包清单（添加默认预设物品）
 * @param tripId 行程ID
 * @returns 初始化后的打包清单
 */
export const initializePackingList = async (tripId: string) => {
  const response = await apiClient.post(`/trips/${tripId}/packing/initialize`);
  return response.data;
};

/**
 * 添加打包物品
 * @param tripId 行程ID
 * @param itemName 物品名称
 * @param category 分类
 * @returns 添加的物品
 */
export const addPackingItem = async (tripId: string, itemName: string, category: string) => {
  const response = await apiClient.post(`/trips/${tripId}/packing`, {
    itemName,
    category,
  });
  return response.data;
};

/**
 * 更新打包物品状态
 * @param itemId 物品ID
 * @param updates 更新内容
 * @returns 更新后的物品
 */
export const updatePackingItem = async (itemId: string, updates: {
  isPacked?: boolean;
  itemName?: string;
}) => {
  const response = await apiClient.patch(`/packing/${itemId}`, updates);
  return response.data;
};

/**
 * 删除打包物品
 * @param itemId 物品ID
 * @returns 删除结果
 */
export const deletePackingItem = async (itemId: string) => {
  const response = await apiClient.delete(`/packing/${itemId}`);
  return response.data;
};

/**
 * 获取所有分类
 * @returns 分类列表
 */
export const getPackingCategories = async () => {
  const response = await apiClient.get('/packing/categories');
  return response.data;
};

/**
 * 获取打包进度
 * @param tripId 行程ID
 * @returns 打包进度
 */
export const getPackingProgress = async (tripId: string) => {
  const response = await apiClient.get(`/trips/${tripId}/packing/progress`);
  return response.data;
};

// ==================== 导出 ====================

export default apiClient;
