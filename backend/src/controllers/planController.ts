// 行程规划控制器 - 处理行程规划相关请求
import { Request, Response } from 'express';
import { CreatePlanRequest } from '../types';
import { amapService } from '../services/amapService';
import { aiRecommender } from '../services/aiRecommender';
import { routeOptimizer } from '../services/routeOptimizer';
import { itineraryAdjustService } from '../services/itineraryAdjustService';
import { AdjustItineraryRequest } from '../services/itineraryAdjustService';
import { PrismaClient } from '@prisma/client';
import { spotService } from '../services/spotService';

const prisma = new PrismaClient();

/**
 * 创建行程计划
 * POST /api/plan
 */
export const createPlan = async (req: Request, res: Response) => {
  try {
    // 解析请求参数
    const planData: CreatePlanRequest = req.body;

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

    console.log(`📅 行程天数: ${days} 天`);
    console.log(`📍 出发地: ${planData.origin || '未指定'}`);

    // 步骤 1: 调用 spotService 获取景点（同时存储到数据库）
    console.log('\n步骤 1: 获取景点数据并存储到数据库...');
    const spots = await spotService.getCitySpots(planData.destination, 50);
    
    if (spots.length === 0) {
      return res.status(404).json({
        success: false,
        error: `未找到 ${planData.destination} 的景点数据，请检查城市名称是否正确`,
      });
    }

    // 转换为AI推荐服务需要的格式
    const attractions = spots.map(spot => ({
      id: spot.id, // 添加spotId
      name: spot.name,
      location: spot.location,
      address: spot.address || '',
      type: spot.category || '景点',
      typecode: spot.category || '110000',
      rating: spot.rating || 3.5,
      cost: spot.ticketPrice ? `${spot.ticketPrice}元` : '免费',
    }));

    console.log(`✅ 获取并存储了 ${spots.length} 个景点到数据库`);

    // 步骤 2: 调用 AI 推荐行程
    console.log('\n步骤 2: AI 推荐行程...');
    const itinerary = await aiRecommender().recommendItinerary({
      attractions,
      destination: planData.destination,
      preferences: planData.preferences || {},
      budget: planData.budget || 5000,
      days,
      groupSize: 1, // 默认为1人
      startDate: planData.start_date,
      endDate: planData.end_date,
    });

    // 步骤 3: 对每天的景点进行路径优化
    console.log('\n步骤 3: 优化游览路径...');
    const optimizer = routeOptimizer();
    for (const day of itinerary.itinerary) {
      day.attractions = optimizer.optimizeRoute(day.attractions);
      // 重新分配时间段
      day.attractions = optimizer.recalculateTimeSlots(day.attractions);
    }

    // 计算总距离
    let totalDistance = 0;
    for (const day of itinerary.itinerary) {
      totalDistance += optimizer.calculateTotalDistance(day.attractions);
    }

    console.log('\n✅ 行程规划完成！');
    console.log(`总费用: ${itinerary.total_cost} 元`);
    console.log(`总距离: ${totalDistance} 公里`);
    console.log(`📍 出发地: ${planData.origin}`);
    console.log(`🎯 目的地: ${planData.destination}`);

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

    console.log('📦 返回数据:', JSON.stringify(responseData.summary, null, 2));

    // 返回结果（不自动保存到数据库）
    res.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('❌ 行程规划失败:', error);
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
export const getItinerary = async (req: Request, res: Response) => {
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
    console.error('❌ 获取行程失败:', error);
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
export const adjustItinerary = async (req: Request, res: Response) => {
  try {
    console.log('📝 收到行程调整请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    // 解析请求参数
    const adjustRequest: AdjustItineraryRequest = req.body;

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
    const result = await itineraryAdjustService.adjustItinerary(adjustRequest);

    console.log('✅ 行程调整完成');
    console.log(`   调整成功: ${result.success}`);
    console.log(`   调整原因: ${result.message}`);
    console.log(`   调整数量: ${result.adjustments.length}`);

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
    console.error('❌ 调整行程失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '调整行程失败',
    });
  }
};
