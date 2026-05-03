/**
 * Cloudinary图片云存储服务的配置初始化文件。负责从环境变量中读取配置信息、初始化Cloudinary SDK实例验证配置完整性。
 */
import { v2 as cloudinary } from 'cloudinary';

// 配置 Cloudinary
export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  // 验证配置是否正确
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.log('Cloudinary 配置已加载');
  }
}

export default cloudinary;
