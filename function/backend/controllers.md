# backend/src/controllers 函数列表

## adminController.ts

### 类 AdminController
- `fetchDash` - 获取仪表板统计数据
- `uploadImgs` - 上传景点图片
- `chkImgState` - 获取景点图片状态
- `setPImg` - 设置主图
- `fetchUserSpots` - 获取用户行程景点
- `getSpots` - 获取景点列表
- `reviewImg` - 审核图片
- `getSpotImgs` - 获取景点图片
- `delImg` - 删除图片
- `fetchPendingImgs` - 获取待审核图片
- `getSpotIDUser` (private) - 从用户行程获取景点ID

---

## advisorController.ts

### 函数
- `fetchMsgs` - 获取会话消息
- `userSessions` - 获取用户会话列表
- `delSession` - 删除会话
- `chatAdvisor` - AI顾问对话

---

## authController.ts

### 函数
- `regUser` - 用户注册
- `login` - 用户登录
- `currUser` - 获取当前用户信息
- `saveProfile` - 更新用户资料
- `authToken` - Token认证中间件

---

## agentController.ts

### 函数
- `askAgent` - AI Agent对话

---

## agentSSEController.ts

### 函数
- `askAgentSSE` - AI Agent SSE流式对话

---

## blogController.ts

### 类 BlogController
- `addBlog` - 创建博客
- `fetchPosts` - 获取博客列表
- `loadBlogId` - 获取博客详情
- `incViews` - 增加浏览量
- `updBlog` - 更新博客
- `delBlog` - 删除博客
- `blogLike` - 点赞/取消点赞
- `addCmt` - 添加评论
- `delCmt` - 删除评论
- `likeCmt` - 评论点赞/取消点赞
- `hotTags` - 获取热门标签

---

## collabController.ts

### 函数
- `createRoom` - 创建协同房间
- `joinRoom` - 加入协同房间
- `getRoomInfo` - 获取房间信息
- `spotStats` - 获取景点统计
- `closeRoom` - 锁定房间
- `saveDraft` - 创建或更新草案
- `sendDraft` - 提交草案
- `myDrfts` - 获取用户草案列表
- `allDrafts` - 获取所有成员草案
- `msgSend` - 发送消息
- `msgs` - 获取消息列表
- `commitTrip` - 保存最终协同行程

---

## destinationController.ts

### 函数
- `hotCities` - 获取热门城市列表
- `citySpots` - 获取城市热门景点
- `cityAll` - 获取城市所有景点

---

## favoriteController.ts

### 函数
- `myFavs` - 获取收藏列表
- `addFav` - 添加收藏
- `delFav` - 取消收藏
- `chkFav` - 检查收藏状态
- `myFavsCount` - 获取收藏数量

---

## hotSpotController.ts

### 函数
- `hotSpots` - 获取热门景点
- `hotCities` - 获取热门城市列表
- `hotCitiesWithSpots` - 获取热门城市（含景点信息）

---

## imageController.ts

### 类 ImageController
- `blogImgUpload` - 上传博客图片
- `imgUpload` - 上传景点图片
- `batchgetSpotImgsByIds` - 批量获取景点图片
- `getSpotImgs` - 获取景点所有图片

---

## iotController.ts

### 函数
- `spotIot` - 获取所有景点IoT数据
- `spotIoT` - 获取指定景点IoT数据

---

## locationCacheController.ts

### 函数
- `findLoc` - 搜索地点（带缓存）
- `getPopularfindLocs` - 获取热门搜索地点
- `clearLocs` - 清空地点缓存

---

## notificationController.ts

### 函数
- `fetNotifs` - 获取通知列表
- `readAllNotifs` - 标记通知已读
- `markAllNotificationsAsRead` - 标记所有通知已读
- `fireSensor` - 手动触发环境感知
- `delNotif` - 删除通知
- `flushNotifs` - 清空所有通知

---

## packingController.ts

### 类 PackingController
- `packList` - 获取打包清单
- `initPack` - 初始化打包清单
- `addItem` - 添加打包物品
- `batchSave` - 批量保存打包清单
- `updItem` - 更新打包物品状态
- `delItem` - 删除打包物品
- `categories` - 获取所有分类
- `packProgress` - 获取打包进度

---

## planController.ts

### 函数
- `makePlan` - 创建行程计划
- `itinerary` - 获取行程详情
- `editTrip` - 调整行程

---

## recommendationController.ts

### 函数
- `hotelRecs` - 获取酒店推荐
- `restaurantRecs` - 获取餐厅推荐
- `findRestaurant` - 自定义餐厅搜索
- `findHotel` - 自定义酒店搜索

---

## shareController.ts

### 函数
- `shareTrip` - 分享行程
- `getSharedTrip` - 获取公开行程
- `copyTrip` - 复刻公开行程

---

## spotSyncController.ts

### 函数
- `syncSpot` - 同步景点到数据库
- `syncSpotsBatch` - 批量同步景点

---

## testNotificationController.ts

### 函数
- `testNotif` - 发送测试通知
- `batchTestNotifs` - 批量发送测试通知

---

## tripController.ts

### 函数
- `listTrips` - 获取用户所有行程
- `getTripById` - 获取单个行程详情
- `delTrip` - 删除行程
- `saveTrip` - 保存行程
- `updHotel` - 更新行程酒店信息
- `calBudget` - 计算实时预算
- `setDayDining` - 更新某天餐厅信息

---

## uploadController.ts

### 函数
- `imgUpload` - 上传图片到Cloudinary
- `delImg` - 删除Cloudinary图片

---

## userController.ts

### 类 UserController
- `userInfo` - 获取用户完整信息
- `saveProfile` - 更新用户基本信息
- `uploadAvatar` - 上传头像
- `updStats` - 更新用户统计数据

---

## budgetController.ts

### 函数
- `budgetStats` - 获取预算状态
- `modBudget` - 调整总预算
- `updPrice` - 更新项目价格
- `budgetLog` - 获取预算变更历史
