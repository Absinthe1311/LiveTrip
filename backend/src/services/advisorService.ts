// AI辅助生成：GLM-5, 2026-04-26 21:36
// 描述：将Advisor的API请求超时从15s增加到30s，适配glm-4.6v模型的响应速度。
// 旅行顾问服务 - 使用智谱AI（ChatGLM）提供旅行规划建议
import https from 'https';

import { getPrismaClient } from '../lib/prisma';
import { chatHistoryService } from './chatHistoryService';
import { httpsRequestWithRetry } from '../utils/retry';

const prisma = getPrismaClient();

// 顾问请求参数
export interface AdvisorRequest {
  question: string;
  planContext?: {
    origin?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    groupSize?: number;
    preferences?: string[];
  };
}

// 顾问响应
export interface AdvisorResponse {
  answer: string;
}

class AdvisorService {
  private apiKey: string;
  private apiUrl: string = 'open.bigmodel.cn';
  private apiPath: string = '/api/paas/v4/chat/completions';
  private model: string = 'glm-4.6v'; // 原模型: 'glm-4' (Token已耗尽，替换为GLM-4.6v)

  constructor() {
    this.apiKey = process.env.ZHIPUAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  未配置 ZHIPUAI_API_KEY');
    } else {
      console.log('✅ 智谱AI（ChatGLM）API Key 已配置');
    }
  }

  /**
   * 调用智谱AI API（带重试机制）
   */
  private async callZhipuAI(messages: any[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('AI服务未配置');
    }

    const data = JSON.stringify({
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const options = {
      hostname: this.apiUrl,
      port: 443,
      path: this.apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 30000,
    };

    // 使用重试机制调用 API
    return await httpsRequestWithRetry(options, data, 2);
  }

  /**
   * 判断是否需要获取景点数据
   */
  private needsSpotData(question: string): boolean {
    const keywords = ['景点', '推荐', '必去', '玩', '看', '参观', '游览'];
    return keywords.some((keyword) => question.includes(keyword));
  }

  /**
   * 从数据库获取景点数据
   */
  private async getSpotsFromDatabase(
    city: string,
    preferences?: string[],
    limit: number = 20
  ): Promise<any[]> {
    try {
      console.log(`🔍 从数据库获取 ${city} 的景点数据...`);

      // 构建查询条件
      const where: any = {
        city: city,
      };

      // 如果有偏好，优先匹配偏好的分类
      if (preferences && preferences.length > 0) {
        // 尝试匹配偏好分类
        const preferenceSpots = await prisma.spot.findMany({
          where: {
            city: city,
            category: {
              in: preferences,
            },
          },
          take: limit,
          orderBy: [{ rating: 'desc' }, { ticketPrice: 'asc' }],
          select: {
            name: true,
            category: true,
            rating: true,
            ticketPrice: true,
            address: true,
            description: true,
          },
        });

        console.log(`   找到 ${preferenceSpots.length} 个匹配偏好的景点`);

        // 如果匹配偏好的景点数量足够，直接返回
        if (preferenceSpots.length >= limit) {
          return preferenceSpots;
        }

        // 如果匹配偏好的景点不足，获取其他景点补充
        const remainingCount = limit - preferenceSpots.length;
        const otherSpots = await prisma.spot.findMany({
          where: {
            city: city,
            category: {
              notIn: preferences,
            },
          },
          take: remainingCount,
          orderBy: [{ rating: 'desc' }, { ticketPrice: 'asc' }],
          select: {
            name: true,
            category: true,
            rating: true,
            ticketPrice: true,
            address: true,
            description: true,
          },
        });

        console.log(`   补充获取 ${otherSpots.length} 个其他景点`);
        return [...preferenceSpots, ...otherSpots];
      }

      // 没有偏好，直接获取评分最高的景点
      const spots = await prisma.spot.findMany({
        where,
        take: limit,
        orderBy: [{ rating: 'desc' }, { ticketPrice: 'asc' }],
        select: {
          name: true,
          category: true,
          rating: true,
          ticketPrice: true,
          address: true,
          description: true,
        },
      });

      console.log(`   获取到 ${spots.length} 个景点`);
      return spots;
    } catch (error) {
      console.error('❌ 从数据库获取景点失败:', error);
      return [];
    }
  }

  /**
   * 格式化景点数据为提示词
   */
  private formatSpotsForPrompt(spots: any[]): string {
    if (spots.length === 0) {
      return '';
    }

    let formatted = '\n\n以下是该城市的主要景点信息：\n\n';

    spots.forEach((spot, index) => {
      formatted += `${index + 1}. ${spot.name}`;
      if (spot.category) {
        formatted += `（${spot.category}）`;
      }
      if (spot.rating) {
        formatted += ` - 评分: ${spot.rating}`;
      }
      if (spot.ticketPrice !== null && spot.ticketPrice !== undefined) {
        formatted += ` - 票价: ${spot.ticketPrice}元`;
      } else {
        formatted += ` - 票价: 免费`;
      }
      if (spot.description) {
        formatted += `\n   简介: ${spot.description}`;
      }
      formatted += '\n';
    });

    return formatted;
  }

  /**
   * 回答用户问题
   */
  async answerQuestion(request: AdvisorRequest, userId?: string): Promise<AdvisorResponse> {
    const { question, planContext } = request;

    console.log('🤖 收到顾问请求');
    console.log('   问题:', question);
    console.log('   规划信息:', JSON.stringify(planContext, null, 2));

    try {
      // 获取或创建对话会话
      const session = await chatHistoryService.getOrCreateAdvisorSession(userId);
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

      // 添加历史消息到上下文
      messageHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: this.buildUserPrompt(question, planContext),
      });

      // 判断是否需要获取景点数据
      if (this.needsSpotData(question) && planContext?.destination) {
        console.log('📝 检测到景点相关问题，从数据库获取景点数据...');

        // 从数据库获取景点数据
        const spots = await this.getSpotsFromDatabase(
          planContext.destination,
          planContext.preferences,
          20
        );

        if (spots.length > 0) {
          // 将景点数据添加到最后一条用户消息
          const spotsInfo = this.formatSpotsForPrompt(spots);
          messages[messages.length - 1].content += spotsInfo;
          console.log(`✅ 已添加 ${spots.length} 个景点信息到上下文`);
        } else {
          console.log('⚠️ 数据库中没有找到该城市的景点数据');
        }
      }

      const result = await this.callZhipuAI(messages);

      const answer = result.choices[0]?.message?.content || '抱歉，我暂时无法回答这个问题。';

      // 保存 AI 回复
      await chatHistoryService.createMessage({
        sessionId: session.id,
        role: 'assistant',
        content: answer,
      });

      console.log('✅ AI顾问回答完成');
      console.log('   回答:', answer);

      return { answer };
    } catch (error: any) {
      console.error('❌ AI顾问回答失败:', error);
      throw new Error(error.message || 'AI顾问服务暂时不可用');
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一位专业的旅行规划顾问，为 LiveTrip 智能旅行平台的用户提供旅行咨询服务。

【能力范围】
✅ 目的地介绍、景点推荐、最佳游览季节、当地文化习俗、注意事项
✅ 行程建议、景点组合、游览顺序、每天行程安排的合理性
✅ 预算参考、省钱技巧、费用分配建议
✅ 交通方式、住宿类型、餐饮方向建议
✅ 根据用户描述的兴趣推荐合适的目的地或景点类型

【边界约束】
❌ 不直接创建或修改任何行程数据
❌ 不访问用户的个人行程信息
❌ 不处理与旅行无关的问题，友好说明只能提供旅行相关帮助
❌ 不要主动询问用户是否需要帮忙修改表单，你的职责是建议而非操作
❌ 对于需要实时数据的问题（如今日天气、实时票价），说明你无法获取实时信息，并给出参考区间或建议用户查询官方渠道

【回答规范】
- 语气：亲切自然，像朋友之间的对话，避免过于正式或说教
- 长度：简洁为主，核心建议控制在 200 字以内，用户追问时再展开细节
- 格式：优先用自然语言表达，必要时使用简短的列表，避免大段堆砌
- 立场：给出明确的建议和倾向，不要模棱两可，用户需要的是决策支持而不是"各有优劣，看个人喜好"这类无效回答

【景点推荐要求（重要）】
当用户询问景点推荐时：
1. **必须给出具体的景点名称**，不要只说"有很多历史博物馆"
2. **基于提供的景点信息进行推荐**，不要编造不存在的景点
3. **推荐 3-5 个最合适的景点**，而不是列出所有景点
4. **说明推荐理由**，如"评分高"、"免费"、"符合您的兴趣"等
5. **如果用户有特定偏好**（如历史文化），优先推荐符合偏好的景点
6. **如果用户询问预算相关**，考虑景点的票价因素`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(question: string, planContext?: AdvisorRequest['planContext']): string {
    let prompt = `用户的问题：${question}`;

    if (planContext) {
      const contextInfo: string[] = [];

      if (planContext.origin) {
        contextInfo.push(`出发地：${planContext.origin}`);
      }
      if (planContext.destination) {
        contextInfo.push(`目的地：${planContext.destination}`);
      }
      if (planContext.startDate && planContext.endDate) {
        contextInfo.push(`出行日期：${planContext.startDate} 至 ${planContext.endDate}`);
      }
      if (planContext.budget) {
        contextInfo.push(`预算：${planContext.budget}元`);
      }
      if (planContext.groupSize) {
        contextInfo.push(`出行人数：${planContext.groupSize}人`);
      }
      if (planContext.preferences && planContext.preferences.length > 0) {
        contextInfo.push(`兴趣偏好：${planContext.preferences.join('、')}`);
      }

      if (contextInfo.length > 0) {
        prompt += `\n\n用户当前的规划信息：\n${contextInfo.join('\n')}`;
      }

      // 计算天数
      if (planContext.startDate && planContext.endDate) {
        const startDate = new Date(planContext.startDate);
        const endDate = new Date(planContext.endDate);
        const days =
          Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        prompt += `\n出行天数：${days}天`;
      }
    }

    return prompt;
  }
}

// 导出单例
export const advisorService = new AdvisorService();
