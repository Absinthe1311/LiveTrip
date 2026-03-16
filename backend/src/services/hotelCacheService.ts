// 酒店缓存服务 - 用于缓存高德地图的酒店数据
// 注意：酒店数据永久存储，不会过期
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HotelCache {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;
  rating?: number;
}

export class HotelCacheService {
  /**
   * 从数据库获取附近的酒店
   * @param centerLocation 中心点坐标 "lng,lat"
   * @param radius 搜索半径（米）
   * @param limit 限制数量
   * @returns 酒店列表
   */
  async getNearbyHotels(
    centerLocation: string,
    radius: number = 5000,
    limit: number = 30
  ): Promise<HotelCache[] | null> {
    try {
      const [lng, lat] = centerLocation.split(',').map(Number);

      // 使用简单的距离计算（近似）
      // 1度纬度约111km，1度经度约111km * cos(lat)
      const latRange = radius / 111000; // 纬度范围
      const lngRange = radius / (111000 * Math.cos(lat * Math.PI / 180)); // 经度范围

      const hotels = await prisma.hotel.findMany({
        where: {
          AND: [
            { location: { not: '' } },
          ],
        },
        take: limit * 2, // 多取一些，然后精确过滤
      });

      // 精确过滤距离
      const nearbyHotels = hotels.filter(hotel => {
        if (!hotel.location) return false;
        const [hLng, hLat] = hotel.location.split(',').map(Number);
        const distance = this.calculateDistance(lat, lng, hLat, hLng);
        return distance <= radius;
      });

      if (nearbyHotels.length === 0) {
        return null;
      }

      // 更新命中次数
      await Promise.all(
        nearbyHotels.map(hotel =>
          prisma.hotel.update({
            where: { id: hotel.id },
            data: { hitCount: { increment: 1 } },
          })
        )
      );

      return nearbyHotels.map(hotel => ({
        name: hotel.name,
        address: hotel.address || '',
        location: hotel.location,
        tel: hotel.tel || undefined,
        type: hotel.type,
        rating: hotel.rating || undefined,
      }));
    } catch (error) {
      console.error('❌ 从数据库获取酒店失败:', error);
      return null;
    }
  }

  /**
   * 保存酒店数据到数据库
   * @param hotels 酒店数据
   * @param city 城市名称
   */
  async saveHotels(hotels: HotelCache[], city: string): Promise<void> {
    try {
      await Promise.all(
        hotels.map(async (hotel) => {
          const amapId = hotel.name + hotel.location;

          await prisma.hotel.upsert({
            where: { amapId },
            update: {
              name: hotel.name,
              address: hotel.address,
              location: hotel.location,
              tel: hotel.tel || null,
              type: hotel.type,
              rating: hotel.rating || null,
              city,
              updatedAt: new Date(),
            },
            create: {
              amapId,
              name: hotel.name,
              address: hotel.address,
              location: hotel.location,
              tel: hotel.tel || null,
              type: hotel.type,
              rating: hotel.rating || null,
              city,
              hitCount: 1,
            },
          });
        })
      );
    } catch (error) {
      console.error('❌ 保存酒店到数据库失败:', error);
    }
  }

  /**
   * 计算两点之间的距离（米）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const hotelCacheService = new HotelCacheService();
