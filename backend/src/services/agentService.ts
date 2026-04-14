// Agent 服务 - 实现 Function Calling 功能
import https from 'https';
import { chatHistoryService } from './chatHistoryService';
import { getPrismaClient } from '../lib/prisma';
import { parseDate, formatDate } from '../utils/dateParser';
import { spotService } from './spotService';
import { traditionalRecommender } from './traditionalRecommender';
import { httpsRequestWithRetry } from '../utils/retry';
import { mustVisitSpotExtractor } from './mustVisitSpotExtractor';
import { constraintAwarePlanner } from './constraintAwarePlanner';
import { userProfileService } from './userProfileService';

const prisma = getPrismaClient();

// 获取传统推荐器实例
const recommender = traditionalRecommender();

// ✅ P0优化: 错误类型定义
enum ErrorType {
  // 参数错误
  PARAM_MISSING = 'PARAM_MISSING',
  PARAM_INVALID = 'PARAM_INVALID',

  // 业务错误
  SPOT_NOT_FOUND = 'SPOT_NOT_FOUND',
  TRIP_NOT_FOUND = 'TRIP_NOT_FOUND',
  TRIP_NOT_COMPLETED = 'TRIP_NOT_COMPLETED',

  // AI 错误
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_RESPONSE_INVALID = 'AI_RESPONSE_INVALID',

  // 系统错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ✅ P0优化: 错误消息映射
const ERROR_MESSAGES: Record<string, { message: string; suggestion: string }> = {
  [ErrorType.PARAM_MISSING]: {
    message: '缺少必要的信息',
    suggestion: '请提供更详细的信息，例如目的地、日期等',
  },
  [ErrorType.PARAM_INVALID]: {
    message: '信息格式不正确',
    suggestion: '请检查日期格式（如：2024-05-01）或数字格式',
  },
  [ErrorType.SPOT_NOT_FOUND]: {
    message: '未找到该景点',
    suggestion: '请检查景点名称是否正确，或尝试其他景点',
  },
  [ErrorType.TRIP_NOT_FOUND]: {
    message: '未找到该行程',
    suggestion: '请检查行程 ID 是否正确，或先创建行程',
  },
  [ErrorType.TRIP_NOT_COMPLETED]: {
    message: '行程尚未完成',
    suggestion: '只能为已完成的行程生成博客，请先完成行程',
  },
  [ErrorType.AI_SERVICE_UNAVAILABLE]: {
    message: 'AI 服务暂时不可用',
    suggestion: '请稍后重试，或联系客服',
  },
  [ErrorType.AI_RESPONSE_INVALID]: {
    message: 'AI 返回了无效的响应',
    suggestion: '请重新描述您的需求，或稍后重试',
  },
  [ErrorType.DATABASE_ERROR]: {
    message: '数据库操作失败',
    suggestion: '请稍后重试，或联系客服',
  },
  [ErrorType.NETWORK_ERROR]: {
    message: '网络连接失败',
    suggestion: '请检查网络连接，或稍后重试',
  },
  [ErrorType.UNKNOWN_ERROR]: {
    message: '发生了未知错误',
    suggestion: '请稍后重试，或联系客服',
  },
};

// 智谱 AI 配置
const ZHIPUAI_API_KEY = process.env.ZHIPUAI_API_KEY || '';
const ZHIPUAI_API_URL = 'open.bigmodel.cn';
const ZHIPUAI_API_PATH = '/api/paas/v4/chat/completions';

if (!ZHIPUAI_API_KEY) {
  console.warn('⚠️ 智谱AI API Key 未配置');
}

/**
 * 工具调用参数
 */
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Agent 请求参数
 */
interface AgentRequest {
  question: string;
  userId?: string;
}

/**
 * Agent 响应
 */
interface AgentResponse {
  answer: string;
  toolCalls?: {
    name: string;
    result: any;
  }[];
}

/**
 * 工具执行结果
 */
interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  needsMoreInfo?: boolean;    // 是否需要用户补充信息
  missingParams?: string[];    // 缺失的参数列表
  needsConfirmation?: boolean; // 是否需要用户确认
  previewData?: any;           // 预览数据
  sessionId?: string;          // 会话ID（用于确认）
}

/**
 * Agent 服务类
 */
class AgentService {
  /**
   * 调用智谱AI API（支持 Function Calling，带重试机制）
   */
  private async callZhipuAI(messages: any[], tools?: any[], toolChoice: any = 'auto'): Promise<any> {
    if (!ZHIPUAI_API_KEY) {
      throw new Error('AI服务未配置');
    }

    const data = {
      model: 'glm-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      ...(tools && { tools }),
      ...(toolChoice && { tool_choice: toolChoice }),
    };

    const jsonData = JSON.stringify(data);
    
    // ✅ 调试: 输出请求详情
    console.log('\n📤 [发送给智谱AI]');
    console.log('   消息数量:', messages.length);
    console.log('   最后一条用户消息:', messages[messages.length - 1]?.content);
    console.log('   工具数量:', tools?.length || 0);
    console.log('   tool_choice:', toolChoice);

    const options = {
      hostname: ZHIPUAI_API_URL,
      port: 443,
      path: ZHIPUAI_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPUAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(jsonData),
      },
      timeout: 30000,
    };

    // 使用重试机制调用 API
    return await httpsRequestWithRetry(options, jsonData, 2);
  }
  /**
   * 定义可用的工具（精简版：从 6 个减少到 3 个）
   */
  private getTools(): any[] {
    return [
      // 工具 1: 创建智能行程（合并 create_trip + create_trip_with_constraints + extract_must_visit_spots）
      {
        type: 'function',
        function: {
          name: 'create_smart_trip',
          description: `创建智能旅行行程。支持必选景点、约束条件、智能推荐。

【触发条件】
- 用户表达旅行意图（如"我想去北京"、"计划去上海"）
- 用户提到具体景点（如"一定要去故宫"）

【参数说明】
- destination: 目的地城市（必填）
- days: 行程天数（可选，默认3天）
- 其他参数均为可选，系统会智能推断

【示例】
用户: "我想去北京玩三天"
→ destination="北京", days=3

用户: "下个月去上海，预算一万"
→ destination="上海", budget=10000`,
          parameters: {
            type: 'object',
            properties: {
              destination: {
                type: 'string',
                description: '目的地城市，如"北京"、"上海"',
              },
              startDate: {
                type: 'string',
                description: '开始日期（可选），格式 YYYY-MM-DD，默认明天',
              },
              endDate: {
                type: 'string',
                description: '结束日期（可选），格式 YYYY-MM-DD，默认 3 天后',
              },
              days: {
                type: 'number',
                description: '行程天数（可选），默认 3 天',
              },
              budget: {
                type: 'number',
                description: '预算金额（可选），默认 5000 元',
              },
              travelers: {
                type: 'number',
                description: '旅行人数（可选），默认 2 人',
              },
              preferences: {
                type: 'string',
                description: '旅行偏好（可选），如"历史文化"、"自然风光"',
              },
              mustVisitSpots: {
                type: 'array',
                description: '必选景点名称列表（可选），如["故宫", "长城"]',
                items: { type: 'string' },
              },
              groupType: {
                type: 'string',
                description: '群体类型（可选）：solo/couple/family/friends',
                enum: ['solo', 'couple', 'family', 'friends'],
              },
            },
            required: ['destination'], // 只要求目的地，其他参数可选
          },
        },
      },
      // 工具 2: 列出行程（保持不变）
      {
        type: 'function',
        function: {
          name: 'list_user_trips',
          description: `查看用户的行程列表。

【触发条件】
- 用户想查看行程（如"查看我的行程"、"有哪些行程"）

【参数说明】
- status: 行程状态筛选（可选）`,
          parameters: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: '行程状态筛选，可选值："planning"（规划中）、"ongoing"（进行中）、"completed"（已完成）',
                enum: ['planning', 'ongoing', 'completed'],
              },
            },
          },
        },
      },
      // 工具 3: 管理博客（合并 generate_blog + publish_blog）
      {
        type: 'function',
        function: {
          name: 'manage_blog',
          description: `管理旅行博客：生成或发布博客。

【触发条件】
- 用户想写游记（如"为上次旅行写游记"）
- 用户想发布博客（如"发布这篇博客"）

【参数说明】
- action: 操作类型（必填）
  * generate: 生成博客
  * publish: 发布博客
- tripId: 行程ID（生成博客时必填）
- blogId: 博客ID（发布博客时必填）`,
          parameters: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description: '操作类型：generate（生成）或 publish（发布）',
                enum: ['generate', 'publish'],
              },
              tripId: {
                type: 'string',
                description: '行程 ID（生成博客时必填）',
              },
              blogId: {
                type: 'string',
                description: '博客 ID（发布博客时必填）',
              },
              title: {
                type: 'string',
                description: '博客标题（可选）',
              },
              style: {
                type: 'string',
                description: '博客风格（可选）：详细记录/简洁总结/情感抒情',
              },
            },
            required: ['action'],
          },
        },
      },
      // ✅ P0优化: 新增确认工具
      {
        type: 'function',
        function: {
          name: 'confirm_action',
          description: `确认保存或发布操作。

【触发条件】
- 用户确认保存行程（如"保存"、"确认"、"好的"）
- 用户确认发布博客（如"发布"、"确认发布"）

【注意】
- 只能在预览后调用
- 调用后会将临时数据保存到数据库`,
          parameters: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description: '确认操作类型：save_trip（保存行程）/ publish_blog（发布博客）',
                enum: ['save_trip', 'publish_blog'],
              },
            },
            required: ['action'],
          },
        },
      },
      // ✅ P0优化: 新增重新生成工具
      {
        type: 'function',
        function: {
          name: 'regenerate',
          description: `重新生成内容。

【触发条件】
- 用户不满意当前结果（如"重新规划"、"重新生成"、"不满意"）

【参数】
- type: 重新生成类型`,
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: '类型：trip/blog',
                enum: ['trip', 'blog'],
              },
            },
            required: ['type'],
          },
        },
      },
    ];
  }

  /**
   * 构建 Agent 系统提示词（带动态上下文）
   * ✅ P1优化: 简化系统提示词,提高AI理解准确性
   */
  private async buildSystemPrompt(userId?: string): Promise<string> {
    // ✅ 重新启用用户画像
    const startTime = Date.now();
    const userProfile = await userProfileService.getUserProfile(userId);
    const profilePrompt = userProfileService.formatProfileAsPrompt(userProfile);
    const elapsed = Date.now() - startTime;
    console.log(`⏱️  用户画像注入耗时: ${elapsed}ms`);

    const today = new Date();
    const thisYear = today.getFullYear();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
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

当前日期: ${today.toISOString().split('T')[0]}
默认年份: ${thisYear}

参数提取规则:
- destination: 从用户输入提取城市名称
- startDate: 
  * 有具体日期 → 转换为YYYY-MM-DD格式
  * 无日期 → 使用明天: ${defaultStartDate}
  * "下个月"、"下周" → 计算具体日期
- endDate: 根据startDate和天数计算,默认3天
- budget: 
  * 有预算 → 提取数字
  * 无预算 → 默认5000元
- travelers:
  * 有人数 → 提取数字
  * "我和爱人"/"两个人" → 2
  * 无人数 → 默认2人
- preferences: 从输入提取偏好,无则默认"休闲观光"

【重要原则】
1. **大胆使用默认值** - 不要反复确认,用户没提供的信息用默认值
2. **立即行动** - 用户表达创建意图时,立即调用工具,不要等待
3. **智能推断** - "三天"推断为3天,"北京之旅"推断目的地为北京
4. **简洁回复** - 创建成功后简洁告知结果,不要冗长解释

【示例】
用户: "我想去北京玩三天"
→ 立即调用create_trip,destination=北京,startDate=${defaultStartDate},endDate=3天后,使用默认预算和人数

用户: "下个月去上海,预算一万"
→ 计算下个月日期,预算10000,使用默认天数和人数`;
  }

  /**
   * 执行工具调用
   */
  private async executeToolCall(toolCall: any, userId?: string, messages?: any[], sessionId?: string): Promise<ToolExecutionResult> {
    // 只处理 function 类型的工具调用
    if (toolCall.type !== 'function') {
      return {
        success: false,
        error: `不支持的工具类型: ${toolCall.type}`,
      };
    }

    const { name, arguments: args } = toolCall.function;

    try {
      console.log(`\n🔧 [工具调用] 执行工具: ${name}`);
      console.log(`   原始参数字符串:`, args);
      console.log(`   参数类型:`, typeof args);

      // ✅ 问题4: 增强参数验证
      let params: any = {};

      if (!args || args === 'undefined' || args === 'null' || args === '{}') {
        console.log(`   ⚠️  参数为空，将使用智能推断`);
        params = {};
      } else {
        try {
          params = JSON.parse(args);
        } catch (parseError) {
          console.error(`   ❌ 参数解析失败:`, parseError);
          params = {};
        }
      }

      console.log(`   解析后参数:`, JSON.stringify(params, null, 2));

      // ✅ P0优化: 参数补全
      if (messages && messages.length > 0) {
        params = await this.completeToolParams(name, params, messages);
      }

      console.log(`   最终参数:`, JSON.stringify(params, null, 2));

      switch (name) {
        case 'create_smart_trip':
          // ✅ 新的统一工具：创建智能行程
          return await this.createSmartTrip(params, userId, sessionId);

        case 'create_trip':
          // ✅ 保留旧工具兼容性
          return await this.createTrip(params, userId);

        case 'list_user_trips':
          return await this.listUserTrips(params, userId);

        case 'manage_blog':
          // ✅ 新的统一工具：管理博客
          return await this.manageBlog(params, userId);

        case 'generate_blog':
          // ✅ 保留旧工具兼容性
          return await this.generateBlog(params, userId);

        case 'publish_blog':
          // ✅ 保留旧工具兼容性
          return await this.publishBlog(params, userId);

        case 'extract_must_visit_spots':
          return await this.extractMustVisitSpots(params);

        case 'create_trip_with_constraints':
          return await this.createTripWithConstraints(params, userId);

        default:
          return {
            success: false,
            error: `未知的工具: ${name}`,
          };
      }
    } catch (error: any) {
      console.error(`❌ 工具执行失败 (${name}):`, error);
      return {
        success: false,
        error: error.message || '工具执行失败',
      };
    }
  }

  /**
   * ✅ P0优化: 创建智能行程（统一工具）
   * 合并了 create_trip + create_trip_with_constraints + extract_must_visit_spots
   * 支持二次确认：先返回预览，用户确认后再保存
   */
  private async createSmartTrip(params: any, userId?: string, sessionId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('\n🎯 [创建智能行程]');
      console.log('   参数:', JSON.stringify(params, null, 2));

      // 1. 参数检查和追问
      const missingParams = this.checkMissingTripParams(params);
      if (missingParams.length > 0) {
        const question = this.generateParamQuestion(missingParams);
        return {
          success: false,
          needsMoreInfo: true,
          missingParams,
          error: question,
        };
      }

      // 2. 调用 createTrip 工具生成完整行程（包含 AI 推荐）
      console.log('   📝 调用 createTrip 生成完整行程...');
      const tripResult = await this.createTrip({
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        budget: params.budget,
        preferences: params.preferences || '',
        mustVisitSpots: params.mustVisitSpots || [],
      }, userId);

      if (!tripResult.success) {
        return tripResult;
      }

      // 3. 从 createTrip 结果中提取完整行程数据
      const tripData = tripResult.data;
      const tripId = tripData.id; // createTrip 返回的是 id，不是 tripId
      console.log('   ✅ AI 推荐完成，行程ID:', tripId);

      // 4. 构建预览数据（从数据库查询完整行程）
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              itineraryItems: {
                orderBy: { startTime: 'asc' },
              },
            },
          },
        },
      });

      if (!trip) {
        return {
          success: false,
          error: '行程创建失败，请重试',
        };
      }

      // 5. 构建预览数据结构
      const previewData = {
        tripId: trip.id,
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        startDate: trip.startDate.toISOString().split('T')[0],
        endDate: trip.endDate.toISOString().split('T')[0],
        days: Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        budget: trip.totalBudget,
        dailyPlans: trip.days.map((day: any) => ({
          day: day.dayNumber,
          date: day.date.toISOString().split('T')[0],
          spots: day.itineraryItems.map((item: any) => ({
            name: item.name,
            category: item.category,
            ticketPrice: item.cost,
            startTime: item.startTime?.toISOString(),
            endTime: item.endTime?.toISOString(),
          })),
        })),
      };

      // 6. 保存临时数据到会话（用于后续确认）
      if (sessionId) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24小时后过期
        
        await chatHistoryService.updateSessionTempData(sessionId, {
          type: 'trip_draft' as any,
          data: previewData,
          createdAt: new Date(),
          expiresAt,
        });
        console.log('   ✅ 临时数据已保存到会话:', sessionId);
      }

      // 7. 删除临时创建的行程（因为用户还没确认）
      await prisma.trip.delete({ where: { id: trip.id } });
      console.log('   🗑️  已删除临时行程，等待用户确认');

      // 8. 返回预览数据，等待用户确认
      return {
        success: true,
        needsConfirmation: true,
        previewData,
        sessionId,
        data: {
          message: '已为您生成行程预览，请确认是否保存到"我的行程"中。',
          preview: previewData,
        },
      };

    } catch (error: any) {
      console.error('❌ 创建智能行程失败:', error);
      return {
        success: false,
        error: error.message || '创建智能行程失败',
      };
    }
  }

  /**
   * 检查缺失的行程参数
   */
  private checkMissingTripParams(params: any): string[] {
    const missing: string[] = [];
    
    if (!params.destination) {
      missing.push('destination');
    }
    
    if (!params.days && !params.startDate) {
      missing.push('days');
    }
    
    return missing;
  }

  /**
   * 生成参数追问问题
   */
  private generateParamQuestion(missingParams: string[]): string {
    const questions: string[] = [];
    
    for (const param of missingParams) {
      switch (param) {
        case 'destination':
          questions.push('请问您想去哪里旅行？');
          break;
        case 'days':
          questions.push('请问您计划旅行几天？');
          break;
        case 'budget':
          questions.push('请问您的预算是多少？');
          break;
        case 'startDate':
          questions.push('请问您计划什么时候出发？');
          break;
      }
    }
    
    return questions.join('\n');
  }

  /**
   * 生成行程预览（不保存到数据库）
   */
  private async generateTripPreview(params: any, userId?: string): Promise<any> {
    try {
      console.log('   🎨 生成行程预览数据...');
      
      // 解析日期
      let startDate = params.startDate ? parseDate(params.startDate) : new Date();
      let endDate = params.endDate ? parseDate(params.endDate) : new Date();
      
      if (!params.startDate && params.days) {
        endDate = new Date(startDate.getTime() + (params.days - 1) * 24 * 60 * 60 * 1000);
      }
      
      const days = params.days || Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      
      // 获取目的地景点
      const spots = await prisma.spot.findMany({
        where: { city: params.destination },
        take: 10,
        orderBy: { rating: 'desc' },
      });
      
      // 生成预览数据
      const preview: any = {
        destination: params.destination,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        days,
        budget: params.budget || 0,
        travelers: params.travelers || 1,
        title: `${params.destination}${days}日游`,
        description: `为您规划的${params.destination}${days}日行程`,
        dailyPlans: [],
        estimatedCost: {
          total: params.budget || 0,
          accommodation: Math.floor((params.budget || 0) * 0.3),
          transportation: Math.floor((params.budget || 0) * 0.2),
          food: Math.floor((params.budget || 0) * 0.2),
          tickets: Math.floor((params.budget || 0) * 0.2),
          other: Math.floor((params.budget || 0) * 0.1),
        },
        spots: spots.slice(0, days * 2),
      };
      
      // 生成每日计划
      for (let i = 0; i < days; i++) {
        const dayDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const daySpots = spots.slice(i * 2, (i + 1) * 2);
        
        preview.dailyPlans.push({
          day: i + 1,
          date: formatDate(dayDate),
          spots: daySpots.map(spot => ({
            name: spot.name,
            category: spot.category,
            ticketPrice: spot.ticketPrice,
            rating: spot.rating,
          })),
        });
      }
      
      console.log('   ✅ 行程预览生成完成');
      return preview;
      
    } catch (error: any) {
      console.error('   ❌ 生成预览失败:', error);
      throw error;
    }
  }

  /**
   * ✅ P0优化: 管理博客（统一工具）
   * 合并了 generate_blog + publish_blog
   */
  private async manageBlog(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('\n📝 [管理博客]');
      console.log('   操作:', params.action);

      if (params.action === 'generate') {
        // 生成博客
        if (!params.tripId) {
          return {
            success: false,
            error: '生成博客需要提供 tripId',
          };
        }
        return await this.generateBlog(params, userId);

      } else if (params.action === 'publish') {
        // 发布博客
        if (!params.blogId) {
          return {
            success: false,
            error: '发布博客需要提供 blogId',
          };
        }
        return await this.publishBlog(params, userId);

      } else {
        return {
          success: false,
          error: `未知的博客操作: ${params.action}`,
        };
      }

    } catch (error: any) {
      console.error('❌ 管理博客失败:', error);
      return {
        success: false,
        error: error.message || '管理博客失败',
      };
    }
  }

  /**
   * ✅ 任务A: 参数验证函数 - 返回结构化验证结果
   */
  private validateCreateTripParams(params: any): {
    valid: boolean;
    needsMoreInfo?: boolean;
    message?: string;
    missingParams?: string[];
  } {
    const missingParams: string[] = [];
    const errors: string[] = [];

    // 检查必填参数
    if (!params.destination) {
      missingParams.push('destination');
    }

    if (!params.startDate) {
      missingParams.push('startDate');
    }

    if (!params.endDate) {
      missingParams.push('endDate');
    }

    // 如果有缺失参数,返回追问
    if (missingParams.length > 0) {
      const questions: string[] = [];
      
      if (missingParams.includes('destination')) {
        questions.push('您想去哪个城市？');
      }
      
      if (missingParams.includes('startDate') || missingParams.includes('endDate')) {
        questions.push('您计划什么时候出发？玩几天？');
      }

      return {
        valid: false,
        needsMoreInfo: true,
        message: questions.join(' '),
        missingParams,
      };
    }

    // 验证日期格式和逻辑
    try {
      const startDate = parseDate(params.startDate);
      const endDate = parseDate(params.endDate);

      if (startDate >= endDate) {
        errors.push('结束日期必须晚于开始日期');
      }

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysDiff > 30) {
        errors.push('行程天数不能超过30天');
      }
      
      if (daysDiff < 1) {
        errors.push('行程天数至少为1天');
      }
    } catch (error: any) {
      errors.push(`日期格式不正确: ${error.message}。支持的格式: YYYY-MM-DD, 明天, 下周三等`);
    }

    if (errors.length > 0) {
      return {
        valid: false,
        needsMoreInfo: false,
        message: errors.join('; '),
      };
    }

    return { valid: true };
  }

  /**
   * 创建行程工具（使用 AI 推荐）
   */
  private extractTripParamsFromMessages(messages: any[], mustVisitSpots: any[]): any {
    // 获取用户消息
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    console.log('\n📝 [参数提取]');
    console.log('   用户消息:', userMessage);
    
    // 提取参数
    const params: any = {
      mustVisitSpots: mustVisitSpots,
    };
    
    // ✅ 优先从mustVisitSpots提取城市
    if (mustVisitSpots && mustVisitSpots.length > 0 && mustVisitSpots[0].city) {
      params.destination = mustVisitSpots[0].city;
      console.log('   从必选景点提取城市:', params.destination);
    } else {
      // 从用户消息提取目的地
      const cityMatch = userMessage.match(/北京|上海|武汉|广州|深圳|杭州|成都|西安|南京|苏州|重庆|天津|青岛|大连|厦门|昆明|三亚/);
      if (cityMatch) {
        params.destination = cityMatch[0];
        console.log('   从消息提取城市:', params.destination);
      }
    }
    
    // ✅ 智能日期提取
    const today = new Date();
    const thisYear = today.getFullYear();
    let startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 1); // 默认明天
    
    // 检查各种日期格式
    if (userMessage.includes('明天')) {
      // 明天
    } else if (userMessage.includes('后天')) {
      startDate.setDate(startDate.getDate() + 1);
    } else if (userMessage.includes('下周')) {
      const weekDayMatch = userMessage.match(/下周([一二三四五六日天])/);
      if (weekDayMatch) {
        const weekDays: Record<string, number> = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':0,'天':0};
        const targetDay = weekDays[weekDayMatch[1]];
        const currentDay = today.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + daysUntil);
      }
    } else {
      // 检查具体日期
      const dateMatch = userMessage.match(/(\d{1,2})月(\d{1,2})日/) || 
                       userMessage.match(/(\d{4})[年-](\d{1,2})[月-](\d{1,2})/);
      if (dateMatch) {
        if (dateMatch.length === 3) {
          const month = parseInt(dateMatch[1]) - 1;
          const day = parseInt(dateMatch[2]);
          startDate = new Date(thisYear, month, day);
        } else if (dateMatch.length === 4) {
          startDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
        }
      }
    }
    
    params.startDate = startDate.toISOString().split('T')[0];
    
    // ✅ 智能天数提取
    const daysMatch = userMessage.match(/(\d+)\s*天/) || userMessage.match(/三天|三日/) || userMessage.match(/两天|两日|2天/);
    let days = 3; // 默认3天
    if (daysMatch) {
      if (daysMatch[0].includes('三') || daysMatch[0].includes('3')) {
        days = 3;
      } else if (daysMatch[0].includes('两') || daysMatch[0].includes('2')) {
        days = 2;
      } else if (daysMatch[1]) {
        days = parseInt(daysMatch[1]);
      }
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    params.endDate = endDate.toISOString().split('T')[0];
    
    console.log('   日期:', params.startDate, '到', params.endDate, '(', days, '天)');
    
    // ✅ 智能预算提取
    const budgetMatch = userMessage.match(/预算[在约]?(\d+)/) || userMessage.match(/(\d+)\s*元/);
    if (budgetMatch) {
      params.budget = parseInt(budgetMatch[1]);
    } else {
      params.budget = 5000; // 默认预算
      console.log('   使用默认预算: 5000元');
    }
    
    // ✅ 智能人数提取
    if (userMessage.includes('爱人') || userMessage.includes('情侣') || userMessage.includes('两个人') || userMessage.includes('2人')) {
      params.travelers = 2;
    } else if (userMessage.includes('一个人') || userMessage.includes('独自') || userMessage.includes('1人')) {
      params.travelers = 1;
    } else if (userMessage.includes('全家') || userMessage.includes('家庭')) {
      params.travelers = 4;
    } else {
      const travelersMatch = userMessage.match(/(\d+)\s*人/);
      if (travelersMatch) {
        params.travelers = parseInt(travelersMatch[1]);
      } else {
        params.travelers = 2; // 默认2人
        console.log('   使用默认人数: 2人');
      }
    }
    
    // ✅ 智能偏好提取
    if (userMessage.includes('历史') || userMessage.includes('文化') || userMessage.includes('故宫') || userMessage.includes('博物馆')) {
      params.preferences = '历史文化';
    } else if (userMessage.includes('自然') || userMessage.includes('风景') || userMessage.includes('山水')) {
      params.preferences = '自然风光';
    } else if (userMessage.includes('美食') || userMessage.includes('吃货')) {
      params.preferences = '美食之旅';
    } else if (userMessage.includes('购物') || userMessage.includes('逛街')) {
      params.preferences = '购物娱乐';
    } else {
      params.preferences = '休闲观光'; // 默认偏好
    }
    
    console.log('   ✅ 提取结果:', JSON.stringify(params, null, 2));
    
    return params;
  }

  /**
   * 创建行程（AI 推荐）
   */
  private async createTrip(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('🗓️  创建行程（AI 推荐）:', params);

      // ✅ 任务A: 使用结构化参数验证
      const validation = this.validateCreateTripParams(params);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.message,
          needsMoreInfo: validation.needsMoreInfo,
          missingParams: validation.missingParams,
        };
      }

      // 解析日期（支持相对日期）
      let startDate: Date;
      let endDate: Date;

      try {
        startDate = parseDate(params.startDate);
        endDate = parseDate(params.endDate);
      } catch (error: any) {
        return {
          success: false,
          error: `日期解析失败: ${error.message}`,
        };
      }

      // 计算天数
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // 如果没有 userId，使用默认用户或提示需要登录
      let tripUserId = userId;
      if (!tripUserId) {
        // 查找或创建一个默认用户用于测试
        let defaultUser = await prisma.user.findFirst({
          where: { username: 'default_user' },
        });

        if (!defaultUser) {
          // 创建默认用户
          defaultUser = await prisma.user.create({
            data: {
              username: 'default_user',
              email: 'default_user@example.com',
              passwordHash: 'default', // 实际使用中应该使用加密的密码
              role: 'user',
            },
          });
          console.log(`✅ 创建默认用户，ID: ${defaultUser.id}`);
        }

        tripUserId = defaultUser.id;
        console.log(`✅ 使用默认用户ID: ${tripUserId}`);
      }

      // 创建行程
      const trip = await prisma.trip.create({
        data: {
          userId: tripUserId,
          title: `${params.destination}之旅`,
          description: params.preferences || '',
          destination: params.destination,
          startDate: startDate,
          endDate: endDate,
          status: 'planning',
          totalBudget: params.budget || 0,
          aiGenerated: true,
        },
      });

      console.log(`✅ 行程基础信息创建成功，ID: ${trip.id}`);

      // 调用 AI 推荐算法填充景点数据
      console.log('🔍 正在调用 AI 推荐系统，为 ' + params.destination + ' 规划 ' + daysDiff + ' 天行程...');

      try {
        // 导入 AI 推荐服务
        const { aiTripRecommender } = await import('./aiTripRecommender');
        const aiRecommender = aiTripRecommender();

        // 调用 AI 推荐
        const recommendation = await aiRecommender.recommendTrip({
          destination: params.destination,
          days: daysDiff,
          preferences: params.preferences ? this.parsePreferences(params.preferences) : undefined,
          budget: params.budget,
          mustVisitSpots: params.mustVisitSpots,
          userId: userId,
        });

        console.log(`✅ AI 推荐完成，正在创建行程记录...`);

        // ✅ P0修复: 验证AI返回的景点数量
        let totalSpotsCount = 0;
        for (const dayPlan of recommendation.dailyPlans) {
          totalSpotsCount += (dayPlan.spots && Array.isArray(dayPlan.spots)) ? dayPlan.spots.length : 0;
        }

        console.log(`   总景点数量: ${totalSpotsCount}`);

        if (totalSpotsCount === 0) {
          // AI返回的景点为空,删除已创建的Trip并返回错误
          console.error('❌ AI返回的景点列表为空,无法创建有效行程');
          
          await prisma.day.deleteMany({
            where: { tripId: trip.id }
          });
          await prisma.trip.delete({
            where: { id: trip.id }
          });
          
          return {
            success: false,
            error: `无法为${params.destination}生成有效行程。

可能的原因：
1. 该城市的景点数据不足
2. 必选景点在数据库和高德API中都不存在
3. AI推荐算法未能生成合理的行程安排

建议：
- 尝试其他城市（如"北京"、"上海"、"杭州"等热门城市）
- 减少必选景点的数量
- 稍后重试或联系管理员检查景点数据`,
          };
        }

        // 创建 Day 和 ItineraryItem 记录
        for (const dayPlan of recommendation.dailyPlans) {
          const day = await prisma.day.create({
            data: {
              tripId: trip.id,
              dayNumber: dayPlan.day,
              date: new Date(dayPlan.date),
            },
          });

          for (const spot of dayPlan.spots) {
            // 查询景点信息 - 使用模糊匹配
            let spotRecord = await prisma.spot.findFirst({
              where: {
                name: spot.name,
                city: params.destination,
              },
            });

            // 如果精确匹配失败，尝试模糊匹配
            if (!spotRecord) {
              console.log(`⚠️  精确匹配失败: "${spot.name}"，尝试模糊匹配...`);
              spotRecord = await prisma.spot.findFirst({
                where: {
                  city: params.destination,
                  name: {
                    contains: spot.name.substring(0, 4), // 使用景点名称的前4个字符进行模糊匹配
                  },
                },
              });
            }

            if (!spotRecord) {
              console.warn(`⚠️  未找到景点: "${spot.name}"，将使用AI返回的信息创建行程项目`);
            } else {
              console.log(`✅ 找到景点: "${spot.name}" -> "${spotRecord.name}"`);
            }

            // 计算时间
            const [startHour, startMinute] = spot.startTime.split(':').map(Number);
            const [endHour, endMinute] = spot.endTime.split(':').map(Number);

            const startTime = new Date(day.date);
            startTime.setHours(startHour, startMinute, 0, 0);

            const endTime = new Date(day.date);
            endTime.setHours(endHour, endMinute, 0, 0);

            await prisma.itineraryItem.create({
              data: {
                dayId: day.id,
                name: spot.name,
                type: 'spot',
                category: spotRecord?.category || '',
                description: spot.notes || spotRecord?.description || '',
                startTime: startTime,
                endTime: endTime,
                address: spotRecord?.address || '',
                latitude: spotRecord ? parseFloat(spotRecord.location.split(',')[0]) : null,
                longitude: spotRecord ? parseFloat(spotRecord.location.split(',')[1]) : null,
                cost: spotRecord?.ticketPrice || 0,
                spotId: spotRecord?.id || null,
              },
            });
          }
        }

        console.log(`✅ 景点信息填充完成，行程创建成功，ID: ${trip.id}`);

        return {
          success: true,
          data: {
            id: trip.id,
            title: trip.title,
            destination: trip.destination,
            startDate: trip.startDate.toISOString().split('T')[0],
            endDate: trip.endDate.toISOString().split('T')[0],
            days: daysDiff,
            summary: recommendation.summary,
            tips: recommendation.tips,
            message: `✅ 行程创建成功！

📋 行程信息：
- 标题：${trip.title}
- 目的地：${trip.destination}
- 时间：${trip.startDate.toISOString().split('T')[0]} 至 ${trip.endDate.toISOString().split('T')[0]}（共 ${daysDiff} 天）
- 预算：${trip.totalBudget} 元

📝 行程总结：
${recommendation.summary}

💡 旅行建议：
${recommendation.tips.map(tip => `- ${tip}`).join('\n')}`,
          },
        };
      } catch (recommendError: any) {
        console.error('❌ AI 推荐执行失败:', recommendError);
        console.error('   错误详情:', recommendError.message);
        console.error('   错误堆栈:', recommendError.stack);

        // AI 推荐失败，删除已创建的行程（避免留下空行程）
        console.log('🗑️  删除失败的行程...');
        await prisma.day.deleteMany({
          where: { tripId: trip.id }
        });
        await prisma.trip.delete({
          where: { id: trip.id }
        });
        console.log('✅ 已删除失败的行程');

        return {
          success: false,
          error: `AI 推荐失败，无法创建行程。错误信息：${recommendError.message}

可能的原因：
1. 该城市的景点数据不足
2. 网络连接问题
3. AI 服务暂时不可用

建议：
- 请稍后重试
- 检查城市名称是否正确
- 联系管理员检查系统状态`,
        };
      }
    } catch (error: any) {
      console.error('❌ 创建行程失败:', error);
      return {
        success: false,
        error: error.message || '创建行程失败',
      };
    }
  }

  /**
   * 列出用户行程工具
   */
  private async listUserTrips(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('📋 列出行程:', params);

      // 如果没有 userId，使用默认用户
      let tripUserId = userId;
      if (!tripUserId) {
        const defaultUser = await prisma.user.findFirst({
          where: { username: 'default_user' },
        });

        if (defaultUser) {
          tripUserId = defaultUser.id;
        } else {
          return {
            success: false,
            error: '请先登录以查看行程',
          };
        }
      }

      // 构建查询条件
      const where: any = {
        userId: tripUserId,
      };

      // 如果指定了状态筛选
      if (params.status) {
        where.status = params.status;
      }

      // 查询行程
      const trips = await prisma.trip.findMany({
        where,
        include: {
          days: {
            orderBy: {
              dayNumber: 'asc',
            },
          },
          budget: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // 最多返回 10 个行程
      });

      // 格式化行程数据
      const formattedTrips = trips.map(trip => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: formatDate(trip.startDate),
        endDate: formatDate(trip.endDate),
        days: trip.days.length,
        status: trip.status,
        budget: trip.totalBudget,
        actualBudget: trip.actualBudget,
        budgetStatus: trip.budgetStatus,
      }));

      console.log(`✅ 找到 ${formattedTrips.length} 个行程`);

      return {
        success: true,
        data: {
          trips: formattedTrips,
          count: formattedTrips.length,
          message: formattedTrips.length > 0
            ? '找到您的行程列表'
            : '您还没有任何行程',
        },
      };
    } catch (error: any) {
      console.error('❌ 列出行程失败:', error);
      return {
        success: false,
        error: error.message || '获取行程列表失败',
      };
    }
  }

  /**
   * 生成博客工具
   */
  private async generateBlog(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('✍️ 生成博客:', params);

      // 验证必填参数
      if (!params.tripId) {
        return {
          success: false,
          error: '缺少必填参数：tripId',
        };
      }

      // 查询行程
      const trip = await prisma.trip.findUnique({
        where: { id: params.tripId },
        include: {
          days: {
            include: {
              itineraryItems: {
                include: {
                  spot: true,
                },
              },
            },
            orderBy: {
              dayNumber: 'asc',
            },
          },
          user: true,
        },
      });

      if (!trip) {
        return {
          success: false,
          error: '行程不存在',
        };
      }

      // 验证行程状态
      if (trip.status !== 'completed') {
        return {
          success: false,
          error: '只能为已完成的行程生成博客',
        };
      }

      // 构建博客内容
      const blogTitle = params.title || `${trip.destination}之旅`;
      const blogStyle = params.style || '详细记录';

      // 收集行程信息
      const tripInfo = {
        title: trip.title,
        destination: trip.destination,
        startDate: formatDate(trip.startDate),
        endDate: formatDate(trip.endDate),
        days: trip.days.length,
        budget: trip.totalBudget,
        actualBudget: trip.actualBudget,
        spots: trip.days.flatMap(day =>
          day.itineraryItems.map(item => ({
            name: item.spot?.name || item.name,
            category: item.spot?.category || '',
            notes: (item as any).notes || '',
          }))
        ),
      };

      // 使用 AI 生成博客内容
      const blogPrompt = `请为一次旅行生成一篇博客文章。

【行程信息】
目的地：${tripInfo.destination}
时间：${tripInfo.startDate} 至 ${tripInfo.endDate}（共 ${tripInfo.days} 天）
预算：${tripInfo.budget} 元
实际花费：${tripInfo.actualBudget} 元

【游览景点】
${tripInfo.spots.map((spot, index) => `${index + 1}. ${spot.name}${spot.category ? `（${spot.category}）` : ''}`).join('\n')}

【博客要求】
- 标题：${blogTitle}
- 风格：${blogStyle}
- 内容生动有趣，包含旅行感受和体验
- 字数：800-1200 字
- 结构清晰，有开头、中间、结尾

请生成博客内容：`;

      try {
        const aiStartTime = Date.now();
        const result = await this.callZhipuAI([
          {
            role: 'system',
            content: '你是一位专业的旅行博主，擅长创作生动有趣的旅行游记。',
          },
          {
            role: 'user',
            content: blogPrompt,
          },
        ]);
        const aiElapsed = Date.now() - aiStartTime;
        console.log(`⏱️  AI 生成博客耗时: ${aiElapsed}ms`);

        const blogContent = result.choices[0]?.message?.content || '';

        const blogStartTime = Date.now();
        // 创建博客草稿
        const blog = await prisma.blogPost.create({
          data: {
            userId: trip.userId,
            title: blogTitle,
            content: blogContent,
            city: trip.destination,
            spotIds: tripInfo.spots.map(s => s.name).join(','), // 存储景点名称
            tags: '旅行,游记', // 默认标签
            status: 'draft', // 保存为草稿
            isPublished: false,
          },
        });

        console.log(`✅ 博客生成成功，ID: ${blog.id}`);

        // 关联景点图片
        const imageAssociationResult = await this.associateSpotImagesToBlog(
          blog.id,
          tripInfo.spots
        );

        const blogElapsed = Date.now() - blogStartTime;
        console.log(`⏱️  博客创建和图片关联耗时: ${blogElapsed}ms`);

        return {
          success: true,
          data: {
            id: blog.id,
            title: blog.title,
            status: blog.status,
            content: blogContent,
            imageCount: imageAssociationResult.associatedImages,
            contentPreview: blogContent.substring(0, 200) + '...',
            needsConfirmation: true, // 标记需要用户确认
            message: `✅ 博客生成成功！

📝 博客信息：
- 标题：${blog.title}
- 状态：草稿
- 关联图片：${imageAssociationResult.associatedImages} 张

📄 内容预览：
${blogContent.substring(0, 200)}...

现在为您发布博客，请确认是否发布？

回复"确认"或"发布"即可发布博客。`,
          },
        };
      } catch (aiError: any) {
        console.error('❌ AI 生成博客失败:', aiError);
        return {
          success: false,
          error: `AI 生成博客失败: ${aiError.message}`,
        };
      }
    } catch (error: any) {
      console.error('❌ 生成博客失败:', error);
      return {
        success: false,
        error: error.message || '生成博客失败',
      };
    }
  }

  /**
   * 提取必选景点工具
   */
  private async extractMustVisitSpots(params: any): Promise<ToolExecutionResult> {
    try {
      console.log('🔍 提取必选景点:', params);

      // 验证必填参数
      if (!params.userInput || !params.destination) {
        return {
          success: false,
          error: '缺少必填参数：userInput、destination',
        };
      }

      // 调用景点提取服务
      const extractionResult = await mustVisitSpotExtractor.extractMustVisitSpots(
        params.userInput,
        params.destination
      );

      console.log(`✅ 提取完成: ${extractionResult.mustVisitSpots.length} 个必选景点`);

      return {
        success: true,
        data: {
          mustVisitSpots: extractionResult.mustVisitSpots,
          unmatchedSpots: extractionResult.unmatchedSpots,
          confidence: extractionResult.confidence,
          message: extractionResult.mustVisitSpots.length > 0
            ? `成功识别 ${extractionResult.mustVisitSpots.length} 个必选景点`
            : '未识别到明确的必选景点',
        },
      };
    } catch (error: any) {
      console.error('❌ 提取必选景点失败:', error);
      return {
        success: false,
        error: error.message || '提取必选景点失败',
      };
    }
  }

  /**
   * 创建约束感知行程工具
   */
  private async createTripWithConstraints(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('\n🎯 [创建约束感知行程]');
      console.log('   接收参数:', JSON.stringify(params, null, 2));

      // 验证必填参数
      if (!params.destination || !params.startDate || !params.endDate) {
        console.error('   ❌ 参数验证失败');
        console.error('   destination:', params.destination || '缺失');
        console.error('   startDate:', params.startDate || '缺失');
        console.error('   endDate:', params.endDate || '缺失');
        return {
          success: false,
          error: '缺少必填参数：destination、startDate、endDate',
        };
      }

      console.log('   ✅ 参数验证通过');

      // 构建请求参数
      const request = {
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        budget: params.budget,
        groupSize: params.travelers,
        groupType: params.groupType,
        hasChildren: params.hasChildren,
        hasElderly: params.hasElderly,
        preferences: params.preferences,
        pace: params.pace,
        mustVisitSpots: params.mustVisitSpots,
      };

      // 调用约束感知规划服务
      const result = await constraintAwarePlanner.createTripWithConstraints(request, userId);

      console.log(`✅ 约束感知行程创建成功，ID: ${result.tripId}`);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ 创建约束感知行程失败:', error);
      return {
        success: false,
        error: error.message || '创建约束感知行程失败',
      };
    }
  }

  /**
   * 发布博客工具
   */
  private async publishBlog(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('📢 发布博客:', params);

      // 验证必填参数
      if (!params.blogId) {
        return {
          success: false,
          error: '缺少必填参数：blogId',
        };
      }

      console.log(`🔍 正在查询博客信息...`);

      // 查询博客
      const blog = await prisma.blogPost.findUnique({
        where: { id: params.blogId },
      });

      if (!blog) {
        return {
          success: false,
          error: '博客不存在',
        };
      }

      // 验证博客状态
      if (blog.status === 'published') {
        return {
          success: true,
          data: {
            id: blog.id,
            title: blog.title,
            status: blog.status,
            message: '博客已经是发布状态',
          },
        };
      }

      // 验证博客所有权
      if (userId && blog.userId !== userId) {
        return {
          success: false,
          error: '无权发布此博客',
        };
      }

      console.log(`📢 正在发布博客...`);

      // 发布博客
      const updatedBlog = await prisma.blogPost.update({
        where: { id: params.blogId },
        data: {
          status: 'published',
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      console.log(`✅ 博客发布成功，ID: ${updatedBlog.id}`);

      return {
        success: true,
        data: {
          id: updatedBlog.id,
          title: updatedBlog.title,
          status: updatedBlog.status,
          publishedAt: updatedBlog.publishedAt?.toISOString().split('T')[0],
          url: `/blog/${updatedBlog.id}`,
          message: `✅ 博客发布成功！

📢 发布信息：
- 博客标题：${updatedBlog.title}
- 发布时间：${updatedBlog.publishedAt?.toISOString().split('T')[0]}
- 访问链接：https://livetrip.com/blog/${updatedBlog.id}

用户现在可以查看您的博客了！`,
        },
      };
    } catch (error: any) {
      console.error('❌ 发布博客失败:', error);
      return {
        success: false,
        error: error.message || '发布博客失败',
      };
    }
  }

  /**
   * 关联景点图片到博客
   */
  private async associateSpotImagesToBlog(blogId: string, spots: Array<{ name: string; category?: string }>): Promise<{ associatedImages: number }> {
    try {
      console.log(`🖼️  开始关联景点图片到博客 ${blogId}...`);

      let associatedImages = 0;
      const processedSpotIds = new Set<string>();

      for (const spot of spots) {
        // 根据景点名称查询数据库中的景点记录
        const spotRecord = await prisma.spot.findFirst({
          where: {
            name: spot.name,
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (spotRecord) {
          // 查询该景点的已审核图片
          const images = await prisma.spotImage.findMany({
            where: {
              spotId: spotRecord.id,
              status: 'approved', // 只选择已审核通过的图片
            },
            orderBy: [
              { priority: 'desc' }, // 优先级高的图片在前
              { isPrimary: 'desc' }, // 主图在前
            ],
            take: 3, // 每个景点最多关联3张图片
            select: {
              id: true,
              url: true,
              priority: true,
              isPrimary: true,
            },
          });

          if (images.length > 0) {
            // 这里我们只是记录关联的图片数量
            // 实际的图片关联可以在前端展示时实时查询
            associatedImages += images.length;
            processedSpotIds.add(spotRecord.id);
            console.log(`   ✅ 景点 "${spot.name}" 关联了 ${images.length} 张图片`);
          }
        }
      }

      console.log(`✅ 图片关联完成，共 ${associatedImages} 张图片`);

      return {
        associatedImages,
      };
    } catch (error: any) {
      console.error('❌ 关联景点图片失败:', error);
      return {
        associatedImages: 0,
      };
    }
  }

  /**
   * 处理 Agent 请求（性能优化版）
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const { question, userId } = request;

    console.log('🤖 收到 Agent 请求');
    console.log('   问题:', question);
    console.log('   userId:', userId);

    try {
      // 获取或创建 Agent 会话
      const session = await chatHistoryService.getOrCreateAgentSession(userId);
      console.log(`   会话ID: ${session.id}`);

      // 保存用户消息
      await chatHistoryService.createMessage({
        sessionId: session.id,
        role: 'user',
        content: question,
      });

      // ✅ P2优化: 减少历史消息数量（从 10 条减少到 5 条）
      const messageHistory = await chatHistoryService.getMessages({
        sessionId: session.id,
        limit: 5,
      });

      // 构建对话上下文
      const messages: any[] = [
        {
          role: 'system',
          content: await this.buildSystemPrompt(userId),
        },
      ];

      // 添加历史消息
      messageHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: question,
      });

      // 调用智谱 AI，启用工具调用
      console.log('\n📡 [调用智谱AI] 启用工具调用...');
      console.log('   用户问题:', question);
      console.log('   消息数量:', messages.length);
      
      const result = await this.callZhipuAI(
        messages,
        this.getTools(),
        'auto' // 让 AI 自动决定是否调用工具
      );

      console.log('\n✅ [智谱AI响应] 成功');
      console.log('   choices数量:', result.choices?.length);
      console.log('   finish_reason:', result.choices[0]?.finish_reason);
      
      // ✅ 调试: 输出完整的AI响应
      console.log('   完整响应:', JSON.stringify(result.choices[0], null, 2));

      const assistantMessage = result.choices[0]?.message;
      const answer = assistantMessage?.content || '';

      console.log('   assistant message content length:', answer.length);
      console.log('   tool_calls:', assistantMessage?.tool_calls?.length || 0);
      
      // ✅ 问题4: 详细输出工具调用信息
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('\n📋 [AI工具调用详情]:');
        assistantMessage.tool_calls.forEach((tc: any, index: number) => {
          console.log(`   工具${index + 1}: ${tc.function?.name || tc.type}`);
          console.log(`   ID: ${tc.id}`);
          console.log(`   参数: ${tc.function?.arguments || 'undefined'}`);
        });
      }

      let toolCallResults: any[] = [];

      // 检查是否有工具调用
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 检测到 ${assistantMessage.tool_calls.length} 个工具调用`);

        // 保存包含工具调用的 assistant 消息
        await chatHistoryService.createMessage({
          sessionId: session.id,
          role: 'assistant',
          content: answer,
          toolCall: JSON.stringify(assistantMessage.tool_calls),
        });

        // 执行所有工具调用
        for (const toolCall of assistantMessage.tool_calls) {
          const toolResult = await this.executeToolCall(toolCall, userId, messages, session.id);
          const toolName = (toolCall as any).function?.name || toolCall.type;
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
          
          // ✅ 自动触发第二个工具调用
          // 如果extract_must_visit_spots成功,自动调用create_trip_with_constraints
          console.log('\n🔍 [检查自动触发条件]');
          console.log('   工具名称:', toolName);
          console.log('   成功:', toolResult.success);
          console.log('   有data:', !!toolResult.data);
          console.log('   有mustVisitSpots:', !!toolResult.data?.mustVisitSpots);
          console.log('   mustVisitSpots长度:', toolResult.data?.mustVisitSpots?.length || 0);
          
          if (toolName === 'extract_must_visit_spots' && toolResult.success && toolResult.data?.mustVisitSpots?.length > 0) {
            console.log('\n🔗 自动触发create_trip_with_constraints工具...');
            
            // 从对话中提取参数
            const params = this.extractTripParamsFromMessages(messages, toolResult.data.mustVisitSpots);
            
            // 调用create_trip_with_constraints
            const createTripResult = await this.createTripWithConstraints(params, userId);
            
            toolCallResults.push({
              name: 'create_trip_with_constraints',
              result: createTripResult,
            });
            
            // 添加到消息历史
            messages.push({
              role: 'tool',
              tool_call_id: 'auto_create_trip',
              content: JSON.stringify(createTripResult),
            });
          } else {
            console.log('   ❌ 不满足自动触发条件');
          }
        }

        // ✅ P2优化: 直接返回工具结果，不再调用 AI 生成最终回复
        // 这样可以减少一次 AI 调用，提升性能
        const toolResult = toolCallResults[0]?.result;
        const finalAnswer = toolResult?.success
          ? toolResult?.data?.message || '操作成功'
          : toolResult?.error || '操作失败';

        // 保存最终回复
        await chatHistoryService.createMessage({
          sessionId: session.id,
          role: 'assistant',
          content: finalAnswer,
        });

        console.log('✅ Agent 处理完成（包含工具调用）');

        return {
          answer: finalAnswer,
          toolCalls: toolCallResults,
        };
      }

      // 没有工具调用，直接返回 AI 回复
      await chatHistoryService.createMessage({
        sessionId: session.id,
        role: 'assistant',
        content: answer,
      });

      console.log('✅ Agent 处理完成（无工具调用）');

      return {
        answer,
      };
    } catch (error: any) {
      console.error('❌ Agent 处理失败:', error);
      throw new Error(error.message || 'Agent 服务暂时不可用');
    }
  }

  /**
   * 解析用户偏好字符串，转换为类别数组
   */
  private parsePreferences(preferences: string | undefined): string[] {
    if (!preferences) {
      return [];
    }

    // 简单的关键词匹配
    const preferenceMap: Record<string, string> = {
      '历史': 'history',
      '文化': 'art',
      '艺术': 'art',
      '自然': 'nature',
      '风景': 'nature',
      '公园': 'nature',
      '美食': 'food',
      '购物': 'shopping',
      '城市': 'city',
      '海滩': 'beach',
      '海岛': 'beach',
      '冒险': 'adventure',
      '主题乐园': 'theme_park',
      '宗教': 'religious',
    };

    const categories: string[] = [];

    for (const [keyword, category] of Object.entries(preferenceMap)) {
      if (preferences.includes(keyword)) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['city', 'nature']; // 默认偏好
  }

  /**
   * 从位置字符串中解析纬度
   */
  private parseLatitude(location: string): number | null {
    try {
      const coords = location.split(',');
      if (coords.length === 2) {
        return parseFloat(coords[1].trim());
      }
    } catch (error) {
      console.warn('解析纬度失败:', location);
    }
    return null;
  }

  /**
   * 从位置字符串中解析经度
   */
  private parseLongitude(location: string): number | null {
    try {
      const coords = location.split(',');
      if (coords.length === 2) {
        return parseFloat(coords[0].trim());
      }
    } catch (error) {
      console.warn('解析经度失败:', location);
    }
    return null;
  }

  /**
   * ✅ P0优化: 智能参数补全 - 在工具执行前自动推断缺失参数
   */
  private async completeToolParams(
    toolName: string,
    params: any,
    messages: any[]
  ): Promise<any> {
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const completedParams = { ...params };

    console.log('\n🔧 [参数补全] 开始...');
    console.log('   工具名称:', toolName);
    console.log('   原始参数:', JSON.stringify(params));
    console.log('   用户消息:', userMessage);

    if (toolName === 'create_trip' || toolName === 'create_smart_trip' || toolName === 'create_trip_with_constraints') {
      // 1. 目的地推断
      if (!completedParams.destination) {
        completedParams.destination = this.inferDestination(userMessage);
        console.log('   ✅ 推断目的地:', completedParams.destination);
      }

      // 2. 日期推断
      if (!completedParams.startDate || !completedParams.endDate) {
        const dateInfo = this.inferDates(userMessage);
        if (!completedParams.startDate) {
          completedParams.startDate = dateInfo.startDate;
        }
        if (!completedParams.endDate) {
          completedParams.endDate = dateInfo.endDate;
        }
        console.log('   ✅ 推断日期:', completedParams.startDate, '至', completedParams.endDate);
      } else if (completedParams.startDate && !completedParams.endDate) {
        // 只有开始日期，推断结束日期
        const days = this.inferDays(userMessage);
        const startDate = parseDate(completedParams.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        completedParams.endDate = endDate.toISOString().split('T')[0];
        console.log('   ✅ 推断结束日期:', completedParams.endDate);
      }

      // 3. 预算推断
      if (!completedParams.budget) {
        completedParams.budget = this.inferBudget(userMessage);
        console.log('   ✅ 推断预算:', completedParams.budget);
      }

      // 4. 人数推断
      if (!completedParams.travelers && !completedParams.groupSize) {
        completedParams.travelers = this.inferTravelers(userMessage);
        console.log('   ✅ 推断人数:', completedParams.travelers);
      }

      // 5. 偏好推断
      if (!completedParams.preferences) {
        completedParams.preferences = this.inferPreferences(userMessage);
        console.log('   ✅ 推断偏好:', completedParams.preferences);
      }
    }

    console.log('   ✅ 补全后参数:', JSON.stringify(completedParams));
    return completedParams;
  }

  /**
   * 推断目的地
   */
  private inferDestination(message: string): string {
    const cityKeywords = [
      '北京', '上海', '广州', '深圳', '杭州', '成都',
      '西安', '武汉', '南京', '苏州', '重庆', '天津',
      '青岛', '大连', '厦门', '昆明', '三亚', '丽江',
      '长沙', '郑州', '济南', '福州', '南昌', '合肥'
    ];

    for (const city of cityKeywords) {
      if (message.includes(city)) {
        return city;
      }
    }

    // 如果找不到，返回默认值
    return '北京';
  }

  /**
   * 推断日期
   */
  private inferDates(message: string): { startDate: string; endDate: string } {
    const today = new Date();
    let startDate = new Date(today);
    let days = 3; // 默认 3 天

    // 检查相对日期
    if (message.includes('明天')) {
      startDate.setDate(startDate.getDate() + 1);
    } else if (message.includes('后天')) {
      startDate.setDate(startDate.getDate() + 2);
    } else if (message.includes('下周')) {
      // 计算下周的日期
      const weekDayMatch = message.match(/下周([一二三四五六日天])/);
      if (weekDayMatch) {
        const weekDays: Record<string, number> = {
          '一': 1, '二': 2, '三': 3, '四': 4,
          '五': 5, '六': 6, '日': 0, '天': 0
        };
        const targetDay = weekDays[weekDayMatch[1]];
        const currentDay = today.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        startDate.setDate(startDate.getDate() + daysUntil);
      }
    } else if (message.includes('下个月') || message.includes('下月')) {
      startDate.setMonth(startDate.getMonth() + 1);
    } else {
      // 检查具体日期
      const dateMatch = message.match(/(\d{1,2})月(\d{1,2})日/) ||
                       message.match(/(\d{4})[年-](\d{1,2})[月-](\d{1,2})/);
      if (dateMatch) {
        if (dateMatch.length === 3) {
          const month = parseInt(dateMatch[1]) - 1;
          const day = parseInt(dateMatch[2]);
          startDate = new Date(today.getFullYear(), month, day);
        } else if (dateMatch.length === 4) {
          startDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
        }
      } else {
        // 默认明天
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    // 推断天数
    days = this.inferDays(message);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  /**
   * 推断天数
   */
  private inferDays(message: string): number {
    if (message.includes('三天') || message.includes('3天')) return 3;
    if (message.includes('两天') || message.includes('2天') || message.includes('二天')) return 2;
    if (message.includes('四天') || message.includes('4天')) return 4;
    if (message.includes('五天') || message.includes('5天')) return 5;
    if (message.includes('一周') || message.includes('7天') || message.includes('七天')) return 7;
    if (message.includes('一天') || message.includes('1天')) return 1;

    // 检查数字
    const daysMatch = message.match(/(\d+)\s*天/);
    if (daysMatch) {
      return parseInt(daysMatch[1]);
    }

    return 3; // 默认 3 天
  }

  /**
   * 推断预算
   */
  private inferBudget(message: string): number {
    const budgetMatch = message.match(/预算[在约]?(\d+)/) ||
                       message.match(/(\d+)\s*元/) ||
                       message.match(/(\d+)\s*块/);

    if (budgetMatch) {
      return parseInt(budgetMatch[1]);
    }

    // 根据关键词推断
    if (message.includes('穷游') || message.includes('省钱') || message.includes('经济')) return 3000;
    if (message.includes('豪华') || message.includes('高端') || message.includes('奢侈')) return 15000;

    return 5000; // 默认 5000 元
  }

  /**
   * 推断人数
   */
  private inferTravelers(message: string): number {
    if (message.includes('一个人') || message.includes('独自') || message.includes('1人') || message.includes('自己')) return 1;
    if (message.includes('两个人') || message.includes('我和爱人') || message.includes('情侣') || message.includes('夫妻')) return 2;
    if (message.includes('全家') || message.includes('家庭') || message.includes('一家')) return 4;
    if (message.includes('朋友') || message.includes('闺蜜') || message.includes('哥们')) return 2;

    const travelersMatch = message.match(/(\d+)\s*人/);
    if (travelersMatch) {
      return parseInt(travelersMatch[1]);
    }

    return 2; // 默认 2 人
  }

  /**
   * 推断偏好
   */
  private inferPreferences(message: string): string {
    if (message.includes('历史') || message.includes('文化') || message.includes('故宫') || message.includes('博物馆')) return '历史文化';
    if (message.includes('自然') || message.includes('风景') || message.includes('山水') || message.includes('自然风光')) return '自然风光';
    if (message.includes('美食') || message.includes('吃货') || message.includes('吃')) return '美食之旅';
    if (message.includes('购物') || message.includes('逛街') || message.includes('买买买')) return '购物娱乐';
    if (message.includes('拍照') || message.includes('打卡') || message.includes('网红')) return '网红打卡';
    if (message.includes('休闲') || message.includes('放松') || message.includes('度假')) return '休闲度假';

    return '休闲观光'; // 默认偏好
  }

  /**
   * ✅ P0优化: 错误格式化 - 将技术错误转换为用户友好的提示
   */
  private formatError(error: any): string {
    console.error('❌ 原始错误:', error);

    let errorType: ErrorType;

    // 错误类型识别
    if (error.message?.includes('缺少必填参数') || error.message?.includes('缺少必要的信息')) {
      errorType = ErrorType.PARAM_MISSING;
    } else if (error.message?.includes('日期格式不正确') || error.message?.includes('日期解析失败')) {
      errorType = ErrorType.PARAM_INVALID;
    } else if (error.message?.includes('未找到景点') || error.message?.includes('景点不存在')) {
      errorType = ErrorType.SPOT_NOT_FOUND;
    } else if (error.message?.includes('行程不存在') || error.message?.includes('未找到该行程')) {
      errorType = ErrorType.TRIP_NOT_FOUND;
    } else if (error.message?.includes('只能为已完成的行程')) {
      errorType = ErrorType.TRIP_NOT_COMPLETED;
    } else if (error.message?.includes('AI服务未配置') || error.message?.includes('AI 服务暂时不可用')) {
      errorType = ErrorType.AI_SERVICE_UNAVAILABLE;
    } else if (error.message?.includes('AI 返回') || error.message?.includes('AI推荐失败')) {
      errorType = ErrorType.AI_RESPONSE_INVALID;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('网络')) {
      errorType = ErrorType.NETWORK_ERROR;
    } else if (error.message?.includes('数据库') || error.message?.includes('Prisma')) {
      errorType = ErrorType.DATABASE_ERROR;
    } else {
      errorType = ErrorType.UNKNOWN_ERROR;
    }

    const formattedError = ERROR_MESSAGES[errorType];

    // 记录详细错误日志
    console.error(`   错误类型: ${errorType}`);
    console.error(`   用户提示: ${formattedError.message}`);
    console.error(`   恢复建议: ${formattedError.suggestion}`);
    console.error(`   技术细节: ${error.message || error}`);

    // 返回用户友好的错误信息
    return `${formattedError.message}\n\n💡 建议：${formattedError.suggestion}`;
  }

  /**
   * 确认保存行程
   */
  async confirmTrip(sessionId: string, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('\n✅ [确认保存行程]');
      console.log('   会话ID:', sessionId);

      // 获取会话临时数据
      const session = await chatHistoryService.getSession(sessionId);
      if (!session || !session.tempData) {
        return {
          success: false,
          error: '未找到行程预览数据，请重新生成',
        };
      }

      // tempData 可能是字符串或对象
      const tempData = typeof session.tempData === 'string' 
        ? JSON.parse(session.tempData) 
        : session.tempData;
        
      if (tempData.type !== 'trip_draft') {
        return {
          success: false,
          error: '临时数据类型不正确',
        };
      }

      // 从 temp 数据中直接保存到数据库
      const previewData = tempData.data;
      console.log('   📝 从临时数据保存行程...');

      // 创建行程
      const trip = await prisma.trip.create({
        data: {
          userId: userId || 'default-user',
          title: previewData.title,
          description: previewData.description,
          destination: previewData.destination,
          startDate: new Date(previewData.startDate),
          endDate: new Date(previewData.endDate),
          totalBudget: previewData.budget,
          status: 'planning',
          aiGenerated: true,
        },
      });

      // 创建每日行程
      for (const dayPlan of previewData.dailyPlans) {
        const day = await prisma.day.create({
          data: {
            tripId: trip.id,
            dayNumber: dayPlan.day,
            date: new Date(dayPlan.date),
          },
        });

        // 创建行程项
        for (const spot of dayPlan.spots) {
          await prisma.itineraryItem.create({
            data: {
              dayId: day.id,
              name: spot.name,
              type: 'attraction',
              category: spot.category || '景点',
              startTime: spot.startTime || undefined,
              endTime: spot.endTime || undefined,
              cost: spot.ticketPrice || 0,
            },
          });
        }
      }

      // 清除临时数据
      await chatHistoryService.clearSessionTempData(sessionId);

      console.log('   ✅ 行程保存成功:', trip.id);

      return {
        success: true,
        data: {
          tripId: trip.id,
          message: '行程已成功保存到"我的行程"中！',
        },
      };

    } catch (error: any) {
      console.error('❌ 确认保存失败:', error);
      return {
        success: false,
        error: error.message || '保存失败',
      };
    }
  }

  /**
   * 取消草稿
   */
  async cancelDraft(sessionId: string): Promise<ToolExecutionResult> {
    try {
      console.log('\n❌ [取消草稿]');
      console.log('   会话ID:', sessionId);

      // 清除临时数据
      await chatHistoryService.clearSessionTempData(sessionId);

      console.log('   ✅ 草稿已取消');

      return {
        success: true,
        data: {
          message: '已取消保存',
        },
      };

    } catch (error: any) {
      console.error('❌ 取消失败:', error);
      return {
        success: false,
        error: error.message || '取消失败',
      };
    }
  }

  /**
   * 保存行程到数据库
   */
  private async saveTripToDatabase(previewData: any, userId?: string): Promise<any> {
    try {
      console.log('   💾 保存行程到数据库...');

      // 创建行程
      const trip = await prisma.trip.create({
        data: {
          userId: userId || 'default-user',
          title: previewData.title,
          description: previewData.description,
          destination: previewData.destination,
          startDate: new Date(previewData.startDate),
          endDate: new Date(previewData.endDate),
          totalBudget: previewData.budget,
          status: 'planning',
          aiGenerated: true,
        },
      });

      // 创建每日行程
      for (const dayPlan of previewData.dailyPlans) {
        const day = await prisma.day.create({
          data: {
            tripId: trip.id,
            dayNumber: dayPlan.day,
            date: new Date(dayPlan.date),
          },
        });

        // 创建行程项
        for (let i = 0; i < dayPlan.spots.length; i++) {
          const spot = dayPlan.spots[i];
          await prisma.itineraryItem.create({
            data: {
              dayId: day.id,
              name: spot.name,
              type: 'attraction',
              category: spot.category || '景点',
              startTime: new Date(new Date(dayPlan.date).getTime() + (9 + i * 3) * 60 * 60 * 1000),
              endTime: new Date(new Date(dayPlan.date).getTime() + (12 + i * 3) * 60 * 60 * 1000),
              cost: spot.ticketPrice || 0,
            },
          });
        }
      }

      console.log('   ✅ 行程保存完成');
      return trip;

    } catch (error: any) {
      console.error('   ❌ 保存失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const agentService = new AgentService();
