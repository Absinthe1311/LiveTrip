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

---

## 🛠 技术栈

### 前端技术

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design
- **状态管理**: Zustand
- **拖拽**: dnd-kit
- **图表**: Recharts
- **地图**: 高德地图 API

### 后端技术

- **运行环境**: Node.js
- **框架**: Express + TypeScript
- **ORM**: Prisma
- **数据库**: SQLite
- **AI服务**: 高德地图 API

### 核心依赖

- **前端**: react, react-dom, antd, @dnd-kit/core, recharts
- **后端**: express, @prisma/client, axios, amap-geocode
- **工具**: typescript, vite, nodemon

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
│   │   ├── models/              # 数据模型
│   │   └── types/               # 类型定义
│   ├── prisma/                  # Prisma配置
│   └── package.json
│
├── frontend/                   # 前端项目
│   ├── src/                     # 源代码目录
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # 公共组件
│   │   ├── api/                 # API客户端
│   │   ├── services/            # 前端服务
│   │   ├── store/               # 状态管理
│   │   └── types/               # 类型定义
│   ├── public/                  # 公共资源
│   └── package.json
│
├── image/                      # 图片资源
├── README.md                   # 项目说明文档
├── 使用说明文档.md              # 使用说明文档
└── 项目交接文档.md              # 项目交接文档
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
AMAP_API_KEY=your_api_key_here
CORS_ORIGIN=http://localhost:5174
```

#### 前端配置 (`frontend/.env`)

```env
VITE_AMAP_KEY=your_api_key_here
VITE_API_BASE_URL=http://localhost:3003/api
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
- 前端地址: http://localhost:5174

---

## 🎯 核心功能

### 1. 智能行程规划

根据用户输入的目的地、日期、预算、偏好等信息，AI自动生成个性化旅行行程。

### 2. 行程管理

- 查看每日行程安排
- 拖拽调整景点顺序
- 查看行程地图
- 查看预算分配

### 3. 备选景点推荐

- 查看每个景点的备选列表
- 基于IoT数据智能推荐
- 一键替换景点
- 备选关系动态更新

### 4. IoT数据展示

- 实时显示景点人流情况
- 显示天气信息
- 显示景点开放状态
- 多样化数据展示

### 5. 地图可视化

- 显示行程路线
- 显示周围餐厅和娱乐场所
- 交互式地图标记

---

## 📊 数据库设计

### 主要表结构

- **Spot** - 景点信息表
- **SpotIoTData** - IoT数据表
- **SpotAlternative** - 备选关系表
- **LocationCache** - 地点缓存表
- **Plan** - 行程计划表

---

## 🔧 开发指南

### 添加新功能

1. 在对应的服务层添加业务逻辑
2. 在控制器层添加API接口
3. 在路由层注册路由
4. 在前端添加UI组件和API调用

### 运行测试

```bash
# 后端测试
cd backend
npm run dev

# 前端测试
cd frontend
npm run dev
```

---

## 📝 更新日志

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
