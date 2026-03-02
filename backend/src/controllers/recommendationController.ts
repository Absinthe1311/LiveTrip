// 推荐控制器 - 处理酒店和餐厅推荐请求
import { Request, Response } from 'express';
import { hotelRecommender, HotelRecommendRequest } from '../services/hotelRecommender';

/**
 * 获取酒店推荐
 * POST /api/recommendations/hotels
 * 
 * 请求体:
 * {
 *   spots: [{ name: string, location: string }],
 *   budget: number
 * }
 */
export const getHotelRecommendations = async (req: Request, res: Response) => {
  try {
    console.log('🏨 收到酒店推荐请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    const { spots, budget } = req.body as HotelRecommendRequest;

    // 验证必填字段
    if (!spots || !Array.isArray(spots) || spots.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：spots（非空数组）',
      });
    }

    if (typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json({
        success: false,
        error: '预算必须为正数',
      });
    }

    // 验证景点数据格式
    for (const spot of spots) {
      if (!spot.name || !spot.location) {
        return res.status(400).json({
          success: false,
          error: '每个景点必须包含 name 和 location 字段',
        });
      }
    }

    console.log(`📍 景点数量: ${spots.length}`);
    console.log(`💰 用户预算: ${budget}元`);

    // 调用酒店推荐服务
    const hotels = await hotelRecommender.getHotelRecommendations(spots, budget);

    console.log(`✅ 返回 ${hotels.length} 个酒店推荐`);

    res.json({
      success: true,
      data: hotels,
      count: hotels.length,
    });
  } catch (error: any) {
    console.error('❌ 酒店推荐失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '酒店推荐失败，请稍后重试',
    });
  }
};

/**
 * 获取餐厅推荐（预留接口，后续实现）
 * POST /api/recommendations/restaurants
 */
export const getRestaurantRecommendations = async (req: Request, res: Response) => {
  try {
    console.log('🍽️ 收到餐厅推荐请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    // TODO: 实现餐厅推荐逻辑
    res.json({
      success: true,
      data: [],
      message: '餐厅推荐功能待实现',
    });
  } catch (error: any) {
    console.error('❌ 餐厅推荐失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '餐厅推荐失败，请稍后重试',
    });
  }
};
