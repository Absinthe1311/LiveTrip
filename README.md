# LiveTrip - AI + IoT 智能旅行规划系统

## 📖 项目简介

**LiveTrip** 是一款基于人工智能和物联网技术的智能旅行规划系统，能够根据用户偏好、实时物联网数据动态优化旅行行程。

### 核心特性

- 🤖 **AI智能推荐** - 基于用户偏好生成个性化行程
- 🌡 **IoT实时数据** - 实时显示景点人流、天气、开放状态
- 🔄 **动态调整** - 根据实时数据智能推荐备选景点
- 💾 **智能缓存** - 减少API调用，提升响应速度
- 🗺️ **地图集成** - 可视化显示行程和周围环境
- 📊 **预算管理** - 自动计算和分配旅行预算
- 🔥 **热门景点** - 动态展示热门目的地
- 🖼️ **景点图片** - 用户上传图片，管理员审核

---

## 🛠 技术栈

### 前端技术

- **框架**: React 18.3.1 + TypeScript 5.7.3
- **构建工具**: Vite 6.0.7
- **UI组件库**: Ant Design 5.22.5
- **状态管理**: Zustand 5.0.2
- **拖拽**: dnd-kit
- **图表**: Recharts
- **地图**: 高德地图 API

### 后端技术

- **运行环境**: Node.js
- **框架**: Express 4.21.2 + TypeScript
- **ORM**: Prisma 6.1.0
- **数据库**: SQLite
- **AI服务**: 智谱AI (ChatGLM)
- **地图服务**: 高德地图 API
- **图片存储**: Cloudinary
- **认证**: JWT + bcryptjs

---

## 📁 项目结构

```
LiveTrip/
├── backend/                    # 后端项目
│   ├── src/                     # 源代码目录
│   │   ├── controllers/         # 控制器层
│   │   ├── services/            # 服务层
│   │   ├── routes/              # 路由层
│   │   ├── iot/                 # IoT相关
│   │   ├── utils/               # 工具函数
│   │   └── types/               # 类型定义
│   ├── prisma/                  # Prisma配置
│   ├── scripts/                 # 脚本工具
│   └── package.json
│
├── frontend/                   # 前端项目
│   ├── src/                     # 源代码目录
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # 公共组件
│   │   ├── api/                 # API客户端
│   │   ├── store/               # 状态管理
│   │   └── types/               # 类型定义
│   ├── public/                  # 公共资源
│   └── package.json
│
├── README.md                   # 项目说明文档
├── 项目交接文档.md              # 项目交接文档
└── 景点图片检索关键字.md        # 图片检索关键字
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd frontend
npm install
```

### 配置环境变量

#### 后端配置 (`backend/.env`)

```env
PORT=3003
DATABASE_URL="file:./dev.db"
AMAP_API_KEY=your_amap_api_key
ZHIPU_API_KEY=your_zhipu_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

#### 前端配置 (`frontend/.env`)

```env
VITE_AMAP_KEY=your_amap_api_key
VITE_API_BASE_URL=http://localhost:3003/api
VITE_API_URL=http://localhost:3003/api
```

### 初始化数据库

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 启动服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

- 后端地址: http://localhost:3003
- 前端地址: http://localhost:5173

---

## 🎯 核心功能

### 1. 用户系统
- 用户注册/登录
- 管理员账号（用户名: 666, 密码: 666666）
- 路由权限控制

### 2. 智能行程规划
- AI生成个性化行程
- 景点推荐与去重
- 酒店和餐厅推荐

### 3. 行程管理
- 查看每日行程安排
- 拖拽调整景点顺序
- 查看行程地图
- 查看预算分配
- 行程分享

### 4. 热门景点
- 动态展示热门目的地
- 从数据库加载热门景点
- 管理员标记热门景点

### 5. 景点图片
- 用户上传图片（需审核）
- 管理员上传图片（自动通过）
- 图片审核管理

### 6. IoT数据展示
- 实时显示景点人流情况
- 显示天气信息
- 显示景点开放状态

---

## 📊 数据库设计

### 主要表结构

- **User** - 用户表
- **Spot** - 景点信息表
- **SpotImage** - 景点图片表
- **SpotIoTData** - IoT数据表
- **Trip** - 行程表
- **Day** - 行程天数表
- **ItineraryItem** - 行程项目表
- **Favorite** - 收藏表

---

## 🔧 开发指南

### 常用脚本

```bash
# 创建管理员账号
cd backend
npx ts-node scripts/createAdmin.ts

# 预热热门景点数据
npx ts-node scripts/seedHotSpots.ts

# 预热城市景点数据
npx ts-node scripts/preloadCitySpots.ts

# 生成图片检索关键字
npx ts-node scripts/generateSearchKeywords.ts
```

---

## 📝 更新日志

### v1.1.0 (2026-03-14)

- ✅ 修复登录后路由跳转问题
- ✅ 添加路由权限控制
- ✅ 修复管理员图片上传逻辑
- ✅ 热门景点动态加载
- ✅ 景点数据预热功能
- ✅ 减少高德API调用

### v1.0.0 (2026-02-08)

- ✅ 智能行程规划功能
- ✅ 备选景点推荐功能
- ✅ IoT数据实时展示
- ✅ 智能缓存系统
- ✅ 地图可视化
- ✅ 预算管理

---

## 📄 许可证

MIT License
