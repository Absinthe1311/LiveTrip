/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：服务层重构
 */

// 餐厅缓存服务 - 用于缓存高德地图的餐厅数据
// 注意：餐厅数据永久存储，不会过期
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

export interface RestaurantCache {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;
  rating?: number;
}

export class RestaurantCacheService {
  /**
   * 从数据库获取附近的餐厅
   * @param centerLocation 中心点坐标 "lng,lat"
   * @param radius 搜索半径（米）
   * @param limit 限制数量
   * @returns 餐厅列表
   */
  async getNearbyRestaurants(
    centerLocation: string,
    radius: number = 3000,
    limit: number = 20
  ): Promise<RestaurantCache[] | null> {
    try {
      const [lng, lat] = centerLocation.split(',').map(Number);

      const restaurants = await prisma.restaurant.findMany({
        where: {
          AND: [{ location: { not: '' } }],
        },
        take: limit * 2,
      });

      // 精确过滤距离
      const nearbyRestaurants = restaurants.filter((restaurant) => {
        if (!restaurant.location) return false;
        const [rLng, rLat] = restaurant.location.split(',').map(Number);
        const distance = this.calculateDistance(lat, lng, rLat, rLng);
        return distance <= radius;
      });

      if (nearbyRestaurants.length === 0) {
        return null;
      }

      // 更新命中次数
      await Promise.all(
        nearbyRestaurants.map((restaurant) =>
          prisma.restaurant.update({
            where: { id: restaurant.id },
            data: { hitCount: { increment: 1 } },
          })
        )
      );

      return nearbyRestaurants.map((restaurant) => ({
        name: restaurant.name,
        address: restaurant.address || '',
        location: restaurant.location,
        tel: restaurant.tel || undefined,
        type: restaurant.type,
        rating: restaurant.rating || undefined,
      }));
    } catch (error) {
      console.error('❌ 从数据库获取餐厅失败:', error);
      return null;
    }
  }

  /**
   * 保存餐厅数据到数据库
   * @param restaurants 餐厅数据
   * @param city 城市名称
   */
  async saveRestaurants(restaurants: RestaurantCache[], city: string): Promise<void> {
    try {
      await Promise.all(
        restaurants.map(async (restaurant) => {
          const amapId = restaurant.name + restaurant.location;

          await prisma.restaurant.upsert({
            where: { amapId },
            update: {
              name: restaurant.name,
              address: restaurant.address,
              location: restaurant.location,
              tel: restaurant.tel || null,
              type: restaurant.type,
              rating: restaurant.rating || null,
              city,
              updatedAt: new Date(),
            },
            create: {
              amapId,
              name: restaurant.name,
              address: restaurant.address,
              location: restaurant.location,
              tel: restaurant.tel || null,
              type: restaurant.type,
              rating: restaurant.rating || null,
              city,
              hitCount: 1,
            },
          });
        })
      );
    } catch (error) {
      console.error('❌ 保存餐厅到数据库失败:', error);
    }
  }

  /**
   * 计算两点之间的距离（米）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const restaurantCacheService = new RestaurantCacheService();
