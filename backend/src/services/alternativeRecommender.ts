// 备选景点推荐服务 - 基于数据库和IoT数据推荐备选景点
import { spotService, Spot, SpotIoTData } from './spotService';

// 备选景点响应接口
export interface AlternativeSpot {
  id: string;
  amapId: string;
  name: string;
  location: string;
  address: string | null;
  city: string;
  category: string | null;
  ticketPrice: number | null;
  openTime: string | null;
  rating: number | null;
  description: string | null;
  isOutdoor: boolean | null;
  iotData?: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
    healthLevel: string;
  };
}

class AlternativeRecommender {
  /**
   * 获取备选景点推荐
   * @param originalSpotId 原景点ID
   * @param city 城市名称
   * @param excludeSpotIds 需要排除的景点ID列表（如行程中的景点）
   * @returns 备选景点列表
   */
  async getRecommendations(
    originalSpotId: string,
    city: string,
    excludeSpotIds: string[] = []
  ): Promise<AlternativeSpot[]> {
    try {
      console.log(`🔍 获取备选景点推荐: ${city}`);
      console.log(`   排除的景点: ${excludeSpotIds.length} 个`);

      // 1. 获取备选景点
      const alternatives = await spotService.getAlternativeSpots(originalSpotId, city, excludeSpotIds);

      if (alternatives.length === 0) {
        console.warn('⚠️  没有找到备选景点');
        return [];
      }

      console.log(`✅ 找到 ${alternatives.length} 个备选景点`);

      // 2. 获取IoT数据
      const spotIds = alternatives.map(s => s.id);
      const iotDataMap = await spotService.getBatchIoTData(spotIds);

      // 3. 组装返回数据
      const result: AlternativeSpot[] = alternatives.map(spot => {
        const iotData = iotDataMap.get(spot.id);
        return {
          id: spot.id,
          amapId: spot.amapId,
          name: spot.name,
          location: spot.location,
          address: spot.address,
          city: spot.city,
          category: spot.category,
          ticketPrice: spot.ticketPrice,
          openTime: spot.openTime,
          rating: spot.rating,
          description: spot.description,
          isOutdoor: spot.isOutdoor,
          image: (spot as any).image, // 添加图片URL
          iotData: iotData ? {
            crowdLevel: iotData.crowdLevel,
            temperature: iotData.temperature,
            rainProbability: iotData.rainProbability,
            isOpen: iotData.isOpen,
            // 添加健康度等级
            healthLevel: this.getHealthLevel(iotData)
          } : undefined,
          // 添加estimated_cost字段（与ticketPrice相同，用于前端显示）
          estimated_cost: spot.ticketPrice || 0,
        };
      });

      console.log(`✅ 返回 ${result.length} 个备选景点（带IoT数据）`);

      return result;
    } catch (error: any) {
      console.error('❌ 获取备选景点推荐失败:', error);
      throw error;
    }
  }

  /**
   * 获取健康度等级
   * @param iotData IoT数据
   * @returns 健康度等级
   */
  private getHealthLevel(iotData: any): string {
    const { rainProbability, crowdLevel, isOpen } = iotData;

    // 严重警告
    if (iotData.rainProbability > 80 ||
        iotData.crowdLevel > 90 ||
        !iotData.isOpen) {
      return 'severe';
    }

    // 注意提示
    if (iotData.rainProbability > 50 ||
        iotData.crowdLevel > 70) {
      return 'warning';
    }

    // 友好提示
    if (iotData.rainProbability < 20 && iotData.crowdLevel < 40) {
      return 'good';
    }

    return 'info';
  }
}

// 导出单例
export const alternativeRecommender = new AlternativeRecommender();
