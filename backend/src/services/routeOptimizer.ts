// 路径优化服务 - 优化每天的景点游览顺序
import { RecommendedAttraction, CategoryTag } from '../types';

// 带坐标的景点
interface AttractionWithCoords extends RecommendedAttraction {
  lng: number;
  lat: number;
}

// 景点类型与体力消耗的映射
const SPOT_ENERGY_COST: Record<string, number> = {
  '博物馆': 30,
  '古迹': 40,
  '公园': 20,
  '风景区': 50,
  '广场': 10,
  '寺庙': 25,
  '古镇': 35,
  '商业街': 15,
  '主题乐园': 60,
  '动物园': 55,
  '水族馆': 40,
  '美术馆': 25,
  '海滩': 30,
  '餐厅': 10,
  '购物中心': 15,
};

class RouteOptimizer {
  /**
   * 优化每天的景点游览顺序
   * 使用 2-opt 算法：在贪心算法的基础上进行局部优化
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

    // 步骤1：使用贪心算法生成初始路线
    const initialRoute = this.greedyOptimization(attractionsWithCoords);
    const initialRouteWithCoords = initialRoute.map((attr, index) => ({
      ...attr,
      ...this.parseLocation(attr.location),
    }));

    // 步骤2：使用 2-opt 算法优化路线
    const optimized = this.twoOptOptimization(initialRouteWithCoords);

    console.log('✅ 路径优化完成（2-opt）');
    return optimized;
  }

  /**
   * 贪心算法优化路径（生成初始路线）
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
   * 2-opt 算法优化路径
   * 遍历所有可能的两条边交换，如果交换后总距离更短，则接受交换
   */
  private twoOptOptimization(route: AttractionWithCoords[]): RecommendedAttraction[] {
    let bestRoute = [...route];
    let bestDistance = this.calculateTotalDistanceWithCoords(bestRoute);
    let improved = true;
    const maxIterations = 100;
    let iteration = 0;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let j = i + 2; j < bestRoute.length; j++) {
          // 尝试交换两条边
          const newRoute = this.swapEdges(bestRoute, i, j);
          const newDistance = this.calculateTotalDistanceWithCoords(newRoute);

          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
            console.log(`   改进：${bestDistance.toFixed(2)}km (交换边 ${i}-${j})`);
          }
        }
      }
    }

    console.log(`   2-opt 迭代次数: ${iteration}，最终距离: ${bestDistance.toFixed(2)}km`);
    return bestRoute.map(attr => this.stripCoords(attr));
  }

  /**
   * 交换两条边
   * 路径：A -> B -> ... -> C -> D
   * 交换后：A -> C -> ... -> B -> D
   */
  private swapEdges(route: AttractionWithCoords[], i: number, j: number): AttractionWithCoords[] {
    const newRoute = [...route];
    
    // 反转 i+1 到 j 的部分
    const segment = newRoute.slice(i + 1, j + 1);
    segment.reverse();
    
    // 将反转后的片段放回原位置
    for (let k = 0; k < segment.length; k++) {
      newRoute[i + 1 + k] = segment[k];
    }
    
    return newRoute;
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

    return this.calculateTotalDistanceWithCoords(attractionsWithCoords);
  }

  /**
   * 计算带坐标的景点的总距离
   */
  private calculateTotalDistanceWithCoords(attractions: AttractionWithCoords[]): number {
    if (attractions.length <= 1) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 0; i < attractions.length - 1; i++) {
      totalDistance += this.calculateDistance(attractions[i], attractions[i + 1]);
    }

    return Math.round(totalDistance * 100) / 100;
  }

  /**
   * 获取景点的体力消耗
   */
  private getSpotEnergyCost(attraction: RecommendedAttraction): number {
    const type = attraction.type || attraction.description || '';
    
    // 根据类型查找体力消耗
    for (const [key, cost] of Object.entries(SPOT_ENERGY_COST)) {
      if (type.includes(key)) {
        return cost;
      }
    }
    
    return 30; // 默认中等消耗
  }

  /**
   * 计算路径的综合得分（距离 + 体力）
   */
  private calculateRouteScore(route: AttractionWithCoords[]): number {
    let totalDistance = this.calculateTotalDistanceWithCoords(route);
    let totalEnergy = 0;

    for (const attraction of route) {
      totalEnergy += this.getSpotEnergyCost(attraction);
    }

    // 综合得分 = 距离得分 × 0.6 + 体力得分 × 0.4
    // 距离得分：距离越短得分越高（归一化到 0-100）
    // 体力得分：合理分布得分越高
    
    const distanceScore = Math.max(0, 100 - totalDistance * 2); // 假设 50km 是最大距离
    const energyScore = this.calculateEnergyDistributionScore(totalEnergy, route.length);
    
    return distanceScore * 0.6 + energyScore * 0.4;
  }

  /**
   * 计算体力分布得分
   * 体力消耗大的景点应该安排在上午，轻松的景点安排在下午
   */
  private calculateEnergyDistributionScore(totalEnergy: number, spotCount: number): number {
    // 简单实现：平均每个景点的体力消耗
    const avgEnergy = totalEnergy / spotCount;
    
    // 如果平均体力消耗在合理范围内（20-50），给高分
    if (avgEnergy >= 20 && avgEnergy <= 50) {
      return 100;
    } else if (avgEnergy > 50) {
      // 体力消耗过大，扣分
      return Math.max(0, 100 - (avgEnergy - 50) * 2);
    } else {
      // 体力消耗过小，可能不够充实
      return avgEnergy * 2;
    }
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
