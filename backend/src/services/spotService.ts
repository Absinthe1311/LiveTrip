// 景点数据服务 - 整合高德API和数据库缓存
import { getPrismaClient } from '../lib/prisma';

import { AmapAttraction, amapService } from './amapService';
import { deduplicateSpots } from '../utils/spotDeduplication';

const prisma = getPrismaClient();
const amapServiceInstance = amapService();

// 景点接口
export interface Spot {
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
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

// IoT数据接口
export interface SpotIoTData {
  id: string;
  spotId: string;
  crowdLevel: number;
  temperature: number;
  rainProbability: number;
  isOpen: boolean;
  generatedAt: Date;
  updatedAt: Date;
}

class SpotService {
  /**
   * 获取城市景点（带缓存）
   * @param city 城市名称
   * @param limit 限制数量，默认20
   * @returns 景点列表
   */
  async getCitySpots(city: string, limit: number = 20): Promise<Spot[]> {
    try {
      console.log(`🔍 获取 ${city} 的景点数据...`);

      // 1. 检查数据库缓存
      const cachedSpots = await this.getSpotsFromDatabase(city, limit);
      if (cachedSpots && cachedSpots.length > 0) {
        console.log(`✅ 从数据库获取到 ${cachedSpots.length} 个景点`);
        return cachedSpots;
      }

      console.log(`📡 数据库中没有 ${city} 的景点，调用高德API...`);

      // 2. 调用高德API
      const amapAttractions = await amapServiceInstance.getAttractions(
        city,
        '景点',
        undefined,
        limit
      );

      if (amapAttractions.length === 0) {
        console.warn(`⚠️  高德API没有返回 ${city} 的景点数据`);
        return [];
      }

      console.log(`✅ 从高德API获取到 ${amapAttractions.length} 个景点`);

      // 3. 去重处理
      const uniqueAttractions = deduplicateSpots(amapAttractions);
      console.log(`✅ 去重后剩余 ${uniqueAttractions.length} 个景点`);

      // 4. 转换并存储到数据库
      const spots = await this.saveSpotsToDatabase(uniqueAttractions, city);
      console.log(`💾 已存储 ${spots.length} 个景点到数据库`);

      // 5. 为每个景点生成IoT数据
      await this.generateIoTDataForSpots(spots);
      console.log(`💾 已生成并存储 ${spots.length} 个景点的IoT数据`);

      return spots;
    } catch (error: any) {
      console.error(`❌ 获取 ${city} 景点失败:`, error);
      throw error;
    }
  }

  /**
   * 从数据库获取景点
   * @param city 城市名称
   * @param limit 限制数量
   * @returns 景点列表
   */
  private async getSpotsFromDatabase(city: string, limit: number): Promise<Spot[]> {
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
      },
      include: {
        image: true, // ✅ 包含图片关系
      },
      take: limit,
      orderBy: {
        rating: 'desc', // 按评分排序
      },
    });

    return spots.map((spot) => ({
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
      source: spot.source,
      image: spot.image, // ✅ 包含图片关系
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
    }));
  }

  /**
   * 将高德景点数据存储到数据库
   * @param amapAttractions 高德景点数据
   * @param city 城市名称
   * @returns 存储的景点列表
   */
  private async saveSpotsToDatabase(
    amapAttractions: AmapAttraction[],
    city: string
  ): Promise<Spot[]> {
    const savedSpots: Spot[] = [];

    for (const attraction of amapAttractions) {
      try {
        // 解析价格
        let ticketPrice: number | null = null;
        if (attraction.cost) {
          const match = attraction.cost.match(/(\d+)/);
          if (match) {
            ticketPrice = parseFloat(match[1]);
          }
        }

        // 解析评分
        let rating: number | null = null;
        if (attraction.rating) {
          rating = attraction.rating;
        }

        // 判断是否为户外景点
        const isOutdoor = this.isOutdoorAttraction(attraction.type);

        // 使用 amapId 作为唯一标识
        const amapId = attraction.name + attraction.location;

        const spot = await prisma.spot.upsert({
          where: { amapId },
          update: {
            name: attraction.name,
            location: attraction.location,
            address: attraction.address,
            city: city,
            category: this.parseCategory(attraction.type),
            ticketPrice: ticketPrice,
            openTime: this.extractOpenTime(attraction.type),
            rating: rating,
            isOutdoor: isOutdoor,
            updatedAt: new Date(),
          },
          create: {
            amapId: amapId,
            name: attraction.name,
            location: attraction.location,
            address: attraction.address,
            city: city,
            category: this.parseCategory(attraction.type),
            ticketPrice: ticketPrice,
            openTime: this.extractOpenTime(attraction.type),
            rating: rating,
            description: attraction.type,
            isOutdoor: isOutdoor,
            source: 'amap',
          },
        });

        savedSpots.push({
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
          source: spot.source,
          createdAt: spot.createdAt,
          updatedAt: spot.updatedAt,
        });
      } catch (error) {
        console.error(`❌ 保存景点失败: ${attraction.name}`, error);
      }
    }

    return savedSpots;
  }

  /**
   * 为景点生成IoT数据
   * @param spots 景点列表
   */
  private async generateIoTDataForSpots(spots: Spot[]): Promise<void> {
    for (const spot of spots) {
      try {
        // 动态生成IoT数据（不依赖预定义列表）
        const iotData = this.generateDynamicIoTData(spot);

        if (iotData) {
          await prisma.spotIoTData.upsert({
            where: { spotId: spot.id },
            update: {
              crowdLevel: iotData.crowdLevel,
              temperature: iotData.temperature,
              rainProbability: iotData.rainProbability,
              isOpen: iotData.isOpen,
              updatedAt: new Date(),
            },
            create: {
              spotId: spot.id,
              crowdLevel: iotData.crowdLevel,
              temperature: iotData.temperature,
              rainProbability: iotData.rainProbability,
              isOpen: iotData.isOpen,
            },
          });
        }
      } catch (error) {
        console.error(`❌ 生成IoT数据失败: ${spot.name}`, error);
      }
    }
  }

  /**
   * 动态生成IoT数据（基于真实规律）
   * @param spot 景点
   * @returns IoT数据
   */
  private generateDynamicIoTData(spot: Spot): any {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // 计算基础人流（根据景点类型）
    const baseCrowd = this.getBaseCrowdByType(spot.category);

    // 时间因子
    const timeFactor = this.getTimeFactor(hour, day);

    // 季节因子
    const seasonFactor = this.getSeasonFactor(now);

    // 计算人流
    let crowdLevel = baseCrowd * timeFactor * seasonFactor;
    crowdLevel = Math.max(0, Math.min(100, crowdLevel + (Math.random() - 0.5) * 10));

    // 计算温度
    const baseTemp = this.getBaseTemperature(spot.city, now);
    const timeOfDayVariation = Math.sin(((hour - 6) * Math.PI) / 12) * 5;
    let temperature = baseTemp + timeOfDayVariation + (Math.random() - 0.5) * 4;
    temperature = Math.round(temperature * 10) / 10;

    // 计算降雨概率
    const baseRainProb = this.getBaseRainProbability(spot.city, now);
    let rainProbability = baseRainProb + (Math.random() - 0.5) * 20;
    rainProbability = Math.max(0, Math.min(100, rainProbability));

    // 判断是否开放
    const isOpen = this.checkIsOpen(spot.openTime, now);

    return {
      crowdLevel: Math.round(crowdLevel),
      temperature,
      rainProbability: Math.round(rainProbability),
      isOpen,
    };
  }

  /**
   * 根据类型获取基础人流
   */
  private getBaseCrowdByType(category: string | null): number {
    const crowdMap: Record<string, number> = {
      博物馆: 40,
      公园: 60,
      风景区: 70,
      广场: 50,
      寺庙: 35,
      古镇: 55,
      商业街: 65,
      主题乐园: 80,
      动物园: 75,
      水族馆: 60,
      美术馆: 30,
    };
    return crowdMap[category || ''] || 50;
  }

  /**
   * 时间因子
   */
  private getTimeFactor(hour: number, day: number): number {
    const isWeekend = day === 0 || day === 6;
    const weekendFactor = isWeekend ? 1.3 : 1.0;

    let timeOfDayFactor = 1.0;
    if (hour >= 9 && hour < 12) {
      timeOfDayFactor = 1.2;
    } else if (hour >= 14 && hour < 17) {
      timeOfDayFactor = 1.3;
    } else if (hour >= 18 && hour < 21) {
      timeOfDayFactor = 1.1;
    } else if (hour >= 0 && hour < 6) {
      timeOfDayFactor = 0.3;
    } else {
      timeOfDayFactor = 0.8;
    }

    return weekendFactor * timeOfDayFactor;
  }

  /**
   * 季节因子
   */
  private getSeasonFactor(date: Date): number {
    const month = date.getMonth() + 1;
    if ((month >= 3 && month <= 5) || (month >= 9 && month <= 11)) {
      return 1.2;
    }
    return 0.9;
  }

  /**
   * 获取基础温度
   */
  private getBaseTemperature(city: string, date: Date): number {
    const month = date.getMonth() + 1;
    const cityBaseTemp: Record<string, number> = {
      北京: 12,
      上海: 16,
      广州: 22,
      深圳: 23,
      成都: 16,
      杭州: 17,
      西安: 14,
      重庆: 18,
    };
    const base = cityBaseTemp[city] || 15;
    const seasonalAdjustment = Math.sin(((month - 1) * Math.PI) / 6) * 15;
    return base + seasonalAdjustment;
  }

  /**
   * 获取基础降雨概率
   */
  private getBaseRainProbability(city: string, date: Date): number {
    const month = date.getMonth() + 1;
    const cityRainProb: Record<string, Record<number, number>> = {
      北京: {
        1: 5,
        2: 8,
        3: 12,
        4: 18,
        5: 25,
        6: 35,
        7: 45,
        8: 40,
        9: 30,
        10: 20,
        11: 10,
        12: 5,
      },
      上海: {
        1: 15,
        2: 18,
        3: 20,
        4: 22,
        5: 25,
        6: 35,
        7: 40,
        8: 38,
        9: 30,
        10: 20,
        11: 15,
        12: 12,
      },
      广州: {
        1: 20,
        2: 25,
        3: 30,
        4: 35,
        5: 40,
        6: 50,
        7: 55,
        8: 50,
        9: 40,
        10: 30,
        11: 20,
        12: 15,
      },
    };
    return cityRainProb[city]?.[month] || 20;
  }

  /**
   * 检查是否开放
   */
  private checkIsOpen(openTime: string | null, currentTime: Date): boolean {
    if (!openTime || openTime === '全天开放') {
      return true;
    }
    const hour = currentTime.getHours();
    if (hour >= 22 || hour < 6) {
      return false;
    }
    return Math.random() > 0.05;
  }

  /**
   * 获取备选景点
   * @param originalSpotId 原景点ID
   * @param city 城市名称
   * @param excludeSpotIds 需要排除的景点ID列表（如行程中的景点）
   * @returns 备选景点列表
   */
  async getAlternativeSpots(
    originalSpotId: string,
    city: string,
    excludeSpotIds: string[] = []
  ): Promise<Spot[]> {
    try {
      console.log(`🔍 获取 ${city} 的备选景点，原景点ID: ${originalSpotId}`);
      console.log(`   排除的景点: ${excludeSpotIds.length} 个`);

      // 1. 检查是否已有备选关系
      const existingAlternatives = await prisma.spotAlternative.findMany({
        where: {
          originalSpotId: originalSpotId,
        },
        orderBy: {
          priority: 'asc',
        },
      });

      if (existingAlternatives.length > 0) {
        console.log(`✅ 找到 ${existingAlternatives.length} 个已存储的备选景点`);

        // 获取备选景点的详细信息（包含图片）
        const alternativeIds = existingAlternatives.map((a) => a.alternativeSpotId);
        const alternatives = await prisma.spot.findMany({
          where: {
            id: {
              in: alternativeIds,
            },
          },
          include: {
            image: {
              where: {
                status: 'approved',
              },
            },
          },
        });

        // 获取IoT数据
        const iotDataMap = await this.getIoTDataMap(alternativeIds);

        // 动态过滤：排除当前行程中的其他景点
        const filteredAlternatives = alternatives.filter(
          (spot) => !excludeSpotIds.includes(spot.id)
        );

        console.log(
          `   动态过滤后: ${filteredAlternatives.length} 个备选景点（排除了 ${alternatives.length - filteredAlternatives.length} 个行程中的景点）`
        );

        // 组装返回数据
        return filteredAlternatives.map((spot) => ({
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
          source: spot.source,
          createdAt: spot.createdAt,
          updatedAt: spot.updatedAt,
          image: spot.image ? spot.image.url : null, // 添加图片URL
        }));
      }

      // 2. 如果没有备选关系，生成新的备选关系
      console.log('📝 没有找到备选关系，开始生成...');
      await this.generateAlternativeRelations(originalSpotId, city, excludeSpotIds);

      // 3. 重新查询备选关系
      const newAlternatives = await prisma.spotAlternative.findMany({
        where: {
          originalSpotId: originalSpotId,
        },
        orderBy: {
          priority: 'asc',
        },
      });

      console.log(`✅ 生成了 ${newAlternatives.length} 个备选景点`);

      // 4. 获取备选景点的详细信息（包含图片）
      const alternativeIds = newAlternatives.map((a) => a.alternativeSpotId);
      const alternatives = await prisma.spot.findMany({
        where: {
          id: {
            in: alternativeIds,
          },
        },
        include: {
          image: {
            where: {
              status: 'approved',
            },
          },
        },
      });

      return alternatives.map((spot) => ({
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
        source: spot.source,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
        image: spot.image ? spot.image.url : null, // 添加图片URL
      }));
    } catch (error: any) {
      console.error(`❌ 获取备选景点失败:`, error);
      throw error;
    }
  }

  /**
   * 生成备选景点关系
   * @param originalSpotId 原景点ID
   * @param city 城市名称
   * @param excludeSpotIds 需要排除的景点ID列表（如行程中的景点）
   */
  private async generateAlternativeRelations(
    originalSpotId: string,
    city: string,
    excludeSpotIds: string[] = []
  ): Promise<void> {
    try {
      // 1. 获取同一城市的所有景点
      const allSpots = await this.getSpotsFromDatabase(city, 100);

      if (allSpots.length === 0) {
        console.warn(`⚠️  ${city} 没有景点数据`);
        return;
      }

      // 2. 排除原景点和需要排除的景点（行程中的景点）
      const candidates = allSpots.filter(
        (s) => s.id !== originalSpotId && !excludeSpotIds.includes(s.id)
      );

      if (candidates.length === 0) {
        console.warn('⚠️  没有可用的候选景点');
        return;
      }

      // 3. 获取IoT数据
      const spotIds = candidates.map((s) => s.id);
      const iotDataMap = await this.getIoTDataMap(spotIds);

      // 4. 评分所有候选景点（不筛选，保留所有）
      const scoredSpots = candidates.map((spot) => {
        const score = this.calculateScore(spot, iotDataMap.get(spot.id));
        const iotData = iotDataMap.get(spot.id);
        return {
          ...spot,
          score,
          iotData,
          healthLevel: iotData ? this.calculateHealthLevel(iotData) : 'info',
        };
      });

      // 5. 获取已作为备选的景点ID（避免重复推荐）
      const usedAlternativeIds = await this.getUsedAlternativeIds(
        city,
        originalSpotId,
        excludeSpotIds
      );

      // 6. 优先推荐健康度高的景点
      const healthySpots = scoredSpots.filter(
        (spot) => spot.healthLevel === 'good' || spot.healthLevel === 'info'
      );

      // 7. 从健康景点中排除已作为备选的景点
      const availableHealthySpots = healthySpots.filter(
        (spot) => !usedAlternativeIds.includes(spot.id)
      );

      // 8. 选择3-5个备选景点（增加备选数量，提升用户体验）
      const numAlternatives = Math.min(5, Math.max(3, Math.floor(candidates.length * 0.3)));
      let selectedAlternatives: any[] = [];

      if (availableHealthySpots.length >= numAlternatives) {
        // 有足够的健康备选景点
        const topSpots = availableHealthySpots
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, Math.min(10, availableHealthySpots.length));

        selectedAlternatives = this.shuffleArray(topSpots).slice(0, numAlternatives);
      } else if (availableHealthySpots.length > 0) {
        // 健康景点不足，混合健康景点和其他景点
        const allAvailableSpots = scoredSpots.filter(
          (spot) => !usedAlternativeIds.includes(spot.id)
        );

        const topSpots = allAvailableSpots
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, Math.min(10, allAvailableSpots.length));

        // 优先选择健康景点，然后补充其他景点
        selectedAlternatives = [
          ...availableHealthySpots.sort((a: any, b: any) => b.score - a.score).slice(0, 2),
          ...topSpots
            .filter((s) => !availableHealthySpots.includes(s))
            .slice(0, numAlternatives - availableHealthySpots.length),
        ];
      } else {
        // 没有健康景点，使用所有候选景点
        const allAvailableSpots = scoredSpots.filter(
          (spot) => !usedAlternativeIds.includes(spot.id)
        );

        if (allAvailableSpots.length > 0) {
          const topSpots = allAvailableSpots
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, Math.min(10, allAvailableSpots.length));

          selectedAlternatives = this.shuffleArray(topSpots).slice(0, numAlternatives);
        } else {
          // 兜底机制：推荐评分最高的景点（即使已被推荐）
          const topSpots = scoredSpots.sort((a, b) => b.score - a.score).slice(0, numAlternatives);

          selectedAlternatives = topSpots;
          console.log(`⚠️  使用兜底机制，推荐评分最高的景点`);
        }
      }

      console.log(`✅ 为景点 ${originalSpotId} 选择了 ${selectedAlternatives.length} 个备选景点`);

      // 9. 存储备选关系
      for (let i = 0; i < selectedAlternatives.length; i++) {
        const alternative = selectedAlternatives[i];
        await prisma.spotAlternative.create({
          data: {
            originalSpotId: originalSpotId,
            alternativeSpotId: alternative.id,
            city: city,
            priority: i + 1,
          },
        });
      }
    } catch (error: any) {
      console.error(`❌ 生成备选关系失败:`, error);
      throw error;
    }
  }

  /**
   * 计算健康度等级
   * @param iotData IoT数据
   * @returns 健康度等级
   */
  private calculateHealthLevel(iotData: any): 'severe' | 'warning' | 'good' | 'info' {
    const { rainProbability, crowdLevel, isOpen } = iotData;

    // 严重警告
    if (rainProbability > 80 || crowdLevel > 90 || !isOpen) {
      return 'severe';
    }

    // 注意提示
    if (rainProbability > 50 || crowdLevel > 70) {
      return 'warning';
    }

    // 友好提示
    if (rainProbability < 20 && crowdLevel < 40) {
      return 'good';
    }

    return 'info';
  }

  /**
   * 获取已作为备选的景点ID
   * @param city 城市名称
   * @param excludeOriginalSpotId 排除的原景点ID
   * @param excludeSpotIds 需要排除的景点ID列表（如行程中的景点）
   * @returns 已作为备选的景点ID列表
   */
  private async getUsedAlternativeIds(
    city: string,
    excludeOriginalSpotId: string,
    excludeSpotIds: string[] = []
  ): Promise<string[]> {
    try {
      // 查询该城市所有已存在的备选关系
      const allAlternatives = await prisma.spotAlternative.findMany({
        where: {
          city: city,
        },
        select: {
          alternativeSpotId: true,
        },
      });

      // 提取所有已作为备选的景点ID
      const usedIds = allAlternatives.map((a) => a.alternativeSpotId);

      // 查询excludeOriginalSpotId的备选关系（排除这个景点自己的备选）
      const excludeAlternatives = await prisma.spotAlternative.findMany({
        where: {
          originalSpotId: excludeOriginalSpotId,
        },
        select: {
          alternativeSpotId: true,
        },
      });

      const excludeIds = excludeAlternatives.map((a) => a.alternativeSpotId);

      // 返回已作为备选的景点ID，但排除：
      // 1. excludeOriginalSpotId自己的备选
      // 2. excludeSpotIds中的景点（行程中的景点）
      return usedIds.filter((id) => !excludeIds.includes(id) && !excludeSpotIds.includes(id));
    } catch (error: any) {
      console.error('❌ 获取已使用的备选ID失败:', error);
      return [];
    }
  }

  /**
   * 更新备选关系（替换景点时调用）
   * @param oldSpotId 被替换的景点ID
   * @param newSpotId 新景点ID
   * @param city 城市名称
   */
  async updateAlternativeRelations(
    oldSpotId: string,
    newSpotId: string,
    city: string
  ): Promise<void> {
    try {
      console.log(`🔄 更新备选关系: ${oldSpotId} -> ${newSpotId}`);

      // 1. 检查是否已经存在这个备选关系
      const existingRelation = await prisma.spotAlternative.findFirst({
        where: {
          originalSpotId: oldSpotId,
          alternativeSpotId: newSpotId,
        },
      });

      if (existingRelation) {
        console.log('ℹ️  备选关系已存在，无需更新');
        return;
      }

      // 2. 获取oldSpotId的备选关系
      const oldAlternatives = await prisma.spotAlternative.findMany({
        where: {
          originalSpotId: oldSpotId,
        },
      });

      if (oldAlternatives.length === 0) {
        console.log('ℹ️  旧景点没有备选关系，创建新的备选关系');

        // 创建新的备选关系
        await prisma.spotAlternative.create({
          data: {
            originalSpotId: oldSpotId,
            alternativeSpotId: newSpotId,
            city: city,
            priority: 1,
          },
        });

        console.log(`✅ 备选关系创建完成`);
        return;
      }

      // 3. 删除oldSpotId的备选关系
      await prisma.spotAlternative.deleteMany({
        where: {
          originalSpotId: oldSpotId,
        },
      });

      // 4. 为newSpotId创建备选关系（包含oldSpotId）
      // 首先获取oldSpotId的备选景点
      const oldAlternativeIds = oldAlternatives.map((a) => a.alternativeSpotId);

      // 为newSpotId创建备选关系
      // 第一个备选是oldSpotId（被替换的景点）
      await prisma.spotAlternative.create({
        data: {
          originalSpotId: newSpotId,
          alternativeSpotId: oldSpotId,
          city: city,
          priority: 1,
        },
      });

      // 其他备选景点保持原有的优先级（+1）
      for (const oldAlt of oldAlternatives) {
        await prisma.spotAlternative.create({
          data: {
            originalSpotId: newSpotId,
            alternativeSpotId: oldAlt.alternativeSpotId,
            city: city,
            priority: oldAlt.priority + 1,
          },
        });
      }

      // 5. 更新其他景点中的备选关系
      // 找到所有将oldSpotId作为备选的关系
      const references = await prisma.spotAlternative.findMany({
        where: {
          alternativeSpotId: oldSpotId,
        },
      });

      // 将这些关系中的oldSpotId替换为newSpotId
      for (const ref of references) {
        // 先删除旧的关系
        await prisma.spotAlternative.delete({
          where: { id: ref.id },
        });

        // 创建新的关系
        await prisma.spotAlternative.create({
          data: {
            originalSpotId: ref.originalSpotId,
            alternativeSpotId: newSpotId,
            city: ref.city,
            priority: ref.priority,
          },
        });
      }

      console.log(`✅ 备选关系更新完成`);
    } catch (error: any) {
      console.error(`❌ 更新备选关系失败:`, error);
      throw error;
    }
  }

  /**
   * 随机打乱数组
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * 获取IoT数据映射
   * @param spotIds 景点ID列表
   * @returns IoT数据映射
   */
  private async getIoTDataMap(spotIds: string[]): Promise<Map<string, SpotIoTData>> {
    const iotDataList = await prisma.spotIoTData.findMany({
      where: {
        spotId: {
          in: spotIds,
        },
      },
    });

    const map = new Map<string, SpotIoTData>();
    iotDataList.forEach((data) => {
      map.set(data.spotId, {
        id: data.id,
        spotId: data.spotId,
        crowdLevel: data.crowdLevel,
        temperature: data.temperature,
        rainProbability: data.rainProbability,
        isOpen: data.isOpen,
        generatedAt: data.generatedAt,
        updatedAt: data.updatedAt,
      });
    });

    return map;
  }

  /**
   * 计算景点评分
   * @param spot 景点
   * @param iotData IoT数据
   * @returns 评分
   */
  private calculateScore(spot: Spot, iotData?: SpotIoTData): number {
    if (!iotData) return 0;

    let score = 100;

    // IoT数据评分（权重70%）
    if (iotData.rainProbability > 50) score -= 20;
    if (iotData.rainProbability > 20) score -= 10;
    if (iotData.crowdLevel > 60) score -= 15;
    if (iotData.crowdLevel > 40) score -= 5;
    if (!iotData.isOpen) score -= 30;

    // 评分（权重20%）
    if (spot.rating) {
      score += (spot.rating - 3.5) * 10;
    }

    // 价格（权重10%）
    if (spot.ticketPrice === 0 || spot.ticketPrice === null) score += 5;

    return Math.max(0, score);
  }

  /**
   * 解析分类
   */
  private parseCategory(type: string): string {
    // 解析高德的类型编码
    // "风景名胜;风景名胜;公园" → "公园"
    const parts = type.split(';');
    return parts[parts.length - 1] || '其他';
  }

  /**
   * 提取开放时间
   */
  private extractOpenTime(type: string): string {
    // 这里可以添加更复杂的逻辑
    // 目前返回默认值
    return '全天开放';
  }

  /**
   * 判断是否为户外景点
   */
  private isOutdoorAttraction(type: string): boolean {
    const outdoorTypes = ['公园', '风景区', '广场', '街道', '古镇', '遗迹'];
    return outdoorTypes.some((t) => type.includes(t));
  }

  /**
   * 获取单个景点详情
   * @param spotId 景点ID
   * @returns 景点详情
   */
  async getSpotById(spotId: string): Promise<Spot | null> {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: {
        iotData: true,
      },
    });

    if (!spot) return null;

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
      source: spot.source,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
    };
  }

  /**
   * 获取景点的IoT数据
   * @param spotId 景点ID
   * @returns IoT数据
   */
  async getSpotIoTData(spotId: string): Promise<SpotIoTData | null> {
    const iotData = await prisma.spotIoTData.findUnique({
      where: { spotId },
    });

    if (!iotData) return null;

    return {
      id: iotData.id,
      spotId: iotData.spotId,
      crowdLevel: iotData.crowdLevel,
      temperature: iotData.temperature,
      rainProbability: iotData.rainProbability,
      isOpen: iotData.isOpen,
      generatedAt: iotData.generatedAt,
      updatedAt: iotData.updatedAt,
    };
  }

  /**
   * 为景点生成IoT数据（如果不存在）
   * @param spotId 景点ID
   * @returns IoT数据
   */
  async generateIoTDataForSpot(spotId: string): Promise<SpotIoTData | null> {
    try {
      // 检查是否已存在IoT数据
      const existingIoTData = await prisma.spotIoTData.findUnique({
        where: { spotId },
      });

      if (existingIoTData) {
        console.log(`✅ 景点 ${spotId} 已有IoT数据`);
        return {
          id: existingIoTData.id,
          spotId: existingIoTData.spotId,
          crowdLevel: existingIoTData.crowdLevel,
          temperature: existingIoTData.temperature,
          rainProbability: existingIoTData.rainProbability,
          isOpen: existingIoTData.isOpen,
          generatedAt: existingIoTData.generatedAt,
          updatedAt: existingIoTData.updatedAt,
        };
      }

      // 获取景点信息
      const spot = await prisma.spot.findUnique({
        where: { id: spotId },
      });

      if (!spot) {
        console.error(`❌ 景点 ${spotId} 不存在`);
        return null;
      }

      console.log(`🔄 为景点 ${spot.name} 生成IoT数据...`);

      // 动态生成IoT数据
      const iotData = this.generateDynamicIoTData(spot);

      // 保存到数据库
      const createdIoTData = await prisma.spotIoTData.create({
        data: {
          spotId,
          crowdLevel: iotData.crowdLevel,
          temperature: iotData.temperature,
          rainProbability: iotData.rainProbability,
          isOpen: iotData.isOpen,
        },
      });

      console.log(`✅ 景点 ${spot.name} IoT数据生成成功`);

      return {
        id: createdIoTData.id,
        spotId: createdIoTData.spotId,
        crowdLevel: createdIoTData.crowdLevel,
        temperature: createdIoTData.temperature,
        rainProbability: createdIoTData.rainProbability,
        isOpen: createdIoTData.isOpen,
        generatedAt: createdIoTData.generatedAt,
        updatedAt: createdIoTData.updatedAt,
      };
    } catch (error) {
      console.error(`❌ 为景点 ${spotId} 生成IoT数据失败:`, error);
      return null;
    }
  }

  /**
   * 批量获取IoT数据
   * @param spotIds 景点ID列表
   * @returns IoT数据映射
   */
  async getBatchIoTData(spotIds: string[]): Promise<Map<string, SpotIoTData>> {
    return this.getIoTDataMap(spotIds);
  }

  /**
   * 获取景点封面图，按优先级：admin approved → user approved → null
   * @param spotId 景点ID
   * @returns 图片URL或null
   */
  async getSpotCoverImage(spotId: string): Promise<string | null> {
    try {
      // 优先获取 admin approved 图片
      const adminImage = await prisma.spotImage.findFirst({
        where: {
          spotId,
          source: 'admin',
          status: 'approved',
        },
        orderBy: [{ isPrimary: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        select: { url: true },
      });

      if (adminImage?.url) {
        return adminImage.url;
      }

      // 其次获取 user approved 图片
      const userImage = await prisma.spotImage.findFirst({
        where: {
          spotId,
          source: 'user',
          status: 'approved',
        },
        orderBy: [{ isPrimary: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        select: { url: true },
      });

      return userImage?.url || null;
    } catch (error) {
      console.error(`获取景点 ${spotId} 封面图失败:`, error);
      return null;
    }
  }

  /**
   * 批量获取景点封面图，供列表页使用，避免 N+1 查询
   * @param spotIds 景点ID列表
   * @returns Map<景点ID, 图片URL或null>
   */
  async getSpotCoverImages(spotIds: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    try {
      // 批量查询所有景点的图片
      const images = await prisma.spotImage.findMany({
        where: {
          spotId: { in: spotIds },
          status: 'approved',
        },
        orderBy: [
          { spotId: 'asc' },
          { source: 'asc' }, // admin < user
          { isPrimary: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          spotId: true,
          url: true,
          source: true,
        },
      });

      // 按景点ID分组，选择每个景点的第一张图片
      const spotImageMap = new Map<string, string>();
      for (const img of images) {
        if (!spotImageMap.has(img.spotId) && img.url) {
          spotImageMap.set(img.spotId, img.url);
        }
      }

      // 构建结果
      for (const spotId of spotIds) {
        result.set(spotId, spotImageMap.get(spotId) || null);
      }

      return result;
    } catch (error) {
      console.error('批量获取景点封面图失败:', error);
      // 返回空结果
      for (const spotId of spotIds) {
        result.set(spotId, null);
      }
      return result;
    }
  }

  /**
   * 根据景点名称和城市查找景点ID
   * @param name 景点名称
   * @param city 城市名称
   * @param location 经纬度（可选，用于精确匹配）
   * @returns 景点ID，如果找不到则返回null
   */
  async findSpotIdByNameAndCity(
    name: string,
    city: string,
    location?: string
  ): Promise<string | null> {
    try {
      // 1. 尝试精确匹配（名称+城市）
      let spot = await prisma.spot.findFirst({
        where: {
          name: name,
          city: city,
        },
      });

      if (spot) {
        return spot.id;
      }

      // 2. 如果提供了经纬度，尝试通过位置匹配（精确匹配）
      if (location) {
        spot = await prisma.spot.findFirst({
          where: {
            city: city,
            location: location,
          },
        });

        if (spot) {
          return spot.id;
        }
      }

      // 3. 尝试反向模糊匹配（数据库名称包含查询名称）
      // 注意：这里使用更严格的匹配，确保不会错误匹配
      spot = await prisma.spot.findFirst({
        where: {
          name: name, // 精确匹配
          city: city,
        },
      });

      if (spot) {
        return spot.id;
      }

      // 4. 尝试去除常见后缀后匹配（如"广场"、"公园"等）
      const simplifiedName = name
        .replace(/广场$/, '')
        .replace(/公园$/, '')
        .replace(/博物馆$/, '')
        .replace(/纪念馆$/, '')
        .replace(/景区$/, '')
        .replace(/景点$/, '')
        .trim();

      if (simplifiedName !== name && simplifiedName.length > 0) {
        spot = await prisma.spot.findFirst({
          where: {
            OR: [
              { name: simplifiedName, city: city },
              { name: { startsWith: simplifiedName }, city: city },
            ],
          },
        });

        if (spot) {
          console.log(`⚠️  简化名称匹配: "${name}" -> "${spot.name}"`);
          return spot.id;
        }
      }

      console.log(`⚠️  未找到景点: ${name} (${city})`);
      return null;
    } catch (error) {
      console.error('❌ 查找景点ID失败:', error);
      return null;
    }
  }
}

// 导出单例
export const spotService = new SpotService();
