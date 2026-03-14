// AI 推荐服务 - 使用智谱AI（ChatGLM）进行智能行程推荐
import { AmapAttraction, amapService } from './amapService';
import { ZhipuAI } from 'zhipuai';

// 推荐的景点项
export interface RecommendedAttraction {
  id?: string; // spotId
  name: string;
  time: string;
  location: string;
  estimated_cost: number;
  description: string;
  type?: string;
  address?: string;
}

// 每日行程
export interface DailyItinerary {
  day: number;
  date: string;
  attractions: RecommendedAttraction[];
  daily_cost: number;
}

// 完整行程
export interface FullItinerary {
  itinerary: DailyItinerary[];
  total_cost: number;
  budget_breakdown: {
    transportation: number;
    accommodation: number;
    dining: number;
    tickets: number;
  };
}

// AI 推荐请求参数
interface AIRecommendRequest {
  attractions: AmapAttraction[];
  destination: string;
  preferences: {
    interests?: string;
    pace?: string;
    energy_level?: string;
  };
  budget: number;
  days: number;
  groupSize: number;
  startDate: string;
  endDate: string;
}

class AIRecommender {
  private zhipuClient: ZhipuAI | null = null;
  private useProvider: 'zhipu' | 'fallback' = 'fallback';
  private model: string = 'glm-4';
  private initialized: boolean = false;

  constructor() {
    // 延迟初始化
  }

  private initialize() {
    if (this.initialized) return;

    // 使用智谱AI
    const zhipuApiKey = process.env.ZHIPUAI_API_KEY;
    if (zhipuApiKey) {
      try {
        this.zhipuClient = new ZhipuAI({ apiKey: zhipuApiKey });
        this.useProvider = 'zhipu';
        console.log('✅ 使用智谱AI（ChatGLM）服务');
      } catch (error) {
        console.warn('⚠️  智谱AI 初始化失败，将使用 fallback 规则引擎');
        this.useProvider = 'fallback';
      }
    } else {
      console.warn('⚠️  未配置 ZHIPUAI_API_KEY，将使用 fallback 规则引擎');
      this.useProvider = 'fallback';
    }

    this.initialized = true;
  }

  /**
   * 使用 AI 推荐行程
   */
  async recommendItinerary(request: AIRecommendRequest): Promise<FullItinerary> {
    // 初始化 AI 客户端
    this.initialize();

    const {
      attractions,
      destination,
      preferences,
      budget,
      days,
      groupSize,
      startDate,
      endDate,
    } = request;

    console.log(`🤖 开始使用 ${this.useProvider} 推荐行程...`);
    console.log(`   目的地: ${destination}`);
    console.log(`   天数: ${days}天`);
    console.log(`   预算: ${budget}元`);
    console.log(`   人数: ${groupSize}人`);
    console.log(`   偏好: ${preferences.interests || '无'}, ${preferences.pace || '适中'}, ${preferences.energy_level || '中等'}`);
    console.log(`   候选景点数: ${attractions.length}`);

    // 根据 provider 选择不同的推荐策略
    switch (this.useProvider) {
      case 'zhipu':
        return this.recommendWithZhipu(request);
      case 'fallback':
      default:
        return this.recommendWithFallback(request);
    }
  }

  /**
   * 使用智谱AI（ChatGLM）推荐行程
   */
  private async recommendWithZhipu(request: AIRecommendRequest): Promise<FullItinerary> {
    try {
      const prompt = this.buildPrompt(request);

      const result = await this.zhipuClient!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const text = result.choices[0]?.message?.content || '';

      // 提取 JSON（可能被包裹在代码块中）
      const jsonText = this.extractJSON(text);
      const itinerary = JSON.parse(jsonText) as FullItinerary;

      // 验证返回的数据格式
      this.validateItinerary(itinerary, request.days);

      console.log('✅ 智谱AI推荐完成');
      return itinerary;
    } catch (error) {
      console.error('❌ 智谱AI推荐失败:', error);
      console.log('🔄 降级使用 fallback 规则引擎');
      return this.recommendWithFallback(request);
    }
  }

  /**
   * 使用 fallback 规则引擎推荐行程（当 AI API 不可用时）
   */
  private recommendWithFallback(request: AIRecommendRequest): FullItinerary {
    console.log('📋 使用 fallback 规则引擎推荐行程');

    const { attractions, preferences, budget, days, groupSize, startDate } = request;

    // 根据偏好筛选景点
    const filteredAttractions = this.filterAttractionsByPreferences(attractions, preferences);

    // 按评分排序
    filteredAttractions.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // 分配到每一天
    const dailyAttractions = this.distributeAttractionsToDays(filteredAttractions, days);

    // 构建行程
    const itinerary: DailyItinerary[] = dailyAttractions.map((dayAttractions, index) => {
      const date = this.addDays(startDate, index);
      const attractionsWithTime = this.assignTimes(dayAttractions);

      const dailyCost = attractionsWithTime.reduce((sum, attr) => sum + attr.estimated_cost, 0);

      return {
        day: index + 1,
        date,
        attractions: attractionsWithTime,
        daily_cost: dailyCost,
      };
    });

    const totalCost = itinerary.reduce((sum, day) => sum + day.daily_cost, 0);

    // 预算分配估算
    const budgetBreakdown = {
      transportation: Math.round(budget * 0.2),
      accommodation: Math.round(budget * 0.4),
      dining: Math.round(budget * 0.25),
      tickets: Math.round(budget * 0.15),
    };

    console.log('✅ Fallback 推荐完成');
    return {
      itinerary,
      total_cost: totalCost,
      budget_breakdown: budgetBreakdown,
    };
  }

  /**
   * 构建发送给 AI 的 prompt
   */
  private buildPrompt(request: AIRecommendRequest): string {
    const {
      attractions,
      destination,
      preferences,
      budget,
      days,
      groupSize,
      startDate,
      endDate,
    } = request;

    // 将景点列表格式化为 JSON
    const attractionsJSON = JSON.stringify(
      attractions.map((attr) => ({
        name: attr.name,
        location: attr.location,
        address: attr.address,
        type: attr.type,
        typecode: attr.typecode,
        rating: attr.rating,
        cost: attr.cost,
      }))
    );

    return `你是一个专业的旅行规划师。请根据以下信息推荐行程：

## 用户信息
- 目的地：${destination}
- 出行天数：${days}天
- 人数：${groupSize}人
- 预算：${budget}元
- 出行日期：${startDate} 至 ${endDate}
- 兴趣偏好：${preferences.interests || '无特别偏好'}
- 出行节奏：${preferences.pace || '适中'}
- 体力值：${preferences.energy_level || '中等'}

## 候选景点（从高德地图获取）
${attractionsJSON}

## 推荐要求
1. 每天安排 2-4 个景点
2. 优先选择符合"${preferences.interests || '无特别偏好'}"偏好的景点
3. 估算每个景点的费用（门票+餐饮），参考景点提供的 cost 信息
4. 总费用不超过 ${budget} 元
5. 每天的景点地理位置尽量接近，减少交通时间
6. 合理安排游览时间，避免过于紧张或松散
7. 为每天分配合理的日期

## 【重要】必须以 JSON 格式返回，格式如下：
\`\`\`json
{
  "itinerary": [
    {
      "day": 1,
      "date": "2026-03-15",
      "attractions": [
        {
          "name": "故宫博物院",
          "time": "09:00-12:00",
          "location": "116.397428,39.90923",
          "estimated_cost": 60,
          "description": "明清两代皇宫，世界文化遗产"
        }
      ],
      "daily_cost": 300
    }
  ],
  "total_cost": 900,
  "budget_breakdown": {
    "transportation": 200,
    "accommodation": 600,
    "dining": 500,
    "tickets": 300
  }
}
\`\`\`

【不要输出任何解释，只输出 JSON】`;
  }

  /**
   * 从文本中提取 JSON（处理代码块包裹的情况）
   */
  private extractJSON(text: string): string {
    // 尝试匹配 ```json ... ``` 代码块
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // 尝试匹配 ``` ... ``` 代码块
    const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    // 如果没有代码块，尝试找到第一个 { 和最后一个 }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return text.substring(firstBrace, lastBrace + 1);
    }

    return text;
  }

  /**
   * 验证行程数据格式
   */
  private validateItinerary(itinerary: FullItinerary, expectedDays: number): void {
    if (!itinerary.itinerary || !Array.isArray(itinerary.itinerary)) {
      throw new Error('行程格式错误：缺少 itinerary 数组');
    }

    if (itinerary.itinerary.length !== expectedDays) {
      throw new Error(`行程天数错误：期望 ${expectedDays} 天，实际返回 ${itinerary.itinerary.length} 天`);
    }

    for (const day of itinerary.itinerary) {
      if (!day.day || !day.date || !day.attractions || !Array.isArray(day.attractions)) {
        throw new Error('每日行程格式错误');
      }

      for (const attr of day.attractions) {
        if (!attr.name || !attr.time || !attr.location || typeof attr.estimated_cost !== 'number') {
          throw new Error('景点信息格式错误');
        }
      }
    }
  }

  /**
   * 根据偏好筛选景点（fallback 使用）
   */
  private filterAttractionsByPreferences(
    attractions: AmapAttraction[],
    preferences: { interests?: string; pace?: string; energy_level?: string }
  ): AmapAttraction[] {
    const interests = preferences.interests || '';

    // 根据兴趣偏好筛选
    if (interests.includes('历史') || interests.includes('文化')) {
      // 优先选择博物馆、古迹等
      return attractions.filter((attr) =>
        attr.type.includes('博物馆') ||
        attr.type.includes('古迹') ||
        attr.type.includes('文化') ||
        attr.typecode.startsWith('11')
      );
    } else if (interests.includes('美食')) {
      // 优先选择餐厅
      return attractions.filter((attr) => attr.typecode.startsWith('05'));
    } else if (interests.includes('自然') || interests.includes('风景')) {
      // 优先选择风景名胜
      return attractions.filter((attr) =>
        attr.type.includes('公园') ||
        attr.type.includes('风景区') ||
        attr.typecode.startsWith('11')
      );
    }

    // 没有特殊偏好，返回所有景点
    return attractions;
  }

  /**
   * 将景点分配到每一天（fallback 使用）
   */
  private distributeAttractionsToDays(attractions: AmapAttraction[], days: number): AmapAttraction[][] {
    const result: AmapAttraction[][] = [];
    const maxAttractionsPerDay = 4; // 每天最多 4 个景点
    const minAttractionsPerDay = 2; // 每天最少 2 个景点

    // 计算可以分配的总景点数
    let totalAttractions = Math.min(attractions.length, days * maxAttractionsPerDay);

    // 计算每天应该分配的景点数
    const attractionsPerDay = Math.floor(totalAttractions / days);
    const remainder = totalAttractions % days;

    // 分配景点到每一天
    let startIndex = 0;
    for (let i = 0; i < days; i++) {
      const count = attractionsPerDay + (i < remainder ? 1 : 0);
      const end = Math.min(startIndex + count, attractions.length);
      result.push(attractions.slice(startIndex, end));
      startIndex = end;
    }

    return result;
  }

  /**
   * 为景点分配游览时间（fallback 使用）
   */
  private assignTimes(attractions: AmapAttraction[]): RecommendedAttraction[] {
    const result: RecommendedAttraction[] = [];
    let currentTime = 9 * 60; // 从 9:00 开始（分钟数）

    for (const attraction of attractions) {
      const duration = 120; // 默认每个景点游览 2 小时
      const endTime = currentTime + duration;

      result.push({
        id: (attraction as any).id, // 保留spotId
        name: attraction.name,
        time: `${this.minutesToTime(currentTime)}-${this.minutesToTime(endTime)}`,
        location: attraction.location,
        estimated_cost: this.estimateCost(attraction),
        description: attraction.type || '',
        type: attraction.type,
        address: attraction.address,
      });

      currentTime = endTime + 60; // 每个景点之间间隔 1 小时
    }

    return result;
  }

  /**
   * 估算景点费用（fallback 使用）
   */
  private estimateCost(attraction: AmapAttraction): number {
    // 如果有 cost 信息，尝试解析
    if (attraction.cost) {
      const match = attraction.cost.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // 根据类型估算
    if (attraction.typecode.startsWith('05')) {
      // 餐厅，人均 50-100 元
      return 75;
    } else if (attraction.typecode.startsWith('11')) {
      // 风景名胜，门票 30-100 元
      return 60;
    } else {
      // 其他景点，门票 20-50 元
      return 35;
    }
  }

  /**
   * 将分钟数转换为时间字符串
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * 日期加天数
   */
  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

// 导出工厂函数
export const getAIRecommender = (): AIRecommender => {
  return new AIRecommender();
};

// 向后兼容的单例导出（延迟初始化）
let aiRecommenderInstance: AIRecommender | null = null;
export const aiRecommender = (): AIRecommender => {
  if (!aiRecommenderInstance) {
    aiRecommenderInstance = new AIRecommender();
  }
  return aiRecommenderInstance;
};
