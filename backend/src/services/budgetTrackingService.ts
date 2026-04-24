// AI辅助生成：GLM-5, 2026-04-24 21:31
// 描述：预算追踪服务，提供预算变更记录、预算调整、预算历史查询等功能，支持预算功能的实时更新和追踪

import prisma from '../lib/prisma';

// 预算变更类型
export type BudgetChangeType =
  | 'total_budget_adjusted'     // 调整总预算
  | 'item_price_updated'        // 更新项目价格
  | 'hotel_selected'            // 选择酒店
  | 'restaurant_selected'       // 选择餐厅
  | 'attraction_added'          // 添加景点
  | 'attraction_removed';       // 移除景点

// 预算分类
export type BudgetCategory = 'transportation' | 'accommodation' | 'dining' | 'tickets' | 'shopping' | 'other';

// 预算变更记录接口
export interface BudgetRecordData {
  tripId: string;
  changeType: BudgetChangeType;
  category?: BudgetCategory;
  previousAmount: number;
  newAmount: number;
  description: string;
  relatedItemName?: string;
}

// 预算更新结果
export interface BudgetUpdateResult {
  success: boolean;
  record?: any;
  budgetInfo?: {
    totalBudget: number;
    usedBudget: number;
    remainingBudget: number;
    budgetStatus: string;
  };
  error?: string;
}

class BudgetTrackingService {
  /**
   * 创建预算变更记录
   */
  async createBudgetRecord(data: BudgetRecordData): Promise<BudgetUpdateResult> {
    try {
      // 获取当前行程的预算信息
      const trip = await prisma.trip.findUnique({
        where: { id: data.tripId },
        include: { budget: true }
      });

      if (!trip) {
        return { success: false, error: '行程不存在' };
      }

      // 计算差额
      const difference = data.newAmount - data.previousAmount;

      // 计算当前已用预算
      const usedBudget = trip.budget
        ? trip.budget.transportation + trip.budget.accommodation + trip.budget.food +
          trip.budget.tickets + trip.budget.shopping + trip.budget.other
        : 0;

      // 计算剩余预算
      const remainingBudget = trip.totalBudget - usedBudget;

      // 创建预算变更记录
      const record = await prisma.budgetRecord.create({
        data: {
          tripId: data.tripId,
          changeType: data.changeType,
          category: data.category,
          previousAmount: data.previousAmount,
          newAmount: data.newAmount,
          difference,
          description: data.description,
          relatedItemName: data.relatedItemName,
          totalBudget: trip.totalBudget,
          usedBudget,
          remainingBudget,
        }
      });

      console.log('✅ 预算变更记录已创建:', record.id);

      return {
        success: true,
        record,
        budgetInfo: {
          totalBudget: trip.totalBudget,
          usedBudget,
          remainingBudget,
          budgetStatus: trip.budgetStatus
        }
      };
    } catch (error) {
      console.error('创建预算变更记录失败:', error);
      return { success: false, error: '创建记录失败' };
    }
  }

  /**
   * 调整总预算
   */
  async adjustTotalBudget(tripId: string, newBudget: number, reason: string): Promise<BudgetUpdateResult> {
    try {
      // 获取当前行程
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { budget: true }
      });

      if (!trip) {
        return { success: false, error: '行程不存在' };
      }

      const previousBudget = trip.totalBudget;

      // 更新行程的总预算
      const updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          totalBudget: newBudget,
          remainingBudget: newBudget - (trip.actualBudget || 0)
        }
      });

      // 创建预算变更记录
      const result = await this.createBudgetRecord({
        tripId,
        changeType: 'total_budget_adjusted',
        previousAmount: previousBudget,
        newAmount: newBudget,
        description: reason || `将总预算从¥${previousBudget}调整为¥${newBudget}`
      });

      console.log(`✅ 总预算已调整: ¥${previousBudget} -> ¥${newBudget}`);

      return result;
    } catch (error) {
      console.error('调整总预算失败:', error);
      return { success: false, error: '调整预算失败' };
    }
  }

  /**
   * 更新项目价格
   */
  async updateItemPrice(
    tripId: string,
    category: BudgetCategory,
    itemName: string,
    previousPrice: number,
    newPrice: number
  ): Promise<BudgetUpdateResult> {
    try {
      // 获取当前预算
      const budget = await prisma.budget.findUnique({
        where: { tripId }
      });

      if (!budget) {
        return { success: false, error: '预算数据不存在' };
      }

      // 更新预算分类金额
      const categoryField = category === 'dining' ? 'food' : category;
      const currentAmount = budget[categoryField] || 0;
      const newAmount = currentAmount - previousPrice + newPrice;

      await prisma.budget.update({
        where: { tripId },
        data: { [categoryField]: newAmount }
      });

      // 创建预算变更记录
      const result = await this.createBudgetRecord({
        tripId,
        changeType: 'item_price_updated',
        category,
        previousAmount: previousPrice,
        newAmount: newPrice,
        description: `更新${this.getCategoryName(category)}价格：${itemName}`,
        relatedItemName: itemName
      });

      console.log(`✅ 项目价格已更新: ${itemName} ¥${previousPrice} -> ¥${newPrice}`);

      return result;
    } catch (error) {
      console.error('更新项目价格失败:', error);
      return { success: false, error: '更新价格失败' };
    }
  }

  /**
   * 获取预算变更历史
   */
  async getBudgetHistory(tripId: string, limit: number = 20): Promise<any[]> {
    try {
      const records = await prisma.budgetRecord.findMany({
        where: { tripId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      console.log(`✅ 获取预算变更历史: ${records.length}条记录`);
      return records;
    } catch (error) {
      console.error('获取预算变更历史失败:', error);
      return [];
    }
  }

  /**
   * 获取实时预算状态
   */
  async getRealTimeBudget(tripId: string): Promise<any> {
    try {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { budget: true }
      });

      if (!trip) {
        return null;
      }

      const usedBudget = trip.budget
        ? trip.budget.transportation + trip.budget.accommodation + trip.budget.food +
          trip.budget.tickets + trip.budget.shopping + trip.budget.other
        : 0;

      const remainingBudget = trip.totalBudget - usedBudget;
      const usageRate = trip.totalBudget > 0 ? usedBudget / trip.totalBudget : 0;

      // 更新行程的剩余预算
      await prisma.trip.update({
        where: { id: tripId },
        data: { remainingBudget }
      });

      return {
        totalBudget: trip.totalBudget,
        usedBudget,
        remainingBudget,
        usageRate,
        budgetStatus: this.getBudgetStatus(usageRate),
        breakdown: trip.budget ? {
          transportation: trip.budget.transportation,
          accommodation: trip.budget.accommodation,
          dining: trip.budget.food,
          tickets: trip.budget.tickets,
          shopping: trip.budget.shopping,
          other: trip.budget.other
        } : null
      };
    } catch (error) {
      console.error('获取实时预算状态失败:', error);
      return null;
    }
  }

  /**
   * 获取分类名称
   */
  private getCategoryName(category: BudgetCategory): string {
    const names: Record<BudgetCategory, string> = {
      transportation: '交通',
      accommodation: '住宿',
      dining: '餐饮',
      tickets: '门票',
      shopping: '购物',
      other: '其他'
    };
    return names[category] || category;
  }

  /**
   * 获取预算状态
   */
  private getBudgetStatus(usageRate: number): string {
    if (usageRate > 1.0) {
      return 'over_budget';
    } else if (usageRate >= 0.95) {
      return 'on_budget';
    } else {
      return 'under_budget';
    }
  }
}

// 导出单例
export const budgetTrackingService = new BudgetTrackingService();
