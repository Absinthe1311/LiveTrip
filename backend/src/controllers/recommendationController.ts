// 推荐控制器 - 处理酒店和餐厅推荐请求
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hotelRecommender, HotelRecommendRequest } from '../services/hotelRecommender';
import { restaurantRecommender, RestaurantRecommendRequest } from '../services/restaurantRecommender';

const prisma = new PrismaClient();

/**
 * 获取酒店推荐
 * POST /api/recommendations/hotels
 * 
 * 请求体:
 * {
 *   spots: [{ name: string, location: string }],
 *   budget: number,
 *   tripId?: string (可选,如果提供则优先使用缓存)
 * }
 */
export const getHotelRecommendations = async (req: Request, res: Response) => {
  try {
    console.log('🏨 收到酒店推荐请求');
    const { spots, budget, tripId } = req.body as HotelRecommendRequest & { tripId?: string };

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

    // 如果提供了tripId,优先使用缓存
    if (tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { hotelRecommendationsCache: true },
      });

      if (trip && trip.hotelRecommendationsCache) {
        try {
          const cachedHotels = JSON.parse(trip.hotelRecommendationsCache);
          if (cachedHotels && cachedHotels.length > 0) {
            console.log('✅ 使用缓存的酒店推荐');
            return res.json({
              success: true,
              data: cachedHotels,
              count: cachedHotels.length,
              fromCache: true,
            });
          }
        } catch (e) {
          console.warn('⚠️  缓存解析失败,将重新获取');
        }
      }
    }

    console.log('📡 调用高德API获取酒店推荐');
    console.log(`📍 景点数量: ${spots.length}, 预算: ${budget}元`);

    // 调用酒店推荐服务
    const hotels = await hotelRecommender.getHotelRecommendations(spots, budget);

    console.log(`✅ 返回 ${hotels.length} 个酒店推荐`);

    res.json({
      success: true,
      data: hotels,
      count: hotels.length,
      fromCache: false,
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
 *   }],
 *   tripId?: string (可选,如果提供则优先使用缓存)
 * }
 */
export const getRestaurantRecommendations = async (req: Request, res: Response) => {
  try {
    console.log('🍽️ 收到餐厅推荐请求');
    const { days, tripId } = req.body as RestaurantRecommendRequest & { tripId?: string };

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

    // 如果提供了tripId,优先使用缓存
    if (tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          days: {
            select: {
              dayNumber: true,
              restaurantRecommendationsCache: true,
            },
          },
        },
      });

      if (trip && trip.days) {
        const cachedRecommendations = [];
        let hasValidCache = false;

        for (const day of days) {
          const dayRecord = trip.days.find(d => d.dayNumber === day.day);
          if (dayRecord && dayRecord.restaurantRecommendationsCache) {
            try {
              const cachedRestaurants = JSON.parse(dayRecord.restaurantRecommendationsCache);
              if (cachedRestaurants && cachedRestaurants.length > 0) {
                cachedRecommendations.push({
                  day: day.day,
                  date: day.date,
                  centerSpot: '',
                  centerLocation: '',
                  restaurants: cachedRestaurants,
                });
                hasValidCache = true;
              }
            } catch (e) {
              console.warn(`⚠️  第${day.day}天缓存解析失败`);
            }
          }
        }

        if (hasValidCache && cachedRecommendations.length === days.length) {
          console.log('✅ 使用缓存的餐厅推荐');
          return res.json({
            success: true,
            data: cachedRecommendations,
            count: cachedRecommendations.length,
            fromCache: true,
          });
        }
      }
    }

    console.log('📡 调用高德API获取餐厅推荐');
    console.log(`📍 天数: ${days.length}`);

    // 调用餐厅推荐服务
    const recommendations = await restaurantRecommender.getRestaurantRecommendations(days);

    console.log(`✅ 返回 ${recommendations.length} 天的餐厅推荐`);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      fromCache: false,
    });
  } catch (error: any) {
    console.error('❌ 餐厅推荐失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '餐厅推荐失败，请稍后重试',
    });
  }
};
