// 行程调整服务 - 根据物联网数据和调整原因动态调整行程
import { RecommendedAttraction, DailyItinerary, FullItinerary } from './aiRecommender';
import { iotDataGenerator } from '../iot/iotDataGenerator';
import { getAlternativeSpots, filterAlternativeSpots, convertToItineraryAttraction } from '../data/alternativeSpots';

// 调整请求接口
export interface AdjustItineraryRequest {
  itinerary: FullItinerary;
  reason: 'crowd' | 'weather' | 'closed';
  targetAttractionId: string;
}

// 调整响应接口
export interface AdjustItineraryResponse {
  success: boolean;
  adjustedItinerary: FullItinerary;
  adjustments: Array<{
    day: number;
    originalAttraction: RecommendedAttraction;
    newAttraction: RecommendedAttraction;
    reason: string;
  }>;
  message: string;
}

// 景点 IoT 数据接口
interface SpotIoTData {
  id: string;
  name: string;
  crowdLevel: number;
  temperature: number;
  rainProbability: number;
  isOpen: boolean;
}

class ItineraryAdjustService {
  /**
   * 调整行程
   */
  public async adjustItinerary(request: AdjustItineraryRequest): Promise<AdjustItineraryResponse> {
    const { itinerary, reason, targetAttractionId } = request;

    console.log(`🔧 开始调整行程...`);
    console.log(`   调整原因: ${reason}`);
    console.log(`   目标景点ID: ${targetAttractionId}`);

    // 获取 IoT 数据
    const iotData = await iotDataGenerator.getIoTData();
    const spotsData = iotData.spots;

    // 查找目标景点在行程中的位置
    const targetDayIndex = await this.findAttractionInItinerary(itinerary, targetAttractionId);
    
    if (targetDayIndex === null) {
      throw new Error(`未找到景点ID: ${targetAttractionId}`);
    }

    const { dayIndex, attractionIndex } = targetDayIndex;
    const targetAttraction = itinerary.itinerary[dayIndex].attractions[attractionIndex];

    // 查找目标景点的 IoT 数据
    const targetSpotData = spotsData.find((spot) => spot.name === targetAttraction.name);
    
    if (!targetSpotData) {
      throw new Error(`未找到景点 ${targetAttraction.name} 的 IoT 数据`);
    }

    console.log(`   目标景点: ${targetAttraction.name}`);
    console.log(`   当前人流: ${targetSpotData.crowdLevel}%`);
    console.log(`   当前降雨概率: ${targetSpotData.rainProbability}%`);
    console.log(`   当前开放状态: ${targetSpotData.isOpen}`);

    // 根据调整原因选择策略
    let adjustmentReason = '';
    let newAttraction: RecommendedAttraction | null = null;

    switch (reason) {
      case 'crowd':
        // 人流 > 80% 时调整
        if (targetSpotData.crowdLevel <= 80) {
          adjustmentReason = `当前人流 ${targetSpotData.crowdLevel}% 不超过阈值，无需调整`;
        } else {
          newAttraction = this.adjustForCrowd(targetAttraction, targetSpotData, spotsData);
          adjustmentReason = `当前人流 ${targetSpotData.crowdLevel}% 超过阈值，已替换为人流较少的备选景点`;
        }
        break;

      case 'weather':
        // 降雨概率 > 70% 时调整
        if (targetSpotData.rainProbability <= 70) {
          adjustmentReason = `当前降雨概率 ${targetSpotData.rainProbability}% 不超过阈值，无需调整`;
        } else {
          newAttraction = this.adjustForWeather(targetAttraction, targetSpotData);
          adjustmentReason = `当前降雨概率 ${targetSpotData.rainProbability}% 超过阈值，已替换为室内景点`;
        }
        break;

      case 'closed':
        // 景点关闭时调整
        if (targetSpotData.isOpen) {
          adjustmentReason = `景点当前开放，无需调整`;
        } else {
          newAttraction = this.adjustForClosed(targetAttraction, targetSpotData);
          adjustmentReason = `景点当前关闭，已替换为备选景点`;
        }
        break;

      default:
        throw new Error(`未知的调整原因: ${reason}`);
    }

    // 如果需要调整
    if (newAttraction) {
      // 保留原景点的时间
      newAttraction.time = targetAttraction.time;

      // 更新行程
      itinerary.itinerary[dayIndex].attractions[attractionIndex] = newAttraction;

      console.log(`✅ 行程调整完成`);
      console.log(`   原景点: ${targetAttraction.name}`);
      console.log(`   新景点: ${newAttraction.name}`);
      console.log(`   调整原因: ${adjustmentReason}`);

      return {
        success: true,
        adjustedItinerary: itinerary,
        adjustments: [
          {
            day: dayIndex + 1,
            originalAttraction: targetAttraction,
            newAttraction,
            reason: adjustmentReason,
          },
        ],
        message: adjustmentReason,
      };
    } else {
      console.log(`ℹ️  无需调整`);
      console.log(`   原因: ${adjustmentReason}`);

      return {
        success: false,
        adjustedItinerary: itinerary,
        adjustments: [],
        message: adjustmentReason,
      };
    }
  }

  /**
   * 查找景点在行程中的位置
   */
  private async findAttractionInItinerary(
    itinerary: FullItinerary,
    attractionId: string
  ): Promise<{ dayIndex: number; attractionIndex: number } | null> {
    console.log(`   查找景点 ID: ${attractionId}`);

    // 首先通过 attractionId 获取 IoT 数据中的景点名称
    const iotData = await iotDataGenerator.getIoTData();
    const targetSpot = iotData.spots.find((s: any) => s.id === attractionId);

    if (!targetSpot) {
      console.warn(`⚠️  未找到 IoT 数据中的景点 ID: ${attractionId}`);
      console.warn(`   可用的景点 ID: ${iotData.spots.map((s: any) => s.id).join(', ')}`);
      return null;
    }

    console.log(`   目标景点名称: "${targetSpot.name}"`);

    // 然后在行程中通过名称匹配找到对应的景点
    console.log(`   行程中的景点数量: ${itinerary.itinerary.length} 天`);
    for (let dayIndex = 0; dayIndex < itinerary.itinerary.length; dayIndex++) {
      const day = itinerary.itinerary[dayIndex];
      console.log(`   第 ${dayIndex + 1} 天的景点数量: ${day.attractions.length}`);
      for (let attractionIndex = 0; attractionIndex < day.attractions.length; attractionIndex++) {
        const attraction = day.attractions[attractionIndex];
        console.log(`     检查景点: "${attraction.name}"`);

        // 使用精确匹配
        if (attraction.name === targetSpot.name) {
          console.log(`   ✅ 找到匹配的行程景点: "${attraction.name}"`);
          return { dayIndex, attractionIndex };
        }
      }
    }

    console.warn(`⚠️  未在行程中找到景点: "${targetSpot.name}"`);
    return null;
  }

  /**
   * 因人流过高而调整
   */
  private adjustForCrowd(
    targetAttraction: RecommendedAttraction,
    targetSpotData: SpotIoTData,
    allSpotsData: SpotIoTData[]
  ): RecommendedAttraction {
    console.log(`   策略: 人流过高 → 推荐备选景点（地理位置近的、同类型的）`);

    // 获取备选景点
    const alternatives = getAlternativeSpots(targetSpotData.id);

    if (alternatives.length === 0) {
      throw new Error(`没有找到 ${targetAttraction.name} 的备选景点`);
    }

    // 筛选人流较少的备选景点
    const lessCrowdedAlternatives = alternatives.filter((alt) => {
      const altSpotData = allSpotsData.find((spot) => spot.name === alt.name);
      return altSpotData && altSpotData.crowdLevel < 60; // 人流小于 60%
    });

    // 如果没有人流较少的备选景点，使用所有备选景点
    const candidates = lessCrowdedAlternatives.length > 0 ? lessCrowdedAlternatives : alternatives;

    // 计算距离，选择最近的
    const closest = this.findClosestAlternative(targetAttraction, candidates);

    return convertToItineraryAttraction(closest);
  }

  /**
   * 因天气原因而调整
   */
  private adjustForWeather(
    targetAttraction: RecommendedAttraction,
    targetSpotData: SpotIoTData
  ): RecommendedAttraction {
    console.log(`   策略: 降雨概率高 → 把户外景点替换为室内景点`);

    // 获取备选景点
    const alternatives = getAlternativeSpots(targetSpotData.id);

    if (alternatives.length === 0) {
      throw new Error(`没有找到 ${targetAttraction.name} 的备选景点`);
    }

    // 筛选室内景点
    const indoorAlternatives = alternatives.filter((alt) => !alt.isOutdoor);

    if (indoorAlternatives.length === 0) {
      console.log(`   警告: 没有找到室内备选景点，使用第一个备选景点`);
      return convertToItineraryAttraction(alternatives[0]);
    }

    // 选择第一个室内备选景点（也可以根据距离选择）
    return convertToItineraryAttraction(indoorAlternatives[0]);
  }

  /**
   * 因景点关闭而调整
   */
  private adjustForClosed(
    targetAttraction: RecommendedAttraction,
    targetSpotData: SpotIoTData
  ): RecommendedAttraction {
    console.log(`   策略: 景点关闭 → 直接替换为备选景点`);

    // 获取备选景点
    const alternatives = getAlternativeSpots(targetSpotData.id);

    if (alternatives.length === 0) {
      throw new Error(`没有找到 ${targetAttraction.name} 的备选景点`);
    }

    // 选择第一个备选景点（也可以根据距离选择）
    return convertToItineraryAttraction(alternatives[0]);
  }

  /**
   * 找到距离目标景点最近的备选景点
   */
  private findClosestAlternative(
    targetAttraction: RecommendedAttraction,
    alternatives: Array<{
      id: string;
      name: string;
      location: string;
      type: string;
      category: string;
      isOutdoor: boolean;
      description: string;
    }>
  ): typeof alternatives[0] {
    const targetLocation = this.parseLocation(targetAttraction.location);

    let closest = alternatives[0];
    let minDistance = Infinity;

    for (const alt of alternatives) {
      const altLocation = this.parseLocation(alt.location);
      const distance = this.calculateDistance(targetLocation, altLocation);

      if (distance < minDistance) {
        minDistance = distance;
        closest = alt;
      }
    }

    console.log(`   最近的备选景点: ${closest.name}（距离 ${minDistance.toFixed(2)} 公里）`);
    return closest;
  }

  /**
   * 解析经纬度字符串
   */
  private parseLocation(location: string): { lng: number; lat: number } {
    const parts = location.split(',');
    if (parts.length !== 2) {
      console.warn(`⚠️  无效的经纬度格式: ${location}`);
      return { lng: 0, lat: 0 };
    }

    const lng = parseFloat(parts[0].trim());
    const lat = parseFloat(parts[1].trim());

    if (isNaN(lng) || isNaN(lat)) {
      console.warn(`⚠️  无法解析经纬度: ${location}`);
      return { lng: 0, lat: 0 };
    }

    return { lng, lat };
  }

  /**
   * 计算两个经纬度之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  private calculateDistance(
    point1: { lng: number; lat: number },
    point2: { lng: number; lat: number }
  ): number {
    const R = 6371; // 地球半径（公里）

    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 保留两位小数
  }

  /**
   * 将角度转换为弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// 导出单例
export const itineraryAdjustService = new ItineraryAdjustService();
