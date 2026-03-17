# LiveTrip — v0.dev & shadcn/ui Prompt 文档

> **使用说明**
> - **v0.dev Prompt**：将对应 Prompt 完整粘贴到 [v0.dev](https://v0.dev) 的对话框，由 Agent 生成页面初稿
> - **shadcn/ui Prompt**：将对应 Prompt 粘贴到 v0.dev 或支持 shadcn/ui 的 AI 编辑器（如 Cursor），用于替换/优化具体组件
> - 建议按页面顺序逐一生成，每个页面生成完后在 v0 中迭代调整再进行下一个

---

## 目录

1. [全局 Layout & 导航](#1-全局-layout--导航)
2. [首页 Home](#2-首页-home)
3. [创建行程页 Create Trip](#3-创建行程页-create-trip)
4. [AI 功能页](#4-ai-功能页)
5. [热门目的地页 Destinations](#5-热门目的地页-destinations)
6. [我的收藏页 Favorites](#6-我的收藏页-favorites)
7. [旅行博客页 Blogs](#7-旅行博客页-blogs)
8. [我的行程页 My Trips](#8-我的行程页-my-trips)
9. [当前行程页 Today](#9-当前行程页-today)
10. [shadcn/ui 组件优化 Prompts](#10-shadcnui-组件优化-prompts)

---

## 1. 全局 Layout & 导航

> **用途**：生成整个应用的外壳，包含 Navbar、Sidebar Tab 导航和主内容区域框架。先生成此 Layout，后续各页面基于此框架填充。

```
Build the main application shell for "LiveTrip", an AI + IoT travel planning web app. Use React with TypeScript and shadcn/ui components. The tech stack is React 18 + TypeScript + Vite + Ant Design 5 + Zustand for state management.

## Layout Structure
- Fixed top Navbar (height: 56px)
- Left sidebar (width: 220px) with tab navigation
- Right main content area (flex: 1, scrollable)

## Top Navbar
- Left section (same width as sidebar, bordered right): Logo icon (airplane emoji in a rounded green square) + brand name "LiveTrip" in serif font (Playfair Display) + subtitle "AI · IoT · Travel" in small green text
- Center: Search input with search icon placeholder text "搜索目的地、景点、攻略…", rounded pill style, light gray background
- Right: notification bell icon button with a red dot badge, heart/favorite icon button, user avatar chip showing initials "ZL" with name "Zhang Lei"

## Left Sidebar
Use shadcn/ui's vertical navigation. Group tabs into sections with small uppercase section labels:

Section "主菜单":
- 首页 (Home icon)
- 创建行程 (Plus icon)
- AI 功能 (Sparkles icon) — with a green "新" badge
- 热门目的地 (Globe/Map icon)
- 我的收藏 (Heart icon) — with a gray count badge "12"

Section "社区":
- 旅行博客 (Edit/Pen icon)

Section "我的旅行":
- 我的行程 (List icon) — with a gray count badge "4"
- 当前行程 (MapPin icon) — with an amber "今" badge

## Active Tab Style
Active tab: light green background (#e8f5ee), dark green text (#0f4a32), left border accent (2px solid #1a6b4a), font-weight 500

## Sidebar Footer
At the bottom: user card with avatar circle (gradient green), name "Zhang Lei", subtitle "旅行达人 · Lv.4", right arrow chevron, light gray background

## Design System
- Primary color: #1a6b4a (deep green)
- Accent: #f5a623 (amber)
- Background: #f6f4f0 (warm off-white)
- Surface: #ffffff
- Fonts: Playfair Display for headings, DM Sans for body
- Border radius: 12px for cards, 10px for inputs
- All borders: 1px solid rgba(0,0,0,0.07)
- No heavy shadows — use subtle box-shadow: 0 2px 16px rgba(0,0,0,0.07)

Make it fully responsive for desktop (min-width 1024px). The sidebar should be collapsible on smaller screens.
```

---

## 2. 首页 Home

> **用途**：生成已登录用户的工作台首页，包含 Hero Banner、统计卡片、最近行程列表、目的地横向滚动卡片。

```
Create the Home dashboard page for "LiveTrip" travel app (logged-in user view). Use React + TypeScript + shadcn/ui. This page renders inside the main content area of the app shell.

## Hero Section
Full-width banner (height: 220px) with:
- Background image: Tokyo cityscape (use a placeholder or Unsplash URL: https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80)
- Dark green gradient overlay from left to right (rgba(15,74,50,0.85) → transparent)
- Bottom-left text: small uppercase label "欢迎回来", large serif heading "Zhang Lei，\n今天去哪儿？" (two lines), subtitle "你有 1 个行程正在规划中"
- Bottom-right: amber CTA button "+ 规划新行程" with rounded pill style and amber glow shadow

## Stats Row (3 columns, below hero with padding 20px 28px)
Three stat cards using shadcn/ui Card component:
1. "行程总数" → value: 4, change: "↑ 本月新增 1" (green text)
2. "已完成" → value: 2
3. "收藏景点" → value: 12, change: "↑ 新增 3"
Card style: white background, subtle border, 16px padding, large number (26px font-weight 500)

## Recent Trips Section
Section header with title "最近行程" and "查看全部 →" link in green.
Three trip cards in a vertical list, each card:
- Left: 48x48 rounded image thumbnail (use Unsplash travel images)
- Middle: trip name (bold 13px), meta info (date range + budget, muted 11px)
- Right: status pill — "规划中" (amber light bg, amber text) or "已完成" (green light bg, green text)
Cards have hover effect: left border turns green, slight translateX(2px)

Trips data:
1. 东京深度游 · 7天 | 2026/03/20 — 03/27 · ¥8,500 | 规划中 | image: https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&q=70
2. 京都赏樱 · 5天 | 2026/02/01 — 02/05 · ¥6,200 | 已完成 | image: https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=100&q=70
3. 巴厘岛度假 · 6天 | 2025/12/24 — 12/30 · ¥5,800 | 已完成 | image: https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=100&q=70

## Hot Destinations Horizontal Scroll
Section header "热门目的地" with "更多 →" link.
Horizontal scrollable row (hide scrollbar) of destination cards (width: 160px each):
Each card: top image (100px height), bottom info panel with city name + star rating + recommended days
Hide scrollbar with CSS. Cards have hover: translateY(-2px).

Destinations:
- 东京 | ★ 4.9 | 7天推荐 | https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=70
- 京都 | ★ 4.8 | 5天推荐 | https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=300&q=70
- 巴厘岛 | ★ 4.7 | 6天推荐 | https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=70
- 巴黎 | ★ 4.8 | 8天推荐 | https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=300&q=70
- 巴塞罗那 | ★ 4.7 | 7天推荐 | https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=300&q=70
```

---

## 3. 创建行程页 Create Trip

> **用途**：生成手动创建行程的 5 步分步表单，右侧搭配 AI 顾问悬浮对话窗。这是核心功能页面，需要重点打磨。

```
Build the "Create Trip" page for LiveTrip travel app. Use React + TypeScript + shadcn/ui. Layout is a two-column split: left side is the multi-step form, right side is a floating AI chat assistant panel.

## Overall Layout
- Full height (fills the content area height)
- Left: flex:1, scrollable, padding 24px 28px
- Right: fixed width 300px, white background, border-left, flex column layout (header + messages + input)
- No gap between the two panels

## Left: Multi-Step Form

### Step Progress Bar (5 steps)
Use a horizontal stepper with step numbers/checkmarks and connecting lines:
- Step 1: 出发地 — DONE (green checkmark circle)
- Step 2: 目的地 — DONE (green checkmark circle)  
- Step 3: 日期预算 — ACTIVE (light green circle with number, green border)
- Step 4: 偏好 — pending (gray)
- Step 5: 确认 — pending (gray)
Connect steps with lines: done steps have green lines, pending steps have gray lines.

### Form Cards (shadcn/ui Card components)
**Card 1: 出行信息**
- Card header with small icon (📍 in a 24px green icon box) + title "出行信息"
- 2-column grid: 出发城市 (value: "上海"), 目的地 (value: "东京，日本") — readonly inputs
- 2-column grid: 出发日期 (date input: 2026-03-20), 返回日期 (date input: 2026-03-27)

**Card 2: 预算设置**
- Icon: 💰, title: "预算设置"
- Single input: placeholder "例如：¥6,000 — ¥10,000"

**Card 3: 兴趣偏好**
- Icon: 🎯, title: "兴趣偏好"
- 3-column grid of toggle chips (click to select/deselect):
  - 🏛 文化历史 (selected), 🍜 美食探索 (selected), 🏞 自然风光
  - 🛍 购物娱乐 (selected), 🎭 艺术展览, ⛩ 寺庙神社
- Selected chip: light green bg, green border, green text, font-weight 500
- Unselected chip: gray bg, gray border

### Bottom Buttons
Flex row: "上一步" outline button + "下一步：确认行程 →" solid green button (flex:1)

## Right: AI Travel Advisor Float Panel

### Header (padded, border-bottom)
- Left: purple gradient orb (28px circle) with sparkle icon
- Title: "AI 旅行顾问" (13px bold)
- Subtitle: "随时为你解答旅行问题" (11px muted)

### Messages Area (flex:1, scrollable, padding 12px 14px, gap 10px)
Display a conversation thread:

AI message 1: "你好！我是你的 AI 旅行顾问 🌍\n有任何关于东京旅行的问题，随时问我！"
AI message 2: "💡 3月下旬东京樱花盛开，上野公园和新宿御苑是最佳赏樱地点，建议早上8点前到达避开人流。"
User message: "东京7天预算8000够吗？"
AI message 3: "¥8,000 在东京7天是合理的中等预算 ✓\n• 机票：¥2,500–3,500（往返）\n• 住宿：¥150–250/晚\n• 餐饮：¥100–150/天\n• 景点+交通：¥50–80/天\n\n建议提前订酒店，3月旺季房价会上涨。"

Message bubble styles:
- AI: light gray bg, gray border, radius 4px 12px 12px 12px, dark text
- User: green (#1a6b4a) bg, white text, radius 12px 12px 4px 12px, align-self flex-end

### Input Area (border-top, padding 12px 14px)
- Textarea (auto-resize, min-height 36px, light gray bg, rounded, font-size 12px)
- Send button (32px square, green bg, white arrow icon)
- Pressing Enter (without Shift) sends the message
- On send: append user bubble, then after 600ms append a typing AI response bubble
```

---

## 4. AI 功能页

> **用途**：展示应用的 AI 核心能力及 IoT 实时数据看板，设计感强，以卡片为主。

```
Create the "AI Features" page for LiveTrip travel app. Use React + TypeScript + shadcn/ui. Page has padding 24px 28px.

## Page Title
- Heading: "AI 智能功能" in Playfair Display serif, 22px, font-weight 600
- Subtitle: "结合 IoT 实时数据的智能旅行体验" in muted gray, 13px
- Margin below: 20px

## AI Feature Cards Grid (2 columns, gap 14px)
Four cards using shadcn/ui Card, each with a 3px colored top border accent:

Card 1 — AI Trip Planner (purple top accent: linear-gradient(90deg, #6366f1, #8b5cf6)):
- Icon: 🗺️ (28px)
- Title: "AI 行程规划"
- Description: "输入目的地和偏好，5步生成完整行程，包含景点、餐厅、酒店推荐。"
- Badge: "智谱 AI · ChatGLM" — light green bg, green text

Card 2 — IoT Data (green top accent: linear-gradient(90deg, #1a6b4a, #2d9166)):
- Icon: 📡 (28px)
- Title: "IoT 实时数据"
- Description: "接入景区客流传感器、气象数据，实时显示人流状态，智能推荐最佳游览时间。"
- Badge: "IoT 数据源" — light blue bg, blue text

Card 3 — Dynamic Adjustment (amber top accent: linear-gradient(90deg, #f59e0b, #f97316)):
- Icon: 🔄 (28px)
- Title: "动态行程调整"
- Description: "根据实时人流、天气变化自动推荐备选景点，确保旅行体验最优。"
- Badge: "实时优化"

Card 4 — AI Advisor (blue top accent: linear-gradient(90deg, #3b82f6, #06b6d4)):
- Icon: 💬 (28px)
- Title: "AI 旅行顾问"
- Description: "创建行程过程中随时咨询，提供签证、货币、文化习俗等旅行知识。"
- Badge: "全程陪伴"

Card hover: translateY(-2px) with stronger box-shadow.

## IoT Live Data Panel (below the grid)
A card with:
- Header row: green pulsing dot animation + "IoT 实时数据 · 东京景区" title + right-aligned "更新于 2分钟前" muted text
- Row of colored status chips (wrap allowed):
  - 浅草寺 · 人流低 (green chip)
  - 上野公园 · 人流较多 (amber chip)
  - 新宿御苑 · 人流中等 (green chip)
  - 渋谷十字口 · 人流爆满 (red chip)
  - 今日天气 · 16°C 晴间多云 (blue chip)
  - 樱花开放度 · 80% (green chip with 🌸)

Pulsing dot: 7px circle, #22c55e, CSS keyframes animation alternating opacity 1 → 0.4 → 1 at 1.5s.
Chip style: padding 6px 12px, border-radius 20px, 12px font, border 1px, with colored dot prefix.
```

---

## 5. 热门目的地页 Destinations

> **用途**：展示热门目的地网格，每张卡片带真实图片、评分、标签和推荐信息。

```
Build the "Hot Destinations" page for LiveTrip. Use React + TypeScript + shadcn/ui. Padding: 24px 28px.

## Hero Banner
Full-width banner card (height: 140px, border-radius 18px, overflow hidden):
- Background image: https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=80 with opacity 0.6
- Overlay: dark green gradient left-to-right
- Text overlay: h2 "探索热门目的地" (Playfair Display, 22px, white) + p "基于 AI 推荐与 IoT 实时人气数据，为你精选全球旅行胜地" (12px, white 75% opacity)
- Hover: cursor pointer

## Destination Grid (2 columns, gap 12px, margin-top 20px)
Six destination cards using shadcn/ui Card. Each card:
- Top: image (width 100%, height 110px, object-fit cover)
- Body padding 12px 14px:
  - City name (14px, font-weight 500)
  - Row: left "X天 · ¥Xk–Xk" (muted 11px) + right star rating in amber (★ X.X, 11px bold)
  - Tag chip below (inline-block, 10px, light green bg, green text, border-radius 8px, padding 2px 8px, margin-top 5px)

Card hover: translateY(-3px) + stronger box-shadow.

Data:
1. 东京 Tokyo | 5–8天 · ¥6k–12k | ★ 4.9 | tag: 🌸 樱花季 HOT | img: https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=75
2. 京都 Kyoto | 3–5天 · ¥4k–8k | ★ 4.8 | tag: ⛩ 古韵和风 | img: https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=75
3. 巴厘岛 Bali | 5–7天 · ¥4k–9k | ★ 4.7 | tag: 🏖 热带度假 | img: https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=75
4. 巴黎 Paris | 7–10天 · ¥12k–22k | ★ 4.8 | tag: 🗼 浪漫之都 | img: https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=75
5. 巴塞罗那 Barcelona | 6–8天 · ¥10k–18k | ★ 4.7 | tag: 🎨 高迪建筑 | img: https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=75
6. 泰姬陵 Agra | 2–3天 · ¥2k–5k | ★ 4.9 | tag: 🕌 世界奇迹 | img: https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=75
```

---

## 6. 我的收藏页 Favorites

> **用途**：展示用户收藏的景点，带 IoT 实时状态，支持移除操作。

```
Build the "My Favorites" page for LiveTrip. Use React + TypeScript + shadcn/ui. Padding: 24px 28px.

## Page Header
- Serif heading "我的收藏" (Playfair Display, 20px)
- Subtitle "已收藏 12 处景点" (muted, 13px, margin-top 3px)

## Favorites Grid (2 columns, gap 12px, margin-top 14px)
Four favorite place cards using shadcn/ui Card:
Each card:
- Top image (width 100%, height 88px, object-fit cover)
- Card body padding 10px 12px:
  - Top row: place name (13px, font-weight 500) + "移除" button (float right, 11px, coral/red text, no border, cursor pointer)
  - Location (11px muted, "📍 城市名", margin-bottom 7px)
  - IoT status chips row (flex wrap gap 5px):
    - Crowd level chip (green or amber)
    - Weather chip (blue)

Card hover: border-color changes to green.
Remove button hover: background coral light.

Data:
1. 伏见稻荷大社 | 📍 京都 | 人流低 (green) | 14°C (blue) | img: https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=300&q=70
2. 东京塔 | 📍 东京 | 人流中 (amber) | 16°C (blue) | img: https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=300&q=70
3. 大阪城 | 📍 大阪 | 人流低 (green) | 15°C (blue) | placeholder emoji: 🏯
4. 富士山 | 📍 静冈 | 人流低 (green) | 3°C 积雪 (blue) | img: https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=300&q=70

IoT chip style: font-size 10–11px, padding 2px 7px, border-radius 7px
- Green chip: bg #e8f5ee, text #0f4a32, border rgba(26,107,74,0.2)
- Amber chip: bg #fef3dc, text #7a4800, border rgba(245,166,35,0.25)
- Blue chip: bg #e8f0fb, text #1e4a8a, border rgba(59,130,196,0.2)
```

---

## 7. 旅行博客页 Blogs

> **用途**：社区博客列表页，含创建入口和文章列表，横向展示封面图、摘要、互动数据。

```
Create the "Travel Blog" community page for LiveTrip. Use React + TypeScript + shadcn/ui. Padding: 24px 28px.

## Page Header
- Serif heading "旅行博客" (Playfair Display, 20px)
- Subtitle "分享你的旅行故事与攻略" (muted 13px, margin-bottom 16px)

## Create Post Bar (above list)
A dashed border card (border: 1.5px dashed, border-radius 12px, padding 14px 16px, cursor pointer):
- Left: user avatar circle (32px, green gradient, initials "ZL")
- Middle: placeholder text "分享你的旅行故事…" (13px muted, flex:1)
- Right: "发布博客" green solid button (small, rounded)
Hover: dashed border changes to green

## Blog List (vertical stack, gap 10px)
Three blog cards using shadcn/ui Card in horizontal layout (flex row):
Each card:
- Left: image (width 100px, height 100%, object-fit cover, flex-shrink 0)
  - If no image: placeholder div with emoji centered
- Right body (flex 1, padding 14px 16px):
  - Title (14px, font-weight 500, margin-bottom 5px, line-height 1.4)
  - Excerpt (12px muted, line-height 1.5, flex:1, 2-line clamp)
  - Footer row: author + date (11px muted) | stats on right: "♡ X" and "💬 X" (11px muted)

Card hover: border-color darkens, subtle box-shadow.

Data:
1. title: "三月京都，满城樱花如梦" | excerpt: "伏见稻荷的朱红鸟居配上落樱，是我见过最美的画面。早上六点出发，整条参道只有我一人…" | author: "by Li Mei · 2天前" | ♡ 234 | 💬 18 | img: https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70

2. title: "巴厘岛7日，从零到惊艳" | excerpt: "带着预算5000元，我拿下了五星级Villa和私人泳池。藏在Seminyak背街的这家民宿，绝对是隐藏宝藏…" | author: "by Wang Fang · 5天前" | ♡ 189 | 💬 32 | img: https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=70

3. title: "东京拉面地图：米其林之外的宝藏小店" | excerpt: "不用排队两小时，就能吃到极品拉面。这几条巷子里藏着老板专门为懂行人留的隐秘菜单…" | author: "by Chen Hao · 1周前" | ♡ 312 | 💬 45 | placeholder emoji: 🍜
```

---

## 8. 我的行程页 My Trips

> **用途**：行程管理中心，支持状态筛选（全部/规划中/已完成），已完成行程显示添加照片入口。

```
Build the "My Trips" management page for LiveTrip. Use React + TypeScript + shadcn/ui. Padding: 24px 28px.

## Page Header
Serif heading "我的行程" (Playfair Display, 20px, margin-bottom 14px)

## Filter Tab Bar
Three toggle buttons in a pill group (shadcn/ui Tabs or custom):
- "全部 (4)" — default active
- "规划中 (2)"
- "已完成 (2)"
Active button: green background, white text. Inactive: white bg, gray text, border.
On click, filter the list below.

## Trip Cards List (vertical stack, gap 10px)
Four trip cards using shadcn/ui Card in horizontal layout:
Each card:
- Left image (width 110px, min-height 90px, object-fit cover)
  - If no image: colored placeholder with emoji, centered
- Middle body (flex:1, padding 14px 16px):
  - Trip name (14px, font-weight 500)
  - Meta: dates + duration + budget (12px muted, margin-bottom 8px)
  - Tags row: small chips for interests (10px, gray bg, gray border, border-radius 7px)
- Right section (padding 14px 16px, flex column, align-items flex-end, justify-content space-between):
  - Status pill (top)
  - For "规划中": small muted link text "查看行程 →"
  - For "已完成": "📷 添加照片" button (11px, gray bg, gray border, border-radius 8px, flex with icon)

Status pills:
- 规划中: amber light bg (#fef3dc), amber text (#7a4800)
- 已完成: green light bg (#e8f5ee), green text (#0f4a32)

Data:
1. 东京深度游 | 2026/03/20 — 03/27 · 7天 · ¥8,500 | tags: 🏛文化 🍜美食 🛍购物 | 规划中 | img: https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&q=70

2. 纽约城市游 | 2026/05/10 — 05/20 · 10天 · ¥18,000 | tags: 🎭艺术 🏙都市 | 规划中 | placeholder: 🗽 on light blue bg

3. 京都赏樱 | 2026/02/01 — 02/05 · 5天 · ¥6,200 | tags: ⛩寺庙 🌸赏花 | 已完成 | img: https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70

4. 巴厘岛度假 | 2025/12/24 — 12/30 · 6天 · ¥5,800 | tags: 🏖海滩 🧘瑜伽 | 已完成 | img: https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=70

Implement filter logic in React state: clicking a tab filters the visible cards by status field.
```

---

## 9. 当前行程页 Today

> **用途**：最核心的使用场景页——展示今日行程时间轴（含餐厅推荐）+ 右侧地图面板双栏布局。

```
Build the "Today's Trip" page for LiveTrip — the active travel companion view. Use React + TypeScript + shadcn/ui. Full-height two-column layout.

## Layout
- Full height (fills content area, no page-level overflow)
- Left column: flex:1, overflow-y auto, padding 20px 22px
- Right column: fixed width 340px, white bg, border-left, flex column

## Left: Timeline View

### Trip Selector Card (margin-bottom 16px)
shadcn/ui Card, flex row, align-items center, justify-content space-between:
- Left: trip name "东京深度游" (14px bold) + meta "Day 1 · 2026年3月20日（周五）" (11px muted)
- Right: "切换行程" button (12px, light green bg, green border, green text, rounded)

### Date Bar (margin-bottom 14px)
Flex row: "今日行程" (13px bold) + "📅 2026/03/20 · 晴 16°C" (12px muted, margin-left auto)

### Timeline (vertical list)
Each timeline item has: time label (right-aligned, 48px wide, 11px muted) + vertical line column + event card.

Vertical line column: dot (10px circle) + connecting vertical line below. Line column width: 14px.
Dot states:
- done: filled green circle (bg #1a6b4a)
- now/active: amber circle (bg #f5a623) with outer glow ring (box-shadow: 0 0 0 3px #fef3dc)
- pending: white circle with gray border

Timeline events:
1. 09:00 | dot: done | ATTRACTION CARD: place "浅草寺", tags [⛩寺庙, 历史], IoT chips [人流低 green, 16°C 晴 blue]

2. 12:00 | dot: done | MEAL CARD (light blue bg, blue left border): 🍱 icon, restaurant "浅草 寿司大 本店", subtitle "推荐午餐 · 人均 ¥80 · 步行5分钟" (blue text)

3. 14:00 | dot: now | ATTRACTION CARD (amber border): badge "▶ 正在进行" (10px amber text, top), place "上野公园（赏樱）", tags [🌸樱花, 公园], IoT chips [人流较多 amber, 16°C blue]

4. 18:00 | dot: pending | MEAL CARD: 🍣 icon, "上野 磯丸水産", "推荐晚餐 · 人均 ¥150 · 步行3分钟"

5. 20:00 | dot: pending | ATTRACTION CARD: place "秋叶原电器街", tags [🛍购物, 科技], IoT chips [人流低 green]

Card styles:
- Attraction card: white bg, border 1px, border-radius 12px, padding 10px 12px
- Active attraction: border-color amber
- Meal card: light blue bg (#e8f0fb), blue border (rgba(59,130,196,0.3)), border-radius 12px

## Right: Map Panel

### Header (padding 12px 14px, border-bottom)
"🗺 今日地图" (13px bold) + "东京 · 台東区" (muted 11px, margin-left auto)

### Map Placeholder (flex:1)
Decorative map-like area:
- Background: layered CSS — a soft green/blue terrain gradient (representing parks + water)
- Grid overlay: subtle 1px white lines every 30px (simulating map grid)
- Three emoji map pins positioned absolutely: 📍 (top area), 🌸 (middle left), 🛍 (bottom right)
- Dashed oval/route path connecting the pins (CSS border dashed, border-radius 50%, positioned absolutely)
- Bottom-left overlay label: "高德地图 · 景点路线" in a semi-transparent white pill (12px, border-radius 8px)

### Map Toolbar (padding 10px 12px, border-top)
Three equal-width buttons: "🧭 导航", "📏 路线", "🔍 搜索"
Style: light gray bg, gray border, border-radius 8px, 12px text, flex:1 each
```

---

## 10. shadcn/ui 组件优化 Prompts

> **用途**：v0.dev 生成初稿后，使用以下 Prompts 对特定组件进行 shadcn/ui 深度优化。每条 Prompt 针对一个独立组件，可单独使用。

---

### 10.1 Stepper 步骤条组件

```
Refactor the multi-step progress indicator in the LiveTrip "Create Trip" page using shadcn/ui primitives. 

Requirements:
- Use shadcn/ui's design tokens and CSS variables (--primary, --muted, --border, --background)
- 5 steps: 出发地, 目的地, 日期预算, 偏好, 确认
- Each step has: numbered circle (or checkmark when done) + step label below
- Connecting lines between steps change color based on completion
- Step states: done (filled green circle with ✓), active (outlined green circle with number, slight glow), pending (gray outline, gray text)
- Animate transition between states with a smooth CSS transition (0.2s)
- Export as a reusable <TripStepper currentStep={number} /> component with TypeScript props
- Use cn() utility for conditional class merging
- Style with Tailwind classes only, no inline styles
```

---

### 10.2 IoT 实时状态 Badge 组件

```
Create a reusable IoT status badge component for LiveTrip using shadcn/ui Badge as base.

Component: <IotBadge type="crowd" | "weather" | "bloom" level="low" | "medium" | "high" | "extreme" value="string" />

Requirements:
- Extend shadcn/ui Badge component with custom variants
- Crowd variants:
  - low: green bg (bg-green-50, text-green-800, border-green-200)
  - medium: amber bg
  - high: orange bg  
  - extreme: red bg
- Weather: always blue variant
- Bloom (cherry blossom %): green variant
- Include a small colored dot prefix (6px circle matching the variant color)
- Add subtle pulse animation for "extreme" crowd level
- Font size: 11px, padding: 2px 8px, border-radius: 20px
- TypeScript interface with all props typed
- Use cva() (class-variance-authority) for variant definitions
```

---

### 10.3 行程时间轴 Timeline 组件

```
Build a reusable vertical timeline component for LiveTrip's "Today" page using shadcn/ui Card.

Component structure:
<Timeline>
  <TimelineItem time="09:00" status="done" type="attraction" />
  <TimelineItem time="12:00" status="done" type="meal" />
  <TimelineItem time="14:00" status="active" type="attraction" isNow />
  <TimelineItem time="18:00" status="pending" type="meal" />
</Timeline>

TimelineItem props (TypeScript):
- time: string
- status: "done" | "active" | "pending"
- type: "attraction" | "meal"
- isNow?: boolean
- place: string
- tags?: string[]
- iotChips?: { label: string; variant: "green" | "amber" | "blue" | "red" }[]
- restaurant?: { name: string; meta: string; icon?: string }

Design requirements:
- Dot: 10px circle — done=green filled, active=amber with glow ring, pending=white+border
- Vertical connecting line: 1.5px, gray color, connects dot to next item
- Attraction card: white, 1px border, 12px rounded, 10px 12px padding
- Active attraction: amber border accent
- Meal card: light blue background (#e8f0fb), blue border, emoji icon above restaurant name
- "正在进行" banner inside active card: 10px amber text, margin-bottom 4px
- Use shadcn/ui Card component as the card base
- All spacing via Tailwind, no inline styles
```

---

### 10.4 AI 顾问对话面板组件

```
Build a floating AI chat panel component for LiveTrip using shadcn/ui primitives.

Component: <AiAdvisorPanel tripDestination="东京" tripBudget="¥8,000" />

Structure:
- Panel header: AI orb icon (gradient purple circle) + title + subtitle
- Messages list (auto-scroll to bottom on new message)
- Input area: auto-resizing textarea + send button

Message types:
type Message = {
  id: string
  role: "ai" | "user"
  content: string
  timestamp: Date
}

Requirements:
- Use shadcn/ui ScrollArea for the messages container
- Use shadcn/ui Textarea for input (auto-resize with rows attribute)
- Use shadcn/ui Button for send button
- Messages animate in with a fade+translateY(4px) → translateY(0) CSS animation on mount
- AI messages: light gray bg, left-aligned, radius "4px 12px 12px 12px"
- User messages: green (#1a6b4a) bg, white text, right-aligned, radius "12px 12px 4px 12px"
- On send: clear input, append user message, show typing indicator (three bouncing dots), then append AI response
- Typing indicator: three 5px dots with staggered bounce animation
- Enter key sends (Shift+Enter for newline)
- Export as a fully self-contained component with useState for messages
- TypeScript typed throughout
```

---

### 10.5 目的地卡片组件

```
Refactor the destination card for LiveTrip using shadcn/ui Card with enhanced interactions.

Component: <DestinationCard name="东京" nameEn="Tokyo" duration="5–8天" budget="¥6k–12k" rating={4.9} tag="🌸 樱花季 HOT" imageUrl="..." onClick={() => {}} />

Requirements:
- Use shadcn/ui Card with AspectRatio for the image container (16:9 or 3:2 ratio)
- Image: next/image or regular <img> with object-fit cover
- Smooth image scale on hover (transform: scale(1.03) on img inside overflow:hidden container, transition 0.3s)
- Card lifts on hover: transform translateY(-3px), stronger shadow
- Card body: city name + English name side by side, meta row (duration + budget), star rating in amber
- Tag chip at bottom: green light bg, green text
- Add a subtle gradient overlay at bottom of image (transparent → rgba(0,0,0,0.15)) for depth
- TypeScript props interface
- Tailwind + shadcn/ui cn() utility
- Accessible: role="button", keyboard navigable, aria-label
```

---

### 10.6 行程卡片（My Trips）组件

```
Build the trip management card for LiveTrip's "My Trips" page using shadcn/ui.

Component: <TripCard trip={TripData} onViewDetail={() => {}} onAddPhoto={() => {}} />

TypeScript interface:
interface TripData {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  duration: number
  budget: number
  status: "planning" | "completed"
  tags: string[]
  coverImage?: string
  coverEmoji?: string
  coverBgColor?: string
}

Requirements:
- Horizontal layout: image left (110px wide) + body middle + right actions
- Image or emoji placeholder (centered emoji on colored bg)
- Status badge using shadcn/ui Badge: planning=amber variant, completed=green variant
- Tags as small shadcn/ui Badge components with secondary variant
- For completed trips: show "📷 添加照片" shadcn/ui Button with outline variant and small size
- For planning trips: show "查看行程 →" shadcn/ui Button with ghost variant and small size
- Card hover: slight elevation (shadow increase)
- Use date-fns for date formatting
- Export with TypeScript
```

---

*文档生成时间：2026-03-17 | 项目：LiveTrip v1.2.0*
