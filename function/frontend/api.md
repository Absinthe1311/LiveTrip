# frontend/src/api 函数列表

## client.ts

### 实例
- `apiClient` - Axios实例（带请求/响应拦截器）

### 函数
- `makePlan` - 创建行程规划
- `spotIot` - 获取IoT数据
- `getAlternativeSpots` - 获取备选景点
- `updateAlternativeRelations` - 更新备选关系
- `editTrip` - 调整行程
- `listTrips` - 获取用户所有行程
- `getTripById` - 获取单个行程详情
- `delTrip` - 删除行程
- `saveTrip` - 保存行程
- `updHotel` - 更新行程酒店信息
- `setDayDining` - 更新某天餐厅信息
- `calBudget` - 计算实时预算
- `budgetStats` - 获取预算状态
- `modBudget` - 调整总预算
- `updPrice` - 更新项目价格
- `budgetLog` - 获取预算变更历史
- `findLoc` - 搜索地点（带缓存）
- `getPopularLocations` - 获取热门搜索地点
- `myFavs` - 获取收藏列表
- `addFavorite` - 添加收藏
- `removeFavorite` - 取消收藏
- `chkFav` - 检查是否已收藏
- `getFavoriteCount` - 获取收藏数量
- `syncSpot` - 同步景点到数据库
- `getCityAttractions` - 获取城市热门景点
- `getSupportedCities` - 获取支持的城市列表
- `shareTrip` - 分享行程
- `getSharedTrip` - 获取公开行程
- `copyTrip` - 复刻公开行程
- `completeTrip` - 完成行程
- `batchgetSpotImgsByIds` - 批量获取景点图片
- `createReview` - 创建评价
- `getSpotReviews` - 获取景点评价
- `getUserReviews` - 获取用户评价
- `deleteReview` - 删除评价
- `toggleReviewLike` - 点赞/取消点赞评价
- `getSpotReviewsStats` - 批量获取景点评价统计
- `addBlog` - 创建博客文章
- `fetchPosts` - 获取博客文章列表
- `loadBlogId` - 获取博客详情
- `updBlog` - 更新博客文章
- `delBlog` - 删除博客文章
- `blogLike` - 点赞/取消点赞
- `addBlogComment` - 添加评论
- `delBlogComment` - 删除评论
- `toggleBlogCommentLike` - 点赞/取消点赞评论
- `hotTags` - 获取热门标签
- `incrementBlogViewCount` - 增加博客浏览量
- `getHotDestinations` - 获取热门目的地

---

## adminApi.ts

### 函数
- `getAdminSpots` - 获取管理员景点列表
- `getSpotImgs` - 获取景点图片列表
- `reviewImg` - 审核图片
- `deleteAdminImage` - 删除图片
- `fetchPendingImgs` - 获取待审核图片列表
- `uploadAdminImage` - 上传景点图片（管理员专用）

---

## collabApi.ts

### 函数
- `citySpots` - 获取城市所有景点
- `createCollabRoom` - 创建协同房间
- `joinCollabRoom` - 通过邀请token加入协同房间
- `getCollabRoomInfo` - 获取房间信息
- `spotStats` - 获取景点统计（仅Host）
- `lockCollabRoom` - 锁定房间（仅Host）
- `saveDraft` - 创建或更新草案
- `sendDraft` - 提交草案
- `myDrfts` - 获取用户草案列表
- `allDrafts` - 获取所有成员草案
- `sendCollabMessage` - 发送消息
- `getCollabMessages` - 获取房间消息列表
- `commitTrip` - 保存最终协同行程
- `getLatestCollabTrip` - 获取最新协同行程

---

## notification.ts

### 函数
- `fetNotifs` - 获取通知列表
- `markAsRead` - 标记通知为已读
- `markAllAsRead` - 标记所有通知为已读
