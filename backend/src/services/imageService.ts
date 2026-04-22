import { getPrismaClient } from '../lib/prisma';
import { cloudinaryService } from './cloudinaryService';
import { generateFileHash } from '../utils/hashGenerator';
import { checkDuplicateImage, generateUniqueFileName, getImageExtension } from '../utils/imageValidator';

const prisma = getPrismaClient();

/**
 * 图片上传结果接口
 */
export interface ImageUploadResult {
  id: string;
  url: string;
  isPrimary: boolean;
  source: string;
  status: string;
  priority: number;
}

/**
 * 图片服务类
 */
export class ImageService {
  /**
   * 上传图片
   * @param spotId 景点ID
   * @param file 文件buffer
   * @param userId 用户ID
   * @param isPrimary 是否设为主图
   * @param source 图片来源 ('admin', 'user_upload')
   * @returns 上传结果
   */
  async uploadImage(
    spotId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
    userId: string,
    isPrimary: boolean = false,
    source: 'admin' | 'user_upload' = 'user_upload'
  ): Promise<ImageUploadResult> {
    try {
      // 验证景点是否存在
      const spot = await prisma.spot.findUnique({
        where: { id: spotId },
      });

      if (!spot) {
        throw new Error('景点不存在');
      }

      // 计算文件hash
      const fileHash = generateFileHash(file.buffer);

      // 检查是否重复上传
      const existingImage = await prisma.spotImage.findFirst({
        where: {
          spotId,
          fileHash,
        },
      });

      if (existingImage) {
        throw new Error('该图片已上传过');
      }

      // 生成唯一文件名
      const extension = getImageExtension(file.mimetype);
      const fileName = generateUniqueFileName(file.originalname, userId);

      // 上传到 Cloudinary
      const cloudinaryResult = await cloudinaryService.uploadImage(file.buffer, 'spot-images');

      // 如果是主图，取消旧的主图
      if (isPrimary) {
        await prisma.spotImage.updateMany({
          where: {
            spotId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      // 创建数据库记录
      const image = await prisma.spotImage.create({
        data: {
          spotId,
          url: cloudinaryResult.cloudinaryUrl,
          source,
          status: source === 'admin' ? 'approved' : 'pending',
          priority: source === 'admin' ? 10 : 5,
          isPrimary,
          fileHash,
          uploadedBy: userId,
          viewCount: 0,
          likeCount: 0,
          reportCount: 0,
        },
      });

      console.log(`✅ 图片上传成功: ${image.id}, 来源: ${source}`);

      return {
        id: image.id,
        url: image.url || '',
        isPrimary: image.isPrimary,
        source: image.source,
        status: image.status,
        priority: image.priority,
      };
    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      throw error instanceof Error ? error : new Error('图片上传失败');
    }
  }

  /**
   * 批量上传图片
   * @param spotId 景点ID
   * @param files 文件数组
   * @param userId 用户ID
   * @param source 图片来源
   * @returns 上传结果数组
   */
  async uploadMultipleImages(
    spotId: string,
    files: Array<{
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    }>,
    userId: string,
    source: 'admin' | 'user_upload' = 'user_upload'
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = i === 0; // 第一张设为主图

      try {
        const result = await this.uploadImage(spotId, file, userId, isPrimary, source);
        results.push(result);
      } catch (error) {
        console.error(`第${i + 1}张图片上传失败:`, error);
        // 继续上传其他图片
      }
    }

    return results;
  }

  /**
   * 获取景点图片列表
   * @param spotId 景点ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 图片列表
   */
  async getSpotImages(
    spotId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    images: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
      source: string;
      status: string;
      priority: number;
      viewCount: number;
      likeCount: number;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // 验证景点是否存在
      const spot = await prisma.spot.findUnique({
        where: { id: spotId },
      });

      if (!spot) {
        throw new Error('景点不存在');
      }

      // 查询已审核通过的图片
      const [images, total] = await Promise.all([
        prisma.spotImage.findMany({
          where: {
            spotId,
            status: 'approved',
            url: {
              not: '',
            },
          },
          orderBy: [
            { isPrimary: 'desc' }, // 主图排在第一位
            { priority: 'desc' }, // 按优先级降序
            { createdAt: 'desc' }, // 按创建时间降序
          ],
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            url: true,
            isPrimary: true,
            source: true,
            status: true,
            priority: true,
            viewCount: true,
            likeCount: true,
          },
        }),
        prisma.spotImage.count({
          where: {
            spotId,
            status: 'approved',
            url: {
              not: '',
            },
          },
        }),
      ]);

      // 处理url可能为null的情况
      const processedImages = images.map(img => ({
        ...img,
        url: img.url || '',
      }));

      return {
        images: processedImages,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('❌ 获取景点图片失败:', error);
      throw error instanceof Error ? error : new Error('获取景点图片失败');
    }
  }

  /**
   * 删除图片
   * @param imageId 图片ID
   * @param userId 用户ID
   * @param userRole 用户角色
   */
  async deleteImage(imageId: string, userId: string, userRole: string): Promise<void> {
    try {
      // 查询图片信息
      const image = await prisma.spotImage.findUnique({
        where: { id: imageId },
      });

      if (!image) {
        throw new Error('图片不存在');
      }

      // 验证权限（管理员或上传者本人）
      if (userRole !== 'admin' && image.uploadedBy !== userId) {
        throw new Error('您没有权限删除此图片');
      }

      // 从 Cloudinary 删除文件
      try {
        // 从 URL 中提取 public_id
        const cloudinaryId = this.extractCloudinaryIdFromUrl(image.url || '');
        if (cloudinaryId) {
          await cloudinaryService.deleteImage(cloudinaryId);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary 删除失败:', cloudinaryError);
        // 继续删除数据库记录
      }

      // 删除数据库记录
      await prisma.spotImage.delete({
        where: { id: imageId },
      });

      console.log(`✅ 图片删除成功: ${imageId}`);
    } catch (error) {
      console.error('❌ 图片删除失败:', error);
      throw error instanceof Error ? error : new Error('图片删除失败');
    }
  }

  /**
   * 更新图片统计信息
   * @param imageId 图片ID
   * @param updates 更新的字段
   */
  async updateImageStats(
    imageId: string,
    updates: {
      viewCount?: number;
      likeCount?: number;
      reportCount?: number;
    }
  ): Promise<void> {
    try {
      await prisma.spotImage.update({
        where: { id: imageId },
        data: updates,
      });
    } catch (error) {
      console.error('❌ 更新图片统计失败:', error);
      throw error instanceof Error ? error : new Error('更新图片统计失败');
    }
  }

  /**
   * 从 URL 中提取 Cloudinary public_id
   * @param url 图片 URL
   * @returns Cloudinary public_id
   */
  private extractCloudinaryIdFromUrl(url: string): string | null {
    try {
      // Cloudinary URL 格式: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
      const match = url.match(/\/upload\/(.+)\.[a-z]+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * 设置图片为主图
   * @param imageId 图片ID
   * @param userId 用户ID
   * @param userRole 用户角色
   */
  async setAsPrimary(imageId: string, userId: string, userRole: string): Promise<void> {
    try {
      // 查询图片信息
      const image = await prisma.spotImage.findUnique({
        where: { id: imageId },
      });

      if (!image) {
        throw new Error('图片不存在');
      }

      // 验证权限（管理员或上传者本人）
      if (userRole !== 'admin' && image.uploadedBy !== userId) {
        throw new Error('您没有权限设置此图片为主图');
      }

      // 取消旧的主图
      await prisma.spotImage.updateMany({
        where: {
          spotId: image.spotId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      // 设置新的主图
      await prisma.spotImage.update({
        where: { id: imageId },
        data: {
          isPrimary: true,
        },
      });

      console.log(`✅ 设置主图成功: ${imageId}`);
    } catch (error) {
      console.error('❌ 设置主图失败:', error);
      throw error instanceof Error ? error : new Error('设置主图失败');
    }
  }

  /**
   * 获取图片详情
   * @param imageId 图片ID
   * @returns 图片详情
   */
  async getImageById(imageId: string) {
    try {
      const image = await prisma.spotImage.findUnique({
        where: { id: imageId },
        include: {
          spot: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true,
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

      return image;
    } catch (error) {
      console.error('❌ 获取图片详情失败:', error);
      throw error instanceof Error ? error : new Error('获取图片详情失败');
    }
  }

  /**
   * 获取景点封面图片（带图片来源）
   * @param spotName 景点名称
   * @param city 城市名称（可选）
   * @returns 图片对象，包含URL和来源信息
   */
  async getSpotCoverImageWithSource(spotName: string, city?: string): Promise<{ url: string; source: string } | null> {
    try {
      // 构建查询条件
      const where: any = {
        name: spotName,
      };

      if (city) {
        where.city = city;
      }

      // 查找景点
      const spot = await prisma.spot.findFirst({
        where,
      });

      if (!spot) {
        return null;
      }

      // 查找景点的图片（优先 admin approved）
      const image = await prisma.spotImage.findFirst({
        where: {
          spotId: spot.id,
          status: 'approved',
          isPrimary: true,
        },
        orderBy: {
          priority: 'desc',
        },
        select: {
          url: true,
          source: true,
        },
      });

      // 如果没有主图，查找第一张图片
      if (!image) {
        const firstImage = await prisma.spotImage.findFirst({
          where: {
            spotId: spot.id,
            status: 'approved',
          },
          orderBy: {
            priority: 'desc',
          },
          select: {
            url: true,
            source: true,
          },
        });

        if (firstImage?.url) {
          return {
            url: firstImage.url,
            source: firstImage.source
          };
        }
      }

      if (image?.url) {
        return {
          url: image.url,
          source: image.source
        };
      }

      // 如果数据库中没有图片，返回null
      console.log(`⚠️  景点 ${spotName} 没有图片`);
      return null;
    } catch (error) {
      console.error('❌ 获取景点封面图片失败:', error);
      return null;
    }
  }

  /**
   * 获取景点封面图片（兼容旧接口）
   * @param spotName 景点名称
   * @param city 城市名称（可选）
   * @returns 图片URL，如果没有找到则返回null
   */
  async getSpotCoverImage(spotName: string, city?: string): Promise<string | null> {
    const result = await this.getSpotCoverImageWithSource(spotName, city);
    return result?.url || null;
  }

  /**
   * 批量获取景点图片
   * @param spots 景点数组，包含名称和城市
   * @returns Map<景点标识, 图片URL>
   */
  async batchGetSpotImages(
    spots: Array<{ name: string; city?: string }>
  ): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();

    for (const spot of spots) {
      try {
        const imageUrl = await this.getSpotCoverImage(spot.name, spot.city);
        const key = spot.city ? `${spot.name}_${spot.city}` : spot.name;
        imageMap.set(key, imageUrl || '');
      } catch (error) {
        console.error(`获取景点 ${spot.name} 图片失败:`, error);
        const key = spot.city ? `${spot.name}_${spot.city}` : spot.name;
        imageMap.set(key, '');
      }
    }

    return imageMap;
  }

  /**
   * 根据景点ID批量获取图片（从数据库查询）
   */
  async batchGetSpotImagesByIds(spotIds: string[]): Promise<Record<string, string>> {
    const prisma = await import('../lib/prisma').then(m => m.getPrismaClient());
    const imageMap: Record<string, string> = {};

    try {
      // 批量查询景点的图片
      const spots = await prisma.spot.findMany({
        where: {
          id: { in: spotIds }
        },
        include: {
          images: {
            where: {
              status: 'approved'
            },
            take: 1,
            orderBy: {
              priority: 'desc'
            }
          }
        }
      });

      // 构建图片映射
      spots.forEach(spot => {
        // 只使用SpotImage表中的图片，不使用coverImage
        if (spot.images && spot.images.length > 0 && spot.images[0].url) {
          imageMap[spot.id] = spot.images[0].url;
        } else {
          // 没有图片时返回空字符串
          imageMap[spot.id] = '';
        }
      });

      console.log(`✅ 批量获取 ${spots.length} 个景点的图片成功`);
      return imageMap;
    } catch (error) {
      console.error('批量获取景点图片失败:', error);
      // 返回空图片映射，避免阻塞前端
      spotIds.forEach(id => {
        imageMap[id] = '';
      });
      return imageMap;
    }
  }
}

// 导出单例实例
export const imageService = new ImageService();
