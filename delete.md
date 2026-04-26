// AI辅助生成：GLM-5, 2026-04-26 12:38
// 描述：项目深度清理清单，包含空目录、未使用源码文件、过时配置/产物、可移除npm依赖的完整分析，供人工审核后执行。

# LiveTrip 项目深度清理清单

> 生成时间：2026-04-26 12:38
> 分析范围：空目录、未引用源码文件、过时配置/构建产物、可移除npm依赖

---

## 一、空目录（无存在必要）

| 目录路径 | 判断理由 |
|---------|---------|
| `backend/src/iot/` | 空目录，无任何文件，IoT代码在services/iotCheckService.ts等处 |
| `backend/src/scripts/` | 空目录，脚本已全部清理 |

---

## 二、未被引用的源码文件

### 2.1 Backend 未引用文件

| 文件路径 | 类型 | 判断理由 |
|---------|------|---------|
| `backend/src/models/index.ts` | 遗留模型 | 仅导出models常量，无任何文件import，Prisma模型在schema.prisma中定义 |
| `backend/src/services/planService.ts` | 未使用服务 | 无controller/route/service引用 |
| `backend/src/services/aiRecommender.ts` | 未使用服务 | agentService引用的是aiTripRecommender，非此文件 |
| `backend/src/services/destinationCacheService.ts` | 未使用服务 | 无任何外部文件import |
| `backend/src/services/imageReviewService.ts` | 未使用服务 | 无任何外部文件import |
| `backend/src/utils/index.ts` | 未使用工具 | 导出successResponse/errorResponse/asyncHandler，无人引用 |
| `backend/src/middleware/validator.ts` | 未使用中间件 | 无任何文件import |

### 2.2 Frontend 未引用文件

| 文件路径 | 类型 | 判断理由 |
|---------|------|---------|
| `frontend/src/components/common/HeroSection.tsx` | 废弃组件 | 已被LandingHeroSection.tsx替代 |
| `frontend/src/components/spot/SpotCard.tsx` | 废弃组件 | 已被SpotCardLegacy.tsx替代 |
| `frontend/src/components/spot/AttractionCard.tsx` | 未使用组件 | DestinationDetail使用的是DestinationAttractionCard |
| `frontend/src/components/iot/IoTDemoShowcase.tsx` | 未使用组件 | 无任何文件import |
| `frontend/src/components/recommendation/PopularDestinations.tsx` | 未使用组件 | 无任何页面import |
| `frontend/src/pages/SharedTrip.tsx` | 废弃页面 | 路由已使用SharedTripNew.tsx |
| `frontend/src/api/adminImageClient.ts` | 未使用API | 无任何文件import |
| `frontend/src/api/client_header.ts` | 未使用API | 无任何文件import |
| `frontend/src/utils/amapCache.ts` | 未使用工具 | 无任何文件import |
| `frontend/src/utils/staticMapGenerator.ts` | 未使用工具 | 无任何文件import |
| `frontend/src/utils/index.ts` | 未使用工具 | 导出函数无人引用，各组件自行定义本地版本 |
| `frontend/src/types/index.ts` | 未使用类型 | 无任何文件import |
| `frontend/src/App.css` | 遗留样式 | Vite默认模板样式，无任何文件import |
| `frontend/src/assets/react.svg` | 遗留资源 | Vite默认模板资产，无人引用 |

---

## 三、过时配置文件/构建产物

| 文件/目录路径 | 类型 | 判断理由 |
|--------------|------|---------|
| `backend/.eslintrc.cjs` | 遗留配置 | ESLint 9.x默认使用flat config，旧格式可能不生效 |
| `frontend/.eslintrc.cjs` | 遗留配置 | 同上 |
| `frontend/tsconfig.tsbuildinfo` | 构建缓存 | TypeScript增量编译缓存(122KB)，应通过.gitignore忽略 |
| `backend/dist/` | 构建产物 | TypeScript编译输出，不应提交到版本库 |
| `backend/data-backups/` | 数据备份 | 包含旧数据库备份(~2MB)和JSON元数据，运行时产物 |

---

## 四、可移除的npm依赖

### 4.1 Backend 可移除依赖

| 依赖名 | 当前位置 | 判断理由 |
|--------|---------|---------|
| `node-fetch` | dependencies | 代码中无import/require，项目使用axios |
| `swagger-jsdoc` | dependencies | 代码中无import，项目无Swagger API文档集成 |
| `swagger-ui-express` | dependencies | 同上 |
| `zhipuai` | dependencies | 代码中无import，未直接使用此SDK |
| `@types/uuid` | dependencies | uuid v13已内置TypeScript类型，此@types包冗余 |

### 4.2 Backend 依赖位置异常

| 依赖名 | 当前位置 | 应移至 | 判断理由 |
|--------|---------|--------|---------|
| `axios` | devDependencies | dependencies | 被amapService.ts/weatherService.ts等生产代码引用 |

### 4.3 Frontend 可移除依赖

| 依赖名 | 当前位置 | 判断理由 |
|--------|---------|---------|
| `@fontsource-variable/geist` | dependencies | 无任何文件/CSS引用此字体 |
| `@hookform/resolvers` | dependencies | 无任何文件import |
| `@radix-ui/react-accordion` | dependencies | 使用radix-ui统一包，未直接import |
| `@radix-ui/react-alert-dialog` | dependencies | 同上 |
| `@radix-ui/react-aspect-ratio` | dependencies | 同上 |
| `@radix-ui/react-avatar` | dependencies | 同上 |
| `@radix-ui/react-checkbox` | dependencies | 同上 |
| `@radix-ui/react-collapsible` | dependencies | 同上 |
| `@radix-ui/react-context-menu` | dependencies | 同上 |
| `@radix-ui/react-dialog` | dependencies | 同上 |
| `@radix-ui/react-dropdown-menu` | dependencies | 同上 |
| `@radix-ui/react-hover-card` | dependencies | 同上 |
| `@radix-ui/react-label` | dependencies | 同上 |
| `@radix-ui/react-menubar` | dependencies | 同上 |
| `@radix-ui/react-navigation-menu` | dependencies | 同上 |
| `@radix-ui/react-popover` | dependencies | 同上 |
| `@radix-ui/react-progress` | dependencies | 同上 |
| `@radix-ui/react-radio-group` | dependencies | 同上 |
| `@radix-ui/react-scroll-area` | dependencies | 同上 |
| `@radix-ui/react-select` | dependencies | 同上 |
| `@radix-ui/react-separator` | dependencies | 同上 |
| `@radix-ui/react-slider` | dependencies | 同上 |
| `@radix-ui/react-slot` | dependencies | 同上 |
| `@radix-ui/react-switch` | dependencies | 同上 |
| `@radix-ui/react-tabs` | dependencies | 同上 |
| `@radix-ui/react-toast` | dependencies | 同上 |
| `@radix-ui/react-toggle` | dependencies | 同上 |
| `@radix-ui/react-toggle-group` | dependencies | 同上 |
| `@radix-ui/react-tooltip` | dependencies | 同上 |
| `@uiw/react-md-editor` | dependencies | 无任何文件import |
| `cmdk` | dependencies | 无任何文件import |
| `date-fns` | dependencies | 前端日期处理使用dayjs，date-fns完全未使用 |
| `echarts` | dependencies | 无任何文件import |
| `echarts-for-react` | dependencies | 同上 |
| `embla-carousel-react` | dependencies | 无任何文件import |
| `input-otp` | dependencies | 无任何文件import |
| `mapbox-gl` | dependencies | 项目使用高德地图，非Mapbox |
| `react-day-picker` | dependencies | 日历为自实现DoubleCalendar |
| `react-hook-form` | dependencies | 无任何文件import |
| `react-image-crop` | dependencies | 图片裁切使用react-easy-crop |
| `react-markdown` | dependencies | 无任何文件import |
| `react-resizable-panels` | dependencies | 无任何文件import |
| `recharts` | dependencies | 无任何文件import |
| `remark-gfm` | dependencies | react-markdown配套插件，两者均未使用 |
| `vaul` | dependencies | 无任何文件import |
| `zod` | dependencies | 无任何文件import |
| `tw-animate-css` | devDependencies | tailwindcss-animate的替代品，但未被引用，与tailwindcss-animate重复 |
| `shadcn-ui` | devDependencies | 旧版shadcn CLI，已被新版shadcn替代 |

---

## 五、统计汇总

| 类别 | 数量 |
|------|------|
| 空目录 | 2 |
| Backend未引用文件 | 7 |
| Frontend未引用文件 | 14 |
| 过时配置/产物 | 5 |
| Backend可移除依赖 | 5 |
| Frontend可移除依赖 | 46 |
| **文件总计** | **28** |
| **依赖总计** | **51** |

---

## 六、执行建议

### 文件删除命令（一键执行参考）

```bash
# 空目录
rm -rf backend/src/iot backend/src/scripts

# Backend未引用文件
rm backend/src/models/index.ts backend/src/services/planService.ts backend/src/services/aiRecommender.ts backend/src/services/destinationCacheService.ts backend/src/services/imageReviewService.ts backend/src/utils/index.ts backend/src/middleware/validator.ts

# Frontend未引用文件
rm frontend/src/components/common/HeroSection.tsx frontend/src/components/spot/SpotCard.tsx frontend/src/components/spot/AttractionCard.tsx frontend/src/components/iot/IoTDemoShowcase.tsx frontend/src/components/recommendation/PopularDestinations.tsx frontend/src/pages/SharedTrip.tsx frontend/src/api/adminImageClient.ts frontend/src/api/client_header.ts frontend/src/utils/amapCache.ts frontend/src/utils/staticMapGenerator.ts frontend/src/utils/index.ts frontend/src/types/index.ts frontend/src/App.css frontend/src/assets/react.svg

# 构建产物
rm frontend/tsconfig.tsbuildinfo
rm -rf backend/dist backend/data-backups
```

### 依赖移除命令

```bash
# Backend
cd backend
npm uninstall node-fetch swagger-jsdoc swagger-ui-express zhipuai @types/uuid

# Frontend
cd ../frontend
npm uninstall @fontsource-variable/geist @hookform/resolvers @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip @uiw/react-md-editor cmdk date-fns echarts echarts-for-react embla-carousel-react input-otp mapbox-gl react-day-picker react-hook-form react-image-crop react-markdown react-resizable-panels recharts remark-gfm vaul zod tw-animate-css shadcn-ui
```

> ⚠️ 删除依赖后需重新 `npm install` 并验证项目编译和运行正常
