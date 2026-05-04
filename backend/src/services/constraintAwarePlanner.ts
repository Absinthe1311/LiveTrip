// 约束感知行程规划服务 - 支持必选景点和地理合理性校验
import { getPrismaClient } from '../lib/prisma';
import { spotService } from './spotService';
import { traditionalRecommender } from './traditionalRecommender';
import { MustVisitSpot } from './mustVisitSpotExtractor';
import { parseDate, formatDate } from '../utils/dateParser';

const prisma = getPrismaClient();
const recommender = traditionalRecommender();

export interface ConstraintAwarePlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  groupSize?: number;
  groupType?: string;
  hasChildren?: boolean;
  hasElderly?: boolean;
  preferences?: string;
  pace?: string;
  energy_level?: string;
  mustVisitSpots?: MustVisitSpot[]; // 必选景点列表
}

export interface ConstraintAwarePlanResult {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  budget: number;
  status: string;
  message: string;
  mustVisitSpotsCount: number;
  recommendedSpotsCount: number;
}

class ConstraintAwarePlanner {
  /**
   * 创建约束感知的行程（带必选景点）
   */
  async createTripWithConstraints(
    request: ConstraintAwarePlanRequest,
    userId?: string
  ): Promise<ConstraintAwarePlanResult> {
    console.log('\n🎯 开始创建约束感知行程...');
    console.log(`   目的地: ${request.destination}`);
    console.log(`   必选景点数: ${request.mustVisitSpots?.length || 0}`);

    try {
      // 验证必填参数
      if (!request.destination || !request.startDate || !request.endDate) {
        throw new Error('缺少必填参数：destination、startDate、endDate');
      }

      // 解析日期
      const startDate = parseDate(request.startDate);
      const endDate = parseDate(request.endDate);

      if (startDate >= endDate) {
        throw new Error('开始日期必须早于结束日期');
      }

      // 计算天数
      const daysDiff =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (daysDiff > 30) {
        throw new Error('行程天数不能超过 30 天');
      }

      // 获取或创建用户
      let tripUserId = userId;
      if (!tripUserId) {
        // 如果没有userId，尝试从header中获取
        console.warn('⚠️  未提供userId，行程将无法被用户看到');
        // 如果没有userId，创建默认用户（仅用于测试）
        const defaultUser = await prisma.user.findFirst({
          where: { username: 'default_user' },
        });

        if (defaultUser) {
          tripUserId = defaultUser.id;
          console.log(`⚠️  使用默认用户ID: ${tripUserId}（注意：此行程可能无法在用户界面显示）`);
        } else {
          // 创建默认用户
          const createdUser = await prisma.user.create({
            data: {
              username: 'default_user',
              email: 'default_user@example.com',
              passwordHash: 'default', // 实际使用中应该使用加密的密码
              role: 'user',
            },
          });
          tripUserId = createdUser.id;
          console.log(`⚠️  创建默认用户，ID: ${tripUserId}（注意：此行程可能无法在用户界面显示）`);
        }
      } else {
        console.log(`✅ 使用登录用户ID: ${tripUserId}`);
      }

      // 创建行程基础信息
      const trip = await prisma.trip.create({
        data: {
          userId: tripUserId,
          title: `${request.destination}之旅`,
          description: request.preferences || '',
          destination: request.destination,
          startDate: startDate,
          endDate: endDate,
          status: 'planning',
          totalBudget: request.budget || 0,
          aiGenerated: true,
        },
      });

      console.log(`✅ 行程基础信息创建成功，ID: ${trip.id}`);

      // 步骤1：处理必选景点（约束预处理）
      const mustVisitCount = await this.processMustVisitSpots(
        trip.id,
        startDate,
        daysDiff,
        request.mustVisitSpots || []
      );

      console.log(`✅ 必选景点处理完成，共 ${mustVisitCount} 个`);

      // 步骤2：获取剩余需要填充的景点数量
      const totalSpotsNeeded = this.calculateTotalSpotsNeeded(daysDiff, request.pace);
      const remainingSpots = totalSpotsNeeded - mustVisitCount;

      console.log(`   总共需要 ${totalSpotsNeeded} 个景点，还需填充 ${remainingSpots} 个`);

      // 步骤3：调用推荐算法填充剩余景点
      if (remainingSpots > 0) {
        await this.fillRemainingSpots(
          trip.id,
          request,
          startDate,
          daysDiff,
          remainingSpots,
          request.mustVisitSpots || []
        );
      }

      console.log(`✅ 行程创建完成，ID: ${trip.id}`);

      return {
        tripId: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: formatDate(trip.startDate),
        endDate: formatDate(trip.endDate),
        days: daysDiff,
        budget: trip.totalBudget,
        status: trip.status,
        message: `行程创建成功！包含 ${mustVisitCount} 个必选景点，${remainingSpots} 个推荐景点。您可以在行程详情中查看和编辑。`,
        mustVisitSpotsCount: mustVisitCount,
        recommendedSpotsCount: remainingSpots,
      };
    } catch (error: any) {
      console.error('❌ 创建约束感知行程失败:', error);
      throw error;
    }
  }

  /**
   * 处理必选景点（约束预处理）
   */
  private async processMustVisitSpots(
    tripId: string,
    startDate: Date,
    daysDiff: number,
    mustVisitSpots: MustVisitSpot[]
  ): Promise<number> {
    if (mustVisitSpots.length === 0) {
      return 0;
    }

    console.log('\n📍 开始处理必选景点...');

    // 创建每天的行程记录
    const dayRecords = [];
    for (let i = 0; i < daysDiff; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);

      const dayRecord = await prisma.day.create({
        data: {
          tripId: tripId,
          dayNumber: i + 1,
          date: dayDate,
          notes: '',
        },
      });

      dayRecords.push(dayRecord);
    }

    // 将必选景点分配到行程中
    // 策略：前两天优先安排必选景点，每天上午安排
    let processedCount = 0;

    for (let i = 0; i < Math.min(mustVisitSpots.length, daysDiff * 2); i++) {
      const spot = mustVisitSpots[i];
      const dayIndex = Math.floor(i / 2); // 每天最多2个必选景点
      const dayRecord = dayRecords[dayIndex];

      if (dayRecord) {
        // 解析经纬度
        const [longitude, latitude] = spot.location
          .split(',')
          .map((coord) => parseFloat(coord.trim()));

        // 创建行程项目
        await prisma.itineraryItem.create({
          data: {
            dayId: dayRecord.id,
            name: spot.name,
            type: 'attraction',
            category: spot.category || '',
            description: spot.description || '',
            startTime: new Date(`${formatDate(dayRecord.date)} ${i % 2 === 0 ? '09:00' : '14:00'}`),
            endTime: new Date(`${formatDate(dayRecord.date)} ${i % 2 === 0 ? '12:00' : '17:00'}`),
            address: spot.address || '',
            latitude: latitude || null,
            longitude: longitude || null,
            cost: spot.ticketPrice || 0,
            spotId: spot.id,
          },
        });

        processedCount++;
        console.log(`   ✅ 安排必选景点: "${spot.name}" (第${dayIndex + 1}天)`);
      }
    }

    return processedCount;
  }

  /**
   * 计算总共需要的景点数量
   */
  private calculateTotalSpotsNeeded(days: number, pace?: string): number {
    const paceMap: Record<string, number> = {
      slow: 2,
      moderate: 3,
      fast: 4,
    };

    const spotsPerDay = paceMap[pace || 'moderate'] || 3;
    return days * spotsPerDay;
  }

  /**
   * 填充剩余景点（调用推荐算法）
   */
  private async fillRemainingSpots(
    tripId: string,
    request: ConstraintAwarePlanRequest,
    startDate: Date,
    daysDiff: number,
    remainingSpots: number,
    mustVisitSpots: MustVisitSpot[]
  ): Promise<void> {
    console.log('\n🎯 开始填充剩余景点...');

    try {
      // 获取城市景点数据
      const attractions = await spotService.citySpots(request.destination, 50);

      if (attractions.length === 0) {
        console.warn(`⚠️  未找到 ${request.destination} 的景点数据`);
        return;
      }

      console.log(`✅ 获取到 ${attractions.length} 个候选景点`);

      // 过滤掉必选景点
      const mustVisitIds = mustVisitSpots.map((s) => s.id);
      const filteredAttractions = attractions.filter(
        (attr: any) => !mustVisitIds.includes(attr.id)
      );

      console.log(`✅ 过滤后剩余 ${filteredAttractions.length} 个候选景点`);

      // 构建推荐请求
      const recommendRequest = {
        origin: '',
        destination: request.destination,
        startDate: formatDate(startDate),
        endDate: formatDate(new Date(startDate.getTime() + (daysDiff - 1) * 24 * 60 * 60 * 1000)),
        budget: request.budget || 5000,
        groupSize: request.groupSize || 1,
        groupType: request.groupType || 'solo',
        hasChildren: request.hasChildren || false,
        hasElderly: request.hasElderly || false,
        preferences: {
          pace: request.pace || 'moderate',
          energy_level: request.energy_level || 'medium',
          categories: this.parsePreferences(request.preferences),
        },
        days: daysDiff,
        attractions: filteredAttractions,
      };

      // 调用推荐算法
      const itinerary = await recommender.recommendItinerary(recommendRequest);

      console.log(`✅ 推荐算法执行完成，生成 ${itinerary.itinerary.length} 天行程`);

      // 将推荐结果填充到数据库（只填充前 remainingSpots 个）
      let filledCount = 0;

      for (const dayItinerary of itinerary.itinerary) {
        if (filledCount >= remainingSpots) break;

        // 查找对应的 Day 记录
        const dayRecord = await prisma.day.findFirst({
          where: {
            tripId: tripId,
            dayNumber: dayItinerary.day,
          },
        });

        if (dayRecord) {
          // 检查该天已有的景点数量
          const existingItems = await prisma.itineraryItem.count({
            where: { dayId: dayRecord.id },
          });

          const spotsToAdd = Math.min(
            dayItinerary.attractions.length,
            3 - existingItems // 每天最多3个景点
          );

          for (let i = 0; i < spotsToAdd && filledCount < remainingSpots; i++) {
            const attraction = dayItinerary.attractions[i];

            // 解析经纬度
            const [longitude, latitude] = attraction.location
              .split(',')
              .map((coord) => parseFloat(coord.trim()));

            await prisma.itineraryItem.create({
              data: {
                dayId: dayRecord.id,
                name: attraction.name,
                type: attraction.type || 'attraction',
                category: attraction.type || '',
                description: attraction.description || '',
                startTime: new Date(`${dayItinerary.date} ${attraction.time.split('-')[0]}`),
                endTime: new Date(`${dayItinerary.date} ${attraction.time.split('-')[1]}`),
                address: attraction.address || '',
                latitude: latitude || null,
                longitude: longitude || null,
                cost: attraction.estimated_cost || 0,
                spotId: attraction.spotId || attraction.id,
              },
            });

            filledCount++;
            console.log(`   ✅ 添加推荐景点: "${attraction.name}" (第${dayItinerary.day}天)`);
          }
        }
      }

      console.log(`✅ 剩余景点填充完成，共 ${filledCount} 个`);
    } catch (error: any) {
      console.error('❌ 填充剩余景点失败:', error);
      // 填充失败不影响行程创建，只是景点数量会少一些
    }
  }

  /**
   * 解析用户偏好字符串，转换为类别数组
   */
  private parsePreferences(preferences: string | undefined): string[] {
    if (!preferences) {
      return [];
    }

    const preferenceMap: Record<string, string> = {
      历史: 'history',
      文化: 'art',
      艺术: 'art',
      自然: 'nature',
      风景: 'nature',
      公园: 'nature',
      美食: 'food',
      购物: 'shopping',
      城市: 'city',
      海滩: 'beach',
      海岛: 'beach',
      冒险: 'adventure',
      主题乐园: 'theme_park',
      宗教: 'religious',
    };

    const categories: string[] = [];

    for (const [keyword, category] of Object.entries(preferenceMap)) {
      if (preferences.includes(keyword)) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['city', 'nature'];
  }
}

// 导出单例
export const constraintAwarePlanner = new ConstraintAwarePlanner();
