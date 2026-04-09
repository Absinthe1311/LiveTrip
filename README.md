# LiveTrip - AI + IoT 智能旅行规划系统

<div align="center">

![LiveTrip Logo](https://img.shields.io/badge/LiveTrip-AI%20%2B%20IoT-blue?style=for-the-badge)

**基于人工智能和物联网的智能旅行规划系统**

[在线演示](#) | [功能特性](#功能特性) | [快速开始](#快速开始) | [技术栈](#技术栈)

</div>

---

## 📖 项目简介

LiveTrip 是一个基于 **AI + IoT** 的智能旅行规划系统，采用自主研发的多因素评分引擎和先进的物联网实时数据，为用户提供个性化的旅行规划服务。

### 核心亮点

- 🤖 **智能AI助手**：基于智谱AI GLM-4的智能对话助手,支持自然语言创建行程
- 🧠 **自主规划算法**：多因素评分引擎 + K-means聚类 + 多样性约束
- 📡 **IoT实时数据**：集成物联网传感器数据，提供景点拥挤度、天气等实时信息
- 🌤️ **真实天气数据**：接入 OpenWeatherMap API，获取真实的天气信息
- 👥 **智能人流模拟**：基于时段、日期和景点热度系数的人流预测模型
- 🗺️ **智能推荐**：景点、酒店、餐厅智能推荐，支持备选景点查看和替换
- 🏙️ **热门目的地**：6个热门城市展示，每个城市9个精选景点，支持分页浏览
- 📱 **现代化UI**：采用 Tailwind CSS + 毛玻璃设计风格的沉浸式界面
- 🎨 **Glass-morphism设计**：半透明卡片、动态光影、琥珀金配色
- 🔗 **行程分享**：支持行程链接分享和PDF导出
- 📸 **图片管理**：景点图片上传、审核和管理功能，支持Cloudinary云存储
- ✍️ **游记撰写**：行程完成后可撰写游记，记录美好时光
- 🎒 **打包清单**：智能打包建议，支持自定义和管理打包物品
- 🤖 **AI智能问答**：悬浮式聊天窗口，实时旅行建议
- 👥 **协同规划**：多人协同编辑行程，实时同步和沟通

---

## ✨ 功能特性

### 用户功能

| 功能模块 | 功能描述 |
|---------|---------|
| **AI智能助手** | 自然语言对话创建行程,支持"我想去北京玩三天"等自然表达 |
| **AI行程规划** | 输入目的地、日期、预算，AI自动生成完整行程 |
| **热门目的地** | 6个热门城市（北京、上海、厦门、成都、杭州、西安），每个城市展示9个精选景点 |
| **实时天气数据** | 真实天气信息（温度、湿度、天气描述、降雨概率） |
| **智能人流预测** | 基于时段、日期和热度系数的人流密度预测 |
| **景点管理** | 拖拽排序、查看备选、替换景点 |
| **酒店推荐** | 基于位置和预算的智能酒店推荐 |
| **餐厅推荐** | 每日餐厅推荐，支持选择和跳过 |
| **行程分享** | 生成分享链接，好友可查看行程 |
| **PDF导出** | 导出精美PDF行程单 |
| **图片上传** | 行程完成后上传景点图片，支持Cloudinary云存储 |
| **游记撰写** | Markdown编辑器，支持图片和格式化 |
| **收藏管理** | 收藏喜欢的景点、酒店、餐厅 |
| **协同规划** | 多人协同编辑行程，实时同步和沟通 |

### 管理后台

| 功能模块 | 功能描述 |
|---------|---------|
| **景点管理** | 景点信息维护、图片审核、数据同步 |
| **用户管理** | 用户信息管理、权限控制 |
| **内容审核** | 图片审核、游记审核 |
| **数据统计** | 访问统计、用户行为分析 |

---

## 🚀 快速开始

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

3. **配置环境变量**
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入真实的API密钥
# 需要配置的API：
# - 高德地图 API Key
# - OpenWeatherMap API Key
# - Cloudinary 配置（可选）
```

4. **初始化数据库**
```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充示例数据
npm run prisma:seed
```

5. **启动后端服务**
```bash
npm run dev
```

6. **安装前端依赖**
```bash
cd frontend
npm install
```

7. **启动前端服务**
```bash
npm run dev
```

8. **访问应用**
- 前端地址：http://localhost:5173
- 后端API：http://localhost:3003
- API文档：http://localhost:3003/api-docs

---

## 🛠️ 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.7.3 | 类型安全 |
| Vite | 6.0.7 | 构建工具 |
| Tailwind CSS | latest | 样式框架 |
| shadcn/ui | latest | UI组件库 |
| React Router | latest | 路由管理 |
| Zustand | latest | 状态管理 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 4.21.2 | Web框架 |
| TypeScript | 5.7.3 | 类型安全 |
| Prisma | 6.1.0 | ORM |
| SQLite | 3.x | 数据库 |

### 核心算法

#### 1. 多因素评分引擎
- **偏好匹配**：Jaccard相似度计算
- **质量评分**：基于景点评分、描述完整度
- **IoT评分**：实时拥挤度、天气状况
- **人群评分**：群体类型适配度

#### 2. K-means 地理聚类
- 按地理位置将景点分组
- 减少每日交通时间
- 提高游览效率

#### 3. 多样性约束
- 每天最多2个同类型景点
- 同类型景点不超过总量的50%
- 每天至少2种不同类型

#### 4. 2-opt 路径优化
- 贪心算法生成初始路线
- 2-opt算法局部优化
- 减少总行程距离

#### 5. 动态预算计算
- 城市等级识别（一线/二线/三线）
- 季节性价格调整（旺季/平季/淡季）
- 群体类型适配
- 预算优化建议

### 外部服务

| 服务 | 用途 |
|------|------|
| 智谱AI GLM-4 | AI对话助手,自然语言理解和行程创建 |
| 高德地图API | 景点数据、地理编码、路径规划 |
| OpenWeatherMap | 实时天气数据 |
| Cloudinary | 图片存储（可选） |

---

## 📁 项目结构

```
LiveTrip/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   │   ├── agentController.ts     # AI Agent控制器
│   │   │   └── advisorController.ts   # 对话管理控制器
│   │   ├── services/        # 业务逻辑
│   │   │   ├── agentService.ts        # AI Agent核心服务
│   │   │   ├── scoringEngine.ts      # 多因素评分引擎
│   │   │   ├── clusteringService.ts  # K-means聚类
│   │   │   ├── diversityService.ts   # 多样性约束
│   │   │   ├── routeOptimizer.ts      # 2-opt路径优化
│   │   │   ├── budgetOptimizer.ts     # 动态预算计算
│   │   │   ├── iotCheckService.ts     # IoT实时检查
│   │   │   ├── mustVisitSpotExtractor.ts  # 必选景点提取
│   │   │   ├── constraintAwarePlanner.ts  # 约束感知规划
│   │   │   └── chatHistoryService.ts      # 对话历史管理
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   ├── types/           # 类型定义
│   │   └── lib/            # 工具库
│   ├── prisma/             # 数据库迁移
│   └── scripts/            # 工具脚本
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── components/     # 组件
│   │   │   ├── AIFeatures.tsx         # AI对话界面
│   │   │   └── TripPlanningForm.tsx   # 行程规划表单
│   │   ├── pages/          # 页面
│   │   ├── api/            # API调用
│   │   └── store/          # 状态管理
│   └── public/             # 静态资源
├── README.md               # 项目说明
├── 使用说明文档.md          # 详细使用说明
├── 项目交接文档.md          # 项目交接文档
└── 算法分析报告.md          # 算法文档
```

---

## 🔧 开发指南

### 添加新功能

1. **后端开发**
```bash
cd backend
npm run dev
```

2. **前端开发**
```bash
cd frontend
npm run dev
```

### 数据库操作

```bash
# 查看数据库
npm run prisma:studio

# 重置数据库
npm run prisma:reset
```

### API文档

启动后端服务后，访问 http://localhost:3003/api-docs 查看完整的API文档。

---

## 📝 算法优化版本

### v2.0 核心改进

本次更新完成了算法的全面优化，主要改进包括：

#### Phase 1：核心算法重构
- ✅ 移除外部AI依赖，建立自主多因素评分引擎
- ✅ 实现K-means地理聚类，减少交通时间
- ✅ 添加多样性约束，确保推荐多样性
- ✅ 支持丰富的用户画像（群体类型、儿童/老人、兴趣标签）

#### Phase 2：优化层升级
- ✅ 升级为2-opt路径优化算法
- ✅ 集成体力权重到路径优化
- ✅ 实现IoT实时检查和排除机制
- ✅ 动态生成备选景点池

#### Phase 3：细节优化
- ✅ 动态预算计算（城市等级、季节性、群体类型）
- ✅ 异常处理和回退机制
- ✅ 数据验证和错误追踪

### 优化效果

- **多样性提升**：避免推荐相似景点，每天至少2种不同类型
- **效率提升**：2-opt算法比贪心算法平均减少20%行程距离
- **智能度提升**：多因素评分综合考虑用户偏好、景点质量、实时状况
- **健壮性提升**：完善的异常处理和回退机制

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 Issue
- 发送邮件至：your-email@example.com

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

特别感谢以下开源项目：
- React
- Express
- Prisma
- Tailwind CSS
- shadcn/ui

---

**LiveTrip - 让旅行更智能！** ✈️
