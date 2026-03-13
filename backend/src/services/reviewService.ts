import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 评价数据接口
 */
export interface ReviewData {
  spotId: string;
  userId: string;
  rating: number;
  comment?: string;
  images?: string[];
}

/**
 * 评价服务类
 */
export class ReviewService {
  /**
   * 创建评价
   */
  async createReview(data: ReviewData) {
    try {
      const review = await prisma.review.create({
        data: {
          spotId: data.spotId,
          userId: data.userId,
          rating: data.rating,
          comment: data.comment || '',
          likeCount: 0,
        },
      });

      // 更新景点统计
      await this.updateSpotStats(data.spotId);

      return review;
    } catch (error) {
      console.error('创建评价失败:', error);
      throw error instanceof Error ? error : new Error('创建评价失败');
    }
  }

  /**
   * 获取景点评价列表
   */
  async getSpotReviews(spotId: string, page: number = 1, limit: number = 10) {
    try {
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { spotId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            images: true,
          },
        }),
        prisma.review.count({ where: { spotId } }),
      ]);

      return { reviews, total, page, limit };
    } catch (error) {
      console.error('获取景点评价失败:', error);
      throw error instanceof Error ? error : new Error('获取景点评价失败');
    }
  }

  /**
   * 获取用户评价列表
   */
  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    try {
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            spot: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        }),
        prisma.review.count({ where: { userId } }),
      ]);

      return { reviews, total, page, limit };
    } catch (error) {
      console.error('获取用户评价失败:', error);
      throw error instanceof Error ? error : new Error('获取用户评价失败');
    }
  }

  /**
   * 删除评价
   */
  async deleteReview(reviewId: string, userId: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error('评价不存在');
      }

      if (review.userId !== userId) {
        throw new Error('您没有权限删除此评价');
      }

      await prisma.review.delete({
        where: { id: reviewId },
      });

      // 更新景点统计
      await this.updateSpotStats(review.spotId);

      return review;
    } catch (error) {
      console.error('删除评价失败:', error);
      throw error instanceof Error ? error : new Error('删除评价失败');
    }
  }

  /**
   * 切换点赞状态
   */
  async toggleLike(reviewId: string, userId: string) {
    try {
      const existingLike = await prisma.reviewLike.findUnique({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });

      if (existingLike) {
        // 取消点赞
        await prisma.reviewLike.delete({
          where: { id: existingLike.id },
        });

        await prisma.review.update({
          where: { id: reviewId },
          data: { likeCount: { decrement: 1 } },
        });

        return { liked: false };
      } else {
        // 添加点赞
        await prisma.reviewLike.create({
          data: {
            reviewId,
            userId,
          },
        });

        await prisma.review.update({
          where: { id: reviewId },
          data: { likeCount: { increment: 1 } },
        });

        return { liked: true };
      }
    } catch (error) {
      console.error('切换点赞状态失败:', error);
      throw error instanceof Error ? error : new Error('切换点赞状态失败');
    }
  }

  /**
   * 获取景点评价统计
   */
  async getSpotReviewsStats(spotIds: string[]) {
    try {
      const stats = await Promise.all(
        spotIds.map(async (spotId) => {
          const reviews = await prisma.review.findMany({
            where: { spotId },
            select: { rating: true },
          });

          const total = reviews.length;
          const avgRating = total > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;

          return {
            spotId,
            total,
            avgRating: Math.round(avgRating * 10) / 10,
          };
        })
      );

      return stats;
    } catch (error) {
      console.error('获取景点评价统计失败:', error);
      throw error instanceof Error ? error : new Error('获取景点评价统计失败');
    }
  }

  /**
   * 更新景点统计
   */
  private async updateSpotStats(spotId: string) {
    try {
      const reviews = await prisma.review.findMany({
        where: { spotId },
        select: { rating: true },
      });

      const total = reviews.length;
      const avgRating = total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

      await prisma.spot.update({
        where: { id: spotId },
        data: {
          reviewCount: total,
          avgRating: Math.round(avgRating * 10) / 10,
        },
      });
    } catch (error) {
      console.error('更新景点统计失败:', error);
    }
  }
}

// 导出单例实例
export const reviewService = new ReviewService();
