# AI 功能问题排查报告

> 排查时间：2026-04-26 21:36
> 当前现象：Advisor 问答超时 | Agent 创建行程超时 | Agent 博客创建正常

---

## 变更影响分析

commit `b035a7b`（博客功能）对 `agentService.ts` 和 `advisorService.ts` 做了以下变更，各变更对功能的影响如下：

### 变更 1：`createSmartTrip` 新增"先创建再删除"的二次确认流程

**代码位置**：`agentService.ts:585-703`

**变更内容**：创建行程时，先调 AI 生成完整行程 → 构建预览 → 删除临时行程 → 返回 `needsConfirmation` → 用户确认后再重建

**影响功能**：

| 功能　　　　　　　 | 是否受影响　　 | 原因　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　 |
| --------------------| ----------------| ----------------------------------------------------------------------------------------------------------|
| **Agent 创建行程** | **是（超时）** | 一次请求内执行了完整 AI 推荐再删除，AI 调用耗时叠加（callZhipuAI 30s + aiTripRecommender 60s = 最坏90s） |
| Agent 博客创建　　 | 否　　　　　　 | 博客创建走 `manageBlog` → `generateBlog`，不经过 `createSmartTrip`　　　　　　　　　　　　　　　　　　　 |
| Advisor 问答　　　 | 否　　　　　　 | Advisor 不调用 Agent 的任何工具　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　|

**为什么之前不超时**：之前的 `createSmartTrip` 直接调用 `createTrip()` 后返回结果，没有"先删后重建"的额外开销，用户能立即看到行程。

---

### 变更 2：`processRequest` 新增二次 AI 调用（`shouldContinueAIProcessing`）

**代码位置**：`agentService.ts:2196-2238`

**变更内容**：工具执行后判断是否需要继续，若需要则再次调用 `callZhipuAI`，可能再次触发工具调用

**影响功能**：

| 功能 | 是否受影响 | 原因 |
|------|-----------|------|
| Agent 创建行程 | 间接影响 | 如果 `shouldContinueAIProcessing` 误判为 true，会额外增加一次 30s 的 AI 调用 |
| **Agent 博客创建** | **可能影响** | 博客/游记相关请求是该机制的触发条件（`agentService.ts:2368`：消息包含"游记"或"博客"时触发），但当前博客创建正常，说明此机制未导致博客超时 |
| Advisor 问答 | 否 | Advisor 不走 `processRequest` |

---

### 变更 3：`processRequest` 新增确认/取消关键词前置检测

**代码位置**：`agentService.ts:2030-2079`

**变更内容**：在调用 AI 之前检测"确认/发布/好的/是的/保存/同意"等关键词，若会话中有临时数据则直接执行确认/取消

**影响功能**：

| 功能 | 是否受影响 | 原因 |
|------|-----------|------|
| Agent 创建行程 | 是 | 用户说"好的""是的"等日常用语时，如果会话中有 tempData，会绕过 AI 直接执行确认逻辑 |
| Agent 博客创建 | 否 | 博客创建不依赖 tempData 确认流程 |
| Advisor 问答 | 否 | Advisor 不走此逻辑 |

---

### 变更 4：`callZhipuAI` 新增 `maxTokens` 和 `timeout` 参数

**代码位置**：`agentService.ts:145`

**变更内容**：`callZhipuAI` 签名从 `(messages, tools?, toolChoice?)` 变为 `(messages, tools?, toolChoice?, maxTokens=2000, timeout=30000)`

**影响功能**：

| 功能 | 是否受影响 | 原因 |
|------|-----------|------|
| Agent 创建行程 | 否 | 使用默认 timeout=30000，与之前一致 |
| Agent 博客创建 | 否 | 使用 timeout=60000，专门为长文本设置，当前正常 |
| Advisor 问答 | 否 | Advisor 有自己的 `callZhipuAI`，不受此变更影响 |

---

### 变更 5：Advisor 模型从 `glm-4` 改为 `glm-4.6v`

**代码位置**：`advisorService.ts:32`

**变更内容**：模型替换，且 Advisor 的 `timeout` 仍为 15000（15秒）

**影响功能**：

| 功能 | 是否受影响 | 原因 |
|------|-----------|------|
| **Advisor 问答** | **是（超时）** | `advisorService.ts:68` 的 `timeout: 15000`（15秒）对 glm-4.6v 可能过短。glm-4.6v 作为多模态模型处理纯文本请求时响应速度可能慢于 glm-4，15秒内未收到响应就触发超时+重试 |
| Agent 创建行程 | 否 | Agent 有独立的 callZhipuAI |
| Agent 博客创建 | 否 | 同上 |

---

## 总结：各功能超时的根因

| 功能 | 现象 | 根因 | 代码位置 |
|------|------|------|---------|
| **Advisor 问答** | 超时 | `timeout: 15000` 对 glm-4.6v 过短 | `advisorService.ts:68` |
| **Agent 创建行程** | 超时 | `createSmartTrip` 的"先创建再删除"流程导致 AI 调用耗时叠加 | `agentService.ts:604-682` |
| Agent 博客创建 | 正常 | `generateBlog` 直接调用 AI 生成内容，流程简单，timeout=60s 充足 | `agentService.ts:1547-1562` |

**核心修复方向**：
1. Advisor：将 `timeout` 从 15000 增加到 30000-45000
2. Agent 行程创建：优化 `createSmartTrip` 的二次确认流程，避免"先创建再删除"的浪费（例如：不删除临时行程，确认时直接更新状态；或先返回预览不调AI，确认后再调AI创建）
