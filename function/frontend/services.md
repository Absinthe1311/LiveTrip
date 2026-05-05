# frontend/src/services 函数列表

## aiService.ts

### 类 AIService
- `sendAdvisorMessage` - 发送消息（问答助手模式）
- `sendAgentMessageSSE` - 发送消息（智能助手模式，SSE流式）

### 导出实例
- `aiService` - AIService单例实例

---

## collabSocket.ts

### 函数
- `connectSocket` - 连接到Socket.io服务器
- `disconnectSocket` - 断开Socket连接
- `joinCollabRoom` - 加入协同房间
- `leaveCollabRoom` - 离开协同房间
- `moveCursor` - 移动光标
- `updateDraft` - 更新草案
- `submitDraft` - 提交草案
- `sendNewMessage` - 发送新消息

---

## alternativeRecommender.ts

### 类 AlternativeRecommender
- `getRecommendations` - 获取备选景点推荐
- `getFallbackRecommendations` (private) - Fallback方案
- `extractCityFromItinerary` (private) - 从行程中提取城市信息
- `calculateIoTScore` (private) - 计算IoT数据评分
- `isSuitableForVisit` - 检查景点是否适合游玩
- `getHealthLevel` - 获取景点健康度等级
- `getHealthColor` - 获取健康度对应的颜色
- `getHealthIcon` - 获取健康度对应的图标
- `getHealthMessage` - 获取健康度对应的提示文案

### 导出实例
- `alternativeRecommender` - AlternativeRecommender单例实例
