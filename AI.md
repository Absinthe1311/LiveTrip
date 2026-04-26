# AI Agent 功能问题排查报告

> 排查时间：2026-04-26 21:36
> 排查范围：Agent 智能助手、Advisor 问答助手、智谱 AI API 调用链路
> 用户反馈问题：① glm-4.6v 替换后 AI 工具总是超时；② Agent 功能和问答功能出现异常

---

## 一、核心问题：glm-4.6v 模型不支持 Function Calling（根本原因）

### 问题描述
代码中将模型从 `glm-4` 替换为 `glm-4.6v`，但 **glm-4.6v 是多模态视觉模型（GLM-4V 系列），不支持 Function Calling / Tool Use 能力**。

### 影响范围
- **Agent 智能助手**：完全依赖 Function Calling 实现工具调用（创建行程、查看行程、生成博客等），模型不支持则 `tool_calls` 永远为空，Agent 退化为普通聊天
- **Advisor 问答助手**：不依赖 Function Calling，但多模态模型的文本推理能力不如纯文本模型，回答质量可能下降

### 涉及代码位置
| 文件 | 行号 | 当前模型 | 说明 |
|------|------|---------|------|
| `backend/src/services/agentService.ts` | 151 | `glm-4.6v` | Agent 核心，使用 Function Calling |
| `backend/src/services/advisorService.ts` | 32 | `glm-4.6v` | Advisor 问答，纯文本对话 |
| `backend/src/services/aiTripRecommender.ts` | 193 | `glm-4.6v` | 行程推荐，纯文本对话 |

### 超时问题的根因分析
glm-4.6v 接收到 Function Calling 参数（`tools` 字段）时，可能：
1. **直接报错或返回异常响应**，导致重试机制触发，叠加超时
2. **忽略 tools 参数**，只返回文本回复，但 Agent 端等待 tool_calls 字段，后续流程异常
3. **响应时间变长**，多模态模型处理纯文本请求时效率低于纯文本模型

### 解决方案
将模型替换为支持 Function Calling 的模型：
- **推荐**：`glm-4-flash`（免费/低价，支持 Function Calling，响应速度快）
- **备选**：`glm-4`（原模型，支持 Function Calling，需确认 Token 额度是否恢复）
- **不建议**：继续使用 `glm-4.6v` 用于 Agent 功能

---

## 二、超时叠加问题：双重 AI 调用链路

### 问题描述
一次完整的 Agent 行程创建请求，会触发 **两次独立的智谱 AI API 调用**，超时时间叠加：

```
用户请求 → agentService.callZhipuAI (30s超时)
         → AI 决定调用 create_smart_trip
         → createTrip() → aiTripRecommender.recommendTrip()
         → aiTripRecommender.callZhipuAI (60s超时)
```

**最坏情况总耗时：30s + 60s = 90s**，远超前端和用户的预期等待时间。

### 涉及代码位置
| 文件 | 行号 | 超时设置 | 说明 |
|------|------|---------|------|
| `backend/src/services/agentService.ts` | 145, 180 | `timeout: 30000` (30s) | Agent 主调用 |
| `backend/src/services/agentService.ts` | 1562 | `timeout: 60000` (60s) | 博客生成调用 |
| `backend/src/services/aiTripRecommender.ts` | 189 | `timeout: 60000` (60s) | 行程推荐调用 |
| `backend/src/services/advisorService.ts` | 68 | `timeout: 15000` (15s) | Advisor 问答调用 |

### 前端无超时保护
前端 `aiService.sendAgentMessage()` 使用原生 `fetch`，**没有设置 AbortController 超时**，用户会无限等待。

### 涉及代码位置
| 文件 | 行号 | 问题 |
|------|------|------|
| `frontend/src/services/aiService.ts` | 88-100 | fetch 无超时控制 |

---

## 三、git 提交历史中导致问题的关键变更

### 3.1 清理提交删除了 AI 相关服务（commit: `08c29ba`）

**提交信息**：`update:清理了项目文件`

**被删除的 AI 相关文件**：
| 文件 | 影响 |
|------|------|
| `backend/src/services/aiRecommender.ts` | 多因素评分引擎推荐服务（非 AI 调用，但为备选方案） |
| `backend/src/services/destinationCacheService.ts` | 目的地缓存服务 |
| `backend/src/services/planService.ts` | 行程规划服务 |
| `agent.md` | Agent 设计文档 |
| `AI使用情况分析报告.md` 等 | AI 相关文档 |

**当前状态**：这些服务未被现有代码直接引用（`aiRecommender` 已被 `aiTripRecommender` 替代），所以删除本身未导致运行时错误，但**丢失了备选推荐方案和文档**。

### 3.2 删除了 zhipuai SDK（commit: `08c29ba`）

**变更**：从 `backend/package.json` 中移除了 `zhipuai` (^2.0.0) 和 `node-fetch` (^2.7.0)

**当前状态**：代码使用原生 `https` 模块调用 API，未直接引用 `zhipuai` SDK，所以删除不影响运行。但 SDK 提供了更好的错误处理和类型支持。

### 3.3 AI Agent 更新提交（commit: `bec74e5`）

**提交信息**：`feat:完成了AI Agent更新，后续可能需要进一步测试`

**关键变更**：
- 增加了二次确认机制（previewData、needsConfirmation）
- `executeToolCall` 新增 `sessionId` 参数
- `createSmartTrip` 增加参数追问功能
- 新增 `agentRoutes.ts` 中的 `/confirm-trip` 和 `/cancel-draft` 路由

**潜在问题**：作者注明"后续可能需要进一步测试"，说明此提交本身可能未充分测试。

---

## 四、其他发现的问题

### 4.1 用户消息重复添加
`agentService.ts:2001-2027`，先从历史获取5条消息（可能已包含当前用户消息），又在第2024行手动 push 当前用户消息，导致消息重复。

### 4.2 确认关键词误触发
`agentService.ts:2030-2033`，确认关键词列表包含"好的"、"是的"等日常用语，可能在非确认场景误触发确认流程。

### 4.3 生产环境调试日志泄露
`agentService.ts:2097`，`console.log('完整响应:', JSON.stringify(result.choices[0], null, 2))` 在生产环境泄露完整 AI 响应数据。

### 4.4 cancelDraft 路由无用户认证
`agentRoutes.ts:45-62`，`/cancel-draft` 路由未验证 userId，任何人可取消他人草稿。

### 4.5 默认用户明文密码
`agentService.ts:1124`，`passwordHash: 'default'`，创建默认用户时密码未加密。

### 4.6 Advisor 超时过短
`advisorService.ts:68`，`timeout: 15000`（15秒），对于复杂问题可能不够。

---

## 五、问题优先级排序

| 优先级 | 问题 | 影响程度 | 修复难度 |
|--------|------|---------|---------|
| **P0 - 紧急** | glm-4.6v 不支持 Function Calling | Agent 功能完全失效 | 低（改模型名） |
| **P1 - 高** | 双重 AI 调用超时叠加 | 行程创建经常超时 | 中（需优化调用链路） |
| **P1 - 高** | 前端 fetch 无超时保护 | 用户无限等待 | 低（加 AbortController） |
| **P2 - 中** | 用户消息重复添加 | 影响上下文质量 | 低 |
| **P2 - 中** | 确认关键词误触发 | 用户体验异常 | 低 |
| **P3 - 低** | 生产调试日志 | 信息泄露 | 低 |
| **P3 - 低** | cancelDraft 无认证 | 安全风险 | 低 |

---

## 六、修复建议

### 立即修复（P0）
1. **替换模型**：将所有 `glm-4.6v` 替换为 `glm-4-flash`（或 `glm-4`）
   - `agentService.ts:151`
   - `advisorService.ts:32`
   - `aiTripRecommender.ts:193`

### 短期修复（P1）
2. **优化 AI 调用链路**：`createTrip` 内部的 `aiTripRecommender` 调用应设置合理超时，或改用异步任务
3. **前端添加超时**：在 `aiService.ts` 的 fetch 调用中添加 `AbortController`，设置 60 秒超时
4. **增加 Advisor 超时**：将 `advisorService.ts` 的 timeout 从 15s 调整到 30s

### 中期优化（P2）
5. **修复消息重复**：检查 `createMessage` 和 `getMessages` 的时序，避免重复 push
6. **优化确认关键词**：增加上下文判断，避免误触发
7. **移除生产调试日志**：用环境变量控制日志级别
