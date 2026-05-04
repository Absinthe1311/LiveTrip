# backend/src/services 函数列表

## advisorService.ts

### 类 AdvisorService
- `constructor` - 构造函数
- `callZhipuAI` (private) - 调用智谱AI API
- `needsSpotData` (private) - 判断是否需要获取景点数据
- `getSpotsFromDatabase` (private) - 从数据库获取景点数据
- `formatSpotsForPrompt` (private) - 格式化景点数据为提示词
- `answerQuestion` - 回答用户问题
- `buildSystemPrompt` (private) - 构建系统提示词
- `buildUserPrompt` (private) - 构建用户提示词

---

## agentService.ts

### 类 AgentService
- `callZhipuAI` (private) - 调用智谱AI API
- `getTools` (private) - 定义可用工具
- `checkMissingTripParams` (private) - 检查缺失参数
- `generateParamQuestion` (private) - 生成参数询问
- `validateCreateTripParams` (private) - 验证创建行程参数
- `cleanBlogContent` (private) - 清理博客内容
- `checkIfConfirmAction` (private) - 检查是否确认操作
- `parsePreferences` (private) - 解析偏好
- `parseLatitude` (private) - 解析纬度
- `parseLongitude` (private) - 解析经度
- `inferDestination` (private) - 推断目的地
- `inferDates` (private) - 推断日期
- `inferDays` (private) - 推断天数
- `inferBudget` (private) - 推断预算
- `inferTravelers` (private) - 推断出行人数
- `inferPreferences` (private) - 推断偏好
- `formatError` (private) - 格式化错误
- `confirmTrip` - 确认保存行程
- `confirmBlogPublish` - 确认发布博客
- `cancelDraft` - 取消草稿

---

## aiTripRecommender.ts
- `parseAiResponse` (private) - 解析AI响应

---

## alternativeRecommender.ts
- `getHealthLevel` (private) - 获取健康等级

---

## amapPOICacheService.ts
- `getFromCache` - 从缓存获取
- `saveToCache` - 保存到缓存
- `getCacheStats` - 获取缓存统计

---

## amapService.ts
- `constructor` - 构造函数
- `getAttractionsByType` - 按类型获取景点
- `getRestaurants` - 获取餐厅
- `getScenicSpots` - 获取景点
- `getTouristAttractions` - 获取旅游景点
- `getAllAttractions` - 获取所有景点
- `deduplicateAttractions` (private) - 去重景点
- `parseLocation` - 解析位置
- `calculateDistance` - 计算距离
- `toRadians` (private) - 角度转弧度

---

## blogService.ts

### 类 BlogService
- `addBlog` - 创建博客
- `fetchPosts` - 获取博客列表
- `loadBlogId` - 获取博客详情
- `incViews` - 增加浏览量
- `updBlog` - 更新博客
- `delBlog` - 删除博客
- `blogLike` - 点赞/取消点赞
- `addCmt` - 添加评论
- `delCmt` - 删除评论
- `likeCmt` - 评论点赞
- `hotTags` - 获取热门标签

---

## budgetCalculator.ts
- `calculateActualBudget` - 计算实际预算
- `calculateEstimatedBudget` - 计算预估预算
- `estimateHotelPrice` (private) - 估算酒店价格
- `estimateRestaurantPrice` (private) - 估算餐厅价格
- `calculateTransportationCost` (private) - 计算交通费用
- `budgetStats` (private) - 获取预算状态
- `getWarningLevel` - 获取警告等级
- `getWarningMessage` - 获取警告消息

---

## budgetOptimizer.ts
- `calculateBudget` - 计算预算
- `getCityTier` (private) - 获取城市等级
- `getSeason` (private) - 获取季节
- `calculateTickets` (private) - 计算门票费用

---

## budgetTrackingService.ts
- `createBudgetRecord` - 创建预算记录
- `adjustTotalBudget` - 调整总预算
- `updPrice` - 更新项目价格
- `budgetLog` - 获取预算历史
- `getRealTimeBudget` - 获取实时预算
- `getCategoryName` (private) - 获取分类名称
- `budgetStats` (private) - 获取预算状态

---

## chatHistoryService.ts
- `createSession` - 创建会话
- `updateSessionState` - 更新会话状态
- `updateSessionTempData` - 更新临时数据
- `clearSessionTempData` - 清除临时数据
- `getSession` - 获取会话
- `getOrCreateAdvisorSession` - 获取或创建顾问会话
- `getOrCreateAgentSession` - 获取或创建Agent会话
- `createMessage` - 创建消息
- `msgs` - 获取消息
- `userSessions` - 获取用户会话
- `delSession` - 删除会话
- `getSessionWithMessages` - 获取会话及消息

---

## cloudinaryService.ts
- `imgUpload` - 上传图片
- `delImg` - 删除图片
- `getOptimizedUrl` - 获取优化URL
- `checkImageExists` - 检查图片是否存在
- `getImageInfo` - 获取图片信息

---

## clusteringService.ts
- `kMeansClustering` - K均值聚类
- `selectInitialCenters` (private) - 选择初始中心
- `assignToClusters` (private) - 分配到聚类
- `recalculateCenters` (private) - 重新计算中心
- `hasConverged` (private) - 是否收敛
- `balanceClusters` (private) - 平衡聚类
- `parseLocation` (private) - 解析位置
- `calculateDistance` (private) - 计算距离
- `toRadians` (private) - 角度转弧度

---

## collabService.ts
- `createRoom` - 创建房间
- `joinRoom` - 加入房间
- `getRoomInfo` - 获取房间信息
- `spotStats` - 获取景点统计
- `closeRoom` - 锁定房间
- `saveDraft` - 创建或更新草案
- `sendDraft` - 提交草案
- `myDrfts` - 获取用户草案
- `msgSend` - 发送消息
- `msgs` - 获取消息
- `isHost` - 是否是房主
- `isMember` - 是否是成员

---

## constraintAwarePlanner.ts
- `calculateTotalSpotsNeeded` (private) - 计算所需景点数
- `parsePreferences` (private) - 解析偏好

---

## crowdSimulator.ts
- `isWeekendOrHoliday` - 是否周末或节假日
- `getCurrentHour` - 获取当前小时
- `calculateTimeSlotFactor` - 计算时段因子
- `getSpotHeatCoefficient` - 获取景点热度系数
- `calculateWaitTime` - 计算等待时间
- `calculateIsOpen` - 计算是否开放
- `getBatchCrowdData` - 批量获取人流数据
- `updateSpotIoTData` - 更新景点IoT数据

---

## diversityService.ts
- `applyDiversityConstraints` - 应用多样性约束
- `canAddSpot` (private) - 是否可添加景点
- `checkDiversity` - 检查多样性

---

## environmentSensorService.ts
- `constructor` - 构造函数
- `sense` - 环境感知
- `isOutdoorAttraction` (private) - 是否户外景点
- `logSensorResult` - 记录感知结果
- `logSensorResults` - 批量记录感知结果

---

## errorHandler.ts
- `determineErrorType` (private) - 确定错误类型
- `determineErrorSeverity` (private) - 确定错误严重性
- `recordError` (private) - 记录错误
- `getErrors` - 获取错误
- `clearErrors` - 清除错误
- `getErrorStats` - 获取错误统计
- `validateItinerary` - 验证行程
- `generateFallbackItinerary` - 生成回退行程
- `generateErrorReport` - 生成错误报告

---

## favoriteService.ts
- `getUserFavorites` - 获取用户收藏
- `getUserFavoritesWithIoT` - 获取收藏（含IoT）
- `addFavorite` - 添加收藏
- `removeFavorite` - 移除收藏
- `isFavorite` - 是否已收藏
- `getFavoriteCount` - 获取收藏数量

---

## hotelCacheService.ts
- `saveHotels` - 保存酒店
- `calculateDistance` (private) - 计算距离

---

## hotelRecommender.ts
- `hotelRecs` - 获取酒店推荐
- `calculateCenterPoint` (private) - 计算中心点
- `getHotelTierByBudget` (private) - 按预算获取酒店等级
- `filterHotelsByTier` (private) - 按等级过滤酒店
- `mapHotelType` (private) - 映射酒店类型
- `sortHotels` (private) - 排序酒店
- `inferCityFromSpots` (private) - 从景点推断城市

---

## imageService.ts
- `imgUpload` - 上传图片
- `delImg` - 删除图片
- `extractCloudinaryIdFromUrl` (private) - 从URL提取Cloudinary ID
- `setAsPrimary` - 设置为主图
- `getImageById` - 按ID获取图片
- `getSpotImgs` - 获取景点图片
- `batchgetSpotImgsByIds` - 批量获取景点图片

---

## iotCheckService.ts
- `isOutdoorAttraction` (private) - 是否户外景点
- `adjustForWeather` - 根据天气调整
- `reassignTimeSlots` (private) - 重新分配时间槽
- `minutesToTime` (private) - 分钟转时间

---

## itineraryAdjustService.ts
- `editTrip` - 调整行程
- `parseLocation` (private) - 解析位置
- `toRadians` (private) - 角度转弧度

---

## locationCacheService.ts
- `findLocWithCache` - 带缓存搜索地点
- `getPopularLocations` - 获取热门地点
- `clearAllCache` - 清除所有缓存
- `cleanExpiredCache` - 清除过期缓存

---

## mustVisitSpotExtractor.ts
- `extractMustVisitSpots` - 提取必游景点
- `identifyPotentialSpotNames` (private) - 识别潜在景点名
- `calculateSimilarity` (private) - 计算相似度
- `getSpotSelect` (private) - 获取景点选择

---

## notificationService.ts
- `notify` - 发送通知
- `notifyBatch` - 批量发送通知
- `getNotificationTitle` (private) - 获取通知标题
- `getUserNotifications` - 获取用户通知
- `markAsRead` - 标记已读
- `markAllAsRead` - 标记全部已读

---

## packingService.ts
- `packList` - 获取打包清单
- `initPack` - 初始化打包清单
- `addItem` - 添加打包物品
- `batchSave` - 批量保存打包清单
- `updItem` - 更新打包物品
- `delItem` - 删除打包物品
- `getCategoryName` - 获取分类名称
- `getAllCategories` - 获取所有分类
- `packProgress` - 获取打包进度

---

## restaurantCacheService.ts
- `saveRestaurants` - 保存餐厅
- `calculateDistance` (private) - 计算距离

---

## restaurantRecommender.ts
- `restaurantRecs` - 获取餐厅推荐
- `getCenterIndex` (private) - 获取中心索引
- `extractCuisineType` (private) - 提取菜系类型
- `filterInappropriateRestaurants` (private) - 过滤不合适餐厅
- `calculateDistanceFromLocation` (private) - 计算距离
- `sortRestaurants` (private) - 排序餐厅
- `inferCityFromSpots` (private) - 从景点推断城市

---

## routeOptimizer.ts
- `optimizeRoute` - 优化路线
- `greedyOptimization` (private) - 贪心优化
- `twoOptOptimization` (private) - 2-opt优化
- `swapEdges` (private) - 交换边
- `parseLocation` (private) - 解析位置
- `calculateDistance` (private) - 计算距离
- `toRadians` (private) - 角度转弧度
- `stripCoords` (private) - 去除坐标
- `calculateTotalDistance` - 计算总距离
- `calculateTotalDistanceWithCoords` (private) - 计算总距离（带坐标）
- `getSpotEnergyCost` (private) - 获取景点能量消耗
- `calculateRouteScore` (private) - 计算路线评分
- `calculateEnergyDistributionScore` (private) - 计算能量分布评分
- `recalculateTimeSlots` - 重新计算时间槽
- `minutesToTime` (private) - 分钟转时间

---

## scoringEngine.ts
- `scoreSpots` - 评分景点
- `inferSpotCategories` (private) - 推断景点分类
- `calculateIoTScore` (private) - 计算IoT评分

---

## sensorScheduler.ts
- `start` - 启动调度器
- `stop` - 停止调度器
- `triggerManualSensing` - 手动触发感知

---

## shareService.ts
- `generateShareLink` - 生成分享链接
- `getPublicTrip` - 获取公开行程
- `cloneTrip` - 复刻行程

---

## spotDataService.ts
- `citySpotsWithIoTData` - 获取城市景点（含IoT）
- `formatSpotsForAI` - 格式化景点给AI
- `getSpotByName` - 按名称获取景点
- `getSpotsByIds` - 按ID获取景点
- `hotSpots` - 获取热门景点

---

## spotService.ts
- `citySpots` - 获取城市景点
- `findSpotIdByNameAndCity` - 按名称和城市查找景点ID
- `generateIoTDataForSpot` - 为景点生成IoT数据
- `getBatchIoTData` - 批量获取IoT数据
- `generateDynamicIoTData` (private) - 生成动态IoT数据
- `getBaseCrowdByType` (private) - 按类型获取基础人流
- `getTimeFactor` (private) - 获取时间因子
- `getSeasonFactor` (private) - 获取季节因子
- `getBaseTemperature` (private) - 获取基础温度
- `getBaseRainProbability` (private) - 获取基础降雨概率
- `checkIsOpen` (private) - 检查是否开放

---

## traditionalRecommender.ts
- `recommendItinerary` - 推荐行程
- `generateAlternativePools` - 生成备选景点池
- `scoreSpots` - 评分景点

---

## userProfileService.ts
- `getUserProfile` - 获取用户画像
- `updateUserProfile` - 更新用户画像
- `inferPreferencesFromHistory` - 从历史推断偏好

---

## weatherService.ts
- `getWeatherData` - 获取天气数据
- `getBatchWeatherData` - 批量获取天气数据
