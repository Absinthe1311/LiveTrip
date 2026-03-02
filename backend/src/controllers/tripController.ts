// 行程管理控制器 - 处理行程的增删改查
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取用户的所有行程
 * GET /api/trips
 */
export const getUserTrips = async (req: Request, res: Response) => {
  try {
    console.log('📝 收到获取行程列表请求');

    // 获取当前用户（从请求头或默认用户）
    const userIdHeader = req.headers['x-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : (userIdHeader || 'default-user');

    console.log(`👤 用户ID: ${userId}`);

    // 获取用户的所有行程
    const trips = await prisma.trip.findMany({
      where: {
        userId,
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

    res.json({
      success: true,
      data: trip,
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

    console.log(`📝 收到删除行程请求，ID: ${tripId}`);

    // 删除行程（级联删除相关的days和itineraryItems）
    await prisma.trip.delete({
      where: {
        id: tripId,
      },
    });

    console.log('✅ 行程删除成功');

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

    // 获取当前用户（从请求头或默认用户）
    const userId = req.headers['x-user-id'] as string || 'default-user';

    // 验证必填字段
    if (!tripData.summary) {
      return res.status(400).json({
        success: false,
        error: '缺少行程摘要信息',
      });
    }

    // 确保用户存在，如果不存在则创建
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log('👤 用户不存在，创建默认用户');
      user = await prisma.user.create({
        data: {
          id: userId,
          username: userId === 'default-user' ? '默认用户' : userId,
          passwordHash: 'default', // 实际应用中应该使用加密密码
        },
      });
      console.log(`✅ 用户创建成功，ID: ${user.id}`);
    }

    const { summary, itinerary, total_cost, budget_breakdown, hotel } = tripData;
    const days = itinerary.itinerary.length;

    // 创建行程记录（包含酒店信息）
    const trip = await prisma.trip.create({
      data: {
        userId,
        title: `${summary.origin || '出发地'} → ${summary.destination} (${days}天)`,
        description: `从${summary.origin || '出发地'}到${summary.destination}的${days}天行程`,
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
      },
    });

    console.log(`✅ 行程记录已创建，ID: ${trip.id}`);

    // 创建预算记录
    await prisma.budget.create({
      data: {
        tripId: trip.id,
        transportation: budget_breakdown?.transportation || 0,
        accommodation: budget_breakdown?.accommodation || 0,
        food: budget_breakdown?.dining || 0,
        tickets: budget_breakdown?.tickets || 0,
        shopping: 0,
        other: 0,
      },
    });

    console.log('✅ 预算记录已创建');

    // 创建每天的行程记录
    for (const day of itinerary.itinerary) {
      const dayRecord = await prisma.day.create({
        data: {
          tripId: trip.id,
          dayNumber: day.day,
          date: new Date(day.date),
          notes: '',
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
          },
        });
      }

      console.log(`✅ 第${day.day}天的${day.attractions.length}个景点记录已创建`);
    }

    console.log('✅ 行程数据已保存到数据库');

    res.json({
      success: true,
      message: '行程保存成功',
      data: {
        tripId: trip.id,
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
