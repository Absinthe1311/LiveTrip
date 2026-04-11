// 图片上传控制器
import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

/**
 * 上传图片到 Cloudinary
 * POST /api/upload/image
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有找到上传的文件',
      });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP',
      });
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: '文件大小不能超过 10MB',
      });
    }

    // 使用 base64 上传
    const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // 上传到 Cloudinary（不进行任何转换，保持原始图片）
    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'livetrip/covers',
      resource_type: 'image',
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error: any) {
    console.error('❌ 图片上传失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '图片上传失败',
    });
  }
};

/**
 * 删除 Cloudinary 上的图片
 * DELETE /api/upload/image/:publicId
 */
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: '缺少 publicId',
      });
    }

    // 确保 publicId 是字符串类型
    const publicIdStr = Array.isArray(publicId) ? publicId[0] : publicId;
    const result = await cloudinary.uploader.destroy(publicIdStr);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: '图片删除成功',
      });
    } else {
      res.status(404).json({
        success: false,
        error: '图片不存在或已被删除',
      });
    }
  } catch (error: any) {
    console.error('❌ 图片删除失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '图片删除失败',
    });
  }
};
