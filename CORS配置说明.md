# CORS 配置说明

## 功能说明

后端已支持逗号分隔的多个CORS来源配置，可以灵活配置允许访问API的前端域名。

---

## 配置方法

### 单个来源
```env
CORS_ORIGIN=http://localhost:5173
```

### 多个来源（逗号分隔）
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://yourdomain.com
```

---

## 配置文件位置

- **开发环境**：`backend/.env`
- **示例配置**：`backend/.env.example`
- **生产环境**：`backend/.env.production`

---

## 当前配置

### 开发环境
```env
# CORS 配置
# 支持多个来源，用逗号分隔
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 生产环境示例
```env
# 生产环境 - 允许正式域名访问
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

---

## 功能特性

### 1. 多来源支持
- ✅ 支持逗号分隔的多个域名
- ✅ 自动去除空格
- ✅ 精确匹配域名

### 2. 安全特性
- ✅ 只允许配置列表中的来源
- ✅ 未配置的来源会被拒绝
- ✅ 控制台会显示被拒绝的来源

### 3. 灵活配置
- ✅ 允许无origin的请求（移动应用、Postman等）
- ✅ 支持携带凭证（cookies、authorization headers）
- ✅ 支持常见的HTTP方法

---

## 允许的HTTP方法

- GET
- POST
- PUT
- DELETE
- PATCH
- OPTIONS

---

## 允许的请求头

- Content-Type
- Authorization
- x-user-id

---

## 测试方法

### 1. 使用浏览器控制台
```javascript
fetch('http://localhost:3001/api/health', {
  method: 'GET',
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log(data));
```

### 2. 使用 curl
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3001/api/health
```

### 3. 使用 Postman
- 设置请求头 `Origin: http://localhost:5173`
- 发送请求到 `http://localhost:3001/api/health`

---

## 常见问题

### Q1: 为什么我的请求被CORS拒绝？

**A**: 检查以下几点：
1. 前端的域名是否在 `CORS_ORIGIN` 配置中
2. 域名是否完全匹配（包括端口号）
3. 查看后端控制台的警告信息

### Q2: 如何添加新的前端域名？

**A**: 在 `.env` 文件中添加，用逗号分隔：
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://new-domain.com
```

### Q3: 生产环境如何配置？

**A**: 使用正式域名：
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Q4: 为什么允许无origin的请求？

**A**: 为了支持：
- 移动应用
- Postman等API测试工具
- 服务器端请求

---

## 错误排查

### 查看允许的来源
后端启动时会在控制台显示：
```
Allowed origins: http://localhost:5173, http://localhost:5174
```

### 查看被拒绝的来源
当请求被拒绝时，控制台会显示：
```
CORS blocked origin: http://unauthorized-domain.com
Allowed origins: http://localhost:5173, http://localhost:5174
```

---

## 代码实现位置

**文件**：`backend/src/index.ts`

**关键代码**：
```typescript
// CORS 配置 - 支持逗号分隔的多个来源
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 允许没有origin的请求（如移动应用、Postman等）
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // 检查请求的origin是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
};

app.use(cors(corsOptions));
```

---

**更新时间**：2026-04-16  
**功能状态**：✅ 已实现
