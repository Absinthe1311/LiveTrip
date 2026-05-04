// 高德地图 POI 缓存服务 - 用于缓存高德地图的景点数据,减少 API 调用
// 注意：景点数据永久存储，不会过期
import { getPrismaClient } from '../lib/prisma';
import { AmapAttraction } from './amapService';

const prisma = getPrismaClient();

export class AmapPOICacheService {
  /**
   * 从缓存获取景点数据（永久存储，不过期）
   * @param city 城市名称
   * @param typecode POI 类型代码
   * @returns 缓存的景点数据,如果没有缓存则返回 null
   */
  async fromCache(city: string, typecode?: string): Promise<AmapAttraction[] | null> {
    try {
      const where: any = { city };

      if (typecode) {
        where.typecode = typecode;
      }

      const cachedPOIs = await prisma.amapPOICache.findMany({
        where,
        orderBy: {
          hitCount: 'desc',
        },
      });

      if (cachedPOIs.length === 0) {
        return null;
      }

      // 更新命中次数
      await Promise.all(
        cachedPOIs.map((poi) =>
          prisma.amapPOICache.update({
            where: { id: poi.id },
            data: {
              hitCount: { increment: 1 },
            },
          })
        )
      );

      // 转换为 AmapAttraction 格式
      return cachedPOIs.map((poi) => ({
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
   * 保存景点数据到缓存（永久存储）
   * @param attractions 景点数据
   * @param city 城市名称
   */
  async toCache(attractions: AmapAttraction[], city: string): Promise<void> {
    try {
      // 批量创建或更新缓存
      await Promise.all(
        attractions.map(async (attraction) => {
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
              expireTime: new Date('2099-12-31'), // 设置为永久
              hitCount: 1,
            },
          });
        })
      );
    } catch (error) {
      console.error('❌ 保存到缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async cacheInfo(): Promise<{
    total: number;
    byCity: Record<string, number>;
  }> {
    try {
      const total = await prisma.amapPOICache.count();

      const byCityGroup = await prisma.amapPOICache.groupBy({
        by: ['city'],
        _count: { city: true },
      });

      const byCity: Record<string, number> = {};
      byCityGroup.forEach((group) => {
        byCity[group.city] = group._count.city;
      });

      return { total, byCity };
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error);
      return { total: 0, byCity: {} };
    }
  }
}

// 导出单例
export const amapPOICacheService = new AmapPOICacheService();
