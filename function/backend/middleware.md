# backend/src/middleware 函数列表

## adminAuthMiddleware.ts

### 函数
- `requireAdmin` - 管理员权限验证中间件
- `optionalAdmin` - 可选的管理员权限验证中间件
- `requireRole` - 检查用户是否为特定角色的中间件
- `requireOwnershipOrAdmin` - 检查资源所有权或管理员权限的中间件

---

## errorHandler.ts

### 函数
- `errorHandler` - 错误处理中间件
- `notFound` - 404处理中间件

---

## fileUploadMiddleware.ts

### 函数
- `handleSingleImageUpload` - 处理单张图片上传
- `handleMultipleImageUpload` - 处理多张图片上传
- `handleUploadError` - 上传错误处理中间件
- `validateFileUpload` - 验证文件是否上传
- `uploadSingleImage` - 包装上传中间件（单张图片）
- `imgUpload` - 包装上传中间件（多张图片）
