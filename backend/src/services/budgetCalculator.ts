// 预算计算服务 - 根据实际选择计算真实预算
import { Hotel } from './hotelRecommender';
import { Restaurant } from './restaurantRecommender';

// 预算明细
export interface BudgetBreakdown {
  accommodation: number; // 住宿
  dining: number; // 餐饮
  transportation: number; // 交通
  tickets: number; // 门票
  other: number; // 其他
  total: number; // 总计
}

// 预算状态
export type BudgetStatus = 'under_budget' | 'on_budget' | 'over_budget';

// 预算信息
export interface BudgetInfo extends BudgetBreakdown {
  status: BudgetStatus;
  usageRate: number; // 使用率 (0-1)
  remaining: number; // 剩余预算
  totalBudget: number; // 总预算
  estimatedBudget?: BudgetBreakdown; // 预估预算（对比用）
}

// 预算计算选项
export interface BudgetCalculateOptions {
  totalBudget: number; // 总预算
  days: number; // 天数
  groupSize?: number; // 人数，默认1
  selectedHotel?: Hotel | null; // 选中的酒店
  selectedRestaurants?: Record<number, Restaurant | null>; // 选中的餐厅（按天）
  itinerarySpots?: Array<{ estimated_cost: number }>; // 行程景点
  avgTransportCost?: number; // 平均交通成本，默认50元
}

class BudgetCalculator {
  /**
   * 计算实际预算（基于用户实际选择）
   */
  calcActual(options: BudgetCalculateOptions): BudgetInfo {
    const {
      totalBudget,
      days,
      groupSize = 1,
      selectedHotel,
      selectedRestaurants = {},
      itinerarySpots = [],
      avgTransportCost = 50,
    } = options;

    // 1. 计算住宿费用
    const accommodation = this.calculateAccommodationCost(selectedHotel, days);

    // 2. 计算餐饮费用（午餐）
    const dining = this.calculateDiningCost(selectedRestaurants, groupSize);

    // 3. 计算门票费用
    const tickets = this.calculateTicketsCost(itinerarySpots, groupSize);

    // 4. 计算交通费用
    const transportation = this.calcTrans(days, avgTransportCost);

    // 5. 其他费用（预留）
    const other = 0;

    // 6. 计算总费用
    const total = accommodation + dining + tickets + transportation + other;

    // 7. 计算预算状态
    const status = this.budgetStats(total, totalBudget);
    const usageRate = total / totalBudget;
    const remaining = totalBudget - total;

    console.log('💰 实际预算计算完成:');
    console.log(`   住宿: ¥${accommodation}`);
    console.log(`   餐饮: ¥${dining}`);
    console.log(`   门票: ¥${tickets}`);
    console.log(`   交通: ¥${transportation}`);
    console.log(`   总计: ¥${total}`);
    console.log(`   使用率: ${(usageRate * 100).toFixed(1)}%`);
    console.log(`   状态: ${status}`);

    return {
      accommodation,
      dining,
      transportation,
      tickets,
      other,
      total,
      status,
      usageRate,
      remaining,
      totalBudget,
    };
  }

  /**
   * 计算预估预算（基于总预算的智能分配）
   */
  estBudget(totalBudget: number, days: number): BudgetBreakdown {
    // 根据天数调整预算分配比例
    // 天数越多，住宿和交通占比越高，餐饮和门票占比相对降低

    let accommodationRatio: number;
    let diningRatio: number;
    let transportationRatio: number;
    let ticketsRatio: number;

    if (days <= 2) {
      // 短途旅行（1-2天）
      accommodationRatio = 0.35; // 住宿 35%
      diningRatio = 0.3; // 餐饮 30%
      transportationRatio = 0.15; // 交通 15%
      ticketsRatio = 0.2; // 门票 20%
    } else if (days <= 5) {
      // 中途旅行（3-5天）
      accommodationRatio = 0.4; // 住宿 40%
      diningRatio = 0.25; // 餐饮 25%
      transportationRatio = 0.2; // 交通 20%
      ticketsRatio = 0.15; // 门票 15%
    } else {
      // 长途旅行（6天以上）
      accommodationRatio = 0.45; // 住宿 45%
      diningRatio = 0.2; // 餐饮 20%
      transportationRatio = 0.25; // 交通 25%
      ticketsRatio = 0.1; // 门票 10%
    }

    const accommodation = Math.round(totalBudget * accommodationRatio);
    const dining = Math.round(totalBudget * diningRatio);
    const transportation = Math.round(totalBudget * transportationRatio);
    const tickets = Math.round(totalBudget * ticketsRatio);
    const other = 0;
    const total = accommodation + dining + transportation + tickets + other;

    console.log('💰 预估预算计算完成:');
    console.log(`   住宿: ¥${accommodation} (${(accommodationRatio * 100).toFixed(0)}%)`);
    console.log(`   餐饮: ¥${dining} (${(diningRatio * 100).toFixed(0)}%)`);
    console.log(`   交通: ¥${transportation} (${(transportationRatio * 100).toFixed(0)}%)`);
    console.log(`   门票: ¥${tickets} (${(ticketsRatio * 100).toFixed(0)}%)`);
    console.log(`   总计: ¥${total}`);

    return {
      accommodation,
      dining,
      transportation,
      tickets,
      other,
      total,
    };
  }

  /**
   * 计算住宿费用
   * @param selectedHotel 选中的酒店
   * @param days 天数
   * @returns 住宿费用
   */
  private calculateAccommodationCost(
    selectedHotel: Hotel | null | undefined,
    days: number
  ): number {
    if (!selectedHotel) {
      // 未选择酒店，使用默认估算：200元/晚
      return 200 * days;
    }

    // 根据酒店类型估算价格
    const estimatedPrice = this.estHotel(selectedHotel);
    return Math.round(estimatedPrice * days);
  }

  /**
   * 估算酒店价格
   * @param hotel 酒店信息
   * @returns 估算价格（每晚）
   */
  private estHotel(hotel: Hotel): number {
    // 如果酒店类型可以推断价格范围
    const type = hotel.type.toLowerCase();

    if (type.includes('经济') || type.includes('快捷')) {
      return 200; // 经济型：200元/晚
    } else if (type.includes('舒适') || type.includes('商务') || type.includes('三星')) {
      return 400; // 舒适型：400元/晚
    } else if (type.includes('高档') || type.includes('标准') || type.includes('四星')) {
      return 600; // 高档型：600元/晚
    } else if (type.includes('豪华') || type.includes('五星')) {
      return 1000; // 豪华型：1000元/晚
    } else {
      return 350; // 其他类型：默认350元/晚
    }
  }

  /**
   * 计算餐饮费用（午餐）
   * @param selectedRestaurants 选中的餐厅（按天）
   * @param groupSize 人数
   * @returns 餐饮费用
   */
  private calculateDiningCost(
    selectedRestaurants: Record<number, Restaurant | null>,
    groupSize: number
  ): number {
    let totalDiningCost = 0;

    console.log('🍽️ 计算餐饮费用:');
    console.log(`   人数: ${groupSize}`);
    console.log(`   选择的餐厅数量: ${Object.keys(selectedRestaurants).length}`);

    for (const day in selectedRestaurants) {
      const restaurant = selectedRestaurants[day];
      if (restaurant) {
        // 根据餐厅类型估算价格
        const estimatedPrice = this.estFood(restaurant);
        const dayCost = estimatedPrice * groupSize;
        totalDiningCost += dayCost;

        console.log(`   第${day}天 - ${restaurant.name} (${restaurant.type}):`);
        console.log(`     单人价格: ¥${estimatedPrice}`);
        console.log(`     ${groupSize}人价格: ¥${dayCost}`);
      }
    }

    console.log(`   餐饮总费用: ¥${Math.round(totalDiningCost)}`);

    return Math.round(totalDiningCost);
  }

  /**
   * 估算餐厅价格
   * @param restaurant 餐厅信息
   * @returns 估算价格（每人每餐）
   */
  private estFood(restaurant: Restaurant): number {
    // 如果餐厅类型可以推断价格范围
    const type = restaurant.type.toLowerCase();

    if (type.includes('小吃') || type.includes('快餐') || type.includes('面食')) {
      return 30; // 小吃/快餐：30元/人
    } else if (type.includes('中餐') || type.includes('家常菜')) {
      return 80; // 中餐/家常菜：80元/人
    } else if (type.includes('火锅') || type.includes('烧烤')) {
      return 120; // 火锅/烧烤：120元/人
    } else if (type.includes('海鲜')) {
      return 150; // 海鲜：150元/人
    } else if (type.includes('日料') || type.includes('西餐')) {
      return 200; // 日料/西餐：200元/人
    } else {
      return 60; // 其他类型：默认60元/人
    }
  }

  /**
   * 计算门票费用
   * @param itinerarySpots 行程景点
   * @param groupSize 人数
   * @returns 门票费用
   */
  private calculateTicketsCost(
    itinerarySpots: Array<{ estimated_cost: number }>,
    groupSize: number
  ): number {
    if (!itinerarySpots || itinerarySpots.length === 0) {
      return 0;
    }

    const ticketsCost = itinerarySpots.reduce((sum, spot) => {
      return sum + (spot.estimated_cost || 0);
    }, 0);

    return Math.round(ticketsCost * groupSize);
  }

  /**
   * 计算交通费用
   * @param days 天数
   * @param avgTransportCost 平均交通成本
   * @returns 交通费用
   */
  private calcTrans(days: number, avgTransportCost: number): number {
    // 交通费用 = (天数 - 1) × 平均交通成本
    // 假设每天从一个景点到下一个景点需要交通
    const transportDays = Math.max(days - 1, 1);
    return Math.round(transportDays * avgTransportCost);
  }

  /**
   * 获取预算状态
   * @param actual 实际费用
   * @param budget 总预算
   * @returns 预算状态
   */
  private budgetStats(actual: number, budget: number): BudgetStatus {
    const usageRate = actual / budget;

    if (usageRate > 1.0) {
      return 'over_budget';
    } else if (usageRate >= 0.95) {
      return 'on_budget';
    } else {
      return 'under_budget';
    }
  }

  /**
   * 获取预算预警级别
   * @param budgetInfo 预算信息
   * @returns 预警级别：0-无预警，1-黄色，2-橙色，3-红色
   */
  warnLevel(budgetInfo: BudgetInfo): number {
    if (budgetInfo.status === 'over_budget') {
      return 3; // 红色预警
    } else if (budgetInfo.usageRate >= 0.95) {
      return 2; // 橙色预警
    } else if (budgetInfo.usageRate >= 0.8) {
      return 1; // 黄色预警
    } else {
      return 0; // 无预警
    }
  }

  /**
   * 获取预算预警消息
   * @param budgetInfo 预算信息
   * @returns 预警消息
   */
  warnMsg(budgetInfo: BudgetInfo): string | null {
    const level = this.warnLevel(budgetInfo);

    if (level === 0) {
      return null;
    }

    const usagePercent = (budgetInfo.usageRate * 100).toFixed(0);

    if (level === 1) {
      return `⚠️ 预算提醒：您的预算使用已达到 ${usagePercent}%，请谨慎选择后续项目。`;
    } else if (level === 2) {
      return `⚠️⚠️ 预算即将超支：您的预算使用已达 ${usagePercent}%，仅剩 ¥${budgetInfo.remaining.toFixed(0)}！`;
    } else if (level === 3) {
      const overBudget = Math.abs(budgetInfo.remaining);
      return `❌ 预算已超支：您的实际开销（¥${budgetInfo.total}）已超出总预算（¥${budgetInfo.totalBudget}）¥${overBudget.toFixed(0)}！`;
    }

    return null;
  }
}

// 导出单例
export const budgetCalculator = new BudgetCalculator();
