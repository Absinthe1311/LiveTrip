// 路径优化服务 - 优化每天的景点游览顺序
import { RecommendedAttraction } from './aiRecommender';

// 带坐标的景点
interface AttractionWithCoords extends RecommendedAttraction {
  lng: number;
  lat: number;
}

class RouteOptimizer {
  /**
   * 优化每天的景点游览顺序
   * 使用贪心算法：从第一个景点开始，每次选择距离当前位置最近的未访问景点
   */
  optimizeRoute(attractions: RecommendedAttraction[]): RecommendedAttraction[] {
    if (attractions.length <= 1) {
      return attractions;
    }

    console.log(`🗺️  优化 ${attractions.length} 个景点的游览顺序...`);

    // 解析经纬度
    const attractionsWithCoords: AttractionWithCoords[] = attractions.map((attr) => ({
      ...attr,
      ...this.parseLocation(attr.location),
    }));

    // 使用贪心算法优化顺序
    const optimized = this.greedyOptimization(attractionsWithCoords);

    console.log('✅ 路径优化完成');
    return optimized;
  }

  /**
   * 贪心算法优化路径
   * 从第一个景点开始，每次选择距离当前位置最近的未访问景点
   */
  private greedyOptimization(attractions: AttractionWithCoords[]): RecommendedAttraction[] {
    const unvisited = [...attractions];
    const optimized: RecommendedAttraction[] = [];

    // 从第一个景点开始
    let current = unvisited.shift()!;
    optimized.push(this.stripCoords(current));

    while (unvisited.length > 0) {
      // 找到距离当前位置最近的景点
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current, unvisited[0]);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(current, unvisited[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // 移动到最近的景点
      current = unvisited.splice(nearestIndex, 1)[0];
      optimized.push(this.stripCoords(current));
    }

    return optimized;
  }

  /**
   * 解析经纬度字符串
   */
  private parseLocation(location: string): { lng: number; lat: number } {
    const parts = location.split(',');
    if (parts.length !== 2) {
      console.warn(`⚠️  无效的经纬度格式: ${location}`);
      return { lng: 0, lat: 0 };
    }

    const lng = parseFloat(parts[0].trim());
    const lat = parseFloat(parts[1].trim());

    if (isNaN(lng) || isNaN(lat)) {
      console.warn(`⚠️  无法解析经纬度: ${location}`);
      return { lng: 0, lat: 0 };
    }

    return { lng, lat };
  }

  /**
   * 计算两个坐标之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  private calculateDistance(point1: AttractionWithCoords, point2: AttractionWithCoords): number {
    const R = 6371; // 地球半径（公里）

    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 保留两位小数
  }

  /**
   * 将角度转换为弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 移除坐标信息
   */
  private stripCoords(attraction: AttractionWithCoords): RecommendedAttraction {
    const { lng, lat, ...rest } = attraction;
    return rest;
  }

  /**
   * 计算总行程距离
   */
  calculateTotalDistance(attractions: RecommendedAttraction[]): number {
    if (attractions.length <= 1) {
      return 0;
    }

    const attractionsWithCoords = attractions.map((attr) => ({
      ...attr,
      ...this.parseLocation(attr.location),
    }));

    let totalDistance = 0;
    for (let i = 0; i < attractionsWithCoords.length - 1; i++) {
      totalDistance += this.calculateDistance(attractionsWithCoords[i], attractionsWithCoords[i + 1]);
    }

    return Math.round(totalDistance * 100) / 100;
  }

  /**
   * 重新分配时间段（基于优化后的顺序）
   * 保持每个景点的游览时长不变，但调整开始和结束时间
   */
  recalculateTimeSlots(attractions: RecommendedAttraction[]): RecommendedAttraction[] {
    if (attractions.length === 0) {
      return attractions;
    }

    // 解析第一个景点的时间
    const firstTime = attractions[0].time.split('-')[0];
    const [firstHours, firstMinutes] = firstTime.split(':').map(Number);
    let currentMinutes = firstHours * 60 + firstMinutes;

    return attractions.map((attraction) => {
      // 解析当前景点的时间段，获取游览时长
      const [startStr, endStr] = attraction.time.split('-');
      const [startHours, startMinutes] = startStr.split(':').map(Number);
      const [endHours, endMinutes] = endStr.split(':').map(Number);
      const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

      // 计算新的时间段
      const newStart = currentMinutes;
      const newEnd = currentMinutes + duration;

      // 更新当前时间（景点之间间隔 30 分钟）
      currentMinutes = newEnd + 30;

      return {
        ...attraction,
        time: `${this.minutesToTime(newStart)}-${this.minutesToTime(newEnd)}`,
      };
    });
  }

  /**
   * 将分钟数转换为时间字符串
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

// 导出工厂函数
export const getRouteOptimizer = (): RouteOptimizer => {
  return new RouteOptimizer();
};

// 向后兼容的单例导出（延迟初始化）
let routeOptimizerInstance: RouteOptimizer | null = null;
export const routeOptimizer = (): RouteOptimizer => {
  if (!routeOptimizerInstance) {
    routeOptimizerInstance = new RouteOptimizer();
  }
  return routeOptimizerInstance;
};
