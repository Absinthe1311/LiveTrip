// 用户画像服务 - 从数据库中提取用户信息，为AI提供上下文
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

export interface UserProfile {
  userId?: string;
  visitedDestinations: string[];
  preferences: string[];
  averageBudgetRange: string;
  recentTrip?: {
    destination: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
  };
  pendingTrips: Array<{
    destination: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  tripCount: number;
  completedTripCount: number;
}

class UserProfileService {
  /**
   * 获取用户画像
   * @param userId 用户ID
   * @returns 用户画像信息
   */
  async getUserProfile(userId?: string): Promise<UserProfile> {
    console.log(`👤 开始构建用户画像...`);

    try {
      // 如果没有 userId，使用默认用户
      let targetUserId = userId;
      if (!targetUserId) {
        const defaultUser = await prisma.user.findFirst({
          where: { username: 'default_user' },
        });

        if (defaultUser) {
          targetUserId = defaultUser.id;
        } else {
          // 返回空画像
          return this.getEmptyProfile();
        }
      }

      // 并行查询多个数据源
      const trips = await prisma.trip.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 20, // 最多取最近20个行程
        select: {
          destination: true,
          startDate: true,
          endDate: true,
          status: true,
          totalBudget: true,
          actualBudget: true,
        },
      });

      // 提取访问过的目的地
      const visitedDestinations = Array.from(new Set(trips.map((trip: any) => trip.destination)));

      // 提取用户偏好（暂时返回空数组）
      const preferences: string[] = [];

      // 计算平均预算范围
      const budgetRange = this.calculateBudgetRange(trips);

      // 获取最近的行程
      const recentTrip = trips.find((trip) => trip.status === 'completed') || trips[0];

      // 获取未完成的行程
      const pendingTrips = trips
        .filter((trip) => trip.status !== 'completed')
        .map((trip) => ({
          destination: trip.destination,
          startDate: trip.startDate.toISOString().split('T')[0],
          endDate: trip.endDate.toISOString().split('T')[0],
          status: trip.status,
        }));

      const tripCount = trips.length;
      const completedTripCount = trips.filter((trip) => trip.status === 'completed').length;

      const profile: UserProfile = {
        userId: targetUserId,
        visitedDestinations,
        preferences,
        averageBudgetRange: budgetRange,
        recentTrip: recentTrip
          ? {
              destination: recentTrip.destination,
              startDate: recentTrip.startDate.toISOString().split('T')[0],
              endDate: recentTrip.endDate.toISOString().split('T')[0],
              days:
                Math.ceil(
                  (recentTrip.endDate.getTime() - recentTrip.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1,
              status: recentTrip.status,
            }
          : undefined,
        pendingTrips,
        tripCount,
        completedTripCount,
      };

      return profile;
    } catch (error: any) {
      console.error('❌ 构建用户画像失败:', error);
      return this.getEmptyProfile();
    }
  }

  /**
   * 获取目的地上下文信息
   * @param city 城市名称
   * @returns 目的地热门景点信息
   */
  async getDestinationContext(city: string): Promise<string> {
    try {
      console.log(`🏙️  获取目的地上下文: ${city}`);

      // 查询该城市的热门景点
      const topSpots = await prisma.spot.findMany({
        where: { city },
        orderBy: [{ isHot: 'desc' }, { rating: 'desc' }],
        take: 10,
        select: {
          name: true,
          category: true,
          rating: true,
        },
      });

      if (topSpots.length === 0) {
        return '';
      }

      // 构建上下文信息
      const context = `【${city}热门景点】\n${topSpots
        .map(
          (spot, index) =>
            `${index + 1}. ${spot.name} (${spot.category || '景点'}, 评分: ${spot.rating || 'N/A'})`
        )
        .join('\n')}`;

      console.log(`✅ 目的地上下文获取完成，${topSpots.length} 个热门景点`);

      return context;
    } catch (error: any) {
      console.error('❌ 获取目的地上下文失败:', error);
      return '';
    }
  }

  /**
   * 将用户画像格式化为系统提示词
   * @param profile 用户画像
   * @returns 格式化的提示词
   */
  formatProfileAsPrompt(profile: UserProfile): string {
    if (profile.tripCount === 0) {
      return '【用户背景信息】\n- 新用户，暂无历史行程数据';
    }

    const lines: string[] = ['【用户背景信息】'];

    if (profile.visitedDestinations.length > 0) {
      lines.push(`- 曾去过的城市：${profile.visitedDestinations.join(', ')}`);
    }

    if (profile.preferences.length > 0) {
      lines.push(`- 偏好标签：${profile.preferences.join(', ')}`);
    }

    if (profile.averageBudgetRange) {
      lines.push(`- 平均预算范围：${profile.averageBudgetRange}`);
    }

    if (profile.recentTrip) {
      lines.push(
        `- 最近一次行程：${profile.recentTrip.destination} ${profile.recentTrip.days}日游（${profile.recentTrip.status === 'completed' ? '已完成' : '进行中'}）`
      );
    }

    if (profile.pendingTrips.length > 0) {
      lines.push(`- 未完成的行程：${profile.pendingTrips.map((t) => t.destination).join(', ')}`);
    }

    lines.push(`- 总行程数：${profile.tripCount}（已完成：${profile.completedTripCount}）`);

    return lines.join('\n');
  }

  /**
   * 提取用户偏好
   */
  private extractPreferences(userPreferences: any): string[] {
    const preferences: string[] = [];

    if (!userPreferences) {
      return preferences;
    }

    // 从 travelStyle 提取偏好
    if (userPreferences.travelStyle) {
      preferences.push(userPreferences.travelStyle);
    }

    // 从 dietaryPrefs 提取偏好
    if (userPreferences.dietaryPrefs) {
      preferences.push(userPreferences.dietaryPrefs);
    }

    return preferences;
  }

  /**
   * 计算平均预算范围
   */
  private calculateBudgetRange(trips: any[]): string {
    const budgets = trips
      .map((trip) => trip.actualBudget || trip.totalBudget)
      .filter((budget) => budget > 0);

    if (budgets.length === 0) {
      return '未知';
    }

    const avgBudget = budgets.reduce((sum, b) => sum + b, 0) / budgets.length;

    if (avgBudget < 3000) {
      return '经济型（<3000元）';
    } else if (avgBudget < 8000) {
      return '中档型（3000-8000元）';
    } else {
      return '豪华型（>8000元）';
    }
  }

  /**
   * 获取空画像
   */
  private getEmptyProfile(): UserProfile {
    return {
      visitedDestinations: [],
      preferences: [],
      averageBudgetRange: '未知',
      pendingTrips: [],
      tripCount: 0,
      completedTripCount: 0,
    };
  }
}

// 导出单例
export const userProfileService = new UserProfileService();
