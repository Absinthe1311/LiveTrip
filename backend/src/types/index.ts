// TypeScript类型定义 - 定义后端使用的类型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Itinerary {
  id: number;
  user_id: number;
  destination: string;
  start_date: Date;
  end_date: Date;
  travelers: number;
  budget?: number;
  preferences?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Attraction {
  id: number;
  name: string;
  city: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  avg_duration_min?: number;
  description?: string;
  tags?: string[];
}

export interface IoTData {
  id: number;
  attraction_id: number;
  crowd_level: number;
  wait_time_min?: number;
  weather?: Record<string, any>;
  is_open: boolean;
  updated_at: Date;
}

export interface Recommendation {
  id: number;
  itinerary_id: number;
  attraction_id: number;
  day_number: number;
  order_in_day: number;
  reason?: Record<string, any>;
  is_alternative: boolean;
  created_at: Date;
}

export interface CreatePlanRequest {
  origin?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number;
  preferences?: {
    interests?: string;
  };
}

// 推荐的景点项
export interface RecommendedAttraction {
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
}

export interface AdjustItineraryRequest {
  itinerary_id: number;
  reason: string;
  adjustments: {
    attraction_id: number;
    action: 'remove' | 'add' | 'reorder';
    new_order?: number;
  }[];
}
