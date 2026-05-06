// 行程规划控制器 - 处理行程规划相关请求
import { Request, Response } from 'express';
import { makePlanRequest } from '../types';
import { amapService } from '../services/amapService';
import { traditionalRecommender } from '../services/traditionalRecommender';
import { routeOptimizer } from '../services/routeOptimizer';
import { itineraryAdjustService } from '../services/itineraryAdjustService';
import { editTripRequest } from '../services/itineraryAdjustService';
import { getPrismaClient } from '../lib/prisma';
import { spotService } from '../services/spotService';

const prisma = getPrismaClient();

/**
 * 创建行程计划
 * POST /api/plan
 */
export const makePlan = async (req: Request, res: Response) => {
  try {
    // 解析请求参数
    const planData: makePlanRequest = req.body;

    // 验证必填字段
    if (!planData.destination || !planData.start_date || !planData.end_date) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：destination, start_date, end_date',
      });
    }

    // 计算天数
    const startDate = new Date(planData.start_date);
    const endDate = new Date(planData.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      return res.status(400).json({
        success: false,
        error: '结束日期必须晚于开始日期',
      });
    }


    // 步骤 1: 调用 spotService 获取景点（同时存储到数据库）
    const spots = await spotService.citySpots(planData.destination, 50);

    if (spots.length === 0) {
      return res.status(404).json({
        success: false,
        error: `未找到 ${planData.destination} 的景点数据，请检查城市名称是否正确`,
      });
    }

    // 转换为AI推荐服务需要的格式
    const attractions = spots.map((spot: any) => ({
      id: spot.id, // 添加spotId
      name: spot.name,
      location: spot.location,
      address: spot.address || '',
      type: spot.category || '景点',
      typecode: spot.category || '110000',
      rating: spot.rating || 3.5,
      cost: spot.ticketPrice ? `${spot.ticketPrice}元` : '免费',
      description: spot.description || spot.category || '热门景点', // 添加description字段
      image: spot.image, //  添加图片字段
    }));


    // 步骤 2: 调用传统推荐算法推荐行程
    const itinerary = await traditionalRecommender().suggestPlan({
      attractions,
      destination: planData.destination,
      preferences: planData.preferences || {
        pace: 'moderate',
        energy_level: 'medium',
        categories: [],
      },
      budget: planData.budget || 5000,
      days,
      groupSize: planData.groupSize || 1,
      groupType: planData.groupType || 'solo',
      hasChildren: planData.hasChildren || false,
      hasElderly: planData.hasElderly || false,
      startDate: planData.start_date,
      endDate: planData.end_date,
    });

    // 步骤 3: 对每天的景点进行路径优化
    const optimizer = routeOptimizer();
    for (const day of itinerary.itinerary) {
      day.attractions = optimizer.optRoute(day.attractions);
      // 重新分配时间段
      day.attractions = optimizer.reslot(day.attractions);
    }

    // 计算总距离
    let totalDistance = 0;
    for (const day of itinerary.itinerary) {
      totalDistance += optimizer.totalDist(day.attractions);
    }


    // 构建返回数据
    const responseData = {
      ...itinerary,
      total_distance: totalDistance,
      summary: {
        origin: planData.origin,
        destination: planData.destination,
        days,
        budget: planData.budget,
        start_date: planData.start_date,
        end_date: planData.end_date,
      },
    };


    // 返回结果（不自动保存到数据库）
    res.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '行程规划失败，请稍后重试',
    });
  }
};

/**
 * 获取行程详情
 * GET /api/itinerary/:id
 */
export const itinerary = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // TODO: 从数据库获取行程
    // 目前返回模拟数据
    res.json({
      success: true,
      data: {
        id,
        message: '行程详情功能待实现',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取行程失败',
    });
  }
};

/**
 * 调整行程
 * POST /api/adjust
 */
export const editTrip = async (req: Request, res: Response) => {
  try {

    // 解析请求参数
    const adjustRequest: editTripRequest = req.body;

    // 验证必填字段
    if (!adjustRequest.itinerary || !adjustRequest.reason || !adjustRequest.targetAttractionId) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：itinerary, reason, targetAttractionId',
      });
    }

    // 验证 reason 字段
    if (!['crowd', 'weather', 'closed'].includes(adjustRequest.reason)) {
      return res.status(400).json({
        success: false,
        error: '无效的 reason 值，必须是 crowd、weather 或 closed',
      });
    }

    // 调用行程调整服务
    const result = await itineraryAdjustService.editTrip(adjustRequest);


    // 返回结果
    res.json({
      success: result.success,
      data: {
        adjustedItinerary: result.adjustedItinerary,
        adjustments: result.adjustments,
        message: result.message,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '调整行程失败',
    });
  }
};
