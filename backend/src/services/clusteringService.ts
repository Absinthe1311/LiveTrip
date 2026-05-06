// K-means 聚类服务 - 按地理位置将景点分组
import { SpotScore, SpotCluster } from '../types';

interface Point {
  lng: number;
  lat: number;
}

class ClusteringService {
  /**
   * 使用 K-means 算法将景点聚类
   */
  async KMeans(spots: SpotScore[], k: number): Promise<SpotCluster[]> {

    if (spots.length === 0) {
      return [];
    }

    if (spots.length <= k) {
      // 景点数量小于等于 K，每个景点一个聚类
      return spots.map((spot, index) => ({
        clusterId: index,
        spots: [spot],
        center: this.parseLoc(spot.spot.location),
      }));
    }

    // 1. 选择初始中心点（使用评分最高的 K 个点）
    const initialCenters = this.initCenters(spots, k);

    // 2. 迭代优化
    let clusters = this.assign(spots, initialCenters);
    let iteration = 0;
    const maxIterations = 100;
    let converged = false;

    while (!converged && iteration < maxIterations) {
      // 重新计算中心点
      const newCenters = this.recalcCenters(clusters);

      // 重新分配景点
      const newClusters = this.assign(spots, newCenters);

      // 检查是否收敛
      converged = this.converged(clusters, newClusters);

      clusters = newClusters;
      iteration++;
    }


    // 3. 后处理：平衡聚类
    const balancedClusters = this.evenOut(clusters);

    return balancedClusters;
  }

  /**
   * 选择初始中心点（使用评分最高的 K 个点）
   */
  private initCenters(spots: SpotScore[], k: number): Point[] {
    // 按评分降序排序，取前 K 个
    const sortedSpots = [...spots].sort((a, b) => b.totalScore - a.totalScore);
    const topKSpots = sortedSpots.slice(0, k);

    return topKSpots.map((spot) => this.parseLoc(spot.spot.location));
  }

  /**
   * 将景点分配到最近的聚类
   */
  private assign(spots: SpotScore[], centers: Point[]): SpotCluster[] {
    const clusters: SpotCluster[] = centers.map((center, index) => ({
      clusterId: index,
      spots: [],
      center,
    }));

    for (const spot of spots) {
      const spotLocation = this.parseLoc(spot.spot.location);

      // 找到最近的中心点
      let minDistance = Infinity;
      let nearestClusterId = 0;

      for (let i = 0; i < centers.length; i++) {
        const distance = this.calcDist(spotLocation, centers[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestClusterId = i;
        }
      }

      clusters[nearestClusterId].spots.push(spot);
    }

    return clusters;
  }

  /**
   * 重新计算每个聚类的中心点
   */
  private recalcCenters(clusters: SpotCluster[]): Point[] {
    return clusters.map((cluster) => {
      if (cluster.spots.length === 0) {
        return cluster.center;
      }

      // 计算所有景点的平均位置
      const sumLng = cluster.spots.reduce((sum, spot) => {
        const location = this.parseLoc(spot.spot.location);
        return sum + location.lng;
      }, 0);

      const sumLat = cluster.spots.reduce((sum, spot) => {
        const location = this.parseLoc(spot.spot.location);
        return sum + location.lat;
      }, 0);

      return {
        lng: sumLng / cluster.spots.length,
        lat: sumLat / cluster.spots.length,
      };
    });
  }

  /**
   * 检查聚类是否收敛
   */
  private converged(oldClusters: SpotCluster[], newClusters: SpotCluster[]): boolean {
    for (let i = 0; i < oldClusters.length; i++) {
      const oldCenter = oldClusters[i].center;
      const newCenter = newClusters[i].center;

      const distance = this.calcDist(oldCenter, newCenter);
      if (distance > 0.001) {
        // 阈值：0.001 公里
        return false;
      }
    }

    return true;
  }

  /**
   * 平衡聚类（处理景点数量不均的情况）
   */
  private evenOut(clusters: SpotCluster[]): SpotCluster[] {

    const averageSpots = clusters.reduce((sum, c) => sum + c.spots.length, 0) / clusters.length;

    for (const cluster of clusters) {
      // 如果景点太少（< 平均值的 50%），从相邻聚类借调
      if (cluster.spots.length < averageSpots * 0.5) {

        // 找到最近的聚类
        let nearestCluster: SpotCluster | null = null;
        let minDistance = Infinity;

        for (const otherCluster of clusters) {
          if (otherCluster.clusterId === cluster.clusterId) continue;

          const distance = this.calcDist(cluster.center, otherCluster.center);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = otherCluster;
          }
        }

        // 从最近的聚类借调 1-2 个低分景点
        if (nearestCluster && nearestCluster.spots.length > 3) {
          const spotsToMove = nearestCluster.spots
            .sort((a, b) => a.totalScore - b.totalScore)
            .slice(0, 2);

          // 从原聚类移除
          nearestCluster.spots = nearestCluster.spots.filter((spot) => !spotsToMove.includes(spot));

          // 添加到目标聚类
          cluster.spots.push(...spotsToMove);

        }
      }

      // 如果景点太多（> 平均值的 150%），移除低分景点到相邻聚类
      if (cluster.spots.length > averageSpots * 1.5) {

        // 找到最近的聚类
        let nearestCluster: SpotCluster | null = null;
        let minDistance = Infinity;

        for (const otherCluster of clusters) {
          if (otherCluster.clusterId === cluster.clusterId) continue;

          const distance = this.calcDist(cluster.center, otherCluster.center);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = otherCluster;
          }
        }

        // 移除 1-2 个低分景点
        if (nearestCluster) {
          const spotsToMove = cluster.spots.sort((a, b) => a.totalScore - b.totalScore).slice(0, 2);

          // 从原聚类移除
          cluster.spots = cluster.spots.filter((spot) => !spotsToMove.includes(spot));

          // 添加到目标聚类
          nearestCluster.spots.push(...spotsToMove);

        }
      }
    }


    return clusters;
  }

  /**
   * 解析经纬度字符串
   */
  private parseLoc(location: string): Point {
    const parts = location.split(',');
    if (parts.length !== 2) {
      return { lng: 0, lat: 0 };
    }

    const lng = parseFloat(parts[0].trim());
    const lat = parseFloat(parts[1].trim());

    if (isNaN(lng) || isNaN(lat)) {
      return { lng: 0, lat: 0 };
    }

    return { lng, lat };
  }

  /**
   * 计算两点之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  private calcDist(point1: Point, point2: Point): number {
    const R = 6371; // 地球半径（公里）

    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 保留两位小数
  }

  /**
   * 将角度转换为弧度
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// 导出单例
export const clusteringService = new ClusteringService();
