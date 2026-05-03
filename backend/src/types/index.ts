// TypeScript类型定义 - 定义后端使用的类型

// 景点类别标签
export type CategoryTag =
  | 'history' // 历史文化（博物馆、古迹）
  | 'nature' // 自然风光（山、湖、公园）
  | 'beach' // 海滨海岛
  | 'city' // 城市地标（建筑、街区）
  | 'food' // 美食体验
  | 'theme_park' // 游乐场/主题公园
  | 'art' // 艺术（美术馆、展览）
  | 'shopping' // 购物
  | 'religious' // 宗教（寺庙、教堂）
  | 'adventure'; // 户外运动/探险

// 出行群体类型
export type GroupType = 'solo' | 'couple' | 'family' | 'friends';

// 出行节奏
export type Pace = 'slow' | 'moderate' | 'fast';

// 体力值
export type EnergyLevel = 'low' | 'medium' | 'high';

// 用户偏好配置
export interface UserPreferences {
  // 出行节奏
  pace: Pace;
  // 体力值
  energy_level: EnergyLevel;
  // 细化偏好标签（多选）
  categories: CategoryTag[];
}

// 行程规划请求参数
export interface CreatePlanRequest {
  origin?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number;
  groupSize?: number;
  // 新增字段
  groupType?: GroupType;
  hasChildren?: boolean;
  hasElderly?: boolean;
  preferences?: UserPreferences;
}

// 景点项
export interface RecommendedAttraction {
  id?: string; // 景点ID（spotId，用于图片上传）- 后端返回的字段名
  name: string;
  time: string;
  location: string;
  estimated_cost: number;
  description: string;
  type?: string;
  address?: string;
  spotId?: string; // 兼容旧字段名
  image?: string | null; // 景点图片URL
  iotData?: any; // IoT实时数据
  rating?: number; // 景点评分
  category?: string; // 景点分类
}

// 每日行程
export interface DailyItinerary {
  day: number;
  date: string;
  attractions: RecommendedAttraction[];
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
  alternativePools?: Record<string, any[]>; // 备选景点池（普通对象）
  excludedSpots?: Array<{ attraction: RecommendedAttraction; reason: string }>; // 被排除的景点信息
  warnings?: Array<{ attraction: RecommendedAttraction; reason: string }>; // 警告信息
  budget_utilization?: number; // 预算利用率
  recommendations?: string[]; // 预算优化建议
}

// 景点评分结果
export interface SpotScore {
  spotId: string;
  spot: any; // Spot 类型
  totalScore: number;
  preferenceScore: number;
  qualityScore: number;
  iotScore: number;
  crowdScore: number;
  categories: CategoryTag[];
  iotData?: any; // IoT实时数据
}

// 景点聚类结果
export interface SpotCluster {
  clusterId: number;
  spots: SpotScore[];
  center: { lng: number; lat: number };
}

// 备选景点信息
export interface AlternativeSpot {
  spotId: string;
  spot: any;
  score: number;
  reason: string;
}
