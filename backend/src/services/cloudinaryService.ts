/**
 * Cloudinary 服务封装
 * 提供图片上传、删除、优化等功能
 */
import cloudinary from '../config/cloudinary';

/**
 * 上传结果接口
 */
export interface UploadResult {
  cloudinaryUrl: string; // 完整访问 URL
  cloudinaryId: string; // public_id，用于后续删除
}

/**
 * 图片优化选项接口
 */
export interface OptimizationOptions {
  width: number;
  height: number;
  crop: string; // 'fill', 'scale', 'fit', etc.
}

/**
 * Cloudinary 服务类
 */
export class CloudinaryService {
  /**
   * 上传图片 Buffer
   * @param fileBuffer 文件 Buffer
   * @param folder 文件夹名称（如 "spots" | "users"）
   * @param options 可选的优化选项
   * @returns 上传结果
   */
  async pushImg(
    fileBuffer: Buffer,
    folder: string,
    options?: { width?: number; quality?: number }
  ): Promise<UploadResult> {
    try {
      // 构建上传选项
      const uploadOptions: any = {
        folder: folder,
        resource_type: 'image',
      };

      // 如果提供了优化选项
      if (options) {
        if (options.width) {
          uploadOptions.transformation = {
            width: options.width,
            crop: 'limit', // 限制最大宽度，保持比例
          };
        }
        if (options.quality) {
          uploadOptions.quality = options.quality;
        }
      }

      // 上传图片
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          })
          .end(fileBuffer);
      });

      return {
        cloudinaryUrl: result.secure_url,
        cloudinaryId: result.public_id,
      };
    } catch (error) {
      throw new Error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除图片
   * @param cloudinaryId Cloudinary public_id
   */
  async delImg(cloudinaryId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(cloudinaryId);
    } catch (error) {
      throw new Error(`图片删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取带转换参数的 URL（压缩/裁剪）
   * @param cloudinaryId Cloudinary public_id
   * @param options 优化选项
   * @returns 优化后的 URL
   */
  getUrl(cloudinaryId: string, options: OptimizationOptions): string {
    try {
      const result = cloudinary.url(cloudinaryId, {
        secure: true,
        transformation: {
          width: options.width,
          height: options.height,
          crop: options.crop,
        },
      });

      return result;
    } catch (error) {
      throw new Error(`生成优化 URL 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量上传图片
   * @param files 文件数组
   * @param folder 文件夹名称
   * @returns 上传结果数组
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; originalname: string }>,
    folder: string
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.pushImg(file.buffer, folder);
        results.push(result);
      } catch (error) {
        // 继续上传其他文件
      }
    }

    return results;
  }

  /**
   * 检查图片是否存在
   * @param cloudinaryId Cloudinary public_id
   * @returns 图片是否存在
   */
  async hasImg(cloudinaryId: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(cloudinaryId);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取图片信息
   * @param cloudinaryId Cloudinary public_id
   * @returns 图片信息
   */
  async getImg(cloudinaryId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(cloudinaryId);
      return result;
    } catch (error) {
      throw new Error(`获取图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 导出单例实例
export const cloudinaryService = new CloudinaryService();
