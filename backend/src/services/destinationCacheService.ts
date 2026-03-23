// 目的地热门景点缓存服务 - 优化版
// 方案A：优先从数据库获取，高德API获取时保存到数据库
import { PrismaClient } from '@prisma/client';
import { getAmapService } from './amapService';

const prisma = new PrismaClient();

// 缓存过期时间（7天）
const CACHE_EXPIRY_DAYS = 7;

// 城市列表
const CITIES = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '成都',
  '杭州',
  '西安',
  '重庆',
  '南京',
  '苏州',
  '武汉',
  '天津',
  '青岛',
  '大连',
  '厦门',
  '长沙',
  '郑州',
  '沈阳',
  '哈尔滨',
  '昆明',
];

// 景点类型
const ATTRACTION_TYPES = '110000|140000|050000'; // 风景名胜|旅游景点|餐饮服务

// 搜索关键词
const SEARCH_KEYWORDS = ['景点', '博物馆', '公园', '名胜古迹', '历史遗迹'];

class DestinationCacheService {
  private amapService: any;

  constructor() {
    this.amapService = getAmapService();
  }

  /**
   * 获取城市的热门景点列表
   * @param city 城市名称
   * @returns 景点列表
   */
  async getCityAttractions(city: string): Promise<any[]> {
    try {
      console.log(`🔍 获取 ${city} 的热门景点...`);

      // 1. 检查缓存
      const cachedData = await prisma.destinationCache.findUnique({
        where: { city },
      });

      if (cachedData && cachedData.expiresAt > new Date()) {
        console.log(`✅ 使用缓存数据: ${city}`);
        return JSON.parse(cachedData.attractions);
      }

      console.log(`🔄 缓存不存在或已过期，开始获取数据: ${city}`);

      // 2. 优先从数据库获取该城市的景点
      const attractionsFromDB = await this.getAttractionsFromDatabase(city);

      if (attractionsFromDB.length > 0) {
        console.log(`✅ 从数据库获取到 ${attractionsFromDB.length} 个景点`);

        // 更新缓存
        await this.updateCache(city, attractionsFromDB);

        return attractionsFromDB;
      }

      console.log(`⚠️  数据库中没有 ${city} 的景点数据，调用高德地图API`);

      // 3. 数据库中没有数据，调用高德地图API
      const attractions = await this.fetchAttractionsFromAmap(city);

      // 4. 保存到数据库
      await this.saveAttractionsToDatabase(city, attractions);

      // 5. 更新缓存
      await this.updateCache(city, attractions);

      console.log(`✅ 数据获取完成: ${city}`);
      return attractions;
    } catch (error: any) {
      console.error(`❌ 获取 ${city} 的热门景点失败:`, error);

      // 如果API调用失败，尝试返回过期缓存
      const cachedData = await prisma.destinationCache.findUnique({
        where: { city },
      });

      if (cachedData) {
        console.log(`⚠️  API调用失败，使用过期缓存: ${city}`);
        return JSON.parse(cachedData.attractions);
      }

      throw error;
    }
  }

  /**
   * 从数据库获取城市的景点列表
   * @param city 城市名称
   * @returns 景点列表
   */
  private async getAttractionsFromDatabase(city: string): Promise<any[]> {
    try {
      const spots = await prisma.spot.findMany({
        where: {
          city: city,
          isHot: true, // 只获取热门景点
        },
        orderBy: {
          rating: 'desc', // 按评分排序
        },
        take: 50, // 最多50个
      });

      // 转换为前端需要的格式
      const attractions = spots.map((spot) => ({
        id: spot.id,
        name: spot.name,
        location: spot.location,
        address: spot.address || '',
        type: spot.category || '景点',
        rating: spot.rating || 4.5,
        cost: spot.ticketPrice ? String(spot.ticketPrice) : '0',
        description: spot.description || spot.category || '热门景点',
        city: spot.city,
        amapId: spot.amapId,
      }));

      return attractions;
    } catch (error: any) {
      console.error(`❌ 从数据库获取景点失败:`, error);
      return [];
    }
  }

  /**
   * 从高德地图API获取景点数据
   * @param city 城市名称
   * @returns 景点列表
   */
  private async fetchAttractionsFromAmap(city: string): Promise<any[]> {
    try {
      const allAttractions: any[] = [];

      // 使用不同的关键词搜索，获取更多景点
      for (const keyword of SEARCH_KEYWORDS) {
        const attractions = await this.amapService.getAttractions(
          city,
          keyword,
          ATTRACTION_TYPES,
          20 // 每个关键词获取20个
        );

        allAttractions.push(...attractions);
      }

      // 去重（根据名称）
      const uniqueAttractions = this.deduplicateAttractions(allAttractions);

      // 过滤掉没有坐标的景点
      const validAttractions = uniqueAttractions.filter(
        (attr) => attr.location && attr.location !== '0,0'
      );

      // 限制返回数量（最多50个）
      const limitedAttractions = validAttractions.slice(0, 50);

      console.log(`✅ 从高德地图API获取到 ${limitedAttractions.length} 个有效景点`);

      return limitedAttractions;
    } catch (error: any) {
      console.error('❌ 从高德地图API获取景点失败:', error);
      throw error;
    }
  }

  /**
   * 保存景点到数据库
   * @param city 城市名称
   * @param attractions 景点列表
   */
  private async saveAttractionsToDatabase(city: string, attractions: any[]): Promise<void> {
    try {
      console.log(`💾 开始保存景点到数据库: ${city}`);

      let savedCount = 0;
      let updatedCount = 0;

      for (const attr of attractions) {
        try {
          // 检查景点是否已存在（根据amapId）
          const existingSpot = await prisma.spot.findUnique({
            where: { amapId: attr.id },
          });

          if (existingSpot) {
            // 景点已存在，更新信息
            await prisma.spot.update({
              where: { amapId: attr.id },
              data: {
                name: attr.name,
                location: attr.location,
                address: attr.address || existingSpot.address,
                city: city,
                category: attr.type || existingSpot.category,
                rating: attr.rating || existingSpot.rating,
                ticketPrice: attr.cost ? parseFloat(attr.cost) : existingSpot.ticketPrice,
                isHot: true, // 标记为热门景点
                updatedAt: new Date(),
              },
            });
            updatedCount++;
          } else {
            // 景点不存在，创建新景点
            await prisma.spot.create({
              data: {
                amapId: attr.id,
                name: attr.name,
                location: attr.location,
                address: attr.address || '',
                city: city,
                category: attr.type || '景点',
                rating: attr.rating || 4.5,
                ticketPrice: attr.cost ? parseFloat(attr.cost) : 0,
                isHot: true, // 标记为热门景点
                description: attr.type || '热门景点', // 初始description，后续可由AI生成
                source: 'amap',
              },
            });
            savedCount++;
          }
        } catch (error: any) {
          console.error(`保存景点失败 (${attr.name}):`, error.message);
        }
      }

      console.log(`✅ 景点保存完成: 新增 ${savedCount} 个，更新 ${updatedCount} 个`);
    } catch (error: any) {
      console.error(`❌ 保存景点到数据库失败:`, error);
    }
  }

  /**
   * 去重景点
   * @param attractions 景点列表
   * @returns 去重后的景点列表
   */
  private deduplicateAttractions(attractions: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const attraction of attractions) {
      const key = `${attraction.name}-${attraction.location}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(attraction);
      }
    }

    return unique;
  }

  /**
   * 更新缓存
   * @param city 城市名称
   * @param attractions 景点列表
   */
  private async updateCache(city: string, attractions: any[]): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

      const jsonData = JSON.stringify(attractions);

      await prisma.destinationCache.upsert({
        where: { city },
        update: {
          attractions: jsonData,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          city,
          attractions: jsonData,
          expiresAt,
        },
      });

      console.log(`✅ 缓存已更新: ${city}, 过期时间: ${expiresAt.toISOString()}`);
    } catch (error: any) {
      console.error(`❌ 更新缓存失败: ${city}`, error);
      throw error;
    }
  }

  /**
   * 预热所有城市的缓存
   */
  async warmupCache(): Promise<void> {
    console.log('🔥 开始预热所有城市的缓存...');

    for (const city of CITIES) {
      try {
        await this.getCityAttractions(city);
        console.log(`✅ ${city} 缓存预热完成`);
        // 避免API调用过于频繁，延迟1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ ${city} 缓存预热失败:`, error);
      }
    }

    console.log('🔥 所有城市缓存预热完成');
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      const result = await prisma.destinationCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`✅ 清理了 ${result.count} 条过期缓存`);
    } catch (error: any) {
      console.error('❌ 清理过期缓存失败:', error);
    }
  }

  /**
   * 清理所有缓存（强制刷新）
   */
  async clearAllCache(): Promise<void> {
    try {
      const result = await prisma.destinationCache.deleteMany({});
      console.log(`✅ 清理了 ${result.count} 条缓存`);
    } catch (error: any) {
      console.error('❌ 清理缓存失败:', error);
    }
  }

  /**
   * 获取所有支持的城市列表
   */
  getSupportedCities(): string[] {
    return [...CITIES];
  }
}

// 导出单例
export const destinationCacheService = new DestinationCacheService();
