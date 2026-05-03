// 行程管理控制器 - 处理行程的增删改查
// AI辅助生成：GLM-5, 2026-04-22
// 内容说明：优化saveTrip响应数据结构，返回完整trip对象（包含coverImage字段）
import { Request, Response } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { budgetCalculator } from '../services/budgetCalculator';
import { spotService } from '../services/spotService';
import { traditionalRecommender } from '../services/traditionalRecommender';

const prisma = getPrismaClient();

/**
 * 获取用户的所有行程
 * GET /api/trips
 */
export const getUserTrips = async (req: Request, res: Response) => {
  try {
    console.log('📝 收到获取行程列表请求');

    // 从认证中间件获取用户ID
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    console.log(`👤 用户ID: ${userId}`);

    // 获取用户的所有行程
    const trips = await prisma.trip.findMany({
      where: {
        userId,
      },
      include: {
        budget: true,
        collabRoom: true, // 包含协同房间信息
        days: {
          include: {
            itineraryItems: true,
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ 找到 ${trips.length} 个行程`);

    res.json({
      success: true,
      data: trips,
    });
  } catch (error: any) {
    console.error('❌ 获取行程列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取行程列表失败',
    });
  }
};

/**
 * 获取单个行程详情
 * GET /api/trips/:id
 */
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tripId = Array.isArray(id) ? id[0] : id;

    console.log(`📝 收到获取行程详情请求，ID: ${tripId}`);

    // 获取行程详情
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
      },
      include: {
        budget: true,
        days: {
          include: {
            itineraryItems: true,
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: '行程不存在',
      });
    }

    console.log('✅ 行程详情获取成功');

    // 生成备选景点池
    let alternativePools: Record<string, any[]> = {};

    try {
      // 获取所有景点ID
      const allSpotIds = trip.days.flatMap((day) =>
        day.itineraryItems.map((item) => item.spotId).filter((id) => id !== null)
      ) as string[];

      // 获取行程中的景点信息（包含图片）
      const itinerarySpots = await prisma.spot.findMany({
        where: {
          id: { in: allSpotIds },
        },
        include: {
          image: true, // ✅ 包含图片关系
        },
      });

      // 获取同一城市的其他景点作为候选（最多50个，包含图片）
      const candidateSpots = await prisma.spot.findMany({
        where: {
          city: trip.destination,
          id: { notIn: allSpotIds }, // 排除行程中的景点
        },
        include: {
          image: true, // ✅ 包含图片关系
        },
        take: 50,
      });

      // 合并所有景点（行程景点 + 候选景点）
      const allSpots = [...itinerarySpots, ...candidateSpots];

      // 获取IoT数据
      const allSpotIdsForIoT = allSpots.map((s) => s.id);
      const iotDataMap = await spotService.getBatchIoTData(allSpotIdsForIoT);

      // 构造评分景点列表
      const scoredSpots = allSpots.map((spot) => ({
        spot,
        spotId: spot.id,
        totalScore: (spot.rating || 0) * 20, // 简单评分
        iotData: iotDataMap.get(spot.id),
      }));

      // 构造选中景点列表
      const selectedSpots = trip.days.flatMap((day) =>
        day.itineraryItems.map((item) => ({
          spotId: item.spotId,
          spot: itinerarySpots.find((s) => s.id === item.spotId),
        }))
      );

      console.log(`   行程景点数: ${itinerarySpots.length}`);
      console.log(`   候选景点数: ${candidateSpots.length}`);
      console.log(`   总景点数: ${allSpots.length}`);

      // 使用traditionalRecommender的generateAlternativePools方法
      alternativePools = traditionalRecommender().generateAlternativePools(
        scoredSpots,
        selectedSpots
      );

      console.log(`✅ 生成备选景点池: ${Object.keys(alternativePools).length} 个景点`);
    } catch (error) {
      console.error('⚠️  生成备选景点池失败:', error);
      // 失败时返回空的备选池
    }

    res.json({
      success: true,
      data: {
        ...trip,
        alternativePools, // 添加备选景点池
      },
    });
  } catch (error: any) {
    console.error('❌ 获取行程详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取行程详情失败',
    });
  }
};

/**
 * 删除行程
 * DELETE /api/trips/:id
 */
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tripId = Array.isArray(id) ? id[0] : id;
    const userId = (req as any).user?.userId;

    console.log(`📝 收到删除行程请求，ID: ${tripId}`);

    // 删除行程（级联删除相关的days和itineraryItems）
    await prisma.trip.delete({
      where: {
        id: tripId,
      },
    });

    console.log('✅ 行程删除成功');

    // 更新用户统计数据
    if (userId) {
      const { UserController } = await import('./userController');
      await UserController.updateUserStats(userId);
    }

    res.json({
      success: true,
      message: '行程删除成功',
    });
  } catch (error: any) {
    console.error('❌ 删除行程失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除行程失败',
    });
  }
};

/**
 * 保存行程（将前端生成的行程保存到数据库）
 * POST /api/trips
 */
export const saveTrip = async (req: Request, res: Response) => {
  try {
    console.log('📝 收到保存行程请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    const tripData = req.body;

    // 从认证中间件获取用户ID
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    // 验证必填字段
    if (!tripData.summary) {
      return res.status(400).json({
        success: false,
        error: '缺少行程摘要信息',
      });
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    const {
      summary,
      itinerary,
      total_cost,
      budget_breakdown,
      hotel,
      hotelRecommendations,
      restaurantRecommendations,
    } = tripData;
    const days = itinerary.itinerary.length;

    // 调试信息
    console.log('📝 接收到的数据:');
    console.log('  summary:', summary);
    console.log('  itinerary.itinerary.length:', itinerary.itinerary?.length);
    console.log('  hotel:', hotel);
    console.log('  hotelRecommendations:', hotelRecommendations);
    console.log('  restaurantRecommendations:', restaurantRecommendations);
    console.log('  restaurants:', tripData.restaurants);

    // 创建行程记录（包含酒店信息和推荐缓存）
    const trip = await prisma.trip.create({
      data: {
        userId,
        title:
          tripData.customization?.tripName ||
          `${summary.origin || '出发地'} → ${summary.destination} (${days}天)`,
        description:
          tripData.customization?.tripDescription ||
          `从${summary.origin || '出发地'}到${summary.destination}的${days}天行程`,
        coverImage: tripData.customization?.coverImage || '',
        destination: summary.destination,
        startDate: new Date(summary.start_date),
        endDate: new Date(summary.end_date),
        totalBudget: summary.budget || total_cost || 0,
        status: 'planning',
        aiGenerated: true,
        // 保存酒店信息
        hotelName: hotel?.name || null,
        hotelAddress: hotel?.address || null,
        hotelLocation: hotel?.location || null,
        hotelTel: hotel?.tel || null,
        hotelType: hotel?.type || null,
        hotelRating: hotel?.rating || null,
        // 保存酒店推荐缓存
        hotelRecommendationsCache: hotelRecommendations ? JSON.stringify(hotelRecommendations) : '',
      },
    });

    console.log(`✅ 行程记录已创建，ID: ${trip.id}`);

    // 创建预算记录
    await prisma.budget.create({
      data: {
        tripId: trip.id,
        // 初始化为0，表示还没有实际花费
        // budget_breakdown是预算分配，不是实际花费
        transportation: 0,
        accommodation: 0,
        food: 0,
        tickets: 0,
        shopping: 0,
        other: 0,
      },
    });

    console.log('✅ 预算记录已创建（初始值为0，表示尚未花费）');

    // 创建每天的行程记录
    for (const day of itinerary.itinerary) {
      // 获取该天的餐厅信息
      const dayRestaurant = tripData.restaurants?.find(
        (r: any) => r.day === day.day
      )?.selectedRestaurant;
      // 获取该天的餐厅推荐缓存
      const dayRestaurantRecommendations = restaurantRecommendations?.find(
        (r: any) => r.day === day.day
      )?.restaurants;

      console.log(`📝 第${day.day}天数据:`, {
        dayRestaurant,
        dayRestaurantRecommendations,
        restaurantRecommendations,
      });

      // 确保 dayRestaurantRecommendations 是数组
      const safeRestaurantRecommendations = Array.isArray(dayRestaurantRecommendations)
        ? dayRestaurantRecommendations
        : [];

      const dayRecord = await prisma.day.create({
        data: {
          tripId: trip.id,
          dayNumber: day.day,
          date: new Date(day.date),
          notes: '',
          // 保存餐厅信息
          restaurantName: dayRestaurant?.name || null,
          restaurantAddress: dayRestaurant?.address || null,
          restaurantLocation: dayRestaurant?.location || null,
          restaurantTel: dayRestaurant?.tel || null,
          restaurantType: dayRestaurant?.type || null,
          restaurantRating: dayRestaurant?.rating || null,
          // 保存餐厅推荐缓存
          restaurantRecommendationsCache:
            safeRestaurantRecommendations.length > 0
              ? JSON.stringify(safeRestaurantRecommendations)
              : '',
        },
      });

      console.log(`✅ 第${day.day}天记录已创建，ID: ${dayRecord.id}`);

      // 创建每天的景点记录
      for (const item of day.attractions) {
        // 解析时间字符串（例如 "09:00-12:00"）
        const [startTimeStr, endTimeStr] = item.time.split('-');
        const [startHour, startMin] = startTimeStr.split(':').map(Number);
        const [endHour, endMin] = endTimeStr.split(':').map(Number);

        // 创建日期对象
        const dayDate = new Date(day.date);
        const startTime = new Date(dayDate);
        startTime.setHours(startHour, startMin, 0, 0);
        const endTime = new Date(dayDate);
        endTime.setHours(endHour, endMin, 0, 0);

        // 解析经纬度
        let latitude = 0;
        let longitude = 0;
        if (item.location) {
          const [lng, lat] = item.location.split(',').map(Number);
          longitude = lng;
          latitude = lat;
        }

        // 优先使用传递过来的spotId（如果存在）
        let spotId: string | null = item.spotId || null;

        // 如果没有spotId，则查找
        if (!spotId) {
          spotId = await spotService.findSpotIdByNameAndCity(
            item.name,
            summary.destination,
            item.location
          );

          if (spotId) {
            console.log(`✅ 找到景点ID: ${item.name} -> ${spotId}`);
          } else {
            console.log(`⚠️  未找到景点ID: ${item.name}`);
          }
        } else {
          console.log(`✅ 使用传递的景点ID: ${item.name} -> ${spotId}`);
        }

        await prisma.itineraryItem.create({
          data: {
            dayId: dayRecord.id,
            name: item.name,
            type: item.type || '景点',
            category: item.description || '',
            description: item.description || '',
            startTime,
            endTime,
            address: item.address || '',
            latitude,
            longitude,
            cost: item.estimated_cost || 0,
            spotId: spotId, // 保存spotId
          },
        });
      }

      console.log(`✅ 第${day.day}天的${day.attractions.length}个景点记录已创建`);
    }

    console.log('✅ 行程数据已保存到数据库');

    // 计算实际预算
    console.log('💰 开始计算实际预算...');

    // 收集所有景点的费用
    const allSpots = itinerary.itinerary.flatMap((day: any) =>
      day.attractions.map((attr: any) => ({
        estimated_cost: attr.estimated_cost || 0,
      }))
    );

    // 计算实际预算
    const budgetInfo = budgetCalculator.calculateActualBudget({
      totalBudget: summary.budget || total_cost || 0,
      days: days,
      groupSize: 1, // 默认为1人
      selectedHotel: hotel || null,
      selectedRestaurants:
        tripData.restaurants?.reduce((acc: any, r: any) => {
          if (r.selectedRestaurant) {
            acc[r.day] = r.selectedRestaurant;
          }
          return acc;
        }, {}) || {},
      itinerarySpots: allSpots,
    });

    console.log(`✅ 实际预算计算完成: ¥${budgetInfo.total}`);

    // 更新行程记录，添加实际预算和状态
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        actualBudget: budgetInfo.total,
        budgetStatus: budgetInfo.status,
      },
    });

    // 更新预算记录
    await prisma.budget.update({
      where: { tripId: trip.id },
      data: {
        transportation: budgetInfo.transportation,
        accommodation: budgetInfo.accommodation,
        food: budgetInfo.dining,
        tickets: budgetInfo.tickets,
      },
    });

    console.log('✅ 预算信息已更新');

    // 更新用户统计数据
    const { UserController } = await import('./userController');
    await UserController.updateUserStats(userId);

    res.json({
      success: true,
      message: '行程保存成功',
      data: {
        tripId: trip.id,
        trip: trip, // 返回完整的trip对象，包含coverImage
        budgetInfo: {
          actualBudget: budgetInfo.total,
          budgetStatus: budgetInfo.status,
          breakdown: {
            accommodation: budgetInfo.accommodation,
            dining: budgetInfo.dining,
            transportation: budgetInfo.transportation,
            tickets: budgetInfo.tickets,
          },
        },
      },
    });
  } catch (error: any) {
    console.error('❌ 保存行程失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '保存行程失败',
    });
  }
};

/**
 * 更新行程的酒店信息
 * PUT /api/trips/:id/hotel
 */
export const updateTripHotel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tripId = Array.isArray(id) ? id[0] : id;
    const hotel = req.body;

    console.log(`🏨 收到更新酒店请求，行程ID: ${tripId}`);
    console.log('酒店信息:', JSON.stringify(hotel, null, 2));

    // 检查行程是否存在
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: '行程不存在',
      });
    }

    // 更新酒店信息
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        hotelName: hotel?.name || null,
        hotelAddress: hotel?.address || null,
        hotelLocation: hotel?.location || null,
        hotelTel: hotel?.tel || null,
        hotelType: hotel?.type || null,
        hotelRating: hotel?.rating || null,
        updatedAt: new Date(),
      },
    });

    console.log('✅ 酒店信息更新成功');

    res.json({
      success: true,
      message: '酒店信息更新成功',
      data: updatedTrip,
    });
  } catch (error: any) {
    console.error('❌ 更新酒店信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '更新酒店信息失败',
    });
  }
};

/**
 * 计算实时预算（基于当前选择）
 * POST /api/trips/calculate-budget
 */
export const calculateRealTimeBudget = async (req: Request, res: Response) => {
  try {
    console.log('💰 收到实时预算计算请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    const { totalBudget, days, groupSize, hotel, restaurants, spots } = req.body;

    // 验证必填字段
    if (!totalBudget || typeof totalBudget !== 'number') {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：totalBudget（数字）',
      });
    }

    if (!days || typeof days !== 'number') {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：days（数字）',
      });
    }

    // 计算实际预算
    const budgetInfo = budgetCalculator.calculateActualBudget({
      totalBudget,
      days,
      groupSize: groupSize || 1,
      selectedHotel: hotel || null,
      selectedRestaurants: restaurants || {},
      itinerarySpots: spots || [],
    });

    // 获取预警信息
    const warningLevel = budgetCalculator.getWarningLevel(budgetInfo);
    const warningMessage = budgetCalculator.getWarningMessage(budgetInfo);

    console.log('✅ 实时预算计算完成');

    res.json({
      success: true,
      data: {
        ...budgetInfo,
        warningLevel,
        warningMessage,
      },
    });
  } catch (error: any) {
    console.error('❌ 计算实时预算失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '计算实时预算失败',
    });
  }
};

/**
 * 更新某一天的餐厅信息
 * PUT /api/trips/:tripId/days/:dayNumber/restaurant
 */
export const updateDayRestaurant = async (req: Request, res: Response) => {
  try {
    const { tripId, dayNumber } = req.params;
    const restaurant = req.body;

    // 确保参数是字符串类型
    const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;
    const dayNumberStr = Array.isArray(dayNumber) ? dayNumber[0] : dayNumber;

    console.log(`🍽️ 收到更新餐厅请求，行程ID: ${tripIdStr}, 天数: ${dayNumberStr}`);
    console.log('餐厅信息:', JSON.stringify(restaurant, null, 2));

    // 查找对应的Day记录
    const day = await prisma.day.findFirst({
      where: {
        tripId: tripIdStr,
        dayNumber: parseInt(dayNumberStr),
      },
    });

    if (!day) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的行程天数记录',
      });
    }

    // 更新餐厅信息
    const updatedDay = await prisma.day.update({
      where: { id: day.id },
      data: {
        restaurantName: restaurant?.name || null,
        restaurantAddress: restaurant?.address || null,
        restaurantLocation: restaurant?.location || null,
        restaurantTel: restaurant?.tel || null,
        restaurantType: restaurant?.type || null,
        restaurantRating: restaurant?.rating || null,
        updatedAt: new Date(),
      },
    });

    console.log('✅ 餐厅信息更新成功');

    res.json({
      success: true,
      message: '餐厅信息更新成功',
      data: updatedDay,
    });
  } catch (error: any) {
    console.error('❌ 更新餐厅信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新餐厅信息失败',
    });
  }
};

/**
 * 完成行程
 * PUT /api/trips/:tripId/complete
 */
export const completeTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;

    // 从认证中间件获取用户ID
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权，请先登录',
      });
    }

    console.log(`✅ 收到完成行程请求，行程ID: ${tripIdStr}, 用户ID: ${userId}`);

    // 查找行程
    const trip = await prisma.trip.findUnique({
      where: { id: tripIdStr },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: '行程不存在',
      });
    }

    console.log(`📋 行程信息: trip.userId=${trip.userId}, 当前用户=${userId}`);

    // 验证行程属于当前用户
    if (trip.userId !== userId) {
      console.log(`❌ 权限验证失败: 行程属于用户 ${trip.userId}，但当前用户是 ${userId}`);
      return res.status(403).json({
        success: false,
        message: '您没有权限完成此行程',
      });
    }

    // 验证行程状态
    if (trip.status !== 'planning') {
      return res.status(400).json({
        success: false,
        message: '行程已完成，不可重复操作',
      });
    }

    // 更新行程状态
    const updatedTrip = await prisma.trip.update({
      where: { id: tripIdStr },
      data: {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ 行程已完成');

    res.json({
      success: true,
      message: '行程已完成',
      data: {
        id: updatedTrip.id,
        status: updatedTrip.status,
        completedAt: updatedTrip.completedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ 完成行程失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '完成行程失败',
    });
  }
};
