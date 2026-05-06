// 地点缓存服务 - 缓存用户搜索过的地点，减少高德地图API调用
import { getPrismaClient } from '../lib/prisma';
import axios from 'axios';

const prisma = getPrismaClient();

interface CacheResult {
  success: boolean;
  data?: any[];
  fromCache: boolean;
  error?: string;
}

/**
 * 搜索地点（带缓存）
 * @param keywords 搜索关键词
 * @param userId 用户ID（可选）
 * @returns 搜索结果
 */
export async function searchLoc(
  keywords: string,
  userId?: string
): Promise<CacheResult> {
  try {

    // 步骤1: 检查数据库缓存（精确匹配keywords）
    const cachedResults = await prisma.locationCache.findMany({
      where: {
        keywords: keywords,
        expireTime: {
          gt: new Date(),
        },
      },
      orderBy: {
        searchCount: 'desc',
      },
      take: 20,
    });

    // 清理过期的缓存
    await cleanOld();

    if (cachedResults.length > 0) {

      // 更新搜索次数
      for (const cache of cachedResults) {
        await prisma.locationCache.update({
          where: { id: cache.id },
          data: { searchCount: cache.searchCount + 1 },
        });
      }

      // 转换为前端格式
      const results = cachedResults.map((cache) => ({
        value: cache.name,
        label: cache.name,
        icon: '',
        province: cache.province || cache.city || cache.address || '',
        rating: 4.5,
        address: cache.address || '',
        latitude: cache.latitude,
        longitude: cache.longitude,
      }));

      return {
        success: true,
        data: results,
        fromCache: true,
      };
    }


    // 步骤2: 调用高德地图API
    const amapKey = process.env.AMAP_API_KEY;
    if (!amapKey) {
      return {
        success: false,
        fromCache: false,
        error: '高德地图API Key未配置',
      };
    }

    const response = await axios.get(`https://restapi.amap.com/v3/place/text`, {
      params: {
        key: amapKey,
        keywords,
        citylimit: false,
        children: 1,
        offset: 20,
        page: 1,
        extensions: 'base',
      },
    });

    if (response.data.status !== '1') {
      return {
        success: false,
        fromCache: false,
        error: response.data.info || 'API调用失败',
      };
    }

    const pois = response.data.pois || [];

    // 步骤3: 将结果存入缓存
    const results: any[] = [];
    for (const poi of pois) {
      if (poi.name.length > 15) continue; // 过滤掉太长的名称

      // 解析经纬度
      let latitude = 0;
      let longitude = 0;
      if (poi.location) {
        const [lng, lat] = poi.location.split(',').map(Number);
        longitude = lng;
        latitude = lat;
      }

      // 检查是否已存在相同的地点
      const existingCache = await prisma.locationCache.findFirst({
        where: {
          name: poi.name,
          address: poi.address || '',
        },
      });

      if (!existingCache) {
        // 创建新的缓存记录
        await prisma.locationCache.create({
          data: {
            name: poi.name,
            type: poi.type || 'location',
            category: poi.typecode || '',
            address: poi.address || '',
            city: poi.cityname || poi.adname || '',
            province: poi.pname || '',
            latitude,
            longitude,
            keywords,
            searchCount: 1,
            cacheTime: new Date(),
            expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
          },
        });
      } else {
        // 更新现有缓存
        await prisma.locationCache.update({
          where: { id: existingCache.id },
          data: {
            searchCount: existingCache.searchCount + 1,
            updatedAt: new Date(),
          },
        });
      }

      results.push({
        value: poi.name,
        label: poi.name,
        icon: '',
        province: poi.address || poi.cityname || poi.adname || '',
        rating: 4.5,
        address: poi.address || '',
        latitude,
        longitude,
      });
    }

    return {
      success: true,
      data: results,
      fromCache: false,
    };
  } catch (error: any) {
    return {
      success: false,
      fromCache: false,
      error: error.message || '搜索失败',
    };
  }
}

/**
 * 清理过期的缓存
 */
async function cleanOld() {
  try {
    const result = await prisma.locationCache.deleteMany({
      where: {
        expireTime: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
    }
  } catch (error) {
  }
}

/**
 * 获取热门搜索地点
 */
export async function hotLocs(limit: number = 10) {
  try {
    const popularLocations = await prisma.locationCache.findMany({
      orderBy: {
        searchCount: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: popularLocations,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 清空所有缓存
 */
export async function flushCache() {
  try {
    const result = await prisma.locationCache.deleteMany({});
    return {
      success: true,
      count: result.count,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
