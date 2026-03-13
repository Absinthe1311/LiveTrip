/**
 * 评价控制器
 * 处理评价相关的API请求
 */

import { Request, Response } from 'express';
import { reviewService } from '../services/reviewService';

export class ReviewController {
  /**
   * 创建评价
   */
  static async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { spotId, userId, rating, comment, images } = req.body;

      // 验证必填字段
      if (!spotId || !userId || !rating) {
        res.status(400).json({
          success: false,
          message: '缺少必填字段：spotId、userId、rating',
        });
        return;
      }

      // 验证评分范围
      if (rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          message: '评分必须在1-5之间',
        });
        return;
      }

      const review = await reviewService.createReview({
        spotId,
        userId,
        rating,
        comment,
        images,
      });

      res.status(201).json({
        success: true,
        message: '评价创建成功',
        data: review,
      });
    } catch (error: any) {
      console.error('创建评价失败:', error);
      res.status(500).json({
        success: false,
        message: '创建评价失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取景点的所有评价
   */
  static async getSpotReviews(req: Request, res: Response): Promise<void> {
    try {
      const { spotId } = req.params;
      const { page = '1', pageSize = '10' } = req.query;

      const spotIdStr = Array.isArray(spotId) ? spotId[0] : spotId;
      const pageStr = Array.isArray(page) ? page[0] : page;
      const pageSizeStr = Array.isArray(pageSize) ? pageSize[0] : pageSize;
      const pageNum = parseInt(pageStr as string);
      const pageSizeNum = parseInt(pageSizeStr as string);

      const result = await reviewService.getSpotReviews(spotIdStr, pageNum, pageSizeNum);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('获取景点评价失败:', error);
      res.status(500).json({
        success: false,
        message: '获取景点评价失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取用户的评价
   */
  static async getUserReviews(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = '1', pageSize = '10' } = req.query;

      const userIdStr = Array.isArray(userId) ? userId[0] : userId;
      const pageStr = Array.isArray(page) ? page[0] : page;
      const pageSizeStr = Array.isArray(pageSize) ? pageSize[0] : pageSize;
      const pageNum = parseInt(pageStr as string);
      const pageSizeNum = parseInt(pageSizeStr as string);

      const result = await reviewService.getUserReviews(userIdStr, pageNum, pageSizeNum);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('获取用户评价失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户评价失败',
        error: error.message,
      });
    }
  }

  /**
   * 删除评价
   */
  static async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const reviewIdStr = Array.isArray(reviewId) ? reviewId[0] : reviewId;
      const success = await reviewService.deleteReview(reviewIdStr, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: '评价删除成功',
        });
      } else {
        res.status(404).json({
          success: false,
          message: '评价不存在或无权删除',
        });
      }
    } catch (error: any) {
      console.error('删除评价失败:', error);
      res.status(500).json({
        success: false,
        message: '删除评价失败',
        error: error.message,
      });
    }
  }

  /**
   * 点赞/取消点赞
   */
  static async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const reviewIdStr = Array.isArray(reviewId) ? reviewId[0] : reviewId;
      const result = await reviewService.toggleLike(reviewIdStr, userId);

      res.status(200).json({
        success: true,
        message: result.liked ? '点赞成功' : '取消点赞成功',
        data: result,
      });
    } catch (error: any) {
      console.error('点赞操作失败:', error);
      res.status(500).json({
        success: false,
        message: '点赞操作失败',
        error: error.message,
      });
    }
  }

  /**
   * 批量获取景点的评价统计
   */
  static async getSpotReviewsStats(req: Request, res: Response): Promise<void> {
    try {
      const { spotIds } = req.body;

      if (!Array.isArray(spotIds) || spotIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'spotIds不能为空',
        });
        return;
      }

      const stats = await reviewService.getSpotReviewsStats(spotIds);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('批量获取评价统计失败:', error);
      res.status(500).json({
        success: false,
        message: '批量获取评价统计失败',
        error: error.message,
      });
    }
  }
}