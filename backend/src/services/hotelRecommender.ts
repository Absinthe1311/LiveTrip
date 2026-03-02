// 酒店推荐服务 - 基于行程景点位置和用户预算推荐酒店
import { amapService, AmapAttraction } from './amapService';

// 酒店信息接口
export interface Hotel {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;           // 酒店类型/档次
  rating?: number;        // 高德评分
  avgDistance: number;    // 到各天景点的平均距离（km）
  distanceDetails: number[]; // 到每天景点的平均距离明细
}

// 酒店推荐请求参数
export interface HotelRecommendRequest {
  spots: Array<{
    name: string;
    location: string;
  }>;
  budget: number;
}

// 酒店档次类型
type HotelTier = 'economy' | 'comfort' | 'luxury';

class HotelRecommender {
  /**
   * 获取酒店推荐
   * @param spots 行程中所有景点的坐标信息
   * @param budget 用户预算
   * @returns 推荐的酒店列表（3-5个）
   */
  async getHotelRecommendations(
    spots: Array<{ name: string; location: string }>,
    budget: number
  ): Promise<Hotel[]> {
    try {
      console.log('🏨 开始酒店推荐...');
      console.log(`   景点数量: ${spots.length}`);
      console.log(`   用户预算: ${budget}元`);

      if (spots.length === 0) {
        console.warn('⚠️  没有景点数据，无法推荐酒店');
        return [];
      }

      // 步骤1: 计算所有景点的地理重心
      const centerPoint = this.calculateCenterPoint(spots);
      console.log(`📍 景点地理重心: ${centerPoint}`);

      // 步骤2: 根据预算确定酒店档次
      const hotelTier = this.getHotelTierByBudget(budget);
      console.log(`💰 酒店档次: ${hotelTier}`);

      // 步骤3: 调用高德API搜索周边酒店
      const amapServiceInstance = amapService();
      const hotels = await amapServiceInstance.searchAround(
        centerPoint,
        '酒店',
        '100101', // 住宿服务 - 酒店
        5000,     // 5公里半径
        30        // 获取30个候选
      );

      if (hotels.length === 0) {
        console.warn('⚠️  未搜索到周边酒店');
        return [];
      }

      console.log(`✅ 搜索到 ${hotels.length} 个酒店`);

      // 步骤4: 根据档次过滤酒店
      const filteredHotels = this.filterHotelsByTier(hotels, hotelTier);
      console.log(`✅ 档次过滤后剩余 ${filteredHotels.length} 个酒店`);

      // 步骤5: 计算每个酒店到各天景点的平均距离
      const hotelsWithDistance = filteredHotels.map(hotel => {
        const { avgDistance, distanceDetails } = this.calculateAvgDistance(hotel, spots);
        return {
          name: hotel.name,
          address: hotel.address,
          location: hotel.location,
          tel: hotel.tel,
          type: this.mapHotelType(hotel.type),
          rating: hotel.rating,
          avgDistance,
          distanceDetails,
        };
      });

      // 步骤6: 综合评分排序（距离评分 + 高德评分）
      const sortedHotels = this.sortHotels(hotelsWithDistance);

      // 步骤7: 返回3个推荐
      const recommendations = sortedHotels.slice(0, Math.min(3, sortedHotels.length));
      console.log(`✅ 返回 ${recommendations.length} 个酒店推荐`);

      return recommendations;
    } catch (error) {
      console.error('❌ 酒店推荐失败:', error);
      throw error;
    }
  }

  /**
   * 计算所有景点的地理重心
   * @param spots 景点列表
   * @returns 重心坐标 "lng,lat"
   */
  private calculateCenterPoint(
    spots: Array<{ name: string; location: string }>
  ): string {
    let sumLng = 0;
    let sumLat = 0;

    for (const spot of spots) {
      const [lng, lat] = spot.location.split(',').map(Number);
      sumLng += lng;
      sumLat += lat;
    }

    const avgLng = sumLng / spots.length;
    const avgLat = sumLat / spots.length;

    return `${avgLng.toFixed(6)},${avgLat.toFixed(6)}`;
  }

  /**
   * 根据预算确定酒店档次
   * @param budget 用户预算
   * @returns 酒店档次
   */
  private getHotelTierByBudget(budget: number): HotelTier {
    // 根据预算划分档次
    // 假设住宿占总预算的40%，按3晚计算
    const accommodationBudget = budget * 0.4;
    const perNightBudget = accommodationBudget / 3;

    if (perNightBudget < 200) {
      return 'economy';   // 经济型：每晚200元以下
    } else if (perNightBudget < 500) {
      return 'comfort';   // 舒适型：每晚200-500元
    } else {
      return 'luxury';    // 豪华型：每晚500元以上
    }
  }

  /**
   * 根据档次过滤酒店
   * @param hotels 酒店列表
   * @param tier 档次
   * @returns 过滤后的酒店列表
   */
  private filterHotelsByTier(hotels: AmapAttraction[], tier: HotelTier): AmapAttraction[] {
    const tierKeywords: Record<HotelTier, string[]> = {
      economy: ['快捷', '经济', '如家', '7天', '汉庭', '锦江之星', '格林豪泰', '布丁', '速8', '怡莱', '酒店'],
      comfort: ['商务', '三星', '3星', '亚朵', '全季', '维也纳', '和颐', '桔子', '智选假日', '酒店'],
      luxury: ['四星', '4星', '五星', '5星', '豪华', '希尔顿', '万豪', '洲际', '凯悦', '香格里拉', '喜来登', '威斯汀', '酒店'],
    };

    const keywords = tierKeywords[tier];

    // 如果过滤后结果为空，则返回所有酒店（降级处理）
    const filtered = hotels.filter(hotel => {
      const hotelNameAndType = `${hotel.name} ${hotel.type}`;
      return keywords.some(keyword => hotelNameAndType.includes(keyword));
    });

    // 如果过滤后没有结果，返回原始列表的前10个
    if (filtered.length === 0) {
      console.log('⚠️  档次过滤后无结果，返回所有酒店');
      return hotels.slice(0, 10);
    }

    return filtered;
  }

  /**
   * 映射酒店类型为可读的档次名称
   * @param type 高德POI type字段
   * @returns 档次名称
   */
  private mapHotelType(type: string): string {
    if (type.includes('五星') || type.includes('5星') || type.includes('豪华')) {
      return '豪华型';
    } else if (type.includes('四星') || type.includes('4星')) {
      return '高档型';
    } else if (type.includes('三星') || type.includes('3星') || type.includes('商务')) {
      return '舒适型';
    } else if (type.includes('快捷') || type.includes('经济')) {
      return '经济型';
    } else {
      return '标准型';
    }
  }

  /**
   * 计算酒店到各天景点的平均距离
   * @param hotel 酒店
   * @param spots 景点列表
   * @returns 平均距离和距离明细
   */
  private calculateAvgDistance(
    hotel: AmapAttraction,
    spots: Array<{ name: string; location: string }>
  ): { avgDistance: number; distanceDetails: number[] } {
    const amapServiceInstance = amapService();
    const distances: number[] = [];

    for (const spot of spots) {
      const distance = amapServiceInstance.calculateDistance(hotel.location, spot.location);
      distances.push(distance);
    }

    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const roundedAvg = Math.round(avgDistance * 100) / 100;

    return { avgDistance: roundedAvg, distanceDetails: distances };
  }

  /**
   * 综合评分排序酒店
   * @param hotels 酒店列表
   * @returns 排序后的酒店列表
   */
  private sortHotels(hotels: Hotel[]): Hotel[] {
    return hotels.sort((a, b) => {
      // 计算综合评分
      // 距离评分（权重60%）：距离越近分数越高
      // 高德评分（权重40%）：评分越高分数越高

      const maxDistance = Math.max(...hotels.map(h => h.avgDistance));
      const minDistance = Math.min(...hotels.map(h => h.avgDistance));
      const distanceRange = maxDistance - minDistance || 1;

      // 距离评分（归一化到0-100，距离越近分数越高）
      const distanceScoreA = (1 - (a.avgDistance - minDistance) / distanceRange) * 60;
      const distanceScoreB = (1 - (b.avgDistance - minDistance) / distanceRange) * 60;

      // 高德评分（归一化到0-100）
      const ratingScoreA = (a.rating || 3.5) / 5 * 40;
      const ratingScoreB = (b.rating || 3.5) / 5 * 40;

      const totalScoreA = distanceScoreA + ratingScoreA;
      const totalScoreB = distanceScoreB + ratingScoreB;

      return totalScoreB - totalScoreA; // 降序
    });
  }
}

// 导出单例
export const hotelRecommender = new HotelRecommender();
