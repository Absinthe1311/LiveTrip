# LiveTrip UI 设计指导文档

## 📋 概述

本文档为 LiveTrip 项目的 UI 设计指导文档，基于 PlanGlass（行程创建）界面的实际配色方案，旨在帮助后续开发者理解当前的设计风格、布局规范和组件使用方式，确保新功能与现有界面风格保持一致。

---

## 🎨 设计风格

### 核心设计理念

**Glass-morphism（毛玻璃设计）**

- **沉浸式体验**：全屏背景图 + 半透明卡片层叠
- **呼吸感**：大量留白，元素间距宽松
- **动态光影**：背景动态光影效果，增强灵性
- **清新配色**：以松绿色、墨绿色为主色调，搭配圣诞红和青苹果色

### 配色方案

#### 主色调：松绿色与墨绿色系（LiveTrip Brand Colors）

```css
/* ==================== 颜色组合定义 ==================== */

/* 组合 1：青苹果 + 奶酪色 */
--apple-green: #73AE52;      /* 青苹果 - 清新活力 */
--cheese: #FBF1D7;           /* 奶酪色 - 温暖柔和 */

/* 组合 2：松绿色 + 圣诞红 */
--pine-green: #145F39;       /* 松绿色 - 主品牌色 */
--christmas-red: #AE1C31;    /* 圣诞红 - 强调色、AI */

/* 组合 3：墨绿色 + 马尔斯绿 */
--ink-green: #005746;        /* 墨绿色 - 深沉稳重 */
--mars-green: #008F8D;       /* 马尔斯绿 - 青绿色调 */

/* 组合 4：梅子青色 + 蜂蜜黄 */
--plum-cyan: #718771;        /* 梅子青色 - 优雅柔和 */
--honey-yellow: #FFD9A3;     /* 蜂蜜黄 - 温暖甜美 */

/* 组合 5：瓦松绿 + 淡翠绿 */
--tile-pine: #6F9986;        /* 瓦松绿 - 自然清新 */
--pale-emerald: #CDEDDE;     /* 淡翠绿 - 清新明亮 */

/* 组合 6：黛绿 + 竹子青 */
--dark-green: #406462;       /* 黛绿 - 深沉内敛 */
--bamboo-cyan: #758B5F;      /* 竹子青 - 自然质朴 */

/* ==================== 功能色定义 ==================== */

/* 主色系 */
--livetrip-primary: #145F39;      /* 松绿色 - 主品牌色 */
--livetrip-primary-dark: #005746; /* 墨绿色 - 更深的绿色 */
--livetrip-primary-light: #CDEDDE;/* 淡翠绿 - 浅绿色背景 */

/* 辅助色系 */
--livetrip-accent: #AE1C31;       /* 圣诞红 - 强调色 */
--livetrip-accent-light: #FFD9A3; /* 蜂蜜黄 - 温暖强调 */

/* 功能色 */
--green-400: #4ade80;             /* 输入框 focus 边框 */
--green-500: #22c55e;             /* 兴趣偏好选中 */
--green-600: #16a34a;             /* 生成按钮渐变起点 */
--emerald-600: #059669;           /* 生成按钮渐变终点 */

/* 辅助色 - 暮光灰 */
--white: #ffffff;
--white/5: rgba(255, 255, 255, 0.05);
--white/10: rgba(255, 255, 255, 0.1);
--white/15: rgba(255, 255, 255, 0.15);
--white/20: rgba(255, 255, 255, 0.2);
--white/30: rgba(255, 255, 255, 0.3);
--white/40: rgba(255, 255, 255, 0.4);
--white/50: rgba(255, 255, 255, 0.5);
--white/60: rgba(255, 255, 255, 0.6);
--white/70: rgba(255, 255, 255, 0.7);
--white/80: rgba(255, 255, 255, 0.8);

/* 背景色 */
--black/40: rgba(0, 0, 0, 0.4);
```

#### 配色原则

1. **主按钮（下一步）**：淡翠绿渐变（`from-[#CDEDDE] to-[#CDEDDE]/80`）+ 墨绿色文字（`text-[#005746]`）
2. **生成按钮**：绿色渐变（`from-green-600 to-emerald-600`）+ 白色文字
3. **次按钮**：半透明白色（`bg-white/10`）+ 半透明白色文字（`text-white/70`）
4. **输入框 Focus**：绿色边框（`border-green-400/50`）+ 绿色发光阴影
5. **选中状态**：
   - 热门目的地：马尔斯绿渐变（`from-[#008F8D]/30`）
   - 预算范围：蜂蜜黄渐变（`from-[#FFD9A3]/40`）
   - 群体类型：淡翠绿渐变（`from-[#CDEDDE]/30`）
   - 兴趣偏好：绿色渐变（`from-green-500/30`）
6. **未选中状态**：半透明白色（`bg-white/5 border-white/20`）
7. **文字**：白色（`text-white`）或半透明白色（`text-white/60`、`text-white/70`）
8. **AI 相关**：圣诞红（`text-[#AE1C31]`）

---

## 🎨 颜色组合详解

### 组合 1：青苹果 + 奶酪色

| 颜色名称 | 色值 | RGB | 使用场景 |
|---------|------|-----|----------|
| 青苹果 | #73AE52 | rgb(115, 174, 82) | 清新活力、成功状态、积极元素 |
| 奶酪色 | #FBF1D7 | rgb(251, 241, 215) | 温暖柔和、背景色、卡片背景 |

**适用场景**：
- 成功提示、完成状态
- 温暖友好的界面背景
- 需要传达积极、乐观情绪的元素

### 组合 2：松绿色 + 圣诞红

| 颜色名称 | 色值 | RGB | 使用场景 |
|---------|------|-----|----------|
| 松绿色 | #145F39 | rgb(20, 95, 57) | 主品牌色、步骤指示器、重要元素 |
| 圣诞红 | #AE1C31 | rgb(174, 28, 49) | 强调色、AI 功能、重要提示 |

**适用场景**：
- 品牌主色调、Logo、重要按钮
- AI 相关功能、特殊强调
- 需要突出显示的重要元素

### 组合 3：墨绿色 + 马尔斯绿

| 颜色名称 | 色值 | RGB | 使用场景 |
|---------|------|-----|----------|
| 墨绿色 | #005746 | rgb(0, 87, 70) | 深沉稳重、按钮文字、定位功能 |
| 马尔斯绿 | #008F8D | rgb(0, 143, 141) | 青绿色调、热门目的地选中 |

**适用场景**：
- 按钮文字、需要高对比度的文字
- 热门目的地、重要选项选中状态
- 需要传达专业、稳重感的元素

### 组合 4：梅子青色 + 蜂蜜黄

| 颜色名称 | 色值 | RGB | 使用场景 |
|---------|------|-----|----------|
| 梅子青色 | #718771 | rgb(113, 135, 113) | 优雅柔和、次要元素 |
| 蜂蜜黄 | #FFD9A3 | rgb(255, 217, 163) | 温暖甜美、预算范围选中 |

**适用场景**：
- 预算范围、价格相关元素
- 次要信息、辅助元素
- 需要传达温暖、舒适感的界面

### 组合 5：瓦松绿 + 淡翠绿

| 颜色名称 | 色值 | RGB | 使用场景 |
|---------|------|-----|----------|
| 瓦松绿 | #6F9986 | rgb(111, 153, 134) | 自然清新、过渡元素 |
| 淡翠绿 | #CDEDDE | rgb(205, 237, 222) | 清新明亮、下一步按钮、群体类型选中 |

**适用场景**：
- 下一步按钮、主要操作按钮
- 群体类型选择、分类元素
- 需要传达清新、自然感的界面

### 组合 6：黛绿 + 竹子青

| 颜色名称 | 色值 | RGB | 使用场景 |
|---------|------|-----|----------|
| 黛绿 | #406462 | rgb(64, 100, 98) | 深沉内敛、背景元素 |
| 竹子青 | #758B5F | rgb(117, 139, 95) | 自然质朴、辅助元素 |

**适用场景**：
- 深色背景、需要降低视觉冲击的元素
- 辅助信息、次要功能
- 需要传达内敛、质朴感的界面

---

## 🏗️ 布局规范

### 页面布局结构

```
┌─────────────────────────────────────┐
│  GlassLayout（全屏背景）             │
│  ┌───────────────────────────────┐  │
│  │  动态光影层（z-0）             │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  主内容区（z-10，最大 4xl）    │  │
│  │  - 步骤指示器                 │  │
│  │  - 内容区域                   │  │
│  │  - 导航按钮                   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  浮动 AI 按钮（右下角 z-40）   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  AI 聊天窗口（右下角 z-50）    │  │
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
  <div className="absolute inset-0 bg-gradient-to-br from-[#145F39]/5 via-transparent to-[#AE1C31]/5 animate-pulse" 
       style={{ animationDuration: '8s' }} />
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#145F39]/10 rounded-full blur-3xl animate-pulse" 
       style={{ animationDuration: '12s' }} />
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#AE1C31]/10 rounded-full blur-3xl animate-pulse" 
       style={{ animationDuration: '15s' }} />
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
- 步骤指示器容器

### 2. 输入框

**样式规范**：
```tsx
<input
  className="w-full pl-12 pr-6 py-5 text-lg rounded-xl 
    bg-white/10 backdrop-blur-md 
    border border-white/20 
    text-white placeholder-white/40 
    transition-all duration-300 
    focus:bg-white/15 
    focus:border-green-400/50 
    focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] 
    focus:outline-none"
/>
```

**关键特性**：
- 背景：`bg-white/10 backdrop-blur-md`
- 边框：`border border-white/20`
- Focus 效果：绿色边框 + 绿色发光阴影
- 字体：`text-lg`（大字体）
- 内边距：`pl-12 pr-6 py-5`（左侧留图标位置）

### 3. 主按钮（下一步）

**样式规范**：
```tsx
<button className="relative flex-1 px-8 py-4 rounded-xl 
  bg-gradient-to-r from-[#CDEDDE] to-[#CDEDDE]/80 
  text-[#005746] font-semibold text-lg 
  border border-[#CDEDDE]/50 
  shadow-lg shadow-[#CDEDDE]/30 
  hover:shadow-xl hover:shadow-[#CDEDDE]/40 
  hover:scale-105 
  active:scale-95 
  transition-all duration-300 
  overflow-hidden"
>
  {/* 高光层 */}
  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
  <span className="relative">下一步</span>
</button>
```

**关键特性**：
- 渐变背景：`from-[#CDEDDE] to-[#CDEDDE]/80`（淡翠绿）
- 文字颜色：`text-[#005746]`（墨绿色）
- 高光层：`from-white/20 to-transparent`
- 发光阴影：`shadow-[#CDEDDE]/30`
- 悬停效果：放大 + 阴影增强
- 按下效果：缩小

### 4. 生成按钮

**样式规范**：
```tsx
<button className="relative flex-1 px-8 py-4 rounded-xl 
  bg-gradient-to-r from-green-600 to-emerald-600 
  text-white font-semibold text-lg 
  border border-green-500/30 
  shadow-lg shadow-green-600/30 
  hover:shadow-xl hover:shadow-green-600/40 
  hover:scale-105 
  active:scale-95 
  transition-all duration-300 
  overflow-hidden"
>
  {/* 高光层 */}
  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
  <span className="relative">生成行程</span>
</button>
```

### 5. 次按钮（上一步）

**样式规范**：
```tsx
<button className="flex-1 px-6 py-4 rounded-xl 
  bg-white/10 backdrop-blur-sm 
  border border-white/20 
  text-white/70 font-medium 
  hover:bg-white/15 hover:text-white 
  transition-all duration-300"
>
  上一步
</button>
```

### 6. 卡片选择器

#### 热门目的地选择器
```tsx
<button className={`p-3 rounded-xl border transition-all duration-300 text-left ${
  isSelected
    ? 'bg-gradient-to-r from-[#008F8D]/30 to-[#008F8D]/20 border-[#008F8D]/50 shadow-lg shadow-[#008F8D]/20'
    : 'bg-white/5 border-white/20 hover:bg-[#008F8D]/10 hover:border-[#008F8D]/30'
}`}>
  {/* 内容 */}
</button>
```
**颜色**：马尔斯绿（#008F8D）

#### 预算范围选择器
```tsx
<button className={`p-4 rounded-xl border-2 transition-all duration-300 ${
  isSelected
    ? 'bg-gradient-to-r from-[#FFD9A3]/40 to-[#FFD9A3]/20 border-[#FFD9A3]/60 shadow-lg shadow-[#FFD9A3]/30'
    : 'bg-white/5 border-white/20 hover:bg-[#FFD9A3]/15 hover:border-[#FFD9A3]/40'
}`}>
  {/* 内容 */}
</button>
```
**颜色**：蜂蜜黄（#FFD9A3）

#### 群体类型选择器
```tsx
<button className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${
  isSelected
    ? 'bg-gradient-to-r from-[#CDEDDE]/30 to-[#CDEDDE]/20 border-[#CDEDDE]/50 shadow-lg shadow-[#CDEDDE]/20'
    : 'bg-white/5 border-white/20 hover:bg-[#CDEDDE]/10 hover:border-[#CDEDDE]/30'
}`}>
  {/* 内容 */}
</button>
```
**颜色**：淡翠绿（#CDEDDE）

#### 兴趣偏好选择器
```tsx
<button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
  isSelected
    ? 'bg-gradient-to-r from-green-500/30 to-green-600/30 border-green-400/50 text-white shadow-lg shadow-green-500/20'
    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
}`}>
  {/* 内容 */}
</button>
```
**颜色**：绿色系（green-500/600）

### 7. 定位按钮

**样式规范**：
```tsx
<button className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-lg 
  bg-[#005746]/20 
  border border-[#005746]/40 
  text-[#005746] 
  hover:bg-[#005746]/30 
  transition-all duration-300 
  text-sm"
>
  <Locate className="w-4 h-4" />
  <span>使用当前位置</span>
</button>
```
**颜色**：墨绿色（#005746）

---

## 📐 间距规范

### 内边距（Padding）

| 元素 | 内边距 | 使用场景 |
|------|--------|----------|
| 大卡片 | `p-8` | 主要内容区域（步骤内容） |
| 中卡片 | `p-6` | 次要内容区域、个性化设置 |
| 小卡片 | `p-4` | 紧凑内容区域、步骤指示器 |
| 输入框 | `pl-12 pr-6 py-5` | 带图标的输入框 |
| 主按钮 | `px-8 py-4` | 下一步、生成按钮 |
| 次按钮 | `px-6 py-4` | 上一步按钮 |
| 小按钮 | `px-4 py-2.5` | 定位按钮 |
| 选择器 | `p-3` / `p-4` / `p-5` | 卡片选择器 |

### 外边距（Margin）

| 元素 | 外边距 | 使用场景 |
|------|--------|----------|
| 标题 | `mb-6` / `mb-4` | 标题下方 |
| 区块 | `space-y-6` | 垂直排列的区块 |
| 选项 | `gap-3` / `gap-4` | 网格布局的间距 |
| 表单项 | `space-y-6` | 表单内间距 |

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

**慢速呼吸**：
```css
animate-pulse
style={{ animationDuration: '8s' }}
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

// 2 列网格（日期选择、预算输入）
<div className="grid grid-cols-2 gap-4">
```

---

## 🎯 特殊组件

### 1. 步骤指示器

**样式规范**：
```tsx
// 当前步骤
<div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
  transition-all duration-500
  bg-[#145F39] scale-110 
  shadow-lg shadow-[#145F39]/50">
  <Icon className="w-4 h-4 text-white" />
</div>

// 已完成步骤
<div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
  transition-all duration-500
  bg-[#145F39]/30 
  border-2 border-[#145F39]">
  <Check className="w-4 h-4 text-white" />
</div>

// 未完成步骤
<div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
  transition-all duration-500
  bg-white/10 
  border-2 border-white/20">
  <Icon className="w-4 h-4 text-white/40" />
</div>

// 连接线
<div className="w-8 h-0.5 flex-shrink-0 transition-all duration-500 bg-[#145F39]" />
```
**颜色**：松绿色（#145F39）

### 2. AI 悬浮聊天窗口

**位置**：右下角，距离按钮上方 100px

**样式**：
```tsx
<div className="fixed z-50"
  style={{ bottom: '100px', right: '32px', width: '380px', maxHeight: '500px' }}
>
  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
    style={{ maxHeight: '500px' }}
  >
    {/* 头部 */}
    <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#AE1C31]" />
        <span className="text-base font-semibold text-white">AI 旅行顾问</span>
      </div>
      <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
        <X className="w-4 h-4 text-white/60" />
      </button>
    </div>
    {/* 内容区 */}
    <div className="flex-1 overflow-y-auto" style={{ minHeight: '300px' }}>
      {/* AI 顾问组件 */}
    </div>
  </div>
</div>
```
**颜色**：圣诞红（#AE1C31）

### 3. 浮动 AI 按钮

**位置**：右下角固定

**样式**：
```tsx
<button className={`fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full 
  shadow-lg transition-all duration-300 flex items-center justify-center group ${
    isOpen 
      ? 'bg-white/20 backdrop-blur-md border-2 border-white/30 scale-90' 
      : 'bg-gradient-to-r from-[#AE1C31] to-[#AE1C31]/80 shadow-[#AE1C31]/40 hover:scale-110 hover:shadow-xl animate-pulse'
  }`}
  style={!isOpen ? { animationDuration: '3s' } : {}}
>
  <Sparkles className={`w-7 h-7 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : 'group-hover:rotate-12'}`} />
  {!isOpen && (
    <span className="absolute -top-12 right-0 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/20">
      AI 旅行顾问
    </span>
  )}
</button>
```
**颜色**：圣诞红（#AE1C31）

---

## 📝 文字规范

### 字体大小

| 元素 | 字体大小 | 使用场景 |
|------|----------|----------|
| 页面标题 | `text-3xl` | 页面主标题 |
| 区块标题 | `text-2xl` | 区块标题（步骤内容） |
| 卡片标题 | `text-lg` / `text-xl` | 卡片标题 |
| 正文 | `text-base` | 正文内容、描述 |
| 小字 | `text-sm` | 辅助文字、标签 |
| 极小字 | `text-xs` | 提示文字、统计 |

### 字重

| 元素 | 字重 | 使用场景 |
|------|------|----------|
| 标题 | `font-bold` | 所有标题 |
| 按钮 | `font-semibold` | 按钮文字 |
| 正文 | `font-medium` | 正文内容、标签 |
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
  ArrowRight,    // 下一步
  ArrowLeft,     // 上一步
  Check,         // 完成
  X,             // 关闭
  Upload,        // 上传
} from "lucide-react";
```

### 图标尺寸

| 元素 | 尺寸 | 使用场景 |
|------|------|----------|
| 大图标 | `w-7 h-7` | 群体类型卡片、AI 按钮 |
| 中图标 | `w-6 h-6` | 预算范围、生成按钮 |
| 小图标 | `w-5 h-5` | 输入框、导航按钮 |
| 极小图标 | `w-4 h-4` | 标签、步骤指示器、定位按钮 |

### 图标颜色

- **白色**：`text-white`（主要图标）
- **半透明白色**：`text-white/40`（占位符图标）、`text-white/60`（辅助图标）
- **墨绿色**：`text-[#005746]`（定位按钮）
- **马尔斯绿**：`text-[#008F8D]`（热门目的地图标）
- **绿色**：`text-green-400`（兴趣分类图标）
- **圣诞红**：`text-[#AE1C31]`（AI 相关图标）

---

## 🚀 开发建议

### 新增页面

1. 使用 `GlassLayout` 作为外层容器
2. 内容区域使用 `max-w-4xl mx-auto py-6 space-y-6` 居中
3. 所有卡片使用 `GlassCard` 组件
4. 输入框、按钮遵循上述样式规范
5. 添加动态光影效果（参考 PlanGlass）

### 新增组件

1. 使用毛玻璃效果：`bg-white/10 backdrop-blur-md`
2. 边框：`border border-white/20`
3. 圆角：`rounded-xl` 或 `rounded-2xl`
4. 过渡动画：`transition-all duration-300`
5. Focus 效果：绿色边框 + 绿色发光阴影

### 样式检查清单

- [ ] 使用松绿色/墨绿色配色
- [ ] 使用毛玻璃效果
- [ ] 添加 Focus 发光效果（绿色）
- [ ] 添加悬停动画
- [ ] 使用 Lucide 图标
- [ ] 遵循间距规范
- [ ] 遵循字体规范
- [ ] 添加动态光影效果

---

## 📚 参考资源

### 设计灵感

- **Glass-morphism**：https://glassmorphism.com/
- **Tailwind CSS**：https://tailwindcss.com/
- **Lucide Icons**：https://lucide.dev/

### 相关文件

- **GlassLayout**：`frontend/src/components/GlassLayout.tsx`
- **GlassCard**：`frontend/src/components/home/GlassCard.tsx`
- **PlanGlass**：`frontend/src/pages/PlanGlass.tsx`（创建行程页面 - 配色参考）
- **Home**：`frontend/src/pages/Home.tsx`（首页）
- **tailwind.config.js**：`frontend/tailwind.config.js`（颜色配置）

---

## 🎨 配色速查表

### 颜色组合总览

| 组合 | 颜色 1 | 色值 1 | 颜色 2 | 色值 2 | 使用场景 |
|------|--------|--------|--------|--------|----------|
| 组合 1 | 青苹果 | #73AE52 | 奶酪色 | #FBF1D7 | 成功状态、温暖背景 |
| 组合 2 | 松绿色 | #145F39 | 圣诞红 | #AE1C31 | 品牌主色、AI 功能 |
| 组合 3 | 墨绿色 | #005746 | 马尔斯绿 | #008F8D | 按钮文字、热门目的地 |
| 组合 4 | 梅子青色 | #718771 | 蜂蜜黄 | #FFD9A3 | 预算范围、次要元素 |
| 组合 5 | 瓦松绿 | #6F9986 | 淡翠绿 | #CDEDDE | 下一步按钮、群体类型 |
| 组合 6 | 黛绿 | #406462 | 竹子青 | #758B5F | 深色背景、辅助元素 |

### 主要功能色

| 颜色名称 | 色值 | Tailwind 类名 | 使用场景 |
|---------|------|--------------|----------|
| 松绿色（主色） | #145F39 | `[#145F39]` | 品牌主色、步骤指示器 |
| 圣诞红（强调） | #AE1C31 | `[#AE1C31]` | AI 功能、强调色 |
| 墨绿色 | #005746 | `[#005746]` | 定位按钮、下一步按钮文字 |
| 马尔斯绿 | #008F8D | `[#008F8D]` | 热门目的地选中 |
| 淡翠绿 | #CDEDDE | `[#CDEDDE]` | 下一步按钮、群体类型选中 |
| 蜂蜜黄 | #FFD9A3 | `[#FFD9A3]` | 预算范围选中 |
| 青苹果 | #73AE52 | `[#73AE52]` | 成功状态、积极元素 |
| 奶酪色 | #FBF1D7 | `[#FBF1D7]` | 温暖背景、卡片背景 |

### 透明度颜色

| 颜色 | 使用场景 |
|------|----------|
| `white/5` | 未选中卡片背景 |
| `white/10` | 输入框背景、次按钮背景 |
| `white/15` | Focus 状态背景 |
| `white/20` | 边框、高光层 |
| `white/30` | 选中状态边框 |
| `white/40` | 占位符文字、图标 |
| `white/50` | 未完成步骤文字 |
| `white/60` | 辅助文字、标签 |
| `white/70` | 次按钮文字、未选中文字 |
| `white/80` | 标签文字 |

---

## 🎨 Tailwind 配置建议

### 更新 tailwind.config.js

```javascript
// 在 tailwind.config.js 的 colors 中添加
colors: {
  // ... 其他颜色
  livetrip: {
    // 主色系
    primary: '#145F39',        // 松绿色
    'primary-dark': '#005746', // 墨绿色
    'primary-light': '#CDEDDE',// 淡翠绿
    
    // 辅助色系
    accent: '#AE1C31',         // 圣诞红
    'accent-light': '#FFD9A3', // 蜂蜜黄
    
    // 功能色
    'apple-green': '#73AE52',  // 青苹果
    'cheese': '#FBF1D7',       // 奶酪色
    'mars-green': '#008F8D',   // 马尔斯绿
    'plum-cyan': '#718771',    // 梅子青色
    'tile-pine': '#6F9986',    // 瓦松绿
    'dark-green': '#406462',   // 黛绿
    'bamboo-cyan': '#758B5F',  // 竹子青
  },
}
```

---

**最后更新时间**：2026-04-14

**维护者**：LiveTrip 开发团队

## 📋 功能更新记录

### 2026-04-14 更新（第二次）
- ✅ 添加详细的颜色组合定义（6 组配色方案）
- ✅ 为每个颜色组合添加 RGB 值和使用场景说明
- ✅ 更新配色速查表，包含所有颜色组合
- ✅ 添加 Tailwind 配置建议
- ✅ 完善颜色使用说明和最佳实践

### 2026-04-14 更新（第一次）
- ✅ 基于 PlanGlass 界面实际配色方案更新文档
- ✅ 更新主色调为松绿色/墨绿色系
- ✅ 添加详细的配色速查表
- ✅ 更新所有组件的样式规范
- ✅ 添加动态光影效果说明

### 2026-04-11 更新
- ✅ 优化背景图更换功能，只在首页显示更换背景按钮
- ✅ 修复背景图显示问题，避免图片截取和放大
- ✅ 优化日历组件，添加独立的开始/结束日期显示区域
- ✅ 优化收藏页面景点卡片显示，支持图片和完整信息展示
