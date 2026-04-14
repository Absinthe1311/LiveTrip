# AI Agent 优化方案

## 📋 问题分析

### 1. 二次确认问题
**现状**：用户输入创建行程请求后，直接创建并保存，没有预览和确认环节

**问题**：
- 用户无法预览行程详情
- 无法修改或取消
- 体验不够友好

**目标**：
- 先展示行程预览
- 询问用户是否保存
- 支持修改或取消

### 2. 过程可视化问题
**现状**：AI 执行过程对用户不可见，用户不知道 AI 在做什么

**问题**：
- 缺乏透明度
- 用户焦虑等待
- 无法了解执行进度

**目标**：
- 实时显示 AI 思考过程
- 显示工具调用状态
- 显示执行进度

### 3. 参数追问问题
**现状**：缺少参数时直接报错，不会主动追问

**问题**：
- 用户体验差
- 需要重新输入完整信息
- 对话不够智能

**目标**：
- 识别缺失参数
- 主动追问用户
- 引导用户补充信息

---

## 🎯 优化方案设计

### 方案一：二次确认机制

#### 1.1 数据库设计
```prisma
// 已有字段（在 ChatSession 中）
state     String  @default("idle")      // 会话状态
tempData  String? @default("")          // 临时数据（JSON格式）
```

**状态定义**：
- `idle` - 空闲状态
- `waiting_confirmation` - 等待用户确认
- `completed` - 已完成

**临时数据结构**：
```typescript
interface TempData {
  type: 'trip_draft' | 'blog_draft';
  data: any;  // 行程或博客数据
  createdAt: Date;
  expiresAt: Date;
}
```

#### 1.2 执行流程
```
用户输入 → AI分析 → 生成草稿 → 保存到tempData → 
返回预览 → 用户确认 → 保存到数据库 → 清空tempData
```

#### 1.3 实现要点

**后端**：
1. 修改 `createSmartTrip` 方法
   - 不直接保存到数据库
   - 返回预览数据
   - 保存到 session.tempData

2. 新增确认接口
   - `confirmTrip(sessionId)` - 确认保存
   - `cancelDraft(sessionId)` - 取消草稿

**前端**：
1. 识别预览响应
   - 显示行程预览卡片
   - 显示确认/取消按钮

2. 用户操作
   - 点击确认 → 调用确认接口
   - 点击取消 → 调用取消接口

---

### 方案二：过程可视化

#### 2.1 执行步骤定义
```typescript
interface ExecutionStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'data_fetch' | 'processing';
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
  timestamp: Date;
  details?: any;
}
```

**步骤类型**：
- `thinking` - AI 思考中
- `tool_call` - 调用工具
- `data_fetch` - 获取数据
- `processing` - 处理数据

#### 2.2 实现方式

**后端**：
1. 使用 SSE (Server-Sent Events)
   - 实时推送执行步骤
   - 不阻塞主流程

2. 步骤记录
   ```typescript
   // 在关键节点记录步骤
   this.recordStep({
     type: 'thinking',
     message: '正在分析您的需求...',
   });
   ```

**前端**：
1. 监听 SSE 事件
   - 实时更新步骤列表
   - 显示进度动画

2. UI 展示
   ```
   ┌────────────────────────────┐
   │ ✅ 正在分析您的需求...      │
   │ ✅ 已识别目的地：北京       │
   │ 🔄 正在获取景点信息...      │
   │ ⏳ 正在规划行程路线...      │
   └────────────────────────────┘
   ```

#### 2.3 关键步骤示例

**创建行程**：
1. ✅ 正在分析您的需求...
2. ✅ 已识别：北京三日游，预算30000元
3. 🔄 正在获取北京景点信息...
4. ⏳ 正在规划最优路线...
5. ⏳ 正在生成行程详情...

**生成博客**：
1. ✅ 正在分析您的需求...
2. ✅ 已找到行程：云南7日游
3. 🔄 正在提取行程亮点...
4. ⏳ 正在生成博客内容...

---

### 方案三：参数追问机制

#### 3.1 参数定义
```typescript
interface RequiredParam {
  name: string;
  type: 'string' | 'number' | 'date' | 'array';
  required: boolean;
  description: string;
  question: string;  // 追问时的问题
}

const TRIP_PARAMS: RequiredParam[] = [
  {
    name: 'destination',
    type: 'string',
    required: true,
    description: '目的地',
    question: '请问您想去哪里旅行？',
  },
  {
    name: 'days',
    type: 'number',
    required: true,
    description: '天数',
    question: '请问您计划旅行几天？',
  },
  {
    name: 'budget',
    type: 'number',
    required: false,
    description: '预算',
    question: '请问您的预算是多少？',
  },
  // ...
];
```

#### 3.2 执行流程
```
用户输入 → AI分析 → 提取参数 → 检查必填项 → 
  ├─ 参数完整 → 执行工具
  └─ 参数缺失 → 追问用户 → 等待补充 → 再次检查
```

#### 3.3 实现要点

**后端**：
1. 参数检查函数
   ```typescript
   checkMissingParams(params: any, required: RequiredParam[]): string[] {
     return required
       .filter(p => p.required && !params[p.name])
       .map(p => p.name);
   }
   ```

2. 生成追问响应
   ```typescript
   generateFollowUpQuestion(missing: string[]): string {
     const questions = missing.map(name => {
       const param = TRIP_PARAMS.find(p => p.name === name);
       return param?.question;
     });
     return questions.join('\n');
   }
   ```

3. 上下文保持
   - 保存已提取的参数到 session
   - 用户补充后合并参数
   - 继续执行工具

**前端**：
1. 识别追问响应
   - 显示追问消息
   - 提示用户补充信息

2. 用户输入处理
   - 发送补充信息
   - 后端合并参数继续执行

#### 3.4 对话示例

**场景1：缺少目的地**
```
用户：帮我创建一个三日行程
AI：请问您想去哪里旅行？
用户：北京
AI：好的，正在为您创建北京三日行程...
```

**场景2：缺少预算**
```
用户：我想去北京玩三天
AI：好的，请问您的预算是多少？
用户：30000元
AI：好的，正在为您创建北京三日行程，预算30000元...
```

**场景3：缺少多个参数**
```
用户：帮我规划一个行程
AI：请问您想去哪里旅行？计划旅行几天？
用户：北京，五天
AI：好的，正在为您创建北京五日行程...
```

---

## 🔧 技术实现

### 优先级排序

**P0 - 必须实现**：
1. 二次确认机制（核心功能）
2. 参数追问机制（用户体验）

**P1 - 重要实现**：
3. 过程可视化（体验优化）

### 实现步骤

#### Step 1: 二次确认机制
1. 修改 `createSmartTrip` 返回预览
2. 实现 `confirmTrip` 和 `cancelDraft`
3. 前端预览组件
4. 确认/取消交互

#### Step 2: 参数追问机制
1. 定义参数规范
2. 实现参数检查
3. 生成追问响应
4. 上下文保持

#### Step 3: 过程可视化
1. SSE 事件推送
2. 步骤记录
3. 前端实时展示
4. 进度动画

---

## 📊 预期效果

### 二次确认
- ✅ 用户可预览行程
- ✅ 可选择保存或取消
- ✅ 体验更友好

### 过程可视化
- ✅ 实时显示执行进度
- ✅ 用户了解 AI 在做什么
- ✅ 减少等待焦虑

### 参数追问
- ✅ 智能识别缺失参数
- ✅ 主动追问用户
- ✅ 对话更自然流畅

---

## ⚠️ 注意事项

1. **性能考虑**：
   - SSE 连接管理
   - 步骤记录不要过多
   - 及时清理临时数据

2. **错误处理**：
   - 网络断开重连
   - 超时处理
   - 异常恢复

3. **用户体验**：
   - 步骤显示简洁
   - 追问不要过多
   - 确认流程清晰

4. **数据安全**：
   - 临时数据过期清理
   - 敏感信息保护
   - 权限验证
