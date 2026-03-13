import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 图片审核数据接口
 */
export interface ImageReviewData {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

/**
 * 图片审核服务类
 */
export class ImageReviewService {
  /**
   * 审核图片
   * @param imageId 图片ID
   * @param reviewerId 审核者ID
   * @param data 审核数据
   * @returns 审核结果
   */
  async reviewImage(
    imageId: string,
    reviewerId: string,
    data: ImageReviewData
  ): Promise<{
    imageId: string;
    status: string;
    reviewedBy: string;
    reviewedAt: Date;
    reviewNote?: string;
    message: string;
  }> {
    try {
      // 查询图片信息
      const image = await prisma.spotImage.findUnique({
        where: { id: imageId },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!image) {
        throw new Error('图片不存在');
      }

      // 验证图片是否已审核
      if (image.status !== 'pending') {
        throw new Error('该图片已审核');
      }

      // 验证审核状态
      if (data.status !== 'approved' && data.status !== 'rejected') {
        throw new Error('审核状态无效');
      }

      // 验证审核备注（拒绝时必须填写）
      if (data.status === 'rejected' && !data.reviewNote) {
        throw new Error('审核拒绝时必须填写备注');
      }

      // 更新图片审核状态
      const updatedImage = await prisma.spotImage.update({
        where: { id: imageId },
        data: {
          status: data.status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: data.reviewNote || null,
        },
      });

      console.log(`✅ 图片审核成功: ${imageId}, 状态: ${data.status}`);

      // TODO: 发送通知给上传者
      // await this.sendNotificationToUploader(image.uploader, updatedImage);

      return {
        imageId: updatedImage.id,
        status: updatedImage.status,
        reviewedBy: updatedImage.reviewedBy!,
        reviewedAt: updatedImage.reviewedAt!,
        reviewNote: updatedImage.reviewNote || undefined,
        message: data.status === 'approved' ? '审核通过' : '审核拒绝',
      };
    } catch (error) {
      console.error('❌ 图片审核失败:', error);
      throw error instanceof Error ? error : new Error('图片审核失败');
    }
  }

  /**
   * 获取待审核图片列表
   * @param page 页码
   * @param limit 每页数量
   * @param filters 过滤条件
   * @returns 待审核图片列表
   */
  async getPendingImages(
    page: number = 1,
    limit: number = 20,
    filters?: {
      source?: string;
      spotId?: string;
      uploaderId?: string;
    }
  ): Promise<{
    images: Array<{
      id: string;
      url: string;
      spotId: string;
      spotName: string;
      uploadedBy: string;
      uploaderName: string;
      uploadedAt: Date;
      source: string;
      status: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // 构建查询条件
      const where: any = {
        status: 'pending',
      };

      if (filters?.source) {
        where.source = filters.source;
      }

      if (filters?.spotId) {
        where.spotId = filters.spotId;
      }

      if (filters?.uploaderId) {
        where.uploadedBy = filters.uploaderId;
      }

      // 查询待审核图片
      const [images, total] = await Promise.all([
        prisma.spotImage.findMany({
          where,
          include: {
            spot: {
              select: {
                id: true,
                name: true,
              },
            },
            uploader: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.spotImage.count({ where }),
      ]);

      return {
        images: images.map((image) => ({
          id: image.id,
          url: image.url || '',
          spotId: image.spot.id,
          spotName: image.spot.name,
          uploadedBy: image.uploadedBy,
          uploaderName: image.uploader.username,
          uploadedAt: image.createdAt,
          source: image.source,
          status: image.status,
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('❌ 获取待审核图片失败:', error);
      throw error instanceof Error ? error : new Error('获取待审核图片失败');
    }
  }

  /**
   * 批量审核图片
   * @param imageIds 图片ID数组
   * @param reviewerId 审核者ID
   * @param status 审核状态
   * @param reviewNote 审核备注
   * @returns 审核结果
   */
  async batchReviewImages(
    imageIds: string[],
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewNote?: string
  ): Promise<{
    successCount: number;
    failedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const imageId of imageIds) {
      try {
        await this.reviewImage(imageId, reviewerId, { status, reviewNote });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        errors.push(`图片 ${imageId}: ${errorMessage}`);
      }
    }

    console.log(`✅ 批量审核完成: 成功 ${successCount}, 失败 ${errors.length}`);

    return {
      successCount,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 获取审核统计
   * @returns 审核统计数据
   */
  async getReviewStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    adminUploaded: number;
    userUploaded: number;
  }> {
    try {
      const [total, pending, approved, rejected, adminUploaded, userUploaded] = await Promise.all([
        prisma.spotImage.count(),
        prisma.spotImage.count({ where: { status: 'pending' } }),
        prisma.spotImage.count({ where: { status: 'approved' } }),
        prisma.spotImage.count({ where: { status: 'rejected' } }),
        prisma.spotImage.count({ where: { source: 'admin' } }),
        prisma.spotImage.count({ where: { source: 'user_upload' } }),
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
        adminUploaded,
        userUploaded,
      };
    } catch (error) {
      console.error('❌ 获取审核统计失败:', error);
      throw error instanceof Error ? error : new Error('获取审核统计失败');
    }
  }

  /**
   * 获取审核历史
   * @param imageId 图片ID
   * @returns 审核历史
   */
  async getReviewHistory(imageId: string) {
    try {
      const image = await prisma.spotImage.findUnique({
        where: { id: imageId },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!image) {
        throw new Error('图片不存在');
      }

      return {
        imageId: image.id,
        uploadedBy: {
          id: image.uploader.id,
          username: image.uploader.username,
        },
        uploadedAt: image.createdAt,
        reviewedBy: image.reviewer
          ? {
              id: image.reviewer.id,
              username: image.reviewer.username,
            }
          : null,
        reviewedAt: image.reviewedAt,
        status: image.status,
        reviewNote: image.reviewNote,
      };
    } catch (error) {
      console.error('❌ 获取审核历史失败:', error);
      throw error instanceof Error ? error : new Error('获取审核历史失败');
    }
  }

  /**
   * 发送通知给上传者
   * @param uploader 上传者信息
   * @param image 图片信息
   */
  private async sendNotificationToUploader(
    uploader: { id: string; username: string; email?: string | null },
    image: { status: string; reviewNote?: string | null }
  ): Promise<void> {
    // TODO: 实现通知功能
    // 可以通过邮件、站内消息等方式通知
    console.log(`发送通知给 ${uploader.username}: 图片审核${image.status === 'approved' ? '通过' : '拒绝'}`);
    if (image.reviewNote) {
      console.log(`审核备注: ${image.reviewNote}`);
    }
  }
}

// 导出单例实例
export const imageReviewService = new ImageReviewService();
