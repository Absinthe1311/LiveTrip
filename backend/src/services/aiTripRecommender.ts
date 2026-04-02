// AI 推荐服务 - 使用智谱 AI 推荐行程（用于 AI 对话中的行程创建）
import https from 'https';
import { spotDataService, SpotWithIoT, SpotDataService as SpotDataServiceClass } from './spotDataService';
import { userProfileService, UserProfile } from './userProfileService';
import { httpsRequestWithRetry } from '../utils/retry';

export interface AiTripRecommendation {
  dailyPlans: {
    day: number;
    date: string;
    spots: {
      name: string;
      startTime: string;
      endTime: string;
      notes: string;
    }[];
  }[];
  summary: string;
  tips: string[];
}

export class AiTripRecommender {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'open.bigmodel.cn';

  constructor(
    private readonly spotDataSvc: SpotDataServiceClass = spotDataService(),
    private readonly userProfileSvc: typeof userProfileService = userProfileService
  ) {
    this.apiKey = process.env.ZHIPUAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  ZHIPUAI_API_KEY 未设置，AI 推荐功能可能无法正常工作');
    }
  }

  /**
   * 调用智谱 AI 推荐行程
   */
  async recommendTrip(params: {
    destination: string;
    days: number;
    preferences?: string[];
    budget?: number;
    mustVisitSpots?: string[];
    userId?: string;
  }): Promise<AiTripRecommendation> {
    console.log('\n🤖 开始使用 AI 推荐行程...');
    console.log(`   目的地: ${params.destination}`);
    console.log(`   天数: ${params.days}`);
    console.log(`   预算: ${params.budget || '未指定'}元`);
    console.log(`   偏好: ${params.preferences?.join(', ') || '无'}`);
    console.log(`   必选景点: ${params.mustVisitSpots?.join(', ') || '无'}`);

    try {
      // 1. 获取景点数据（包含 IoT 数据）
      console.log('\n步骤1: 获取景点数据...');
      const spots = await this.spotDataSvc.getCitySpotsWithIoTData(
        params.destination,
        100 // 获取更多景点供 AI 选择
      );
      console.log(`✅ 获取到 ${spots.length} 个景点`);

      if (spots.length === 0) {
        throw new Error(`未找到 ${params.destination} 的景点数据。可能原因：
1. 该城市名称不正确
2. 高德 API 没有返回该城市的景点数据
3. 网络连接问题

建议：
- 请确认城市名称是否正确（如"上海"、"北京"）
- 稍后重试
- 联系管理员检查高德 API 配置`);
      }

      // 2. 获取用户画像
      console.log('\n步骤2: 获取用户画像...');
      const userProfile = params.userId
        ? await this.userProfileSvc.getUserProfile(params.userId)
        : null;
      console.log(`✅ ${userProfile ? '获取到用户画像' : '无用户历史数据'}`);

      // 3. 构建 AI 提示词
      console.log('\n步骤3: 构建 AI 提示词...');
      const prompt = this.buildRecommendationPrompt(
        params,
        spots,
        userProfile
      );

      // 4. 调用智谱 AI
      console.log('\n步骤4: 调用智谱 AI...');
      const response = await this.callZhipuAI(prompt);
      console.log('✅ AI 响应成功');

      // 5. 解析 AI 返回的结果
      console.log('\n步骤5: 解析 AI 返回结果...');
      const result = this.parseAiResponse(response);
      console.log('✅ 行程推荐完成');

      return result;
    } catch (error: any) {
      console.error('❌ AI 推荐行程失败:', error.message);
      throw new Error(`AI 推荐行程失败: ${error.message}`);
    }
  }

  /**
   * 构建推荐提示词
   */
  private buildRecommendationPrompt(
    params: any,
    spots: SpotWithIoT[],
    userProfile: UserProfile | null
  ): string {
    const spotsInfo = this.spotDataSvc.formatSpotsForAI(spots);
    const userProfileInfo = userProfile
      ? this.userProfileSvc.formatProfileAsPrompt(userProfile)
      : '暂无用户历史数据';

    const mustVisitSpotsInfo = params.mustVisitSpots && params.mustVisitSpots.length > 0
      ? `必选景点：${params.mustVisitSpots.join('、')}`
      : '无必选景点';

    return `
你是一位专业的旅行规划师，请根据以下信息为用户规划一个${params.days}天的${params.destination}旅行行程。

【用户需求】
- 目的地：${params.destination}
- 行程天数：${params.days}天
- 预算：${params.budget || '未指定'}元
- 偏好：${params.preferences?.join('、') || '无特殊偏好'}
${mustVisitSpotsInfo}

【用户历史数据】
${userProfileInfo}

【可用景点列表】
${spotsInfo}

【要求】
1. 根据用户需求和 IoT 数据，合理安排每天的景点
2. 优先安排必选景点（如果有）
3. 考虑景点的拥挤程度、天气情况等 IoT 数据
4. 每天安排 2-4 个景点，避免过于紧凑
5. 考虑地理位置的合理性，相近的景点安排在同一天
6. 提供每个景点的游览时间建议（开始时间和结束时间）
7. 如果用户有历史偏好，尽量推荐符合偏好的景点
8. 优先选择热门景点和高评分景点

【输出格式】
请以 JSON 格式返回行程规划结果，格式如下：
\`\`\`json
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
\`\`\`

请严格按照以上 JSON 格式返回，不要添加其他内容。
`;
  }

  /**
   * 调用智谱 AI
   */
  private async callZhipuAI(prompt: string): Promise<any> {
    const options = {
      hostname: this.apiUrl,
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    };

    const data = JSON.stringify({
      model: 'glm-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return await httpsRequestWithRetry(options, data, 2);
  }

  /**
   * 解析 AI 返回的结果
   */
  private parseAiResponse(response: any): AiTripRecommendation {
    const content = response.choices[0]?.message?.content || '';

    console.log('AI 返回内容:', content);

    // 尝试提取 JSON
    let jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

    if (!jsonMatch) {
      // 如果没有 ```json 标记，尝试直接解析
      jsonMatch = content.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      throw new Error('AI 返回的格式不正确，无法解析 JSON');
    }

    try {
      const result = JSON.parse(jsonMatch[1]);

      // 验证结果格式
      if (!result.dailyPlans || !Array.isArray(result.dailyPlans)) {
        throw new Error('AI 返回的结果缺少 dailyPlans 字段');
      }

      if (!result.summary) {
        throw new Error('AI 返回的结果缺少 summary 字段');
      }

      if (!result.tips || !Array.isArray(result.tips)) {
        throw new Error('AI 返回的结果缺少 tips 字段');
      }

      return result as AiTripRecommendation;
    } catch (error: any) {
      console.error('解析 AI 返回结果失败:', error);
      console.error('原始内容:', content);
      throw new Error(`解析 AI 返回结果失败: ${error.message}`);
    }
  }
}

// 导出单例
let aiTripRecommenderInstance: AiTripRecommender | null = null;
export const aiTripRecommender = (): AiTripRecommender => {
  if (!aiTripRecommenderInstance) {
    aiTripRecommenderInstance = new AiTripRecommender();
  }
  return aiTripRecommenderInstance;
};
