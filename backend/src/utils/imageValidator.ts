import { generateFileHash } from './hashGenerator';

/**
 * 支持的图片MIME类型
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * 图片大小限制（字节）- 10MB
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * 最大图片数量
 */
export const MAX_IMAGE_COUNT = 5;

/**
 * 验证图片格式
 * @param mimeType 文件的MIME类型
 * @returns 是否为支持的格式
 */
export function validateImageFormat(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/**
 * 验证图片大小
 * @param size 文件大小（字节）
 * @returns 是否在大小限制内
 */
export function validateImageSize(size: number): boolean {
  return size <= MAX_IMAGE_SIZE;
}

/**
 * 验证图片数量
 * @param count 图片数量
 * @returns 是否在数量限制内
 */
export function validateImageCount(count: number): boolean {
  return count <= MAX_IMAGE_COUNT;
}

/**
 * 验证图片文件
 * @param file 文件对象
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateImageFile(file: {
  mimetype: string;
  size: number;
  buffer?: Buffer;
}): { valid: boolean; error?: string } {
  // 验证格式
  if (!validateImageFormat(file.mimetype)) {
    return {
      valid: false,
      error: `只支持JPG、PNG、WEBP格式，当前格式: ${file.mimetype}`,
    };
  }

  // 验证大小
  if (!validateImageSize(file.size)) {
    return {
      valid: false,
      error: `图片大小不能超过10MB，当前大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * 批量验证图片文件
 * @param files 文件数组
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateMultipleImageFiles(files: Array<{
  mimetype: string;
  size: number;
  buffer?: Buffer;
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证数量
  if (!validateImageCount(files.length)) {
    errors.push(`最多上传${MAX_IMAGE_COUNT}张图片，当前数量: ${files.length}`);
  }

  // 验证每个文件
  files.forEach((file, index) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      errors.push(`第${index + 1}张图片: ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 生成图片预览URL（使用base64）
 * @param buffer 文件buffer
 * @param mimeType 文件MIME类型
 * @returns base64格式的图片URL
 */
export function generateImagePreview(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 生成唯一的文件名
 * @param originalName 原始文件名
 * @param userId 用户ID
 * @returns 唯一的文件名
 */
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${userId}_${timestamp}_${random}.${extension}`;
}

/**
 * 计算文件的hash值并验证是否重复
 * @param buffer 文件buffer
 * @param existingHashes 现有的hash值集合
 * @returns 包含hash值和是否重复
 */
export function checkDuplicateImage(
  buffer: Buffer,
  existingHashes: Set<string>
): { hash: string; isDuplicate: boolean } {
  const hash = generateFileHash(buffer);
  return {
    hash,
    isDuplicate: existingHashes.has(hash),
  };
}

/**
 * 验证用户上传权限
 * @param user 用户对象
 * @param spotId 景点ID
 * @param userVisitedSpots 用户游览过的景点ID列表
 * @returns 验证结果
 */
export function validateUserUploadPermission(
  user: { id: string; role: string },
  spotId: string,
  userVisitedSpots: string[]
): { valid: boolean; error?: string } {
  // 管理员可以直接上传
  if (user.role === 'admin') {
    return { valid: true };
  }

  // 普通用户需要游览过该景点
  if (!userVisitedSpots.includes(spotId)) {
    return {
      valid: false,
      error: '您只能为游览过的景点上传图片',
    };
  }

  return { valid: true };
}

/**
 * 获取图片的扩展名
 * @param mimeType 文件MIME类型
 * @returns 文件扩展名
 */
export function getImageExtension(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return extensionMap[mimeType] || 'jpg';
}
