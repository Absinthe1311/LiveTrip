import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

/**
 * 存储配置 - 使用内存存储
 */
const storage = multer.memoryStorage();

/**
 * 文件过滤器 - 只允许图片文件
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持JPG、PNG、WEBP格式的图片'));
  }
};

/**
 * Multer配置
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 1, // 单张图片
  },
  fileFilter,
});

/**
 * 处理单张图片上传
 */
export const handleSingleImageUpload = upload.single('file');

/**
 * 处理多张图片上传
 */
export const handleMultipleImageUpload = upload.array('files', 5);

/**
 * 错误处理中间件
 */
export function handleUploadError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: '图片大小不能超过20MB',
      });
      return;
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: '最多上传5张图片',
      });
      return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: '意外的文件字段',
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: `文件上传错误: ${err.message}`,
    });
    return;
  }

  // 其他错误
  if (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  next();
}

/**
 * 验证文件是否上传
 */
export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      message: '请选择要上传的图片',
    });
    return;
  }

  next();
}

/**
 * 包装上传中间件（单张图片），包含错误处理和验证
 */
export function uploadSingleImage(req: Request, res: Response, next: NextFunction): void {
  handleSingleImageUpload(req, res, (err) => {
    if (err) {
      handleUploadError(err, req, res, () => {});
      return;
    }
    validateFileUpload(req, res, next);
  });
}

/**
 * 包装上传中间件（多张图片），包含错误处理和验证
 */
export function imgUpload(req: Request, res: Response, next: NextFunction): void {
  handleMultipleImageUpload(req, res, (err) => {
    if (err) {
      handleUploadError(err, req, res, () => {});
      return;
    }
    validateFileUpload(req, res, next);
  });
}
