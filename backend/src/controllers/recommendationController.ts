// 推荐控制器 - 处理酒店和餐厅推荐请求
import { Request, Response } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { hotelRecommender, HotelRecommendRequest } from '../services/hotelRecommender';
import {
  restaurantRecommender,
  RestaurantRecommendRequest,
} from '../services/restaurantRecommender';
import { amapService } from '../services/amapService';
import { restaurantCacheService } from '../services/restaurantCacheService';
import { hotelCacheService } from '../services/hotelCacheService';

const prisma = getPrismaClient();

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
export const hotelRecs = async (req: Request, res: Response) => {
  try {
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
            console.log('✅ [数据库缓存] 酒店推荐 - tripId:', tripId);
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

    console.log('📡 [高德API] 酒店推荐 - 景点:', spots.length, '预算:', budget);

    // 调用酒店推荐服务
    const hotels = await hotelRecommender.hotelRecs(spots, budget);

    console.log(`✅ [高德API] 酒店推荐成功 - 返回 ${hotels.length} 个结果`);

    // 保存推荐数据到缓存（如果有tripId）
    if (tripId && hotels.length > 0) {
      try {
        await prisma.trip.update({
          where: { id: tripId },
          data: { hotelRecommendationsCache: JSON.stringify(hotels) },
        });
        console.log(`💾 [数据库] 保存酒店推荐缓存 - tripId: ${tripId}`);
      } catch (e) {
        console.warn('⚠️  保存酒店推荐缓存失败:', e);
      }
    }

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
export const restaurantRecs = async (req: Request, res: Response) => {
  try {
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
          const dayRecord = trip.days.find((d) => d.dayNumber === day.day);
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
          console.log('✅ [数据库缓存] 餐厅推荐 - tripId:', tripId);
          return res.json({
            success: true,
            data: cachedRecommendations,
            count: cachedRecommendations.length,
            fromCache: true,
          });
        }
      }
    }

    console.log('📡 [高德API] 餐厅推荐 - 天数:', days.length);

    // 调用餐厅推荐服务
    const recommendations = await restaurantRecommender.restaurantRecs(days);

    console.log(`✅ [高德API] 餐厅推荐成功 - 返回 ${recommendations.length} 天的结果`);

    // 保存推荐数据到缓存（如果有tripId）
    if (tripId && recommendations.length > 0) {
      try {
        for (const rec of recommendations) {
          if (rec.restaurants && rec.restaurants.length > 0) {
            await prisma.day.updateMany({
              where: { tripId, dayNumber: rec.day },
              data: { restaurantRecommendationsCache: JSON.stringify(rec.restaurants) },
            });
          }
        }
        console.log(`💾 [数据库] 保存餐厅推荐缓存 - tripId: ${tripId}`);
      } catch (e) {
        console.warn('⚠️  保存餐厅推荐缓存失败:', e);
      }
    }

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

/**
 * 自定义餐厅搜索
 * POST /api/recommendations/restaurants/custom
 *
 * 请求体:
 * {
 *   name: string,    // 餐厅名称
 *   city: string     // 城市名称
 * }
 */
export const findRestaurant = async (req: Request, res: Response) => {
  try {
    const { name, city, location } = req.body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：name（餐厅名称）',
      });
    }

    if (!city || typeof city !== 'string' || city.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：city（城市名称）',
      });
    }

    console.log(
      `📡 [高德API] 自定义餐厅搜索 - 名称: ${name}, 城市: ${city}, 中心位置: ${location || '无'}`
    );

    const amapServiceInstance = amapService();

    try {
      let finalRestaurants: any[] = [];

      // 如果提供了中心位置，使用周边搜索
      if (location) {
        console.log(`🔍 使用周边搜索 - 中心: ${location}, 关键词: ${name}, 半径: 5000m`);
        finalRestaurants = await amapServiceInstance.searchAround(
          location,
          name,
          '050000',
          5000,
          20
        );
        console.log(`✅ [高德API] 周边搜索 - 返回 ${finalRestaurants.length} 个结果`);

        // 如果周边搜索无结果，扩大搜索半径
        if (finalRestaurants.length === 0) {
          console.log(`⚠️  5km范围内无结果，扩大到10km`);
          finalRestaurants = await amapServiceInstance.searchAround(
            location,
            name,
            '050000',
            10000,
            20
          );
          console.log(`✅ [高德API] 扩大范围搜索 - 返回 ${finalRestaurants.length} 个结果`);
        }
      }

      // 如果没有提供位置或周边搜索无结果，使用城市搜索
      if (finalRestaurants.length === 0) {
        console.log(`🔍 使用城市搜索 - 城市: ${city}, 关键词: ${name}, types: 050000`);
        finalRestaurants = await amapServiceInstance.getAttractions(city, name, '050000', 20);
        console.log(`✅ [高德API] 城市搜索 - 返回 ${finalRestaurants.length} 个结果`);

        // 如果还没有结果，不限制types
        if (finalRestaurants.length === 0) {
          console.log(`⚠️  城市搜索无结果，尝试不限制types`);
          finalRestaurants = await amapServiceInstance.getAttractions(city, name, '', 20);
          console.log(`✅ [高德API] 不限制types搜索 - 返回 ${finalRestaurants.length} 个结果`);
        }
      }

      console.log(`📊 最终返回 ${finalRestaurants.length} 个餐厅`);

      // 保存到数据库缓存
      if (finalRestaurants.length > 0) {
        const restaurantCaches = finalRestaurants.map((r: any) => ({
          name: r.name,
          address: r.address,
          location: r.location,
          tel: r.tel,
          type: r.type,
          rating: r.rating,
        }));
        await restaurantCacheService.saveRestaurants(restaurantCaches, city);
        console.log(`💾 [数据库] 保存 ${finalRestaurants.length} 个餐厅到缓存`);
      }

      res.json({
        success: true,
        data: finalRestaurants,
        count: finalRestaurants.length,
      });
    } catch (error: any) {
      console.error('❌ 高德API调用失败:', error);
      console.error('❌ 错误堆栈:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message || '高德API调用失败',
        data: [],
        count: 0,
      });
    }
  } catch (error: any) {
    console.error('❌ 自定义餐厅搜索失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '自定义餐厅搜索失败，请稍后重试',
    });
  }
};

/**
 * 自定义酒店搜索
 * POST /api/recommendations/hotels/custom
 *
 * 请求体:
 * {
 *   name: string,    // 酒店名称
 *   city: string     // 城市名称
 * }
 */
export const findHotel = async (req: Request, res: Response) => {
  try {
    const { name, city } = req.body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：name（酒店名称）',
      });
    }

    if (!city || typeof city !== 'string' || city.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：city（城市名称）',
      });
    }

    console.log(`📡 [高德API] 自定义酒店搜索 - 名称: ${name}, 城市: ${city}`);

    // 调用高德API搜索酒店
    const amapServiceInstance = amapService();
    const hotels = await amapServiceInstance.getAttractions(city, name, '100101', 20);

    console.log(`✅ [高德API] 自定义酒店搜索成功 - 返回 ${hotels.length} 个结果`);

    // 如果没有结果，尝试不限制types再搜索一次
    let finalHotels = hotels;
    if (hotels.length === 0) {
      console.log(`⚠️  第一次搜索无结果，尝试不限制types搜索`);
      finalHotels = await amapServiceInstance.getAttractions(city, name, '', 20);
      console.log(`✅ [高德API] 第二次搜索 - 返回 ${finalHotels.length} 个结果`);
    }

    // 保存到数据库缓存
    if (finalHotels.length > 0) {
      const hotelCaches = finalHotels.map((h) => ({
        name: h.name,
        address: h.address,
        location: h.location,
        tel: h.tel,
        type: h.type,
        rating: h.rating,
      }));
      await hotelCacheService.saveHotels(hotelCaches, city);
      console.log(`💾 [数据库] 保存 ${finalHotels.length} 个酒店到缓存`);
    }

    res.json({
      success: true,
      data: finalHotels,
      count: finalHotels.length,
    });
  } catch (error: any) {
    console.error('❌ 自定义酒店搜索失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '自定义酒店搜索失败，请稍后重试',
    });
  }
};
