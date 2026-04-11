// 图片上传路由
import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/uploadController';

const router = express.Router();

// 配置 multer 用于内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

/**
 * @route   POST /api/upload/image
 * @desc    上传图片到 Cloudinary
 * @access  Private
 */
router.post('/image', upload.single('image'), uploadImage);

/**
 * @route   DELETE /api/upload/image/:publicId
 * @desc    删除 Cloudinary 上的图片
 * @access  Private
 */
router.delete('/image/:publicId', deleteImage);

export default router;
