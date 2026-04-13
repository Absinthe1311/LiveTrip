# 首页控件数据连接开发任务清单

## 任务概述
连接首页的6个核心控件与后端API，实现数据的实时展示和交互，为用户提供个性化的旅行工作台视图。

## 前置条件
- ✅ 后端API已实现并可用
- ✅ 前端基础组件已存在（PackingList、WeatherCard、BudgetCard、TotalTravelCard）
- ✅ useHomepageData Hook已存在但需要改造

---

## 任务清单

### 阶段一：数据层改造（优先级：高）

#### 任务1.1：改造useHomepageData Hook - 天气数据获取
**描述**：改造天气数据获取逻辑，从IoT数据中提取城市天气，默认显示北京天气

**实现步骤**：
1. 改造 `useHomepageData.ts` 中的 `fetchWeatherData` 方法
2. 从IoT数据中提取北京景点的天气信息作为默认天气
3. 添加城市选择功能，用户可以查看其他城市的天气
4. 从该城市的景点IoT数据中提取天气信息

**验收标准**：
- [ ] 天气控件默认显示北京天气
- [ ] 用户可以选择其他城市查看天气
- [ ] 天气数据从IoT数据中正确提取

**涉及文件**：
- `frontend/src/hooks/useHomepageData.ts`
- `frontend/src/components/home/WeatherCard.tsx`

---

#### 任务1.2：改造useHomepageData Hook - 足迹城市计算
**描述**：新增足迹城市计算逻辑，从用户行程列表中提取去过的城市

**实现步骤**：
1. 在 `useHomepageData.ts` 中添加 `footprintCities` 状态
2. 实现 `calculateFootprintCities` 方法
3. 从行程列表中提取城市并统计去过次数
4. 查询该城市的景点，获取第一个景点的坐标作为城市坐标

**验收标准**：
- [ ] 正确统计用户去过的所有城市
- [ ] 每个城市包含名称、坐标、去过次数
- [ ] 城市去重统计

**涉及文件**：
- `frontend/src/hooks/useHomepageData.ts`
- `frontend/src/api/client.ts`（添加获取城市景点的方法）

---

#### 任务1.3：改造useHomepageData Hook - 热门目的地获取
**描述**：新增热门目的地数据获取逻辑

**实现步骤**：
1. 在 `useHomepageData.ts` 中添加 `hotDestinations` 状态
2. 在初始化时调用 `GET /api/destinations/cities`
3. 处理API响应并存储数据

**验收标准**：
- [ ] 成功获取热门城市列表
- [ ] 每个城市包含名称、景点数量、图片

**涉及文件**：
- `frontend/src/hooks/useHomepageData.ts`
- `frontend/src/api/client.ts`

---

#### 任务1.4：新增搜索功能
**描述**：实现搜索热门目的地、用户行程和Blog的功能

**实现步骤**：
1. 在 `useHomepageData.ts` 中添加 `searchResults` 状态
2. 实现 `search` 方法
3. 搜索热门目的地（城市名称匹配）
4. 搜索用户行程（标题或目的地匹配）
5. 搜索Blog文章（标题匹配）
6. 合并结果并排序（目的地优先）

**验收标准**：
- [ ] 输入关键词返回匹配的目的地、行程和Blog
- [ ] 空搜索显示热门推荐
- [ ] 无结果显示空状态提示

**涉及文件**：
- `frontend/src/hooks/useHomepageData.ts`
- `frontend/src/api/client.ts`（添加获取Blog列表的方法）

---

### 阶段二：组件层实现（优先级：高）

#### 任务2.1：实现地图控件
**描述**：创建MapWidget组件，展示中国地图和用户足迹

**实现步骤**：
1. 创建 `frontend/src/components/home/MapWidget.tsx`
2. 集成高德地图JS API
3. 实现地图初始化和城市标记
4. 实现点击城市标记查看相关行程
5. 添加地图加载失败的降级方案
6. 添加毛玻璃样式设计

**验收标准**：
- [ ] 地图正确显示中国地图
- [ ] 用户去过的城市显示标记
- [ ] 点击标记可查看相关行程
- [ ] 地图加载失败显示静态图或城市列表

**涉及文件**：
- `frontend/src/components/home/MapWidget.tsx`（新建）
- `frontend/src/components/home/index.ts`（导出）
- `frontend/src/pages/Home.tsx`（引入）

---

#### 任务2.2：改造搜索栏组件
**描述**：改造搜索栏，支持搜索热门目的地和用户行程

**实现步骤**：
1. 创建 `frontend/src/components/home/SearchBar.tsx`
2. 实现搜索输入框和下拉框
3. 实现搜索结果展示（目的地和行程）
4. 实现点击结果跳转（目的地详情页或行程详情页）
5. 添加防抖逻辑（300ms）
6. 添加毛玻璃样式设计

**验收标准**：
- [ ] 输入关键词触发搜索
- [ ] 显示匹配的目的地和行程
- [ ] 点击结果跳转到对应页面
- [ ] 空输入显示热门推荐

**涉及文件**：
- `frontend/src/components/home/SearchBar.tsx`（新建）
- `frontend/src/components/home/index.ts`（导出）
- `frontend/src/pages/Home.tsx`（引入）

---

#### 任务2.3：优化行李清单控件
**描述**：优化行李清单控件，支持切换打包状态

**实现步骤**：
1. 改造 `frontend/src/components/home/PackingList.tsx`
2. 实现 `togglePacked` 方法调用API
3. 添加打包进度动画
4. 优化空状态展示

**验收标准**：
- [ ] 点击物品切换打包状态
- [ ] 打包进度实时更新
- [ ] 空状态显示友好提示

**涉及文件**：
- `frontend/src/components/home/PackingList.tsx`
- `frontend/src/hooks/useHomepageData.ts`

---

#### 任务2.4：优化天气控件
**描述**：优化天气控件，显示更详细的天气信息

**实现步骤**：
1. 改造 `frontend/src/components/home/WeatherCard.tsx`
2. 显示温度、湿度、风速、气压
3. 添加天气图标
4. 添加城市名称和更新时间
5. 优化样式设计

**验收标准**：
- [ ] 显示完整的天气信息
- [ ] 天气图标正确显示
- [ ] 显示城市名称

**涉及文件**：
- `frontend/src/components/home/WeatherCard.tsx`

---

#### 任务2.5：优化预算控件
**描述**：优化预算控件，显示预算分配和占比

**实现步骤**：
1. 改造 `frontend/src/components/home/BudgetCard.tsx`
2. 显示各类预算金额和占比
3. 添加预算分配图表（饼图或条形图）
4. 优化空状态展示

**验收标准**：
- [ ] 显示各类预算金额
- [ ] 显示预算占比图表
- [ ] 空状态显示友好提示

**涉及文件**：
- `frontend/src/components/home/BudgetCard.tsx`

---

#### 任务2.6：优化统计控件
**描述**：优化统计控件，显示旅行统计数据

**实现步骤**：
1. 改造 `frontend/src/components/home/TotalTravelCard.tsx`
2. 显示总行程数、城市数、已完成、即将出行
3. 添加数据动画效果
4. 优化样式设计

**验收标准**：
- [ ] 显示正确的统计数据
- [ ] 数据变化有动画效果

**涉及文件**：
- `frontend/src/components/home/TotalTravelCard.tsx`

---

### 阶段三：页面层集成（优先级：高）

#### 任务3.1：集成所有控件到首页
**描述**：将所有控件集成到Home.tsx页面

**实现步骤**：
1. 改造 `frontend/src/pages/Home.tsx`
2. 引入MapWidget和SearchBar
3. 调整控件布局（响应式设计）
4. 传递正确的数据到各控件
5. 添加加载状态和错误处理

**验收标准**：
- [ ] 所有控件正确显示
- [ ] 布局响应式适配
- [ ] 加载状态显示骨架屏
- [ ] 错误状态显示友好提示

**涉及文件**：
- `frontend/src/pages/Home.tsx`

---

### 阶段四：类型定义和工具函数（优先级：中）

#### 任务4.1：添加类型定义
**描述**：为新增的数据结构添加TypeScript类型定义

**实现步骤**：
1. 创建 `frontend/src/types/packing.ts`
2. 创建 `frontend/src/types/weather.ts`
3. 创建 `frontend/src/types/budget.ts`
4. 创建 `frontend/src/types/trip.ts`
5. 创建 `frontend/src/types/search.ts`
6. 创建 `frontend/src/types/api.ts`

**验收标准**：
- [ ] 所有数据结构有类型定义
- [ ] 类型定义完整且准确

**涉及文件**：
- `frontend/src/types/`（新建多个文件）

---

#### 任务4.2：添加工具函数
**描述**：添加数据处理和格式化工具函数

**实现步骤**：
1. 创建 `frontend/src/utils/weather.ts`（天气数据处理）
2. 创建 `frontend/src/utils/budget.ts`（预算数据处理）
3. 创建 `frontend/src/utils/search.ts`（搜索过滤逻辑）

**验收标准**：
- [ ] 工具函数可复用
- [ ] 有单元测试覆盖

**涉及文件**：
- `frontend/src/utils/`（新建多个文件）

---

### 阶段五：测试和优化（优先级：中）

#### 任务5.1：添加错误边界
**描述**：为各控件添加错误边界，防止单个控件崩溃影响整个页面

**实现步骤**：
1. 创建 `frontend/src/components/ErrorBoundary.tsx`
2. 为各控件包裹错误边界
3. 添加错误日志记录

**验收标准**：
- [ ] 单个控件错误不影响其他控件
- [ ] 错误信息友好展示

**涉及文件**：
- `frontend/src/components/ErrorBoundary.tsx`（新建）
- `frontend/src/pages/Home.tsx`

---

#### 任务5.2：性能优化
**描述**：优化数据加载和渲染性能

**实现步骤**：
1. 使用React Query缓存API响应
2. 地图控件懒加载
3. 搜索输入防抖
4. 添加骨架屏

**验收标准**：
- [ ] 首页加载时间 < 3秒
- [ ] 搜索响应时间 < 500ms
- [ ] 无布局抖动

**涉及文件**：
- `frontend/src/hooks/useHomepageData.ts`
- `frontend/src/pages/Home.tsx`

---

#### 任务5.3：响应式设计优化
**描述**：优化移动端和桌面端的响应式布局

**实现步骤**：
1. 调整控件在不同屏幕尺寸下的布局
2. 优化移动端的交互体验
3. 测试各种屏幕尺寸

**验收标准**：
- [ ] 桌面端布局合理
- [ ] 移动端布局合理
- [ ] 交互流畅

**涉及文件**：
- `frontend/src/pages/Home.tsx`
- `frontend/src/components/home/*.tsx`

---

## 任务依赖关系

```
阶段一（数据层）
  ├─ 任务1.1（天气数据）
  ├─ 任务1.2（足迹城市）
  ├─ 任务1.3（热门目的地）
  └─ 任务1.4（搜索功能）
      ↓
阶段二（组件层）
  ├─ 任务2.1（地图控件）← 依赖任务1.2
  ├─ 任务2.2（搜索栏）← 依赖任务1.3、1.4
  ├─ 任务2.3（行李清单）
  ├─ 任务2.4（天气控件）← 依赖任务1.1
  ├─ 任务2.5（预算控件）
  └─ 任务2.6（统计控件）
      ↓
阶段三（页面层）
  └─ 任务3.1（集成）← 依赖阶段二所有任务
      ↓
阶段四（类型和工具）
  ├─ 任务4.1（类型定义）
  └─ 任务4.2（工具函数）
      ↓
阶段五（测试和优化）
  ├─ 任务5.1（错误边界）
  ├─ 任务5.2（性能优化）
  └─ 任务5.3（响应式设计）
```

## 预估工作量

- **阶段一**：4个任务 × 2小时 = 8小时
- **阶段二**：6个任务 × 2小时 = 12小时
- **阶段三**：1个任务 × 3小时 = 3小时
- **阶段四**：2个任务 × 1小时 = 2小时
- **阶段五**：3个任务 × 2小时 = 6小时

**总计**：约31小时（4个工作日）

## 风险和注意事项

1. **高德地图API加载失败**：需要准备降级方案（静态地图或城市列表）
2. **天气API限流**：OpenWeatherMap免费版有调用限制，需要添加缓存
3. **定位权限**：用户可能拒绝定位权限，需要优雅降级
4. **数据缺失**：用户可能无行程数据，需要友好的空状态展示
5. **性能问题**：大量数据时需要虚拟列表和懒加载优化

## 验收清单

- [ ] 行李清单正确显示当前行程的打包物品
- [ ] 天气控件显示当前城市或北京的天气
- [ ] 预算控件显示当前行程的预算分配
- [ ] 地图控件显示用户去过的城市
- [ ] 统计控件显示正确的旅行数据
- [ ] 搜索栏支持搜索目的地和行程
- [ ] 所有控件响应式适配
- [ ] 错误状态友好展示
- [ ] 加载状态显示骨架屏
- [ ] 性能指标达标（加载时间 < 3秒）
