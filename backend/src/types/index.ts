// TypeScript类型定义 - 定义后端使用的类型

// IoT数据类型
export interface IoTData {
  id: number;
  attraction_id: number;
  crowd_level: number;
  wait_time_min?: number;
  weather?: Record<string, any>;
  is_open: boolean;
  updated_at: string;
}

// 行程规划请求参数
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
