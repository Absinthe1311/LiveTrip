// 餐厅推荐服务 - 基于每天行程景点位置推荐午餐餐厅
import { amapService, AmapAttraction } from './amapService';
import { amapRateLimiter } from '../utils/apiRateLimiter';
import { restaurantCacheService, RestaurantCache } from './restaurantCacheService';

// 餐厅信息接口
export interface Restaurant {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type: string;           // 菜系/类型
  rating?: number;        // 高德评分
  distance: number;       // 距中心点距离（m）
}

// 每天餐厅推荐结果
export interface DayRestaurantRecommendation {
  day: number;
  date: string;
  centerSpot: string;     // 中心点景点名称
  centerLocation: string; // 中心点坐标
  restaurants: Restaurant[];
}

// 餐厅推荐请求参数
export interface RestaurantRecommendRequest {
  days: Array<{
    day: number;
    date: string;
    spots: Array<{
      name: string;
      location: string;
    }>;
  }>;
}

class RestaurantRecommender {
  /**
   * 获取餐厅推荐（按天）
   * @param days 每天的行程数据
   * @returns 每天的餐厅推荐列表
   */
  async getRestaurantRecommendations(
    days: Array<{
      day: number;
      date: string;
      spots: Array<{ name: string; location: string }>;
    }>
  ): Promise<DayRestaurantRecommendation[]> {
    try {
      const results: DayRestaurantRecommendation[] = [];

      for (const dayData of days) {
        if (!dayData.spots || dayData.spots.length === 0) {
          results.push({
            day: dayData.day,
            date: dayData.date,
            centerSpot: '',
            centerLocation: '',
            restaurants: [],
          });
          continue;
        }

        // 计算中间景点索引
        const centerIndex = this.getCenterIndex(dayData.spots.length);
        const centerSpot = dayData.spots[centerIndex];

        // 先从数据库查询附近餐厅
        const cachedRestaurants = await restaurantCacheService.getNearbyRestaurants(
          centerSpot.location,
          1000,
          20
        );

        let restaurants: AmapAttraction[];

        if (cachedRestaurants && cachedRestaurants.length > 0) {
          console.log(`✅ [数据库] 第${dayData.day}天找到 ${cachedRestaurants.length} 个餐厅`);
          restaurants = cachedRestaurants.map(r => ({
            name: r.name,
            location: r.location,
            address: r.address,
            type: r.type,
            typecode: '050000',
            tel: r.tel,
            rating: r.rating,
          }));
        } else {
          // 数据库没有，调用高德API
          console.log(`📡 [高德API] 第${dayData.day}天搜索餐厅 - 中心点: ${centerSpot.location}`);
          restaurants = await amapRateLimiter.execute(async () => {
            const amapServiceInstance = amapService();
            return await amapServiceInstance.searchAround(
              centerSpot.location,
              '餐厅',
              '050000',
              1000,
              20
            );
          });

          if (restaurants.length === 0) {
            results.push({
              day: dayData.day,
              date: dayData.date,
              centerSpot: centerSpot.name,
              centerLocation: centerSpot.location,
              restaurants: [],
            });
            continue;
          }

          console.log(`✅ [高德API] 第${dayData.day}天找到 ${restaurants.length} 个餐厅`);

          // 保存到数据库
          const restaurantCaches: RestaurantCache[] = restaurants.map(r => ({
            name: r.name,
            address: r.address,
            location: r.location,
            tel: r.tel,
            type: r.type,
            rating: r.rating,
          }));

          const city = this.inferCityFromSpots(dayData.spots);
          await restaurantCacheService.saveRestaurants(restaurantCaches, city);
          console.log(`💾 [数据库] 第${dayData.day}天保存 ${restaurants.length} 个餐厅`);
        }

        // 处理餐厅数据
        const processedRestaurants = restaurants.map(r => ({
          name: r.name,
          address: r.address,
          location: r.location,
          tel: r.tel,
          type: this.extractCuisineType(r.type),
          rating: r.rating,
          distance: r.distance ? parseInt(r.distance) : this.calculateDistanceFromLocation(r.location, centerSpot.location),
        }));

        // 排序：有评分的优先，按评分降序；无评分的排在后面
        const sortedRestaurants = this.sortRestaurants(processedRestaurants);

        // 返回最多3个推荐
        const recommendations = sortedRestaurants.slice(0, Math.min(3, sortedRestaurants.length));

        results.push({
          day: dayData.day,
          date: dayData.date,
          centerSpot: centerSpot.name,
          centerLocation: centerSpot.location,
          restaurants: recommendations,
        });
      }

      return results;
    } catch (error) {
      console.error('❌ 餐厅推荐失败:', error);
      throw error;
    }
  }

  /**
   * 获取中间景点索引
   * - 若当天只有1个景点，返回0
   * - 若当天有偶数个景点，取靠前的中间索引
   * @param count 景点数量
   * @returns 中间索引
   */
  private getCenterIndex(count: number): number {
    if (count === 1) {
      return 0;
    }
    // 偶数个取靠前的中间索引，奇数个取正中间
    // 例如：4个取索引1，5个取索引2
    return Math.floor((count - 1) / 2);
  }

  /**
   * 从高德POI type字段提取菜系类型
   * @param type 高德POI type字段
   * @returns 菜系类型
   */
  private extractCuisineType(type: string): string {
    if (!type) {
      return '餐厅';
    }

    // 常见菜系关键词
    const cuisineKeywords = [
      '中餐', '西餐', '日料', '韩料', '火锅', '烧烤', '海鲜',
      '川菜', '湘菜', '粤菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜',
      '快餐', '小吃', '面食', '饺子', '披萨', '汉堡', '咖啡', '茶餐厅',
      '自助餐', '料理', '菜', '餐'
    ];

    // 分割type字段（高德type格式如："餐饮服务;中餐厅;川菜"）
    const typeParts = type.split(';');

    for (const part of typeParts) {
      for (const keyword of cuisineKeywords) {
        if (part.includes(keyword)) {
          return part;
        }
      }
    }

    // 如果没有匹配到，返回最后一个部分或"餐厅"
    return typeParts[typeParts.length - 1] || '餐厅';
  }

  /**
   * 根据坐标计算距离（当高德未返回distance时使用）
   * @param location1 坐标1
   * @param location2 坐标2
   * @returns 距离（米）
   */
  private calculateDistanceFromLocation(location1: string, location2: string): number {
    try {
      const amapServiceInstance = amapService();
      const distanceKm = amapServiceInstance.calculateDistance(location1, location2);
      return Math.round(distanceKm * 1000); // 转换为米
    } catch (error) {
      console.error('❌ 计算距离失败:', error);
      return 0; // 返回默认值
    }
  }

  /**
   * 排序餐厅
   * - 有评分的优先，按评分降序
   * - 无评分的排在后面
   * @param restaurants 餐厅列表
   * @returns 排序后的餐厅列表
   */
  private sortRestaurants(restaurants: Restaurant[]): Restaurant[] {
    return restaurants.sort((a, b) => {
      // 有评分的排前面
      if (a.rating !== undefined && b.rating === undefined) {
        return -1;
      }
      if (a.rating === undefined && b.rating !== undefined) {
        return 1;
      }
      // 都有评分，按评分降序
      if (a.rating !== undefined && b.rating !== undefined) {
        return b.rating - a.rating;
      }
      // 都没有评分，按距离升序
      return a.distance - b.distance;
    });
  }

  /**
   * 从景点列表推断城市名称
   */
  private inferCityFromSpots(spots: Array<{ name: string; location: string }>): string {
    return '未知城市';
  }
}

// 导出单例
export const restaurantRecommender = new RestaurantRecommender();
