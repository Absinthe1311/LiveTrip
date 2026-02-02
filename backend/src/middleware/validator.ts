// 请求验证中间件 - 验证请求数据
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validatePlanRequest = [
  body('destination').notEmpty().withMessage('目的地不能为空'),
  body('start_date').isISO8601().withMessage('开始日期格式不正确'),
  body('end_date').isISO8601().withMessage('结束日期格式不正确'),
  body('travelers').isInt({ min: 1 }).withMessage('旅行人数必须大于0'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateAdjustRequest = [
  body('itinerary_id').isInt({ min: 1 }).withMessage('行程ID必须大于0'),
  body('reason').notEmpty().withMessage('调整原因不能为空'),
  body('adjustments').isArray().withMessage('调整项必须是数组'),
  body('adjustments.*.attraction_id').isInt({ min: 1 }).withMessage('景点ID必须大于0'),
  body('adjustments.*.action').isIn(['remove', 'add', 'reorder']).withMessage('操作类型不正确'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }
    next();
  }
];
