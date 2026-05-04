# backend/src/routes 函数列表

## 说明
routes文件夹中的文件主要是路由配置，将controller中的函数挂载到对应的HTTP路由上。大部分不包含独立的业务函数。

## index.ts
- 路由聚合配置，统一管理所有API路由

## 各路由文件说明
- `adminRoutes.ts` - 管理员相关路由
- `advisorRoutes.ts` - AI顾问路由
- `agentRoutes.ts` - Agent路由（含内联处理函数）
- `authRoutes.ts` - 认证路由
- `blogRoutes.ts` - 博客路由
- `chatHistoryRoutes.ts` - 聊天历史路由
- `collabRoutes.ts` - 协同规划路由
- `destinationRoutes.ts` - 目的地路由
- `favoriteRoutes.ts` - 收藏路由
- `hotSpotRoutes.ts` - 热门景点路由
- `imageRoutes.ts` - 图片路由
- `iotRoutes.ts` - IoT数据路由
- `locationCacheRoutes.ts` - 地点缓存路由
- `notificationRoutes.ts` - 通知路由
- `packingRoutes.ts` - 打包清单路由
- `planRoutes.ts` - 行程规划路由
- `recommendationRoutes.ts` - 推荐路由
- `shareRoutes.ts` - 分享路由
- `spotRoutes.ts` - 景点路由
- `spotSyncRoutes.ts` - 景点同步路由
- `tripRoutes.ts` - 行程管理路由
- `uploadRoutes.ts` - 上传路由
- `userRoutes.ts` - 用户路由

## agentRoutes.ts 内联函数
- 确认保存行程处理函数
- 取消草稿处理函数
- 确认发布博客处理函数
