// AI辅助生成：GLM-5, 2026-04-24 21:31
// 描述：预算控制器，提供预算调整、预算历史查询、实时预算状态等API接口

import { Request, Response } from 'express';
import { budgetTrackingService, BudgetCategory } from '../services/budgetTrackingService';

/**
 * GET /api/trips/:tripId/budget
 * 获取行程的实时预算状态
 */
export const budgetStats = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId as string;

    const budgetInfo = await budgetTrackingService.getRealTimeBudget(tripId);

    if (!budgetInfo) {
      return res.status(404).json({
        success: false,
        message: '行程不存在',
      });
    }

    res.json({
      success: true,
      data: budgetInfo,
    });
  } catch (error) {
    console.error('获取预算状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算状态失败',
    });
  }
};

/**
 * PUT /api/trips/:tripId/budget
 * 调整总预算
 */
export const modBudget = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId as string;
    const { newBudget, reason } = req.body;

    if (!newBudget || newBudget < 0) {
      return res.status(400).json({
        success: false,
        message: '预算金额无效',
      });
    }

    const result = await budgetTrackingService.adjustTotalBudget(tripId, newBudget, reason);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('调整预算失败:', error);
    res.status(500).json({
      success: false,
      message: '调整预算失败',
    });
  }
};

/**
 * PUT /api/trips/:tripId/budget/item
 * 更新项目价格
 */
export const updPrice = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId as string;
    const { category, itemName, previousPrice, newPrice } = req.body;

    if (!category || !itemName || previousPrice === undefined || newPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: '参数不完整',
      });
    }

    const result = await budgetTrackingService.updPrice(
      tripId,
      category as BudgetCategory,
      itemName,
      previousPrice,
      newPrice
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('更新项目价格失败:', error);
    res.status(500).json({
      success: false,
      message: '更新项目价格失败',
    });
  }
};

/**
 * GET /api/trips/:tripId/budget/history
 * 获取预算变更历史
 */
export const budgetLog = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId as string;
    const { limit = 20 } = req.query;

    const records = await budgetTrackingService.budgetLog(tripId, Number(limit));

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('获取预算变更历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算变更历史失败',
    });
  }
};
