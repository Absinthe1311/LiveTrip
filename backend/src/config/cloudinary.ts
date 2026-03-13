/**
 * Cloudinary 配置文件
 * 从环境变量读取配置，不硬编码任何密钥
 */
import { v2 as cloudinary } from 'cloudinary';

// 配置 Cloudinary
export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // 使用 HTTPS
  });

  // 验证配置是否正确
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary 配置不完整，图片上传功能可能无法使用');
  } else {
    console.log('✅ Cloudinary 配置已加载');
  }
}

export default cloudinary;
