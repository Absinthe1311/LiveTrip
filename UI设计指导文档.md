# LiveTrip UI 设计指导文档

## 📋 概述

本文档为 LiveTrip 项目的 UI 设计指导文档，旨在帮助后续开发者理解当前的设计风格、布局规范和组件使用方式，确保新功能与现有界面风格保持一致。

---

## 🎨 设计风格

### 核心设计理念

**Glass-morphism（毛玻璃设计）**

- **沉浸式体验**：全屏背景图 + 半透明卡片层叠
- **呼吸感**：大量留白，元素间距宽松
- **动态光影**：背景动态光影效果，增强灵性
- **温暖配色**：琥珀金为主色调，与背景完美融合

### 配色方案

#### 主色调：琥珀金与暮光灰（Sunset Ember）

```css
/* 主色 - 琥珀金 */
--amber-400: #fbbf24;
--amber-500: #f59e0b;
--amber-600: #d97706;

/* 辅助色 - 暮光灰 */
--white: #ffffff;
--white/5: rgba(255, 255, 255, 0.05);
--white/10: rgba(255, 255, 255, 0.1);
--white/20: rgba(255, 255, 255, 0.2);
--white/60: rgba(255, 255, 255, 0.6);
--white/80: rgba(255, 255, 255, 0.8);

/* 背景色 */
--black/40: rgba(0, 0, 0, 0.4);
```

#### 配色原则

1. **主按钮**：琥珀金渐变（`from-amber-500 to-amber-600`）
2. **次按钮**：半透明白色（`bg-white/10`）
3. **选中状态**：琥珀金渐变 + 发光阴影
4. **未选中状态**：半透明白色
5. **文字**：白色（`text-white`）或半透明白色（`text-white/60`）

---

## 🏗️ 布局规范

### 页面布局结构

```
┌─────────────────────────────────────┐
│  GlassLayout（全屏背景）             │
│  ┌───────────────────────────────┐  │
│  │  左侧导航栏（固定 240px）      │  │
│  ├───────────────────────────────┤  │
│  │  主内容区（居中，最大 4xl）    │  │
│  │  - 顶部搜索栏（可选）          │  │
│  │  - 内容区域                    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  浮动 AI 按钮（右下角）        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### GlassLayout 组件

**文件位置**：`frontend/src/components/GlassLayout.tsx`

**核心样式**：
```tsx
// 全屏背景
<div className="fixed inset-0 bg-cover bg-center"
  style={{ backgroundImage: "url('/homepage-bg.jpg')" }} />

// 背景模糊层
<div className="fixed inset-0 bg-black/40 backdrop-blur-xl" />

// 动态光影效果
<div className="fixed inset-0 pointer-events-none z-0">
  <div className="absolute inset-0 bg-gradient-to-br from-livetrip-primary/5 via-transparent to-livetrip-accent/5 animate-pulse" />
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-livetrip-primary/10 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-livetrip-accent/10 rounded-full blur-3xl animate-pulse" />
</div>
```

---

## 🧩 核心组件

### 1. GlassCard（毛玻璃卡片）

**文件位置**：`frontend/src/components/home/GlassCard.tsx`

**样式规范**：
```tsx
<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
  {children}
</div>
```

**使用场景**：
- 所有内容容器
- 表单区域
- 列表项

### 2. 输入框

**样式规范**：
```tsx
<input
  className="w-full px-6 py-5 text-lg rounded-xl 
    bg-white/10 backdrop-blur-md 
    border border-white/20 
    text-white placeholder-white/40 
    transition-all duration-300 
    focus:bg-white/15 
    focus:border-amber-400/50 
    focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] 
    focus:outline-none"
/>
```

**关键特性**：
- 背景：`bg-white/10 backdrop-blur-md`
- 边框：`border border-white/20`
- Focus 效果：琥珀色发光
- 字体：`text-lg`（大字体）
- 内边距：`px-6 py-5`

### 3. 主按钮

**样式规范**：
```tsx
<button className="relative px-8 py-4 rounded-xl 
  bg-gradient-to-r from-amber-500 to-amber-600 
  text-white font-semibold text-lg 
  border border-white/20 
  shadow-lg shadow-amber-500/30 
  hover:shadow-xl hover:shadow-amber-500/40 
  hover:scale-105 
  active:scale-95 
  transition-all duration-300 
  overflow-hidden"
>
  {/* 高光层 */}
  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
  <span className="relative">按钮文字</span>
</button>
```

**关键特性**：
- 渐变背景：`from-amber-500 to-amber-600`
- 高光层：`from-white/20 to-transparent`
- 发光阴影：`shadow-amber-500/30`
- 悬停效果：放大 + 阴影增强
- 按下效果：缩小

### 4. 次按钮

**样式规范**：
```tsx
<button className="px-6 py-4 rounded-xl 
  bg-white/10 backdrop-blur-sm 
  border border-white/20 
  text-white/70 font-medium 
  hover:bg-white/15 hover:text-white 
  transition-all duration-300"
>
  按钮文字
</button>
```

### 5. 卡片选择器

**样式规范**：
```tsx
<button className={`p-4 rounded-xl border-2 transition-all duration-300 ${
  isSelected
    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
    : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
}`}>
  {/* 内容 */}
</button>
```

**使用场景**：
- 预算范围选择
- 群体类型选择
- 热门目的地选择
- 兴趣偏好选择

---

## 📐 间距规范

### 内边距（Padding）

| 元素 | 内边距 | 使用场景 |
|------|--------|----------|
| 大卡片 | `p-8` | 主要内容区域 |
| 中卡片 | `p-6` | 次要内容区域 |
| 小卡片 | `p-4` | 紧凑内容区域 |
| 输入框 | `px-6 py-5` | 所有输入框 |
| 按钮 | `px-8 py-4` | 主按钮 |
| 小按钮 | `px-6 py-3` | 次按钮 |

### 外边距（Margin）

| 元素 | 外边距 | 使用场景 |
|------|--------|----------|
| 标题 | `mb-6` | 标题下方 |
| 区块 | `space-y-6` | 垂直排列的区块 |
| 选项 | `gap-3` / `gap-4` | 网格布局的间距 |

---

## 🎭 动效规范

### 过渡动画

**基础过渡**：
```css
transition-all duration-300
```

**长过渡**：
```css
transition-all duration-500
```

### 悬停效果

**放大**：
```css
hover:scale-105
```

**缩小**：
```css
active:scale-95
```

**阴影增强**：
```css
hover:shadow-xl
```

### 脉冲动画

**呼吸动效**：
```css
animate-pulse
style={{ animationDuration: '3s' }}
```

---

## 📱 响应式设计

### 断点

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### 布局示例

**网格布局**：
```tsx
// 4 列网格（预算范围）
<div className="grid grid-cols-4 gap-3">

// 3 列网格（群体类型、热门目的地）
<div className="grid grid-cols-3 gap-4">

// 2 列网格（日期选择）
<div className="grid grid-cols-2 gap-4">
```

---

## 🎯 特殊组件

### 1. AI 悬浮聊天窗口

**位置**：右下角，距离按钮上方 100px

**样式**：
```tsx
<div className="fixed z-50"
  style={{ bottom: '100px', right: '32px', width: '380px', maxHeight: '500px' }}
>
  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
    {/* 头部 */}
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      {/* 内容 */}
    </div>
    {/* 内容区 */}
    <div className="flex-1 overflow-y-auto" style={{ minHeight: '300px' }}>
      {/* AI 顾问组件 */}
    </div>
  </div>
</div>
```

### 2. 浮动 AI 按钮

**位置**：右下角固定

**样式**：
```tsx
<button className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full 
  bg-gradient-to-r from-amber-500 to-amber-600 
  shadow-lg shadow-amber-500/40 
  hover:scale-110 hover:shadow-xl 
  transition-all duration-300 
  animate-pulse"
  style={{ animationDuration: '3s' }}
>
  <Sparkles className="w-7 h-7 text-white" />
</button>
```

### 3. 步骤指示器

**样式**：
```tsx
// 当前步骤
<div className="w-14 h-14 rounded-full 
  bg-livetrip-primary scale-110 
  shadow-lg shadow-livetrip-primary/50">
  <Icon className="w-6 h-6 text-white" />
</div>

// 已完成步骤
<div className="w-14 h-14 rounded-full 
  bg-livetrip-primary/30 
  border-2 border-livetrip-primary">
  <Check className="w-6 h-6 text-white" />
</div>

// 未完成步骤
<div className="w-14 h-14 rounded-full 
  bg-white/10 
  border-2 border-white/20">
  <Icon className="w-6 h-6 text-white/40" />
</div>
```

---

## 📝 文字规范

### 字体大小

| 元素 | 字体大小 | 使用场景 |
|------|----------|----------|
| 页面标题 | `text-3xl` | 页面主标题 |
| 区块标题 | `text-2xl` | 区块标题 |
| 卡片标题 | `text-lg` / `text-xl` | 卡片标题 |
| 正文 | `text-base` | 正文内容 |
| 小字 | `text-sm` | 辅助文字 |
| 极小字 | `text-xs` | 标签、提示 |

### 字重

| 元素 | 字重 | 使用场景 |
|------|------|----------|
| 标题 | `font-bold` | 所有标题 |
| 按钮 | `font-semibold` | 按钮文字 |
| 正文 | `font-medium` | 正文内容 |
| 辅助文字 | `font-normal` | 辅助文字 |

---

## 🎨 图标规范

### 图标库

**使用 Lucide React**

**常用图标**：
```tsx
import { 
  MapPin,        // 出发地
  Navigation,    // 目的地
  Calendar,      // 日期
  Wallet,        // 预算
  Users,         // 群体
  Heart,         // 兴趣
  User,          // 独自旅行
  HeartHandshake,// 情侣
  UsersRound,    // 好友
  Briefcase,     // 商务
  Building2,     // 团队
  Sparkles,      // AI
  Locate,        // 定位
  Send,          // 发送
  Bot,           // 机器人
} from "lucide-react";
```

### 图标尺寸

| 元素 | 尺寸 | 使用场景 |
|------|------|----------|
| 大图标 | `w-8 h-8` | 群体类型卡片 |
| 中图标 | `w-6 h-6` / `w-7 h-7` | 预算范围、步骤指示器 |
| 小图标 | `w-5 h-5` | 按钮、输入框 |
| 极小图标 | `w-4 h-4` | 标签、辅助文字 |

### 图标颜色

- **白色**：`text-white`（主要图标）
- **琥珀色**：`text-amber-400`（AI 相关图标）
- **半透明白色**：`text-white/60`（辅助图标）

---

## 🚀 开发建议

### 新增页面

1. 使用 `GlassLayout` 作为外层容器
2. 内容区域使用 `max-w-4xl mx-auto py-8` 居中
3. 所有卡片使用 `GlassCard` 组件
4. 输入框、按钮遵循上述样式规范

### 新增组件

1. 使用毛玻璃效果：`bg-white/10 backdrop-blur-md`
2. 边框：`border border-white/20`
3. 圆角：`rounded-xl` 或 `rounded-2xl`
4. 过渡动画：`transition-all duration-300`

### 样式检查清单

- [ ] 使用琥珀金配色
- [ ] 使用毛玻璃效果
- [ ] 添加 Focus 发光效果
- [ ] 添加悬停动画
- [ ] 使用 Lucide 图标
- [ ] 遵循间距规范
- [ ] 遵循字体规范

---

## 📚 参考资源

### 设计灵感

- **Glass-morphism**：https://glassmorphism.com/
- **Tailwind CSS**：https://tailwindcss.com/
- **Lucide Icons**：https://lucide.dev/

### 相关文件

- **GlassLayout**：`frontend/src/components/GlassLayout.tsx`
- **GlassCard**：`frontend/src/components/home/GlassCard.tsx`
- **PlanGlass**：`frontend/src/pages/PlanGlass.tsx`（创建行程页面）
- **Home**：`frontend/src/pages/Home.tsx`（首页）

---

**最后更新时间**：2026-04-11

**维护者**：LiveTrip 开发团队

## 📋 功能更新记录

### 2026-04-11 更新
- ✅ 优化背景图更换功能，只在首页显示更换背景按钮
- ✅ 修复背景图显示问题，避免图片截取和放大
- ✅ 优化日历组件，添加独立的开始/结束日期显示区域
- ✅ 优化收藏页面景点卡片显示，支持图片和完整信息展示
