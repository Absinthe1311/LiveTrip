import { getIot } from '../api/client';
import { getAlternativeSpotsByName } from '../data/alternativeSpots';
import type { AttractionItem } from '../api/client';

// IoT数据接口
interface IoTData {
  id: string;
  name: string;
  crowdLevel: number;
  temperature: number;
  rainProbability: number;
  isOpen: boolean;
}

/**
 * 备选景点推荐服务
 * 基于IoT数据、景点相似度、距离等因素推荐备选景点
 */
export class AlternativeRecommender {
  /**
   * 获取备选景点推荐
   * @param originalAttraction 原景点
   * @param iotData IoT数据
   * @param city 城市名称（可选）
   * @param excludeSpotNames 需要排除的景点名称列表（如行程中的景点）
   * @returns 排序后的备选景点列表
   */
  public async getRecommendations(
    originalAttraction: AttractionItem,
    iotData: IoTData[],
    city?: string,
    excludeSpotNames: string[] = []
  ): Promise<Array<any>> {
    console.log('🔍 获取备选景点推荐:', originalAttraction.name);
    console.log('   原景点时间:', originalAttraction.time);

    // 如果没有提供城市信息，尝试从行程中提取
    if (!city) {
      city = this.extractCityFromItinerary(originalAttraction) || undefined;
      console.log('   提取的城市:', city || '未提取到');
    }

    if (!city) {
      console.warn('⚠️  无法提取城市信息，使用默认值');
      return this.getFallbackRecommendations(originalAttraction, iotData);
    }

    try {
      // 调用后端API获取备选景点
      const response = await getIot(originalAttraction.name, city, excludeSpotNames);

      if (response.success && response.data) {
        console.log(`✅ 从API获取到 ${response.data.length} 个备选景点`);
        // 后端已经处理了IoT数据和排序，直接返回
        return response.data;
      } else {
        console.warn('⚠️  API返回失败，使用fallback方案');
        return this.getFallbackRecommendations(originalAttraction, iotData);
      }
    } catch (error: any) {
      console.error('❌ 获取备选景点失败:', error);
      console.log('🔄 使用fallback方案');
      return this.getFallbackRecommendations(originalAttraction, iotData);
    }
  }

  /**
   * Fallback方案：当API调用失败时使用
   */
  private getFallbackRecommendations(
    originalAttraction: AttractionItem,
    iotData: IoTData[]
  ): Promise<Array<any>> {
    console.log('🔄 使用fallback方案获取备选景点');

    // 使用景点名称查找备选景点（解决替换后无法再次查找的问题）
    const alternatives: any[] = getAlternativeSpotsByName();

    if (alternatives.length === 0) {
      console.warn('⚠️ 未找到该景点的备选景点');
      return Promise.resolve([]);
    }

    console.log(`✅ 找到 ${alternatives.length} 个备选景点`);

    // 为每个备选景点评分并添加模拟IoT数据
    const scoredAlternatives = alternatives.map((alternative) => {
      const alternativeIoTData = iotData.find((spot) => spot.name === alternative.name);

      // 如果没有IoT数据，生成模拟数据
      const simulatedIoTData = alternativeIoTData || {
        id: alternative.id,
        name: alternative.name,
        crowdLevel: Math.floor(Math.random() * 50) + 20, // 20-70%
        temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
        rainProbability: Math.floor(Math.random() * 30), // 0-30%
        isOpen: true,
      };

      return Object.assign({}, alternative, {
        iotData: simulatedIoTData,
      });
    });

    // 根据IoT数据筛选和排序
    const filteredAlternatives = scoredAlternatives.filter((alt) => {
      if (!alt.iotData) return true; // 如果没有IoT数据，默认保留

      const { rainProbability, crowdLevel, isOpen } = alt.iotData;

      // 排除严重问题的景点
      if (rainProbability > 80) return false; // 暴雨
      if (crowdLevel > 90) return false; // 极度拥挤
      if (!isOpen) return false; // 已关闭

      return true;
    });

    // 按IoT数据质量排序（优先推荐天气好、人流适中、正常开放的景点）
    const sortedAlternatives = filteredAlternatives.sort((a, b) => {
      const scoreA = this.calculateIoTScore(a.iotData);
      const scoreB = this.calculateIoTScore(b.iotData);
      return scoreB - scoreA; // 降序
    });

    // 只返回前5个最佳备选
    return Promise.resolve(sortedAlternatives.slice(0, 5));
  }

  /**
   * 从行程中提取城市信息
   * @param attraction 景点
   * @returns 城市名称
   */
  private extractCityFromItinerary(attraction: AttractionItem): string | null {
    // 这里需要从全局行程数据中获取城市信息
    // 由于当前架构限制，暂时返回 null
    // TODO: 需要修改架构，将城市信息传递到备选景点推荐服务

    // 临时方案：从localStorage中获取当前行程的目的地
    try {
      const currentItinerary = localStorage.getItem('currentItinerary');
      if (currentItinerary) {
        const itinerary = JSON.parse(currentItinerary);
        if (itinerary.data && itinerary.data.summary) {
          return itinerary.data.summary.destination;
        }
      }
    } catch (error) {
      console.error('❌ 提取城市信息失败:', error);
    }

    return null;
  }

  /**
   * 计算IoT数据评分
   * @param iotData IoT数据
   * @returns 评分（0-100）
   */
  private calculateIoTScore(iotData?: any): number {
    if (!iotData) return 50; // 没有数据，给中等分数

    let score = 100;

    // 天气评分（权重：40%）
    if (iotData.rainProbability > 80) score -= 40;
    else if (iotData.rainProbability > 50) score -= 20;
    else if (iotData.rainProbability > 20) score -= 10;

    // 人流评分（权重：30%）
    if (iotData.crowdLevel > 90) score -= 30;
    else if (iotData.crowdLevel > 60) score -= 15;
    else if (iotData.crowdLevel > 40) score -= 5;

    // 开放状态评分（权重：30%）
    if (!iotData.isOpen) score -= 30;

    return Math.max(0, score);
  }

  /**
   * 检查景点是否适合游玩
   * @param iotData IoT数据
   * @returns 是否适合游玩
   */
  public isSuitableForVisit(iotData?: any): boolean {
    if (!iotData) return true;

    // 暴雨、极度拥挤、已关闭 - 不适合游玩
    if (iotData.rainProbability > 80) return false;
    if (iotData.crowdLevel > 90) return false;
    if (!iotData.isOpen) return false;

    return true;
  }

  /**
   * 获取景点健康度等级
   * @param iotData IoT数据
   * @returns 健康度等级
   */
  public getHealthLevel(iotData?: any): 'severe' | 'warning' | 'good' | 'info' {
    if (!iotData) return 'info';

    // 严重警告
    if (iotData.rainProbability > 80 || iotData.crowdLevel > 90 || !iotData.isOpen) {
      return 'severe';
    }

    // 注意提示
    if (iotData.rainProbability > 50 || iotData.crowdLevel > 60) {
      return 'warning';
    }

    // 友好提示
    if (iotData.rainProbability < 20 && iotData.crowdLevel < 40) {
      return 'good';
    }

    return 'info';
  }

  /**
   * 获取健康度对应的颜色
   * @param level 健康度等级
   * @returns 颜色
   */
  public getHealthColor(level: string): string {
    switch (level) {
      case 'severe':
        return 'red';
      case 'warning':
        return 'orange';
      case 'good':
        return 'green';
      default:
        return 'blue';
    }
  }

  /**
   * 获取健康度对应的图标
   * @param level 健康度等级
   * @returns 图标
   */
  public getHealthIcon(level: string): string {
    switch (level) {
      case 'severe':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'good':
        return '✅';
      default:
        return 'ℹ️';
    }
  }

  /**
   * 获取健康度对应的提示文案
   * @param level 健康度等级
   * @param iotData IoT数据
   * @returns 提示文案
   */
  public getHealthMessage(level: string, iotData?: any): string {
    if (!iotData) return '暂无数据';

    switch (level) {
      case 'severe':
        if (!iotData.isOpen) return '景点已关闭';
        if (iotData.rainProbability > 80) return `暴雨预警（降雨概率${iotData.rainProbability}%）`;
        if (iotData.crowdLevel > 90) return `极度拥挤（拥挤指数${iotData.crowdLevel}%）`;
        return '存在严重问题';

      case 'warning':
        if (iotData.rainProbability > 50) return `可能有雨（降雨概率${iotData.rainProbability}%）`;
        if (iotData.crowdLevel > 60) return `人流较多（拥挤指数${iotData.crowdLevel}%）`;
        return '需要注意';

      case 'good':
        return '适宜游玩';

      default:
        return '状况正常';
    }
  }
}

// 导出单例
export const alternativeRecommender = new AlternativeRecommender();
