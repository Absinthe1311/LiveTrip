// TypeScript类型定义 - 定义后端使用的类型

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
