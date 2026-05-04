/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：服务层重构
 */

// 预算优化服务 - 动态计算和优化预算分配
import { DailyItinerary, RecommendedAttraction, GroupType } from '../types';

// 城市等级配置（住宿和餐饮基准价格）
const CITY_TIER_CONFIG = {
  tier1: {
    // 一线城市：北京、上海、广州、深圳
    accommodation_per_room: { budget: 300, moderate: 500, luxury: 800 },
    dining_per_person: { budget: 100, moderate: 150, luxury: 250 },
    transportation_per_km: 3,
  },
  tier2: {
    // 二线城市：杭州、南京、成都、武汉、西安等
    accommodation_per_room: { budget: 200, moderate: 350, luxury: 600 },
    dining_per_person: { budget: 80, moderate: 120, luxury: 200 },
    transportation_per_km: 2.5,
  },
  tier3: {
    // 三线城市：其他城市
    accommodation_per_room: { budget: 150, moderate: 250, luxury: 400 },
    dining_per_person: { budget: 60, moderate: 100, luxury: 150 },
    transportation_per_km: 2,
  },
};

// 季节性价格系数
const SEASONAL_MULTIPLIERS = {
  peak: {
    // 旺季（春节、国庆、暑假）
    accommodation: 1.5,
    dining: 1.2,
    tickets: 1.0,
  },
  shoulder: {
    // 平季（其他节假日）
    accommodation: 1.2,
    dining: 1.1,
    tickets: 1.0,
  },
  off: {
    // 淡季
    accommodation: 0.8,
    dining: 0.9,
    tickets: 0.9,
  },
};

// 群体类型调整系数
const GROUP_TYPE_MULTIPLIERS: Record<string, { dining: number; accommodation: number }> = {
  solo: { dining: 1.0, accommodation: 1.0 },
  couple: { dining: 1.2, accommodation: 1.1 },
  family: { dining: 1.5, accommodation: 1.3 },
  friends: { dining: 1.3, accommodation: 1.2 },
};

interface BudgetCalculationParams {
  itinerary: DailyItinerary[];
  totalBudget: number;
  days: number;
  groupSize: number;
  groupType: GroupType;
  destination: string;
  startDate: string;
  endDate: string;
}

interface BudgetResult {
  total_cost: number;
  budget_breakdown: {
    transportation: number;
    accommodation: number;
    dining: number;
    tickets: number;
  };
  budget_utilization: number; // 预算利用率
  recommendations: string[]; // 预算优化建议
}

class BudgetOptimizer {
  /**
   * 动态计算预算分配
   */
  async calculateBudget(params: BudgetCalculationParams): Promise<BudgetResult> {
    const { itinerary, totalBudget, days, groupSize, groupType, destination, startDate, endDate } =
      params;

    console.log('\n💰 开始动态计算预算分配...');
    console.log(`   总预算: ${totalBudget}元`);
    console.log(`   天数: ${days}天`);
    console.log(`   人数: ${groupSize}人`);
    console.log(`   目的地: ${destination}`);

    // 1. 确定城市等级
    const cityTier = this.getCityTier(destination);
    console.log(`   城市等级: ${cityTier}`);

    // 2. 确定季节
    const season = this.getSeason(startDate, endDate);
    console.log(`   旅游季节: ${season}`);

    // 3. 确定预算档次
    const budgetTier = this.getBudgetTier(totalBudget, days, groupSize);
    console.log(`   预算档次: ${budgetTier}`);

    // 4. 计算门票费用（实际费用）
    const tickets = this.calculateTickets(itinerary);
    console.log(`   门票费用: ${tickets}元`);

    // 5. 计算住宿费用（动态）
    const accommodation = this.calculateAccommodation(
      days,
      groupSize,
      cityTier,
      budgetTier,
      season,
      groupType
    );
    console.log(`   住宿费用: ${accommodation}元`);

    // 6. 计算餐饮费用（动态）
    const dining = this.calculateDining(days, groupSize, cityTier, budgetTier, season, groupType);
    console.log(`   餐饮费用: ${dining}元`);

    // 7. 计算交通费用（动态）
    const transportation = this.calculateTransportation(
      itinerary,
      cityTier,
      totalBudget - tickets - accommodation - dining
    );
    console.log(`   交通费用: ${transportation}元`);

    // 8. 计算总费用
    const total_cost = tickets + accommodation + dining + transportation;

    // 9. 计算预算利用率
    const budget_utilization = (total_cost / totalBudget) * 100;

    // 10. 生成优化建议
    const recommendations = this.generateRecommendations(
      { tickets, accommodation, dining, transportation },
      totalBudget,
      budget_utilization
    );

    console.log(`\n   总费用: ${total_cost}元`);
    console.log(`   预算利用率: ${budget_utilization.toFixed(1)}%\n`);

    return {
      total_cost,
      budget_breakdown: {
        transportation: Math.round(transportation),
        accommodation: Math.round(accommodation),
        dining: Math.round(dining),
        tickets: Math.round(tickets),
      },
      budget_utilization: Math.round(budget_utilization * 10) / 10,
      recommendations,
    };
  }

  /**
   * 获取城市等级
   */
  private getCityTier(destination: string): 'tier1' | 'tier2' | 'tier3' {
    const tier1Cities = ['北京', '上海', '广州', '深圳'];
    const tier2Cities = [
      '杭州',
      '南京',
      '成都',
      '武汉',
      '西安',
      '重庆',
      '天津',
      '苏州',
      '长沙',
      '郑州',
    ];

    if (tier1Cities.some((city) => destination.includes(city))) {
      return 'tier1';
    } else if (tier2Cities.some((city) => destination.includes(city))) {
      return 'tier2';
    } else {
      return 'tier3';
    }
  }

  /**
   * 获取旅游季节
   */
  private getSeason(startDate: string, endDate: string): 'peak' | 'shoulder' | 'off' {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 获取月份
    const months: number[] = [];
    const current = new Date(start);
    while (current <= end) {
      months.push(current.getMonth());
      current.setDate(current.getDate() + 1);
    }

    // 旺季：7-8月（暑假）、1-2月（春节）、4-5月（清明、五一）、10月（国庆）
    const peakMonths = [0, 1, 6, 7, 9];
    // 平季：3-4月、5-6月、9月、11-12月
    const shoulderMonths = [2, 3, 4, 5, 8, 10, 11];

    // 检查是否包含旺季月份
    if (months.some((m) => peakMonths.includes(m))) {
      return 'peak';
    }
    // 检查是否包含平季月份
    else if (months.some((m) => shoulderMonths.includes(m))) {
      return 'shoulder';
    }
    // 淡季
    else {
      return 'off';
    }
  }

  /**
   * 获取预算档次
   */
  private getBudgetTier(
    totalBudget: number,
    days: number,
    groupSize: number
  ): 'budget' | 'moderate' | 'luxury' {
    const budgetPerPersonPerDay = totalBudget / (days * groupSize);

    if (budgetPerPersonPerDay < 300) {
      return 'budget'; // 经济型
    } else if (budgetPerPersonPerDay < 600) {
      return 'moderate'; // 舒适型
    } else {
      return 'luxury'; // 豪华型
    }
  }

  /**
   * 计算门票费用
   */
  private calculateTickets(itinerary: DailyItinerary[]): number {
    return itinerary.reduce((sum, day) => {
      return sum + day.attractions.reduce((daySum, attr) => daySum + attr.estimated_cost, 0);
    }, 0);
  }

  /**
   * 计算住宿费用
   */
  private calculateAccommodation(
    days: number,
    groupSize: number,
    cityTier: 'tier1' | 'tier2' | 'tier3',
    budgetTier: 'budget' | 'moderate' | 'luxury',
    season: 'peak' | 'shoulder' | 'off',
    groupType: GroupType
  ): number {
    const config = CITY_TIER_CONFIG[cityTier];
    const seasonalMultiplier = SEASONAL_MULTIPLIERS[season].accommodation;

    // 基础房价（根据预算档次）
    const basePrice = config.accommodation_per_room[budgetTier];

    // 需要的房间数（每间房最多2人）
    const roomsNeeded = Math.ceil(groupSize / 2);

    // 群体类型调整
    const groupMultiplier = GROUP_TYPE_MULTIPLIERS[groupType]?.accommodation || 1.0;

    // 计算住宿费用
    const accommodation = days * roomsNeeded * basePrice * seasonalMultiplier * groupMultiplier;

    return accommodation;
  }

  /**
   * 计算餐饮费用
   */
  private calculateDining(
    days: number,
    groupSize: number,
    cityTier: 'tier1' | 'tier2' | 'tier3',
    budgetTier: 'budget' | 'moderate' | 'luxury',
    season: 'peak' | 'shoulder' | 'off',
    groupType: GroupType
  ): number {
    const config = CITY_TIER_CONFIG[cityTier];
    const seasonalMultiplier = SEASONAL_MULTIPLIERS[season].dining;

    // 基础餐饮费用（根据预算档次）
    const basePrice = config.dining_per_person[budgetTier];

    // 群体类型调整
    const groupMultiplier = GROUP_TYPE_MULTIPLIERS[groupType]?.dining || 1.0;

    // 计算餐饮费用
    const dining = days * groupSize * basePrice * seasonalMultiplier * groupMultiplier;

    return dining;
  }

  /**
   * 计算交通费用
   */
  private calculateTransportation(
    itinerary: DailyItinerary[],
    cityTier: 'tier1' | 'tier2' | 'tier3',
    remainingBudget: number
  ): number {
    const config = CITY_TIER_CONFIG[cityTier];

    // 计算每日景点间的距离（简单估算）
    let estimatedDistance = 0;
    for (const day of itinerary) {
      const attractionCount = day.attractions.length;
      if (attractionCount > 1) {
        // 假设每个景点间平均 2km
        estimatedDistance += (attractionCount - 1) * 2;
      }
    }

    // 计算基础交通费用
    const baseTransportation = estimatedDistance * config.transportation_per_km;

    // 如果剩余预算不足，调整交通费用
    if (remainingBudget < baseTransportation) {
      console.log(`   ⚠️  交通预算不足，建议减少景点数量`);
      return remainingBudget;
    }

    return baseTransportation;
  }

  /**
   * 生成预算优化建议
   */
  private generateRecommendations(
    breakdown: { tickets: number; accommodation: number; dining: number; transportation: number },
    totalBudget: number,
    utilization: number
  ): string[] {
    const recommendations: string[] = [];

    // 检查预算利用率
    if (utilization > 100) {
      recommendations.push(`⚠️  预算超支 ${utilization.toFixed(1)}%，建议增加预算或减少景点数量`);
    } else if (utilization > 90) {
      recommendations.push(`⚠️  预算紧张 (${utilization.toFixed(1)}%)，建议预留一些应急资金`);
    } else if (utilization < 50) {
      recommendations.push(`💡 预算充足 (${utilization.toFixed(1)}%)，可以考虑升级住宿或增加景点`);
    }

    // 检查各项费用占比
    const total =
      breakdown.tickets + breakdown.accommodation + breakdown.dining + breakdown.transportation;
    const ticketRatio = (breakdown.tickets / total) * 100;
    const accommodationRatio = (breakdown.accommodation / total) * 100;
    const diningRatio = (breakdown.dining / total) * 100;
    const transportationRatio = (breakdown.transportation / total) * 100;

    if (ticketRatio > 30) {
      recommendations.push(
        `💡 门票费用占比 ${ticketRatio.toFixed(1)}%，可以考虑购买套票或选择免费景点`
      );
    }

    if (accommodationRatio > 50) {
      recommendations.push(
        `💡 住宿费用占比 ${accommodationRatio.toFixed(1)}%，可以考虑选择经济型住宿`
      );
    }

    if (diningRatio > 35) {
      recommendations.push(
        `💡 餐饮费用占比 ${diningRatio.toFixed(1)}%，可以考虑当地特色小吃节省开支`
      );
    }

    return recommendations;
  }
}

// 导出单例
export const budgetOptimizer = new BudgetOptimizer();
