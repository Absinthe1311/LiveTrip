/**
 * 分享服务
 * 处理行程分享相关的业务逻辑
 *
 * AI辅助生成：GLM-5，2026年4月22日
 * 内容说明：在getPublicTrip函数返回的itineraryItems中添加spotId字段，
 *          使前端能够通过spotId获取景点图片
 */

import { getPrismaClient } from '../lib/prisma';
import { genToken } from '../utils/tokenGenerator';

const prisma = getPrismaClient();

/**
 * 生成分享链接
 * @param tripId 行程ID
 * @param userId 用户ID
 * @returns 分享链接信息
 */
export async function shareLink(tripId: string, userId: string) {

  // 1. 查询行程是否存在
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new Error('行程不存在');
  }

  // 2. 验证用户权限
  if (trip.userId !== userId) {
    throw new Error('无权限分享此行程');
  }

  // 3. 检查是否已有shareToken
  if (trip.shareToken && trip.isPublic) {
    return {
      shareToken: trip.shareToken,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/shared/${trip.shareToken}`,
      isPublic: true,
    };
  }

  // 4. 生成新的shareToken
  let shareToken = genToken();
  let attempts = 0;
  const maxAttempts = 3;

  // 确保token唯一
  while (attempts < maxAttempts) {
    const existingTrip = await prisma.trip.findUnique({
      where: { shareToken },
    });

    if (!existingTrip) {
      break;
    }

    shareToken = genToken();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('生成分享token失败,请稍后重试');
  }

  // 5. 更新数据库
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      isPublic: true,
      shareToken,
    },
  });


  return {
    shareToken,
    shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/shared/${shareToken}`,
    isPublic: true,
  };
}

/**
 * 获取公开行程
 * @param token 分享token
 * @returns 行程只读数据
 */
export async function publicTrip(token: string) {

  // 1. 根据token查询行程，添加超时保护
  const trip = (await Promise.race([
    prisma.trip.findUnique({
      where: { shareToken: token },
      include: {
        budget: true,
        days: {
          include: {
            itineraryItems: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('数据库查询超时')), 10000)),
  ])) as any;

  // 2. 验证行程是否存在
  if (!trip) {
    throw new Error('分享链接无效或行程不存在');
  }

  // 3. 验证行程是否公开
  if (!trip.isPublic) {
    throw new Error('该行程未公开分享');
  }


  // 4. 过滤敏感字段,返回只读数据
  const publicTrip = {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalBudget: trip.totalBudget,
    days: trip.days.map((day: any) => ({
      dayNumber: day.dayNumber,
      date: day.date,
      notes: day.notes,
      restaurantName: day.restaurantName,
      restaurantAddress: day.restaurantAddress,
      restaurantLocation: day.restaurantLocation,
      restaurantType: day.restaurantType,
      restaurantRating: day.restaurantRating,
      itineraryItems: day.itineraryItems.map((item: any) => ({
        spotId: item.spotId, // 添加spotId，用于获取景点图片
        name: item.name,
        type: item.type,
        category: item.category,
        description: item.description,
        startTime: item.startTime,
        endTime: item.endTime,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        cost: item.cost,
      })),
    })),
    budget: trip.budget
      ? {
          transportation: trip.budget.transportation,
          accommodation: trip.budget.accommodation,
          food: trip.budget.food,
          tickets: trip.budget.tickets,
          shopping: trip.budget.shopping,
          other: trip.budget.other,
        }
      : null,
    hotelName: trip.hotelName,
    hotelAddress: trip.hotelAddress,
    hotelLocation: trip.hotelLocation,
    hotelType: trip.hotelType,
    hotelRating: trip.hotelRating,
  };

  return publicTrip;
}

/**
 * 复刻公开行程
 * @param token 分享token
 * @param userId 当前用户ID
 * @returns 新行程ID
 */
export async function forkTrip(token: string, userId: string) {

  // 1. 获取原行程数据
  const originalTrip = await prisma.trip.findUnique({
    where: { shareToken: token },
    include: {
      budget: true,
      days: {
        include: {
          itineraryItems: true,
        },
      },
    },
  });

  // 2. 验证行程是否存在
  if (!originalTrip) {
    throw new Error('原行程不存在');
  }

  // 3. 验证行程是否公开
  if (!originalTrip.isPublic) {
    throw new Error('该行程未公开分享,无法复刻');
  }


  // 4. 使用事务创建新行程
  const newTrip = await prisma.$transaction(async (tx) => {
    // 创建新Trip记录
    const trip = await tx.trip.create({
      data: {
        userId,
        title: `${originalTrip.title} (复刻)`,
        description: originalTrip.description,
        destination: originalTrip.destination,
        startDate: originalTrip.startDate,
        endDate: originalTrip.endDate,
        status: 'planning',
        totalBudget: originalTrip.totalBudget,
        aiGenerated: false, // 标记为非AI生成
        hotelName: originalTrip.hotelName,
        hotelAddress: originalTrip.hotelAddress,
        hotelLocation: originalTrip.hotelLocation,
        hotelType: originalTrip.hotelType,
        hotelRating: originalTrip.hotelRating,
        isPublic: false, // 复刻的行程默认不公开
      },
    });

    // 复制预算数据
    if (originalTrip.budget) {
      await tx.budget.create({
        data: {
          tripId: trip.id,
          transportation: originalTrip.budget.transportation,
          accommodation: originalTrip.budget.accommodation,
          food: originalTrip.budget.food,
          tickets: originalTrip.budget.tickets,
          shopping: originalTrip.budget.shopping,
          other: originalTrip.budget.other,
        },
      });
    }

    // 复制每一天的行程
    for (const day of originalTrip.days) {
      const newDay = await tx.day.create({
        data: {
          tripId: trip.id,
          dayNumber: day.dayNumber,
          date: day.date,
          notes: day.notes,
          restaurantName: day.restaurantName,
          restaurantAddress: day.restaurantAddress,
          restaurantLocation: day.restaurantLocation,
          restaurantType: day.restaurantType,
          restaurantRating: day.restaurantRating,
        },
      });

      // 复制该天的所有景点
      for (const item of day.itineraryItems) {
        await tx.itineraryItem.create({
          data: {
            dayId: newDay.id,
            name: item.name,
            type: item.type,
            category: item.category,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
            cost: item.cost,
          },
        });
      }
    }

    return trip;
  });


  return {
    tripId: newTrip.id,
    message: '行程复刻成功',
  };
}
