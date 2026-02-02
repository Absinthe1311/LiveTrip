// 行程规划控制器 - 处理行程规划相关请求
import { Request, Response } from 'express';

export const createPlan = async (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'POST /api/plan - 创建行程计划' 
  });
};

export const getItinerary = async (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ 
    status: 'ok', 
    message: `GET /api/itinerary/${id} - 获取行程`,
    itineraryId: id
  });
};

export const adjustItinerary = async (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'POST /api/adjust - 调整行程' 
  });
};
