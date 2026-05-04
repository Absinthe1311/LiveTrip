# backend/src/utils 函数列表

## apiRateLimiter.ts

### 类 ApiRateLimiter
- `constructor` - 构造函数
- `execute` - 执行异步任务（受速率限制）
- `processQueue` (private) - 处理队列中的任务

### 导出
- `amapRateLimiter` - 高德API速率限制器实例

---

## tokenGenerator.ts

### 函数
- `generateShareToken` - 生成分享token
- `isValidToken` - 验证token格式

---

## dateParser.ts

### 函数
- `parseDate` - 解析日期字符串
- `addDays` - 添加天数
- `getDayOfWeek` - 中文星期转数字
- `getDayOfWeekDate` - 获取指定周的星期几
- `formatDate` - 格式化日期为YYYY-MM-DD

---

## hashGenerator.ts

### 函数
- `generateFileHash` - 生成文件hash值
- `generateStringHash` - 生成字符串hash值
- `compareHash` - 验证两个hash值是否相同

---

## imageValidator.ts

### 导出常量
- `ALLOWED_IMAGE_TYPES` - 支持的图片MIME类型
- `MAX_IMAGE_SIZE` - 图片大小限制
- `MAX_IMAGE_COUNT` - 最大图片数量

### 函数
- `validateImageFormat` - 验证图片格式
- `validateImageSize` - 验证图片大小
- `validateImageCount` - 验证图片数量
- `validateImageFile` - 验证图片文件
- `validateMultipleImageFiles` - 批量验证图片文件
- `generateImagePreview` - 生成图片预览URL
- `generateUniqueFileName` - 生成唯一文件名
- `checkDuplicateImage` - 检查重复图片
- `validateUserUploadPermission` - 验证用户上传权限
- `getImageExtension` - 获取图片扩展名

---

## retry.ts

### 函数
- `retryWithBackoff` - 带有指数退避的重试函数
- `httpsRequestWithRetry` - 带有重试的HTTPS请求包装器

---

## spotDeduplication.ts

### 函数
- `calculateStringSimilarity` - 计算字符串相似度
- `calculateDistance` - 计算两个坐标之间的距离
- `toRad` - 角度转弧度
- `isParentChildRelation` - 判断是否为父子关系
- `isDuplicateSpot` - 判断是否为重复景点
- `deduplicateSpots` - 景点去重
