// 推荐控制器 - 处理酒店和餐厅推荐请求
import { Request, Response } from 'express';
import { hotelRecommender, HotelRecommendRequest } from '../services/hotelRecommender';
import { restaurantRecommender, RestaurantRecommendRequest } from '../services/restaurantRecommender';

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
 * 获取餐厅推荐（按天）
 * POST /api/recommendations/restaurants
 * 
 * 请求体:
 * {
 *   days: [{
 *     day: number,
 *     date: string,
 *     spots: [{ name: string, location: string }]
 *   }]
 * }
 */
export const getRestaurantRecommendations = async (req: Request, res: Response) => {
  try {
    console.log('🍽️ 收到餐厅推荐请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    const { days } = req.body as RestaurantRecommendRequest;

    // 验证必填字段
    if (!days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：days（非空数组）',
      });
    }

    // 验证每天的数据格式
    for (const dayData of days) {
      if (typeof dayData.day !== 'number') {
        return res.status(400).json({
          success: false,
          error: '每天数据必须包含 day 字段（数字）',
        });
      }
      // date 字段改为可选，如果为空则使用默认值
      if (!dayData.date || typeof dayData.date !== 'string') {
        dayData.date = ''; // 使用空字符串作为默认值
      }
      if (!dayData.spots || !Array.isArray(dayData.spots)) {
        return res.status(400).json({
          success: false,
          error: '每天数据必须包含 spots 字段（数组）',
        });
      }
      // 验证景点数据格式
      for (const spot of dayData.spots) {
        if (!spot.name || !spot.location) {
          return res.status(400).json({
            success: false,
            error: '每个景点必须包含 name 和 location 字段',
          });
        }
      }
    }

    console.log(`📍 天数: ${days.length}`);
    console.log('📦 请求数据详情:', JSON.stringify(days, null, 2));

    // 调用餐厅推荐服务
    const recommendations = await restaurantRecommender.getRestaurantRecommendations(days);

    console.log(`✅ 返回 ${recommendations.length} 天的餐厅推荐`);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error('❌ 餐厅推荐失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '餐厅推荐失败，请稍后重试',
    });
  }
};
