# LiveTrip - AI + IoT 智能旅行规划系统

<div align="center">

![LiveTrip Logo](https://img.shields.io/badge/LiveTrip-AI%20%2B%20IoT-blue?style=for-the-badge)

**基于人工智能和物联网的智能旅行规划系统**

[在线演示](#) | [功能特性](#功能特性) | [快速开始](#快速开始) | [技术栈](#技术栈)

</div>

---

## 📖 项目简介

LiveTrip 是一个基于 **AI + IoT** 的智能旅行规划系统，结合智谱AI（ChatGLM）的强大能力和物联网实时数据，为用户提供个性化的旅行规划服务。

### 核心亮点

- 🤖 **AI智能规划**：基于智谱AI的智能行程规划，自动生成最优路线和时间安排
- 📡 **IoT实时数据**：集成物联网传感器数据，提供景点拥挤度、天气等实时信息
- 🗺️ **智能推荐**：景点、酒店、餐厅智能推荐，支持备选景点查看和替换
- 📱 **现代化UI**：采用 Tailwind CSS + shadcn/ui 的现代化界面设计
- 🔗 **行程分享**：支持行程链接分享和PDF导出
- 📸 **图片管理**：景点图片上传、审核和管理功能
- ✍️ **游记撰写**：行程完成后可撰写游记，记录美好时光

---

## ✨ 功能特性

### 用户功能

| 功能模块 | 功能描述 |
|---------|---------|
| **AI行程规划** | 输入目的地、日期、预算，AI自动生成完整行程 |
| **实时数据** | 查看景点拥挤度、天气、开放状态等IoT数据 |
| **景点管理** | 拖拽排序、查看备选、替换景点 |
| **酒店推荐** | 基于位置和预算的智能酒店推荐 |
| **餐厅推荐** | 每日餐厅推荐，支持选择和跳过 |
| **行程分享** | 生成分享链接，好友可查看行程 |
| **PDF导出** | 导出精美PDF行程单 |
| **图片上传** | 行程完成后上传景点图片 |
| **游记撰写** | Markdown编辑器，支持图片和格式化 |
| **收藏管理** | 收藏喜欢的景点、酒店、餐厅 |

### 管理员功能

| 功能模块 | 功能描述 |
|---------|---------|
| **图片审核** | 审核用户上传的景点图片 |
| **景点管理** | 管理景点信息和图片 |

---

## 🛠️ 技术栈

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.7.3 | 类型安全 |
| Vite | 6.0.7 | 构建工具 |
| Tailwind CSS | 3.4.19 | 样式框架 |
| shadcn/ui | - | UI组件库 |
| Ant Design | 5.22.5 | 企业级UI组件 |
| Zustand | 5.0.2 | 状态管理 |
| React Router | 7.1.1 | 路由管理 |
| Axios | 1.7.9 | HTTP客户端 |
| @dnd-kit | - | 拖拽排序 |
| ECharts | 6.0.0 | 图表可视化 |
| jsPDF | 4.2.0 | PDF生成 |
| Lucide React | - | 图标库 |

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | - | 运行环境 |
| Express | 4.21.2 | Web框架 |
| Prisma | 6.1.0 | ORM框架 |
| SQLite | - | 数据库 |
| JWT | - | 身份认证 |
| bcryptjs | - | 密码加密 |
| Cloudinary | - | 图片存储 |
| 智谱AI | - | AI服务 |
| 高德地图 | - | 地图服务 |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/livetrip.git
cd livetrip
```

#### 2. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

#### 3. 配置环境变量

**后端配置**：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-jwt-secret-key

# 智谱AI
ZHIPUAI_API_KEY=your-zhipuai-api-key

# 高德地图
AMAP_JS_KEY=your-amap-js-key
AMAP_JS_SECRET=your-amap-js-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**前端配置**：

```bash
cd ../frontend
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_AMAP_JS_KEY=your-amap-js-key
VITE_AMAP_JS_SECRET=your-amap-js-secret
VITE_ZHIPUAI_API_KEY=your-zhipuai-api-key
```

#### 4. 初始化数据库

```bash
cd backend

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充初始数据
npm run prisma:seed
```

#### 5. 启动项目

**启动后端**：

```bash
cd backend
npm run dev
```

**启动前端**（新终端）：

```bash
cd frontend
npm run dev
```

#### 6. 访问应用

打开浏览器访问：http://localhost:5173

---

## 📁 项目结构

```
LiveTrip/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── store/           # 状态管理
│   │   ├── services/        # 服务
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 服务
│   │   └── utils/           # 工具函数
│   ├── prisma/              # 数据库
│   │   ├── schema.prisma    # 数据库模型
│   │   └── seed.ts          # 初始数据
│   └── package.json
│
├── README.md                 # 项目说明
├── 使用说明文档.md           # 用户手册
└── 项目交接文档.md           # 交接文档
```

---

## 🔑 API Key 获取

### 智谱AI

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册账号并登录
3. 在控制台创建API Key
4. 复制API Key到环境变量

### 高德地图

1. 访问 [高德开放平台](https://console.amap.com/)
2. 注册账号并登录
3. 创建应用，选择"Web服务"
4. 获取Key和密钥
5. 复制到环境变量

### Cloudinary

1. 访问 [Cloudinary](https://cloudinary.com/)
2. 注册账号并登录
3. 在Dashboard获取配置信息
4. 复制到环境变量

---

## 📝 开发指南

### 前端开发

```bash
cd frontend

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 后端开发

```bash
cd backend

# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm run start

# 数据库操作
npm run prisma:studio    # 打开Prisma Studio
npm run prisma:migrate   # 运行迁移
npm run prisma:reset     # 重置数据库
```

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 👥 联系方式

- 项目主页：https://github.com/your-username/livetrip
- 问题反馈：https://github.com/your-username/livetrip/issues

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star ⭐**

Made with ❤️ by LiveTrip Team

</div>
