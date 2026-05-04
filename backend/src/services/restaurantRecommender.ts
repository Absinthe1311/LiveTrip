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
  type: string; // 菜系/类型
  rating?: number; // 高德评分
  distance: number; // 距中心点距离（m）
}

// 每天餐厅推荐结果
export interface DayRestaurantRecommendation {
  day: number;
  date: string;
  centerSpot: string; // 中心点景点名称
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
  async ResRec(
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
        const centerIndex = this.centerIdx(dayData.spots.length);
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
          restaurants = cachedRestaurants.map((r) => ({
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
          restaurants = await amapRateLimiter.exec(async () => {
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
          const restaurantCaches: RestaurantCache[] = restaurants.map((r) => ({
            name: r.name,
            address: r.address,
            location: r.location,
            tel: r.tel,
            type: r.type,
            rating: r.rating,
          }));

          const city = this.guessCity(dayData.spots);
          await restaurantCacheService.storeRes(restaurantCaches, city);
          console.log(`💾 [数据库] 第${dayData.day}天保存 ${restaurants.length} 个餐厅`);
        }

        // 处理餐厅数据
        const processedRestaurants = restaurants.map((r) => ({
          name: r.name,
          address: r.address,
          location: r.location,
          tel: r.tel,
          type: this.foodType(r.type),
          rating: r.rating,
          distance: r.distance
            ? parseInt(r.distance)
            : this.calcDist(r.location, centerSpot.location),
        }));

        // 过滤不合适的餐厅（快餐、学校餐厅等）
        const filteredRestaurants = this.filterBad(processedRestaurants);

        console.log(`🔍 过滤前: ${processedRestaurants.length} 个餐厅`);
        console.log(`✅ 过滤后: ${filteredRestaurants.length} 个合适餐厅`);

        // 如果过滤后数量不足，放宽过滤条件，保留部分餐厅
        let finalRestaurants = filteredRestaurants;
        if (filteredRestaurants.length < 3) {
          console.log(`⚠️  过滤后餐厅不足3个，放宽过滤条件`);
          // 重新过滤，仅排除明显不合适的（学校、医院等）
          const relaxedFiltered = processedRestaurants.filter((r) => {
            const nameAndType = `${r.name} ${r.type} ${r.address}`;
            const severeExcluded = ['学校', '医院', '诊所', '药店', '便利店', '停车场', '加油站'];
            return !severeExcluded.some((keyword) => nameAndType.includes(keyword));
          });
          finalRestaurants = relaxedFiltered;
        }

        // 排序：有评分的优先，按评分降序；无评分的排在后面
        const sortedRestaurants = this.orderDining(finalRestaurants);

        // 返回最多5个推荐
        const recommendations = sortedRestaurants.slice(0, Math.min(5, sortedRestaurants.length));

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
  private centerIdx(count: number): number {
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
  private foodType(type: string): string {
    if (!type) {
      return '餐厅';
    }

    // 常见菜系关键词
    const cuisineKeywords = [
      '中餐',
      '西餐',
      '日料',
      '韩料',
      '火锅',
      '烧烤',
      '海鲜',
      '川菜',
      '湘菜',
      '粤菜',
      '鲁菜',
      '苏菜',
      '浙菜',
      '闽菜',
      '徽菜',
      '快餐',
      '小吃',
      '面食',
      '饺子',
      '披萨',
      '汉堡',
      '咖啡',
      '茶餐厅',
      '自助餐',
      '料理',
      '菜',
      '餐',
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
   * 过滤不合适的餐厅类型
   * @param restaurants 餐厅列表
   * @returns 过滤后的餐厅列表
   */
  private filterBad(restaurants: Restaurant[]): Restaurant[] {
    // 不合适的餐厅类型关键词（排除快餐、学校餐厅等）
    const excludedKeywords = [
      '快餐',
      '小吃店',
      '学校',
      '食堂',
      '外卖',
      '便利店',
      '咖啡厅',
      '咖啡店',
      '奶茶',
      '甜品',
      '酒吧',
      '夜总会',
      'KTV',
      '网吧',
      '棋牌',
      '足浴',
      '按摩',
      'SPA',
      '美容',
      '美发',
      '理发',
      '洗衣',
      '照相',
      '复印',
      '快递',
      '物流',
      '停车场',
      '加油站',
      '汽修',
      '洗车',
      '药店',
      '医院',
      '诊所',
      '宠物',
      '花店',
      '水果',
      '超市',
      '商场',
      '市场',
      '摊位',
      '大排档',
      '路边摊',
      // 连锁快餐品牌
      '肯德基',
      'KFC',
      '麦当劳',
      "McDonald's",
      '必胜客',
      'Pizza Hut',
      '德克士',
      'Dicos',
      '华莱士',
      '汉堡王',
      'Burger King',
    ];

    // 优先保留的餐厅类型关键词
    const preferredKeywords = [
      '中餐厅',
      '西餐厅',
      '餐厅',
      '饭店',
      '酒楼',
      '酒家',
      '日料',
      '日式',
      '韩料',
      '韩式',
      '料理',
      '火锅',
      '烧烤',
      '烤肉',
      '海鲜',
      '自助餐',
      '川菜',
      '湘菜',
      '粤菜',
      '鲁菜',
      '苏菜',
      '浙菜',
      '闽菜',
      '徽菜',
      '私房菜',
      '特色菜',
      '地方菜',
      '家常菜',
      '土菜馆',
      '茶餐厅',
      '港式',
      '台湾菜',
      '东南亚',
      '泰国菜',
      '印度菜',
    ];

    return restaurants.filter((restaurant) => {
      const nameAndType = `${restaurant.name} ${restaurant.type} ${restaurant.address}`;

      // 检查是否包含排除关键词
      for (const keyword of excludedKeywords) {
        if (nameAndType.includes(keyword)) {
          console.log(`🚫 过滤不合适餐厅: ${restaurant.name} (包含: ${keyword})`);
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 根据坐标计算距离（当高德未返回distance时使用）
   * @param location1 坐标1
   * @param location2 坐标2
   * @returns 距离（米）
   */
  private calcDist(location1: string, location2: string): number {
    try {
      const amapServiceInstance = amapService();
      const distanceKm = amapServiceInstance.calcDist(location1, location2);
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
  private orderDining(restaurants: Restaurant[]): Restaurant[] {
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
  private guessCity(spots: Array<{ name: string; location: string }>): string {
    return '未知城市';
  }
}

// 导出单例
export const restaurantRecommender = new RestaurantRecommender();
