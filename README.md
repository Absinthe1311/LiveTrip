# LiveTrip - AI + IoT 智能旅行规划系统

<div align="center">

![LiveTrip Logo](https://img.shields.io/badge/LiveTrip-AI%20%2B%20IoT-blue?style=for-the-badge)

**基于人工智能和物联网的智能旅行规划系统**

[功能特性](#功能特性) | [快速开始](#快速开始) | [技术栈](#技术栈)

</div>

---

## 项目简介

LiveTrip 是一个基于 **AI + IoT** 的智能旅行规划系统，采用自主研发的多因素评分引擎和先进的物联网实时数据，为用户提供个性化的旅行规划服务。

### 核心亮点

- **智能AI助手**：基于智谱AI GLM-4的智能对话助手，支持自然语言创建行程
- **自主规划算法**：多因素评分引擎 + K-means聚类 + 多样性约束 + 2-opt路径优化
- **IoT实时数据**：集成物联网传感器数据，提供景点拥挤度、天气等实时信息
- **环境感知推送**：实时监控降雨、人流、温度等环境因素，主动推送提醒通知
- **真实天气数据**：接入 OpenWeatherMap API，获取真实天气信息
- **智能人流模拟**：基于时段、日期和景点热度系数的人流预测模型
- **智能推荐**：景点、酒店、餐厅智能推荐，支持备选景点查看和替换
- **热门目的地**：10个热门城市，659+精选景点
- **现代化UI**：Tailwind CSS + 毛玻璃(Glass-morphism)设计 + 松绿色(#145F39)品牌色
- **智能定位**：支持浏览器定位和高德地图逆地理编码
- **行程分享**：支持行程链接分享和二维码
- **图片管理**：景点图片上传，支持Cloudinary云存储
- **游记撰写**：Markdown编辑器，支持图片、格式化和PDF导出
- **打包清单**：智能打包建议，支持自定义和管理打包物品
- **协同规划**：多人协同编辑行程，实时同步和沟通
- **博客PDF导出**：游记支持导出为PDF文档

---

## 功能特性

### 用户功能

| 功能模块 | 功能描述 |
|---------|---------|
| **AI智能助手** | 自然语言对话创建行程，支持"我想去北京玩三天"等自然表达 |
| **智能行程规划** | 输入目的地、日期、预算，使用多因素评分引擎+K-means聚类+2-opt优化生成行程 |
| **智能定位** | 支持浏览器定位，自动获取当前位置作为出发地 |
| **日期选择** | 双月日历组件，直观选择开始和结束日期 |
| **热门目的地** | 10个热门城市（北京、上海、厦门、成都、杭州、西安、武汉、三亚、丽江），659+精选景点 |
| **实时天气数据** | 真实天气信息（温度、湿度、天气描述、降雨概率） |
| **智能人流预测** | 基于时段、日期和热度系数的人流密度预测 |
| **景点管理** | 拖拽排序、查看备选、替换景点（替换后自动更新备选池） |
| **景点收藏** | 收藏喜欢的景点，支持数据库持久化 |
| **酒店推荐** | 基于位置和预算的智能酒店推荐，支持跳过 |
| **餐厅推荐** | 每日餐厅推荐，支持选择和跳过 |
| **行程分享** | 生成分享链接和二维码，好友可查看行程 |
| **图片上传** | 景点图片上传，支持Cloudinary云存储 |
| **游记撰写** | Markdown编辑器，支持图片和格式化，可导出PDF |
| **打包清单** | 预设物品分类，支持自定义添加和自动保存 |
| **协同规划** | 多人协同编辑行程，实时同步和沟通 |

### 管理后台

| 功能模块 | 功能描述 |
|---------|---------|
| **景点管理** | 景点信息维护、图片审核、数据同步 |
| **用户管理** | 用户信息管理、权限控制 |
| **内容审核** | 图片审核、游记审核 |
| **数据统计** | 访问统计、用户行为分析 |

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/LiveTrip.git
cd LiveTrip
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **配置后端环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入真实的API密钥：
# - 高德地图 API Key（Web服务API Key + JS API Key）
# - OpenWeatherMap API Key
# - 智谱AI API Key
# - Cloudinary 配置（可选）
```

4. **初始化数据库**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. **启动后端服务**
```bash
npm run dev
```

6. **安装前端依赖**
```bash
cd ../frontend
npm install
```

7. **配置前端环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置：
# - VITE_AMAP_WS_KEY：高德地图Web服务API Key
# - VITE_AMAP_JS_KEY：高德地图JS API Key
# - VITE_AMAP_JS_SECRET：高德地图JS API安全密钥
# - VITE_API_BASE_URL：后端API地址
```

8. **启动前端服务**
```bash
npm run dev
```

9. **访问应用**
- 前端地址：http://localhost:5173
- 后端API：http://localhost:3003

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.7.3 | 类型安全 |
| Vite | 6.0.7 | 构建工具 |
| Tailwind CSS | 3.4.19 | 样式框架 |
| shadcn | 4.0.8 | UI组件CLI |
| radix-ui | 1.4.3 | 无障碍UI原语 |
| Ant Design | 5.22.5 | UI组件库 |
| React Router | 7.1.1 | 路由管理 |
| Zustand | 5.0.2 | 状态管理 |
| Axios | 1.7.9 | HTTP客户端 |
| Socket.io Client | 4.8.3 | 实时通信 |
| Framer Motion | 12.38.0 | 动画库 |
| TipTap | 3.x | 富文本编辑器 |
| Lucide React | 0.577.0 | 图标库 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 4.21.2 | Web框架 |
| TypeScript | 5.7.3 | 类型安全 |
| Prisma | 6.1.0 | ORM |
| SQLite | 3.x | 数据库 |
| Socket.io | 4.8.3 | 实时通信 |
| Cloudinary | 2.9.0 | 图片存储 |
| date-fns | 4.1.0 | 日期处理 |
| node-cron | 4.2.1 | 定时任务 |

### 核心算法

#### 1. 多因素评分引擎
- **偏好匹配**：Jaccard相似度计算
- **质量评分**：基于景点评分、描述完整度
- **IoT评分**：实时拥挤度、天气状况
- **人群评分**：群体类型适配度

#### 2. K-means 地理聚类
- 按地理位置将景点分组，减少每日交通时间

#### 3. 多样性约束
- 每天最多2个同类型景点，同类型不超过总量50%，每天至少2种不同类型

#### 4. 2-opt 路径优化
- 贪心算法生成初始路线 + 2-opt算法局部优化，减少总行程距离

#### 5. 动态预算计算
- 城市等级识别、季节性价格调整、群体类型适配、预算优化建议

### 外部服务

| 服务 | 用途 |
|------|------|
| 智谱AI GLM-4 | AI对话助手，自然语言理解和行程创建 |
| 高德地图API | 景点数据、地理编码、路径规划、逆地理编码 |
| OpenWeatherMap | 实时天气数据 |
| Cloudinary | 图片存储（可选） |

---

## 项目结构

```
LiveTrip/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器层
│   │   ├── data/           # 静态数据
│   │   ├── lib/            # 工具库
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑层
│   │   ├── socket/         # Socket.io
│   │   ├── types/          # TypeScript类型定义
│   │   └── utils/          # 工具函数
│   ├── prisma/             # 数据库schema和迁移
│   └── scripts/            # 工具脚本（备份、恢复、管理员创建）
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── api/            # API调用封装
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 可复用组件
│   │   ├── config/         # 配置文件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── lib/            # 工具库
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # 服务层
│   │   ├── store/          # Zustand状态管理
│   │   └── utils/          # 工具函数
│   └── public/             # 公共静态资源
└── README.md
```

### 核心模块说明

#### 后端核心服务

| 服务文件 | 功能描述 |
|---------|---------|
| `scoringEngine.ts` | 多因素评分引擎，计算景点综合评分 |
| `clusteringService.ts` | K-means地理聚类，景点分组 |
| `diversityService.ts` | 多样性约束，确保推荐多样性 |
| `routeOptimizer.ts` | 2-opt路径优化，减少行程距离 |
| `budgetOptimizer.ts` | 动态预算计算，城市等级识别 |
| `iotCheckService.ts` | IoT实时检查，环境感知 |
| `agentService.ts` | AI Agent核心服务，自然语言处理 |
| `traditionalRecommender.ts` | 行程推荐和备选景点生成 |
| `itineraryAdjustService.ts` | 行程调整和备选景点管理 |
| `favoriteService.ts` | 收藏服务 |
| `collabService.ts` | 协同规划服务 |
| `weatherService.ts` | 天气数据服务 |
| `notificationService.ts` | 通知推送服务 |

#### 前端核心组件

| 组件文件 | 功能描述 |
|---------|---------|
| `LandingHeroSection.tsx` | Landing页面视频背景和视差效果 |
| `GlassLayout.tsx` | 毛玻璃布局容器 |
| `DoubleCalendar.tsx` | 双月日历组件 |
| `SpotCard.tsx` | 景点卡片组件 |
| `DayMap.tsx` | 行程地图组件（高德地图） |
| `PackingStep.tsx` | 打包清单步骤组件 |
| `ActionButton.tsx` | 步骤导航按钮 |
| `AuthGuard.tsx` | 认证守卫组件 |

---

## 开发指南

### 开发模式

```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 数据库操作

```bash
npm run prisma:studio    # 可视化数据库
npm run prisma:reset     # 重置数据库
npm run prisma:seed      # 填充示例数据
```

### 代码规范

```bash
# 后端
cd backend && npm run lint && npm run format

# 前端
cd frontend && npm run lint && npm run format && npm run type-check
```

---

## 数据库设计

### 核心数据表

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `User` | 用户信息 | id, username, email, role |
| `Trip` | 行程信息 | id, userId, destination, startDate, endDate |
| `Day` | 行程天数 | id, tripId, dayNumber, date |
| `ItineraryItem` | 行程项 | id, dayId, name, type, spotId |
| `Spot` | 景点信息 | id, name, city, category, rating |
| `Favorite` | 收藏记录 | id, userId, spotId |
| `SpotIoTData` | IoT数据 | id, spotId, crowdLevel, temperature |
| `CollabRoom` | 协同房间 | id, tripId, hostId, inviteToken |
| `BlogPost` | 游记 | id, userId, title, content |
| `Notification` | 通知 | id, userId, type, content |

### 数据关系

- User → Trip → Day → ItineraryItem → Spot
- User ↔ Favorite ↔ Spot
- Trip ↔ CollabRoom ↔ TripMember
- Spot → SpotIoTData → EnvironmentSensorLog
- User → BlogPost → BlogComment

---

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**LiveTrip - Live to see, Live to go.**
