/**
 * 打包清单控制器
 * 处理打包清单的API请求
 */

import { Request, Response } from 'express';
import { packingService } from '../services/packingService';

export class PackingController {
  /**
   * 获取行程的打包清单
   * GET /api/trips/:tripId/packing
   */
  static async getPackingList(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;

      if (!tripIdStr) {
        res.status(400).json({
          success: false,
          message: '行程ID不能为空',
        });
        return;
      }

      const result = await packingService.getPackingList(tripIdStr);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('获取打包清单失败:', error);
      res.status(500).json({
        success: false,
        message: '获取打包清单失败',
        error: error.message,
      });
    }
  }

  /**
   * 初始化打包清单（添加默认预设物品）
   * POST /api/trips/:tripId/packing/initialize
   */
  static async initializePackingList(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;

      if (!tripIdStr) {
        res.status(400).json({
          success: false,
          message: '行程ID不能为空',
        });
        return;
      }

      const result = await packingService.initializePackingList(tripIdStr);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('初始化打包清单失败:', error);
      res.status(500).json({
        success: false,
        message: '初始化打包清单失败',
        error: error.message,
      });
    }
  }

  /**
   * 添加打包物品
   * POST /api/trips/:tripId/packing
   */
  static async addPackingItem(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const { itemName, category } = req.body;
      const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;

      if (!tripIdStr || !itemName || !category) {
        res.status(400).json({
          success: false,
          message: '缺少必要参数',
        });
        return;
      }

      const result = await packingService.addPackingItem(tripIdStr, itemName, category);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('添加打包物品失败:', error);
      res.status(500).json({
        success: false,
        message: '添加打包物品失败',
        error: error.message,
      });
    }
  }

  /**
   * 批量保存打包清单
   * POST /api/trips/:tripId/packing/batch
   */
  static async batchSavePackingList(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const { items } = req.body;
      const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;

      if (!tripIdStr || !items || !Array.isArray(items)) {
        res.status(400).json({
          success: false,
          message: '缺少必要参数',
        });
        return;
      }

      const result = await packingService.batchSavePackingList(tripIdStr, items);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('批量保存打包清单失败:', error);
      res.status(500).json({
        success: false,
        message: '批量保存打包清单失败',
        error: error.message,
      });
    }
  }

  /**
   * 更新打包物品状态
   * PATCH /api/packing/:itemId
   */
  static async updatePackingItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const itemIdStr = Array.isArray(itemId) ? itemId[0] : itemId;
      const { isPacked, itemName } = req.body;

      if (!itemIdStr) {
        res.status(400).json({
          success: false,
          message: '物品ID不能为空',
        });
        return;
      }

      const updates: any = {};
      if (typeof isPacked === 'boolean') {
        updates.isPacked = isPacked;
      }
      if (itemName) {
        updates.itemName = itemName;
      }

      const result = await packingService.updatePackingItem(itemIdStr, updates);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('更新打包物品失败:', error);
      res.status(500).json({
        success: false,
        message: '更新打包物品失败',
        error: error.message,
      });
    }
  }

  /**
   * 删除打包物品
   * DELETE /api/packing/:itemId
   */
  static async deletePackingItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const itemIdStr = Array.isArray(itemId) ? itemId[0] : itemId;

      if (!itemIdStr) {
        res.status(400).json({
          success: false,
          message: '物品ID不能为空',
        });
        return;
      }

      const result = await packingService.deletePackingItem(itemIdStr);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('删除打包物品失败:', error);
      res.status(500).json({
        success: false,
        message: '删除打包物品失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取所有分类
   * GET /api/packing/categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = packingService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      console.error('获取分类失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取打包进度
   * GET /api/trips/:tripId/packing/progress
   */
  static async getPackingProgress(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const tripIdStr = Array.isArray(tripId) ? tripId[0] : tripId;

      if (!tripIdStr) {
        res.status(400).json({
          success: false,
          message: '行程ID不能为空',
        });
        return;
      }

      const progress = await packingService.getPackingProgress(tripIdStr);

      // 计算总进度
      const totalItems = progress.reduce((sum: number, item: any) => sum + item._count, 0);
      const packedItems = progress.find((item: any) => item.isPacked)?._count || 0;
      const percentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

      res.status(200).json({
        success: true,
        data: {
          total: totalItems,
          packed: packedItems,
          percentage,
        },
      });
    } catch (error: any) {
      console.error('获取打包进度失败:', error);
      res.status(500).json({
        success: false,
        message: '获取打包进度失败',
        error: error.message,
      });
    }
  }
}
