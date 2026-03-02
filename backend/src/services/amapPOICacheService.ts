// 高德地图 POI 缓存服务 - 用于缓存高德地图的景点数据,减少 API 调用
import { PrismaClient } from '@prisma/client';
import { AmapAttraction } from './amapService';

const prisma = new PrismaClient();

// 缓存过期时间(30天)
const CACHE_EXPIRE_DAYS = 30;

export class AmapPOICacheService {
  /**
   * 从缓存获取景点数据
   * @param city 城市名称
   * @param typecode POI 类型代码
   * @returns 缓存的景点数据,如果没有缓存则返回 null
   */
  async getFromCache(city: string, typecode?: string): Promise<AmapAttraction[] | null> {
    try {
      // 检查是否有缓存
      const where: any = {
        city,
        expireTime: {
          gte: new Date(), // 未过期
        },
      };

      if (typecode) {
        where.typecode = typecode;
      }

      const cachedPOIs = await prisma.amapPOICache.findMany({
        where,
        orderBy: {
          hitCount: 'desc', // 按使用次数排序
        },
      });

      if (cachedPOIs.length === 0) {
        console.log(`📭 缓存中没有找到 ${city} 的景点数据`);
        return null;
      }

      console.log(`✅ 从缓存获取到 ${cachedPOIs.length} 个景点`);

      // 更新命中次数
      await Promise.all(
        cachedPOIs.map(poi =>
          prisma.amapPOICache.update({
            where: { id: poi.id },
            data: {
              hitCount: {
                increment: 1,
              },
            },
          })
        )
      );

      // 转换为 AmapAttraction 格式
      return cachedPOIs.map(poi => ({
        name: poi.name,
        location: poi.location,
        address: poi.address || '',
        type: poi.type,
        typecode: poi.typecode,
        tel: poi.tel || undefined,
        distance: poi.distance || undefined,
        rating: poi.rating || undefined,
        cost: poi.cost || undefined,
      }));
    } catch (error) {
      console.error('❌ 从缓存获取数据失败:', error);
      return null;
    }
  }

  /**
   * 保存景点数据到缓存
   * @param attractions 景点数据
   * @param city 城市名称
   */
  async saveToCache(attractions: AmapAttraction[], city: string): Promise<void> {
    try {
      console.log(`💾 保存 ${attractions.length} 个景点到缓存`);

      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + CACHE_EXPIRE_DAYS);

      // 批量创建或更新缓存
      await Promise.all(
        attractions.map(async (attraction) => {
          // 使用 POI ID 作为唯一标识,如果没有则使用 name + location
          const poiId = attraction.name + attraction.location;

          await prisma.amapPOICache.upsert({
            where: { poiId },
            update: {
              name: attraction.name,
              type: attraction.type,
              typecode: attraction.typecode,
              address: attraction.address,
              location: attraction.location,
              tel: attraction.tel,
              distance: attraction.distance || null,
              rating: attraction.rating || null,
              cost: attraction.cost || null,
              city,
              expireTime,
              updatedAt: new Date(),
            },
            create: {
              poiId,
              name: attraction.name,
              type: attraction.type,
              typecode: attraction.typecode,
              address: attraction.address,
              location: attraction.location,
              tel: attraction.tel,
              distance: attraction.distance || null,
              rating: attraction.rating || null,
              cost: attraction.cost || null,
              city,
              cacheTime: new Date(),
              expireTime,
              hitCount: 1,
            },
          });
        })
      );

      console.log(`✅ 成功保存 ${attractions.length} 个景点到缓存`);
    } catch (error) {
      console.error('❌ 保存到缓存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      const result = await prisma.amapPOICache.deleteMany({
        where: {
          expireTime: {
            lt: new Date(), // 已过期
          },
        },
      });

      console.log(`🧹 清理了 ${result.count} 个过期缓存`);
    } catch (error) {
      console.error('❌ 清理缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    total: number;
    valid: number;
    expired: number;
    byCity: Record<string, number>;
  }> {
    try {
      const total = await prisma.amapPOICache.count();
      const valid = await prisma.amapPOICache.count({
        where: {
          expireTime: {
            gte: new Date(),
          },
        },
      });
      const expired = total - valid;

      // 按城市统计
      const byCityGroup = await prisma.amapPOICache.groupBy({
        by: ['city'],
        _count: {
          city: true,
        },
        where: {
          expireTime: {
            gte: new Date(),
          },
        },
      });

      const byCity: Record<string, number> = {};
      byCityGroup.forEach(group => {
        byCity[group.city] = group._count.city;
      });

      return {
        total,
        valid,
        expired,
        byCity,
      };
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error);
      return {
        total: 0,
        valid: 0,
        expired: 0,
        byCity: {},
      };
    }
  }
}

// 导出单例
export const amapPOICacheService = new AmapPOICacheService();
