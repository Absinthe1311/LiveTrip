// AI辅助生成：GLM-5, 2026-04-25 21:24
// 描述：LiveTrip AI模型配置详细说明，解释如何指定模型以及如何切换到其他模型。

# LiveTrip AI模型配置详细说明

## 📋 当前模型配置

### 您当前使用的模型

**模型名称**：`glm-4`  
**模型说明**：智谱AI GLM-4大语言模型（最新版本）

**模型特点**：
- ✅ 支持Function Calling（工具调用）
- ✅ 强大的自然语言理解能力
- ✅ 支持多轮对话
- ✅ 上下文理解能力强
- ❌ 消耗token较多
- ❌ 价格相对较高

---

## 🔍 模型指定位置

### 位置1：Agent服务（主要）

**文件**：`backend/src/services/agentService.ts`  
**行号**：150

```typescript
const data = {
  model: 'glm-4',  // ← 这里指定模型
  messages: messages,
  temperature: 0.7,
  max_tokens: 2000,
  ...(tools && { tools }),
  ...(toolChoice && { tool_choice: toolChoice }),
};
```

**用途**：
- Agent对话处理
- 工具调用决策
- 博客内容生成

---

### 位置2：顾问服务

**文件**：`backend/src/services/advisorService.ts`  
**行号**：32

```typescript
class AdvisorService {
  private apiKey: string;
  private apiUrl: string = 'open.bigmodel.cn';
  private apiPath: string = '/api/paas/v4/chat/completions';
  private model: string = 'glm-4';  // ← 这里指定模型
  
  // ...
}
```

**用途**：
- AI顾问问答
- 旅行建议

---

### 位置3：行程推荐服务

**文件**：`backend/src/services/aiTripRecommender.ts`  
**行号**：193

```typescript
const data = JSON.stringify({
  model: 'glm-4',  // ← 这里指定模型
  messages: [
    {
      role: 'user',
      content: prompt,
    },
  ],
  temperature: 0.7,
});
```

**用途**：
- AI行程推荐
- 景点选择

---

## 🤖 智谱AI可用模型

### GLM-4系列

| 模型名称 | 说明 | 价格 | 推荐场景 |
|---------|------|------|---------|
| `glm-4` | 最新版本，功能最强 | 较高 | 复杂任务、Function Calling |
| `glm-4-air` | 轻量版，速度快 | 中等 | 简单对话、快速响应 |
| `glm-4-airx` | 增强版，平衡性能和速度 | 中等 | 一般任务 |
| `glm-4-flash` | 极速版，最快 | 最低 | 简单问答、高频调用 |

### GLM-3系列（更便宜）

| 模型名称 | 说明 | 价格 | 推荐场景 |
|---------|------|------|---------|
| `glm-3-turbo` | 经典版本，性价比高 | 低 | 一般任务 |
| `chatglm_turbo` | 对话优化版 | 低 | 对话场景 |

---

## 🔧 如何切换模型

### 方案1：全局切换（推荐）

**修改所有文件中的模型名称**：

**步骤1**：修改`agentService.ts`
```typescript
const data = {
  model: 'glm-4-air',  // 改为更便宜的模型
  messages: messages,
  temperature: 0.7,
  max_tokens: 2000,
  ...(tools && { tools }),
  ...(toolChoice && { tool_choice: toolChoice }),
};
```

**步骤2**：修改`advisorService.ts`
```typescript
private model: string = 'glm-4-air';  // 改为更便宜的模型
```

**步骤3**：修改`aiTripRecommender.ts`
```typescript
const data = JSON.stringify({
  model: 'glm-4-air',  // 改为更便宜的模型
  messages: [
    {
      role: 'user',
      content: prompt,
    },
  ],
  temperature: 0.7,
});
```

---

### 方案2：分级使用（更灵活）

**根据任务复杂度选择不同模型**：

**修改`agentService.ts`**：
```typescript
private async callZhipuAI(
  messages: any[],
  tools?: any[],
  toolChoice: any = 'auto',
  modelType: 'complex' | 'simple' = 'complex'  // 新增参数
): Promise<any> {
  if (!ZHIPUAI_API_KEY) {
    throw new Error('AI服务未配置');
  }

  // 根据任务类型选择模型
  const model = modelType === 'complex' ? 'glm-4' : 'glm-4-air';

  const data = {
    model: model,  // 动态选择模型
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000,
    ...(tools && { tools }),
    ...(toolChoice && { tool_choice: toolChoice }),
  };

  // ...
}
```

**使用示例**：
```typescript
// 复杂任务用GLM-4
await this.callZhipuAI(messages, tools, 'auto', 'complex');

// 简单任务用GLM-4-Air
await this.callZhipuAI(messages, tools, 'auto', 'simple');
```

---

### 方案3：环境变量配置（最灵活）

**步骤1**：添加环境变量

**修改`.env`文件**：
```bash
# AI模型配置
ZHIPUAI_MODEL_COMPLEX=glm-4          # 复杂任务模型
ZHIPUAI_MODEL_SIMPLE=glm-4-air       # 简单任务模型
ZHIPUAI_MODEL_BLOG=glm-4             # 博客生成模型
```

**步骤2**：修改代码读取环境变量

**修改`agentService.ts`**：
```typescript
private async callZhipuAI(
  messages: any[],
  tools?: any[],
  toolChoice: any = 'auto',
  taskType: 'complex' | 'simple' | 'blog' = 'complex'
): Promise<any> {
  if (!ZHIPUAI_API_KEY) {
    throw new Error('AI服务未配置');
  }

  // 从环境变量读取模型配置
  const modelMap = {
    complex: process.env.ZHIPUAI_MODEL_COMPLEX || 'glm-4',
    simple: process.env.ZHIPUAI_MODEL_SIMPLE || 'glm-4-air',
    blog: process.env.ZHIPUAI_MODEL_BLOG || 'glm-4',
  };

  const model = modelMap[taskType];

  const data = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000,
    ...(tools && { tools }),
    ...(toolChoice && { tool_choice: toolChoice }),
  };

  // ...
}
```

---

## 📊 模型对比和推荐

### 价格对比（智谱AI官方定价）

| 模型 | 输入价格 | 输出价格 | 相对成本 |
|------|---------|---------|---------|
| glm-4 | 0.1元/千token | 0.1元/千token | 100% |
| glm-4-air | 0.001元/千token | 0.001元/千token | 1% ⭐ |
| glm-4-airx | 0.01元/千token | 0.01元/千token | 10% |
| glm-4-flash | 0.0001元/千token | 0.0001元/千token | 0.1% ⭐⭐ |
| glm-3-turbo | 0.001元/千token | 0.001元/千token | 1% |

**惊人发现**：
- `glm-4-air`比`glm-4`便宜**100倍**！
- `glm-4-flash`比`glm-4`便宜**1000倍**！

---

### 功能对比

| 功能 | glm-4 | glm-4-air | glm-4-flash | glm-3-turbo |
|------|-------|-----------|-------------|-------------|
| Function Calling | ✅ | ✅ | ✅ | ❌ |
| 多轮对话 | ✅ | ✅ | ✅ | ✅ |
| 复杂推理 | ✅⭐⭐⭐ | ✅⭐⭐ | ✅⭐ | ✅⭐ |
| 响应速度 | 中等 | 快⭐ | 极快⭐⭐ | 快 |
| 上下文长度 | 128K | 128K | 128K | 32K |

---

## 🎯 推荐配置方案

### 方案A：极致省钱（推荐）

**配置**：
```typescript
// agentService.ts - 简单任务
model: 'glm-4-air'  // 便宜100倍

// aiTripRecommender.ts - 行程推荐
model: 'glm-4-air'  // 便宜100倍

// advisorService.ts - 顾问问答
model: 'glm-4-flash'  // 便宜1000倍
```

**效果**：
- 成本降低：**95-99%**
- 功能基本不受影响
- 响应速度更快

---

### 方案B：平衡性能和成本

**配置**：
```typescript
// agentService.ts - 复杂任务（工具调用）
model: 'glm-4'  // 保持最强性能

// aiTripRecommender.ts - 行程推荐
model: 'glm-4-air'  // 便宜100倍

// advisorService.ts - 顾问问答
model: 'glm-4-air'  // 便宜100倍
```

**效果**：
- 成本降低：**60-70%**
- 核心功能保持最强性能
- 辅助功能使用便宜模型

---

### 方案C：分级智能选择

**实现**：
```typescript
// 根据任务类型自动选择模型
function selectModel(task: string): string {
  switch (task) {
    case 'function_calling':
      return 'glm-4';          // 工具调用用最强模型
    case 'blog_generation':
      return 'glm-4';          // 博客生成用最强模型
    case 'trip_recommendation':
      return 'glm-4-air';      // 行程推荐用中等模型
    case 'simple_qa':
      return 'glm-4-flash';    // 简单问答用最便宜模型
    default:
      return 'glm-4-air';      // 默认用中等模型
  }
}
```

---

## 🚀 立即行动建议

### 推荐方案：切换到glm-4-air

**理由**：
1. ✅ 便宜100倍（0.001元 vs 0.1元）
2. ✅ 支持Function Calling
3. ✅ 响应速度更快
4. ✅ 功能基本不受影响

**修改步骤**：

**步骤1**：修改`agentService.ts`第150行
```typescript
model: 'glm-4-air',  // 从glm-4改为glm-4-air
```

**步骤2**：修改`advisorService.ts`第32行
```typescript
private model: string = 'glm-4-air';  // 从glm-4改为glm-4-air
```

**步骤3**：修改`aiTripRecommender.ts`第193行
```typescript
model: 'glm-4-air',  // 从glm-4改为glm-4-air
```

**步骤4**：重启服务
```bash
cd backend
npm run dev
```

**预期效果**：
- 💰 成本降低**99%**
- ⚡ 响应速度提升
- ✅ 功能基本不受影响

---

## 📝 总结

### 当前状态

- **使用模型**：`glm-4`（最贵）
- **指定位置**：3个文件硬编码
- **成本**：0.1元/千token
- **余额**：❌ 不足

### 推荐行动

1. **立即切换到`glm-4-air`**：
   - 成本降低99%
   - 功能基本不受影响
   - 响应更快

2. **或实现分级选择**：
   - 复杂任务用`glm-4`
   - 简单任务用`glm-4-air`
   - 平衡性能和成本

3. **或使用环境变量**：
   - 灵活配置
   - 易于调整
   - 支持不同环境

---

**报告生成时间**：2026-04-25 21:24  
**建议优先级**：P0（立即执行）  
**预期效果**：成本降低95-99%
