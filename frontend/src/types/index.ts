// 全局类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Itinerary {
  id: number;
  user_id: number;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget?: number;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
}

export interface Recommendation {
  id: number;
  itinerary_id: number;
  attraction_id: number;
  day_number: number;
  order_in_day: number;
  reason?: Record<string, any>;
  is_alternative: boolean;
  created_at: string;
}
