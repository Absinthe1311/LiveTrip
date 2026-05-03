/**
 * 打包清单服务
 * 处理打包清单的业务逻辑
 */

import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

// 预设物品分类和默认物品
const DEFAULT_PACKING_ITEMS = {
  clothing: ['T恤', '衬衫', '裤子', '外套', '内衣裤', '袜子', '睡衣', '运动鞋'],
  electronics: ['手机充电器', '充电宝', '耳机', '相机', '笔记本电脑', '转换插头'],
  documents: ['身份证', '护照', '驾照', '车票/机票', '酒店预订确认单', '保险单'],
  toiletries: ['牙刷', '牙膏', '洗发水', '沐浴露', '毛巾', '护肤品'],
  medicine: ['常用药品', '创可贴', '晕车药', '感冒药'],
  other: ['雨伞', '水杯', '纸巾', '塑料袋'],
};

// 分类名称映射
const CATEGORY_NAMES: Record<string, string> = {
  clothing: '衣物',
  electronics: '电子产品',
  documents: '证件文件',
  toiletries: '洗漱用品',
  medicine: '药品',
  other: '其他',
};

export class PackingService {
  /**
   * 获取行程的打包清单
   */
  async getPackingList(tripId: string) {
    try {
      const prisma = getPrismaClient();
      const packingItems = await prisma.packingItem.findMany({
        where: { tripId },
        orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
      });

      return {
        success: true,
        data: packingItems,
      };
    } catch (error) {
      console.error('获取打包清单失败:', error);
      throw error;
    }
  }

  /**
   * 初始化打包清单（添加默认预设物品）
   */
  async initializePackingList(tripId: string) {
    try {
      const prisma = getPrismaClient();

      // 检查是否已有物品
      const existingItems = await prisma.packingItem.findMany({
        where: { tripId },
      });

      if (existingItems.length > 0) {
        return {
          success: true,
          message: '打包清单已存在',
          data: existingItems,
        };
      }

      // 添加默认预设物品
      const itemsToAdd = [];
      for (const [category, items] of Object.entries(DEFAULT_PACKING_ITEMS)) {
        for (const itemName of items) {
          itemsToAdd.push({
            tripId,
            itemName,
            category,
            isPacked: false,
            isSuggested: false,
            isDefault: true,
          });
        }
      }

      const createdItems = await prisma.packingItem.createMany({
        data: itemsToAdd,
      });

      // 返回完整的清单
      return this.getPackingList(tripId);
    } catch (error) {
      console.error('初始化打包清单失败:', error);
      throw error;
    }
  }

  /**
   * 添加打包物品
   */
  async addPackingItem(tripId: string, itemName: string, category: string) {
    try {
      const prisma = getPrismaClient();
      const item = await prisma.packingItem.create({
        data: {
          tripId,
          itemName,
          category,
          isPacked: false,
          isSuggested: true,
          isDefault: false,
        },
      });

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      console.error('添加打包物品失败:', error);
      throw error;
    }
  }

  /**
   * 批量保存打包清单
   */
  async batchSavePackingList(tripId: string, items: any[]) {
    try {
      const prisma = getPrismaClient();

      // 先删除所有现有物品
      await prisma.packingItem.deleteMany({
        where: { tripId },
      });

      // 批量创建新物品
      const itemsToCreate = items.map((item) => ({
        tripId,
        itemName: item.itemName,
        category: item.category,
        isPacked: item.isPacked || false,
        isSuggested: !item.isCustom,
        isDefault: false,
      }));

      await prisma.packingItem.createMany({
        data: itemsToCreate,
      });

      // 返回完整的清单
      return this.getPackingList(tripId);
    } catch (error) {
      console.error('批量保存打包清单失败:', error);
      throw error;
    }
  }

  /**
   * 更新打包物品状态
   */
  async updatePackingItem(itemId: string, updates: { isPacked?: boolean; itemName?: string }) {
    try {
      const prisma = getPrismaClient();
      const item = await prisma.packingItem.update({
        where: { id: itemId },
        data: updates,
      });

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      console.error('更新打包物品失败:', error);
      throw error;
    }
  }

  /**
   * 删除打包物品
   */
  async deletePackingItem(itemId: string) {
    try {
      const prisma = getPrismaClient();
      await prisma.packingItem.delete({
        where: { id: itemId },
      });

      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      console.error('删除打包物品失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类名称
   */
  getCategoryName(category: string): string {
    return CATEGORY_NAMES[category] || category;
  }

  /**
   * 获取所有分类
   */
  getAllCategories(): Array<{ key: string; name: string }> {
    return Object.entries(CATEGORY_NAMES).map(([key, name]) => ({
      key,
      name,
    }));
  }

  /**
   * 获取打包进度
   */
  async getPackingProgress(tripId: string) {
    try {
      const prisma = getPrismaClient();
      return prisma.packingItem.groupBy({
        by: ['isPacked'],
        where: { tripId },
        _count: true,
      });
    } catch (error) {
      console.error('获取打包进度失败:', error);
      throw error;
    }
  }
}

export const packingService = new PackingService();
