// 工具函数 - 通用工具方法
import { Response } from 'express';

// 成功响应
export const successResponse = (res: Response, data: any, message?: string, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: message || 'Success',
    data
  });
};

// 错误响应
export const errorResponse = (res: Response, message: string, statusCode: number = 500, errors?: any) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

// 异步处理包装器
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
