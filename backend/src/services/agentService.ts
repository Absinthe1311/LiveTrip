// Agent 服务 - 实现 Function Calling 功能
import https from 'https';
import { chatHistoryService } from './chatHistoryService';
import { getPrismaClient } from '../lib/prisma';
import { parseDate, formatDate } from '../utils/dateParser';

const prisma = getPrismaClient();

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
}

/**
 * Agent 服务类
 */
class AgentService {
  /**
   * 调用智谱AI API（支持 Function Calling）
   */
  private async callZhipuAI(messages: any[], tools?: any[], toolChoice: any = 'auto'): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!ZHIPUAI_API_KEY) {
        reject(new Error('AI服务未配置'));
        return;
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

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            if (res.statusCode === 200) {
              resolve(json);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
            }
          } catch (e) {
            reject(new Error(`解析响应失败: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });

      req.write(jsonData);
      req.end();
    });
  }
  /**
   * 定义可用的工具
   */
  private getTools(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'create_trip',
          description: '创建一个新的旅行行程。当用户想要制定旅行计划、安排行程时使用此工具。',
          parameters: {
            type: 'object',
            properties: {
              destination: {
                type: 'string',
                description: '目的地城市名称，如"北京"、"上海"、"杭州"等',
              },
              startDate: {
                type: 'string',
                description: '开始日期，格式为 YYYY-MM-DD，如"2024-05-01"',
              },
              endDate: {
                type: 'string',
                description: '结束日期，格式为 YYYY-MM-DD，如"2024-05-03"',
              },
              budget: {
                type: 'number',
                description: '预算金额（元），如 5000',
              },
              preferences: {
                type: 'string',
                description: '旅行偏好，如"喜欢历史文化"、"喜欢自然风光"、"美食之旅"等',
              },
              travelers: {
                type: 'number',
                description: '旅行人数，默认为 1',
              },
            },
            required: ['destination', 'startDate', 'endDate'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_user_trips',
          description: '获取用户的所有行程列表。当用户想要查看自己的行程、询问有哪些行程时使用此工具。',
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
      {
        type: 'function',
        function: {
          name: 'generate_blog',
          description: '为已完成的行程生成旅行博客。当用户想要为某次旅行写游记、生成博客内容时使用此工具。',
          parameters: {
            type: 'object',
            properties: {
              tripId: {
                type: 'string',
                description: '行程 ID，用于指定要生成博客的行程',
              },
              title: {
                type: 'string',
                description: '博客标题，如"北京三日游游记"、"西湖春游记"等',
              },
              style: {
                type: 'string',
                description: '博客风格，如"详细记录"、"简洁总结"、"情感抒情"等',
              },
            },
            required: ['tripId'],
          },
        },
      },
    ];
  }

  /**
   * 构建 Agent 系统提示词
   */
  private buildSystemPrompt(): string {
    return `
你是一位智能旅行助手 Agent，可以帮助用户通过对话完成旅行相关的任务。

【你的能力】
✅ 创建旅行行程：通过对话了解用户需求，调用工具创建行程
✅ 查看用户行程：获取用户的所有行程信息
✅ 生成旅行博客：为已完成的旅行生成游记内容

【工作流程】
1. 理解用户的意图和需求
2. 根据需求判断是否需要调用工具
3. 如果需要，调用相应的工具并获取结果
4. 基于工具结果，向用户提供友好的回复和建议

【注意事项】
- 用户可以使用相对日期（如"明天"、"下周三"），你需要根据当前日期计算具体日期
- 在调用工具前，如果缺少必要参数，先询问用户
- 工具调用结果可能包含错误信息，需要向用户说明
- 对于复杂的旅行需求，可以分步骤引导用户完成
- 生成博客时，使用行程中的实际数据，创作生动有趣的内容

【对话风格】
- 友好、专业、耐心
- 主动引导用户提供必要信息
- 清晰说明每个操作的结果
- 在工具调用失败时，提供友好的错误提示和解决方案
`;
  }

  /**
   * 执行工具调用
   */
  private async executeToolCall(toolCall: any, userId?: string): Promise<ToolExecutionResult> {
    // 只处理 function 类型的工具调用
    if (toolCall.type !== 'function') {
      return {
        success: false,
        error: `不支持的工具类型: ${toolCall.type}`,
      };
    }

    const { name, arguments: args } = toolCall.function;

    try {
      console.log(`🔧 执行工具: ${name}`);
      console.log(`   参数: ${args}`);

      const params = JSON.parse(args);

      switch (name) {
        case 'create_trip':
          return await this.createTrip(params, userId);

        case 'list_user_trips':
          return await this.listUserTrips(params, userId);

        case 'generate_blog':
          return await this.generateBlog(params, userId);

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
   * 创建行程工具
   */
  private async createTrip(params: any, userId?: string): Promise<ToolExecutionResult> {
    try {
      console.log('📝 创建行程:', params);

      // 验证必填参数
      if (!params.destination || !params.startDate || !params.endDate) {
        return {
          success: false,
          error: '缺少必填参数：destination、startDate、endDate',
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

      // 验证日期有效性
      if (startDate >= endDate) {
        return {
          success: false,
          error: '开始日期必须早于结束日期',
        };
      }

      // 计算天数
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (daysDiff > 30) {
        return {
          success: false,
          error: '行程天数不能超过 30 天',
        };
      }

      // 如果没有 userId，使用默认用户或提示需要登录
      let tripUserId = userId;
      if (!tripUserId) {
        // 查找或创建一个默认用户用于测试
        const defaultUser = await prisma.user.findFirst({
          where: { username: 'default_user' },
        });

        if (defaultUser) {
          tripUserId = defaultUser.id;
        } else {
          return {
            success: false,
            error: '请先登录以创建行程',
          };
        }
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

      // 创建每天的行程（空行程，后续可以调用规划 API 填充）
      for (let i = 0; i < daysDiff; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + i);

        await prisma.day.create({
          data: {
            tripId: trip.id,
            dayNumber: i + 1,
            date: dayDate,
            notes: '',
          },
        });
      }

      console.log(`✅ 行程创建成功，ID: ${trip.id}`);

      return {
        success: true,
        data: {
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
          startDate: formatDate(trip.startDate),
          endDate: formatDate(trip.endDate),
          days: daysDiff,
          budget: trip.totalBudget,
          status: trip.status,
          message: '行程创建成功！您可以在行程详情中查看和编辑。',
        },
      };
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

        const blogContent = result.choices[0]?.message?.content || '';

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

        return {
          success: true,
          data: {
            id: blog.id,
            title: blog.title,
            status: blog.status,
            content: blogContent,
            message: '博客已生成并保存为草稿，您可以在编辑页面继续完善。',
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
   * 处理 Agent 请求
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const { question, userId } = request;

    console.log('🤖 收到 Agent 请求');
    console.log('   问题:', question);

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

      // 获取历史消息（最近 10 条）
      const messageHistory = await chatHistoryService.getMessages({
        sessionId: session.id,
        limit: 10,
      });

      // 构建对话上下文
      const messages: any[] = [
        {
          role: 'system',
          content: this.buildSystemPrompt(),
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
      const result = await this.callZhipuAI(
        messages,
        this.getTools(),
        'auto' // 让 AI 自动决定是否调用工具
      );

      const assistantMessage = result.choices[0]?.message;
      const answer = assistantMessage?.content || '';

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
          const toolResult = await this.executeToolCall(toolCall, userId);
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
        }

        // 再次调用 AI，基于工具结果生成最终回复
        const finalResult = await this.callZhipuAI(messages);

        const finalAnswer = finalResult.choices[0]?.message?.content || '';

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
}

// 导出单例
export const agentService = new AgentService();
