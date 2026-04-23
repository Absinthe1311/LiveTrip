// 景点数据查询服务 - 为 AI 提供景点和 IoT 数据
import { getPrismaClient } from '../lib/prisma';
import { spotService } from './spotService';

const prisma = getPrismaClient();

export interface SpotWithIoT {
  id: string;
  amapId: string;
  name: string;
  location: string;
  address?: string;
  city: string;
  category?: string;
  ticketPrice?: number;
  openTime?: string;
  rating?: number;
  description?: string;
  isOutdoor?: boolean;
  isHot: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  iotData?: {
    id: string;
    spotId: string;
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
    weatherDescription?: string;
    weatherIcon?: string;
    weatherUpdatedAt?: Date;
    generatedAt: Date;
  };
}

export class SpotDataService {
  /**
   * 获取城市的景点列表（包含 IoT 数据）
   * 如果数据库中没有景点，会自动从高德 API 获取
   */
  async getCitySpotsWithIoTData(city: string, limit: number = 50): Promise<SpotWithIoT[]> {
    console.log(`🔍 查询 ${city} 的景点列表，限制 ${limit} 个...`);

    // 1. 先从数据库查询
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
      },
      include: {
        iotData: true,
      },
      take: limit,
      orderBy: [
        { isHot: 'desc' }, // 优先返回热门景点
        { rating: 'desc' }, // 然后按评分排序
      ],
    });

    console.log(`✅ 从数据库查询到 ${spots.length} 个景点`);

    // 2. 如果数据库中没有景点，从高德 API 获取
    if (spots.length === 0) {
      console.log(`📡 数据库中没有 ${city} 的景点，尝试从高德 API 获取...`);

      try {
        // 调用 spotService 从高德 API 获取景点
        const newSpots = await spotService.getCitySpots(city, limit);

        if (newSpots.length > 0) {
          console.log(`✅ 从高德 API 获取到 ${newSpots.length} 个景点`);

          // 重新查询数据库，包含 IoT 数据
          const spotsWithIoT = await prisma.spot.findMany({
            where: {
              city: city,
            },
            include: {
              iotData: true,
            },
            take: limit,
            orderBy: [
              { isHot: 'desc' },
              { rating: 'desc' },
            ],
          });

          console.log(`✅ 最终获取到 ${spotsWithIoT.length} 个景点（包含 IoT 数据）`);

          return spotsWithIoT as SpotWithIoT[];
        } else {
          console.warn(`⚠️  高德 API 也没有返回 ${city} 的景点数据`);
          return [];
        }
      } catch (error: any) {
        console.error(`❌ 从高德 API 获取 ${city} 景点失败:`, error);
        return [];
      }
    }

    return spots as SpotWithIoT[];
  }

  /**
   * 格式化景点数据为 AI 可理解的格式
   */
  formatSpotsForAI(spots: SpotWithIoT[]): string {
    return spots.map((spot, index) => {
      const iotInfo = spot.iotData ? `
        - 拥挤程度: ${spot.iotData.crowdLevel.toFixed(2)}
        - 温度: ${spot.iotData.temperature.toFixed(1)}°C
        - 下雨概率: ${spot.iotData.rainProbability.toFixed(0)}%
        - 是否开放: ${spot.iotData.isOpen ? '是' : '否'}
        ${spot.iotData.weatherDescription ? `- 天气: ${spot.iotData.weatherDescription}` : ''}
      ` : '（暂无 IoT 数据）';

      return `
${index + 1}. ${spot.name}
   - 分类: ${spot.category || '未分类'}
   - 地址: ${spot.address || '未知'}
   - 门票价格: ${spot.ticketPrice || '免费'} 元
   - 评分: ${spot.rating || '暂无评分'}
   - 描述: ${spot.description || '暂无描述'}
   - 是否热门: ${spot.isHot ? '是' : '否'}
   - 是否户外: ${spot.isOutdoor ? '是' : '否'}
   IoT 数据:${iotInfo}
      `.trim();
    }).join('\n\n');
  }

  /**
   * 根据景点名称查询景点
   * 如果数据库中没有，尝试从高德 API 获取
   */
  async getSpotByName(name: string, city?: string): Promise<SpotWithIoT | null> {
    console.log(`🔍 查询景点: ${name}${city ? ` (${city})` : ''}`);

    // 1. 先从数据库查询
    const where: any = {
      name: name,
    };

    if (city) {
      where.city = city;
    }

    const spot = await prisma.spot.findFirst({
      where: where,
      include: {
        iotData: true,
      },
    });

    if (spot) {
      console.log(`✅ 从数据库找到景点: ${spot.name}`);
      return spot as SpotWithIoT;
    }

    // 2. 如果数据库中没有，尝试从高德 API 获取
    console.log(`📡 数据库中没有找到景点 "${name}"，尝试从高德 API 获取...`);

    try {
      // 使用高德 API 搜索特定景点
      const amapService = require('./amapService').amapService;
      const searchCity = city || '全国';
      const amapAttractions = await amapService.getAttractions(searchCity, name, undefined, 5);

      if (amapAttractions.length > 0) {
        console.log(`✅ 从高德 API 找到 ${amapAttractions.length} 个匹配的景点`);

        // 调用 spotService 保存到数据库（这会自动处理保存和 IoT 数据生成）
        const savedSpots = await spotService.getCitySpots(searchCity, 1);

        if (savedSpots.length > 0) {
          console.log(`✅ 景点已保存到数据库: ${savedSpots[0].name}`);

          // 重新查询包含 IoT 数据
          const newSpot = await prisma.spot.findFirst({
            where: {
              name: savedSpots[0].name,
              city: searchCity,
            },
            include: {
              iotData: true,
            },
          });

          if (newSpot) {
            return newSpot as SpotWithIoT;
          }
        }
      } else {
        console.warn(`⚠️  高德 API 也没有找到景点 "${name}"`);
      }
    } catch (error: any) {
      console.error(`❌ 从高德 API 获取景点 "${name}" 失败:`, error);
    }

    return null;
  }

  /**
   * 根据景点 ID 批量查询景点
   */
  async getSpotsByIds(spotIds: string[]): Promise<SpotWithIoT[]> {
    const spots = await prisma.spot.findMany({
      where: {
        id: {
          in: spotIds,
        },
      },
      include: {
        iotData: true,
      },
    });

    return spots as SpotWithIoT[];
  }

  /**
   * 获取热门景点
   */
  async getHotSpots(city: string, limit: number = 10): Promise<SpotWithIoT[]> {
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
        isHot: true,
      },
      include: {
        iotData: true,
      },
      take: limit,
      orderBy: {
        rating: 'desc',
      },
    });

    return spots as SpotWithIoT[];
  }

  /**
   * 根据分类获取景点
   */
  async getSpotsByCategory(
    city: string,
    category: string,
    limit: number = 20
  ): Promise<SpotWithIoT[]> {
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
        category: category,
      },
      include: {
        iotData: true,
      },
      take: limit,
      orderBy: {
        rating: 'desc',
      },
    });

    return spots as SpotWithIoT[];
  }
}

// 导出单例
let spotDataServiceInstance: SpotDataService | null = null;
export const spotDataService = (): SpotDataService => {
  if (!spotDataServiceInstance) {
    spotDataServiceInstance = new SpotDataService();
  }
  return spotDataServiceInstance;
};
