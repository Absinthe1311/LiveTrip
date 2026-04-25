// AI辅助生成：GLM-5, 2026-04-25 21:24
// 描述：LiveTrip AI Agent架构分析文档，详细说明Agent的实现机制、技能体系、函数调用流程和扩展设计指南。

# LiveTrip AI Agent 架构分析文档

## 📋 文档概述

本文档详细分析了LiveTrip项目中AI Agent的实现架构、技能体系、函数调用机制，以及如何在此基础上进行功能扩展。

**生成时间**：2026-04-25 21:24  
**分析范围**：Agent核心服务、工具定义、调用流程、推荐系统

---

## 🏗️ 一、Agent整体架构

### 1.1 架构层次图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端交互层                               │
│  AIAdvisor.tsx (毛玻璃风格聊天组件)                          │
│  - 用户输入处理                                               │
│  - 消息展示                                                   │
│  - 快捷问题模板                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                    Agent服务层                                │
│  agentService.ts (核心Agent服务)                             │
│  - processRequest() 主处理流程                               │
│  - callZhipuAI() AI调用                                      │
│  - executeToolCall() 工具执行                                │
│  - buildSystemPrompt() 系统提示构建                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼─────┐
│ 工具执行层    │ │ AI推荐层   │ │ 数据层    │
│              │ │            │ │          │
│ - 创建行程   │ │ aiTrip     │ │ Prisma   │
│ - 列出行程   │ │ Recommender│ │ ORM      │
│ - 管理博客   │ │            │ │          │
│ - 确认操作   │ │            │ │          │
└──────────────┘ └────────────┘ └──────────┘
```

### 1.2 核心组件说明

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| **Agent服务** | `backend/src/services/agentService.ts` | 核心Agent逻辑，工具调用，对话管理 |
| **AI推荐器** | `backend/src/services/aiTripRecommender.ts` | 使用AI生成行程推荐 |
| **聊天历史** | `backend/src/services/chatHistoryService.ts` | 对话上下文管理 |
| **用户画像** | `backend/src/services/userProfileService.ts` | 用户偏好分析 |
| **前端组件** | `frontend/src/components/ai/AIAdvisor.tsx` | 用户交互界面 |

---

## 🤖 二、Agent技能体系

### 2.1 工具定义（Tools）

Agent当前定义了**5个核心工具**，通过智谱AI的Function Calling机制实现：

#### 工具1：`create_smart_trip` - 创建智能行程

**功能**：创建智能旅行行程，支持必选景点、约束条件、智能推荐

**触发条件**：
- 用户表达旅行意图（如"我想去北京"、"计划去上海"）
- 用户提到具体景点（如"一定要去故宫"）

**参数定义**：
```typescript
{
  destination: string,      // 目的地城市（必填）
  startDate?: string,       // 开始日期（可选，默认明天）
  endDate?: string,         // 结束日期（可选，默认3天后）
  days?: number,            // 行程天数（可选，默认3天）
  budget?: number,          // 预算金额（可选，默认5000元）
  travelers?: number,       // 旅行人数（可选，默认2人）
  preferences?: string,     // 旅行偏好（可选）
  mustVisitSpots?: string[],// 必选景点列表（可选）
  groupType?: string        // 群体类型（可选）
}
```

**执行流程**：
1. 参数检查和追问（如果缺少必填参数）
2. 调用`createTrip`生成完整行程（包含AI推荐）
3. 构建预览数据
4. 保存临时数据到会话（等待用户确认）
5. 删除临时行程
6. 返回预览数据

**特点**：
- ✅ 支持二次确认机制（先预览，后保存）
- ✅ 智能参数推断（使用默认值减少确认）
- ✅ 集成AI推荐系统

---

#### 工具2：`list_user_trips` - 列出用户行程

**功能**：查看用户的行程列表

**触发条件**：
- 用户想查看行程（如"查看我的行程"、"有哪些行程"）

**参数定义**：
```typescript
{
  status?: string  // 行程状态筛选：planning/ongoing/completed
}
```

**执行流程**：
1. 验证用户身份
2. 构建查询条件（支持状态筛选）
3. 查询行程数据（最多返回10个）
4. 格式化返回结果

---

#### 工具3：`manage_blog` - 管理博客

**功能**：管理旅行博客，支持生成和发布

**触发条件**：
- 用户想写游记（如"为上次旅行写游记"）
- 用户想发布博客（如"发布这篇博客"）

**参数定义**：
```typescript
{
  action: string,      // 操作类型：generate/publish（必填）
  tripId?: string,     // 行程ID（生成博客时必填）
  blogId?: string,     // 博客ID（发布博客时必填）
  title?: string,      // 博客标题（可选）
  style?: string       // 博客风格（可选）
}
```

**执行流程**：
- **生成博客**：
  1. 验证行程存在且已完成
  2. 收集行程信息
  3. 调用AI生成博客内容
  4. 创建博客草稿
  5. 关联景点图片
  6. 返回预览（等待确认发布）

- **发布博客**：
  1. 验证博客存在
  2. 验证所有权
  3. 更新博客状态为已发布
  4. 返回发布链接

---

#### 工具4：`confirm_action` - 确认操作

**功能**：确认保存或发布操作

**触发条件**：
- 用户确认保存行程（如"保存"、"确认"、"好的"）
- 用户确认发布博客（如"发布"、"确认发布"）

**参数定义**：
```typescript
{
  action: string  // 确认操作类型：save_trip/publish_blog
}
```

**特点**：
- 只能在预览后调用
- 调用后会将临时数据保存到数据库

---

#### 工具5：`regenerate` - 重新生成

**功能**：重新生成内容

**触发条件**：
- 用户不满意当前结果（如"重新规划"、"重新生成"、"不满意"）

**参数定义**：
```typescript
{
  type: string  // 类型：trip/blog
}
```

---

### 2.2 工具调用机制

#### 调用流程图

```
用户输入
   │
   ▼
processRequest()
   │
   ├─► 获取/创建会话
   ├─► 保存用户消息
   ├─► 构建对话上下文（历史消息）
   │
   ▼
callZhipuAI(messages, tools, 'auto')
   │
   ├─► 发送请求到智谱AI
   ├─► AI决定是否调用工具
   │
   ▼
AI响应
   │
   ├─ 有工具调用？
   │  │
   │  ├─ YES ─► executeToolCall()
   │  │            │
   │  │            ├─► 解析参数
   │  │            ├─► 参数补全（completeToolParams）
   │  │            ├─► 执行具体工具函数
   │  │            └─► 返回结果
   │  │
   │  └─► 将工具结果添加到对话历史
   │
   └─ NO ─► 直接返回AI回复
```

#### 关键代码片段

**1. 工具调用检测**（agentService.ts:1904-1985）
```typescript
if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
  console.log(`🔧 检测到 ${assistantMessage.tool_calls.length} 个工具调用`);
  
  // 执行所有工具调用
  for (const toolCall of assistantMessage.tool_calls) {
    const toolResult = await this.executeToolCall(toolCall, userId, messages, session.id);
    toolCallResults.push({
      name: toolName,
      result: toolResult,
    });
    
    // 将工具结果添加到对话历史
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult),
    });
  }
}
```

**2. 参数补全机制**（agentService.ts:2075-2136）
```typescript
private async completeToolParams(
  toolName: string,
  params: any,
  messages: any[]
): Promise<any> {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const completedParams = { ...params };
  
  if (toolName === 'create_trip' || toolName === 'create_smart_trip') {
    // 1. 目的地推断
    if (!completedParams.destination) {
      completedParams.destination = this.inferDestination(userMessage);
    }
    
    // 2. 日期推断
    if (!completedParams.startDate || !completedParams.endDate) {
      const dateInfo = this.inferDates(userMessage);
      // ...
    }
    
    // 3. 预算推断
    // 4. 人数推断
    // 5. 偏好推断
  }
  
  return completedParams;
}
```

---

## 🧠 三、AI推荐系统

### 3.1 推荐流程

```
recommendTrip()
   │
   ├─► 步骤1: 获取景点数据（包含IoT数据）
   │         spotDataService.getCitySpotsWithIoTData()
   │
   ├─► 步骤2: 获取用户画像
   │         userProfileService.getUserProfile()
   │
   ├─► 步骤3: 构建AI提示词
   │         buildRecommendationPrompt()
   │
   ├─► 步骤4: 调用智谱AI
   │         callZhipuAI()
   │
   └─► 步骤5: 解析AI返回结果
             parseAiResponse()
```

### 3.2 提示词构建策略

**核心要素**：
1. **用户需求**：目的地、天数、预算、偏好、必选景点
2. **用户历史数据**：历史行程、偏好分析
3. **可用景点列表**：景点信息 + IoT数据（拥挤度、天气等）
4. **约束条件**：
   - 优先安排必选景点
   - 考虑IoT数据（拥挤度、天气）
   - 每天2-4个景点
   - 地理位置合理性
   - 符合用户历史偏好

**输出格式**：JSON结构
```json
{
  "dailyPlans": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "spots": [
        {
          "name": "景点名称",
          "startTime": "09:00",
          "endTime": "11:00",
          "notes": "游览建议"
        }
      ]
    }
  ],
  "summary": "行程总结",
  "tips": ["旅行建议"]
}
```

---

## 🔧 四、智能参数推断

### 4.1 推断函数列表

| 函数 | 功能 | 示例 |
|------|------|------|
| `inferDestination()` | 从消息中提取城市 | "我想去北京" → "北京" |
| `inferDates()` | 推断日期范围 | "下个月去玩三天" → 计算具体日期 |
| `inferDays()` | 推断天数 | "三天" → 3 |
| `inferBudget()` | 推断预算 | "预算一万" → 10000 |
| `inferTravelers()` | 推断人数 | "我和爱人" → 2 |
| `inferPreferences()` | 推断偏好 | "喜欢历史文化" → "历史文化" |

### 4.2 推断优先级

```
1. 用户明确指定 ──► 直接使用
2. 从消息提取 ──► 智能识别
3. 用户画像 ──► 历史偏好
4. 默认值 ──► 系统默认
```

---

## 🎯 五、系统提示词设计

### 5.1 提示词结构

```typescript
private async buildSystemPrompt(userId?: string): Promise<string> {
  // 1. 用户画像注入
  const userProfile = await userProfileService.getUserProfile(userId);
  const profilePrompt = userProfileService.formatProfileAsPrompt(userProfile);
  
  // 2. 动态日期计算
  const today = new Date();
  const defaultStartDate = tomorrow.toISOString().split('T')[0];
  
  return `你是LiveTrip的智能旅行助手,专业、高效、友好。

${profilePrompt}

【核心任务】
帮助用户创建旅行行程、查看行程、生成博客。

【工具使用规则】
1. 用户提到具体景点 → 调用extract_must_visit_spots提取景点,然后自动创建行程
2. 用户未提到具体景点 → 直接调用create_trip创建行程
3. 用户要查看行程 → 调用list_user_trips
4. 用户要生成博客 → 调用generate_blog

【智能参数提取 - 使用默认值减少确认】
当前日期: ${today}
默认年份: ${thisYear}

参数提取规则:
- destination: 从用户输入提取城市名称
- startDate: 有具体日期 → 转换为YYYY-MM-DD格式
           无日期 → 使用明天: ${defaultStartDate}
- budget: 有预算 → 提取数字
        无预算 → 默认5000元
- travelers: 有人数 → 提取数字
           无人数 → 默认2人

【重要原则】
1. **大胆使用默认值** - 不要反复确认,用户没提供的信息用默认值
2. **立即行动** - 用户表达创建意图时,立即调用工具,不要等待
3. **智能推断** - "三天"推断为3天,"北京之旅"推断目的地为北京
4. **简洁回复** - 创建成功后简洁告知结果,不要冗长解释
`;
}
```

### 5.2 设计原则

1. **角色定位**：专业、高效、友好的旅行助手
2. **任务明确**：创建行程、查看行程、生成博客
3. **工具规则**：明确的工具调用触发条件
4. **智能推断**：使用默认值减少用户确认
5. **行为原则**：大胆使用默认值、立即行动、简洁回复

---

## 🔄 六、对话上下文管理

### 6.1 会话机制

**会话创建**：
```typescript
const session = await chatHistoryService.getOrCreateAgentSession(userId);
```

**消息保存**：
```typescript
await chatHistoryService.createMessage({
  sessionId: session.id,
  role: 'user',
  content: question,
});
```

**历史消息获取**：
```typescript
const messageHistory = await chatHistoryService.getMessages({
  sessionId: session.id,
  limit: 5,  // 最多5条历史消息
});
```

### 6.2 临时数据管理

**保存临时数据**（用于二次确认）：
```typescript
await chatHistoryService.updateSessionTempData(sessionId, {
  type: 'trip_draft',
  data: previewData,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
});
```

**获取临时数据**：
```typescript
const session = await chatHistoryService.getSession(sessionId);
const tempData = JSON.parse(session.tempData);
```

---

## 🚀 七、功能扩展设计指南

### 7.1 添加新工具的步骤

#### 步骤1：定义工具

在`getTools()`方法中添加新工具定义：

```typescript
{
  type: 'function',
  function: {
    name: 'new_tool_name',
    description: `工具描述
    
【触发条件】
- 条件1
- 条件2

【参数说明】
- param1: 说明`,
    parameters: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: '参数描述',
        },
      },
      required: ['param1'],
    },
  },
}
```

#### 步骤2：实现工具函数

在`AgentService`类中添加私有方法：

```typescript
private async newToolFunction(params: any, userId?: string): Promise<ToolExecutionResult> {
  try {
    console.log('🔧 执行新工具:', params);
    
    // 1. 参数验证
    if (!params.param1) {
      return {
        success: false,
        error: '缺少必填参数：param1',
      };
    }
    
    // 2. 业务逻辑
    // ...
    
    // 3. 返回结果
    return {
      success: true,
      data: {
        message: '操作成功',
        // 其他数据
      },
    };
    
  } catch (error: any) {
    console.error('❌ 工具执行失败:', error);
    return {
      success: false,
      error: error.message || '操作失败',
    };
  }
}
```

#### 步骤3：注册工具调用

在`executeToolCall()`方法的switch语句中添加：

```typescript
switch (name) {
  // ... 其他工具
  
  case 'new_tool_name':
    return await this.newToolFunction(params, userId);
    
  default:
    return {
      success: false,
      error: `未知的工具: ${name}`,
    };
}
```

#### 步骤4：更新系统提示词

在`buildSystemPrompt()`中添加工具使用规则：

```typescript
【工具使用规则】
// ... 其他规则
5. 用户触发新工具条件 → 调用new_tool_name
```

### 7.2 扩展场景示例

#### 场景1：添加"修改行程"功能

**工具定义**：
```typescript
{
  type: 'function',
  function: {
    name: 'modify_trip',
    description: `修改已有行程
    
【触发条件】
- 用户想修改行程（如"修改我的北京行程"、"调整行程时间"）`,
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string', description: '行程ID' },
        modifications: { type: 'object', description: '修改内容' },
      },
      required: ['tripId', 'modifications'],
    },
  },
}
```

**实现函数**：
```typescript
private async modifyTrip(params: any, userId?: string): Promise<ToolExecutionResult> {
  // 1. 验证行程存在
  const trip = await prisma.trip.findUnique({
    where: { id: params.tripId },
  });
  
  if (!trip) {
    return { success: false, error: '行程不存在' };
  }
  
  // 2. 应用修改
  const updatedTrip = await prisma.trip.update({
    where: { id: params.tripId },
    data: params.modifications,
  });
  
  // 3. 返回结果
  return {
    success: true,
    data: {
      message: '行程修改成功',
      trip: updatedTrip,
    },
  };
}
```

#### 场景2：添加"智能问答"功能

**工具定义**：
```typescript
{
  type: 'function',
  function: {
    name: 'answer_question',
    description: `回答旅行相关问题
    
【触发条件】
- 用户询问旅行问题（如"北京有什么特色美食？"）`,
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: '用户问题' },
        context: { type: 'string', description: '上下文信息' },
      },
      required: ['question'],
    },
  },
}
```

**实现函数**：
```typescript
private async answerQuestion(params: any, userId?: string): Promise<ToolExecutionResult> {
  // 调用AI生成回答
  const result = await this.callZhipuAI([
    {
      role: 'system',
      content: '你是专业的旅行顾问，请回答用户的问题。',
    },
    {
      role: 'user',
      content: params.question,
    },
  ]);
  
  return {
    success: true,
    data: {
      answer: result.choices[0]?.message?.content,
    },
  };
}
```

### 7.3 扩展注意事项

1. **参数验证**：始终验证必填参数，提供友好的错误提示
2. **错误处理**：使用try-catch捕获异常，返回结构化错误
3. **日志记录**：添加详细的console.log用于调试
4. **用户反馈**：返回清晰的message字段，告知用户操作结果
5. **权限验证**：涉及用户数据时，验证userId和所有权
6. **性能优化**：避免重复查询数据库，使用缓存机制

---

## 📊 八、性能优化策略

### 8.1 当前优化措施

| 优化项 | 实现方式 | 效果 |
|--------|---------|------|
| **历史消息限制** | 最多5条历史消息 | 减少Token消耗 |
| **工具结果直接返回** | 不再调用AI生成最终回复 | 减少一次AI调用 |
| **参数智能补全** | 使用默认值减少确认 | 提升用户体验 |
| **重试机制** | `httpsRequestWithRetry()` | 提高稳定性 |
| **临时数据过期** | 24小时后自动清理 | 避免数据堆积 |

### 8.2 可进一步优化

1. **缓存AI响应**：相似问题复用历史回答
2. **并行工具调用**：多个独立工具并行执行
3. **流式响应**：使用SSE实现打字机效果
4. **预加载景点数据**：热门城市景点预加载到内存

---

## 🔐 九、错误处理机制

### 9.1 错误类型定义

```typescript
enum ErrorType {
  // 参数错误
  PARAM_MISSING = 'PARAM_MISSING',
  PARAM_INVALID = 'PARAM_INVALID',
  
  // 业务错误
  SPOT_NOT_FOUND = 'SPOT_NOT_FOUND',
  TRIP_NOT_FOUND = 'TRIP_NOT_FOUND',
  TRIP_NOT_COMPLETED = 'TRIP_NOT_COMPLETED',
  
  // AI错误
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_RESPONSE_INVALID = 'AI_RESPONSE_INVALID',
  
  // 系统错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### 9.2 错误消息映射

```typescript
const ERROR_MESSAGES: Record<string, { message: string; suggestion: string }> = {
  [ErrorType.PARAM_MISSING]: {
    message: '缺少必要的信息',
    suggestion: '请提供更详细的信息，例如目的地、日期等',
  },
  [ErrorType.AI_SERVICE_UNAVAILABLE]: {
    message: 'AI 服务暂时不可用',
    suggestion: '请稍后重试，或联系客服',
  },
  // ... 其他错误
};
```

### 9.3 错误格式化

```typescript
private formatError(error: any): string {
  // 1. 识别错误类型
  let errorType: ErrorType;
  if (error.message?.includes('缺少必填参数')) {
    errorType = ErrorType.PARAM_MISSING;
  }
  // ... 其他识别
  
  // 2. 获取用户友好的错误信息
  const formattedError = ERROR_MESSAGES[errorType];
  
  // 3. 返回格式化错误
  return `${formattedError.message}\n\n💡 建议：${formattedError.suggestion}`;
}
```

---

## 🎨 十、前端交互设计

### 10.1 AIAdvisor组件特性

**毛玻璃风格**：
- 半透明背景
- 模糊效果（backdrop-blur）
- 渐变边框

**快捷问题模板**：
```typescript
const QUICK_QUESTIONS = [
  { icon: MapPin, text: '这个目的地有什么特色景点？' },
  { icon: Calendar, text: '最佳旅行时间是什么时候？' },
  { icon: Sparkles, text: '有什么必去的景点推荐？' },
  { icon: FileText, text: '当地美食和住宿建议' },
  { icon: MapPin, text: '详细介绍某个景点的历史和游览攻略' },
  { icon: Heart, text: '如何制定合理的旅行预算？' },
];
```

**消息格式化**：
- 支持分段显示
- 列表项识别（以 - 或 • 开头）
- 标题识别（以 # 开头）

### 10.2 交互流程

```
用户输入
   │
   ├─► setInputValue()
   ├─► handleSend()
   │     │
   │     ├─► 添加用户消息到messages
   │     ├─► setLoading(true)
   │     ├─► aiService.sendAdvisorMessage()
   │     │     │
   │     │     └─► HTTP POST /api/ai/advisor
   │     │
   │     ├─► 添加AI回复到messages
   │     └─► setLoading(false)
   │
   └─► useEffect() 自动滚动到底部
```

---

## 📝 十一、总结与建议

### 11.1 当前架构优势

✅ **模块化设计**：工具、推荐、对话管理分离清晰  
✅ **智能推断**：参数补全机制减少用户确认  
✅ **二次确认**：重要操作先预览后保存  
✅ **错误友好**：结构化错误处理，用户友好提示  
✅ **性能优化**：历史消息限制、工具结果直接返回  
✅ **扩展性强**：工具定义清晰，易于添加新功能

### 11.2 可改进方向

1. **多轮对话优化**：
   - 增强上下文理解能力
   - 支持指代消解（"修改它" → 识别具体对象）

2. **工具链编排**：
   - 支持工具组合调用
   - 自动规划工具执行顺序

3. **个性化推荐**：
   - 深度学习用户偏好
   - 协同过滤推荐

4. **多模态能力**：
   - 图片识别（景点识别）
   - 语音交互
   - 地图可视化

5. **主动服务**：
   - 行程提醒
   - 天气预警
   - 景点拥挤度实时推送

### 11.3 扩展开发建议

**对于初学者**：
- 从简单的问答工具开始
- 参考现有工具的实现模式
- 注重错误处理和用户反馈

**对于进阶开发者**：
- 研究工具链编排机制
- 优化AI提示词设计
- 实现更智能的参数推断

**对于架构师**：
- 考虑引入工作流引擎
- 设计插件化工具系统
- 实现分布式任务调度

---

## 📚 附录：关键代码位置索引

| 功能 | 文件 | 行号范围 |
|------|------|---------|
| Agent主处理流程 | agentService.ts | 1820-2003 |
| 工具定义 | agentService.ts | 186-379 |
| 工具执行 | agentService.ts | 454-537 |
| 创建智能行程 | agentService.ts | 544-663 |
| 参数补全 | agentService.ts | 2075-2136 |
| 系统提示词 | agentService.ts | 385-449 |
| AI推荐流程 | aiTripRecommender.ts | 39-105 |
| 前端交互 | AIAdvisor.tsx | 53-95 |

---

**文档版本**：v1.0  
**最后更新**：2026-04-25 21:24  
**维护者**：LiveTrip开发团队
