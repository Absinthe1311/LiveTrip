// 目的地热门景点缓存服务
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

      console.log(`🔄 缓存不存在或已过期，调用API获取数据: ${city}`);

      // 2. 调用高德地图API获取数据
      const attractions = await this.fetchAttractionsFromAmap(city);

      // 3. 更新缓存
      await this.updateCache(city, attractions);

      console.log(`✅ 缓存更新完成: ${city}`);
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

      console.log(`✅ 从API获取到 ${limitedAttractions.length} 个有效景点`);

      return limitedAttractions;
    } catch (error: any) {
      console.error('❌ 从高德地图API获取景点失败:', error);
      throw error;
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
   * 获取所有支持的城市列表
   */
  getSupportedCities(): string[] {
    return [...CITIES];
  }
}

// 导出单例
export const destinationCacheService = new DestinationCacheService();
