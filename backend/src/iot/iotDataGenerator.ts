// IoT 数据生成器 - 模拟真实的 IoT 实时数据
// 数据在服务器内存中持续存在，每次调用只做小幅更新

// 景点 IoT 数据接口
export interface SpotIoTData {
  id: string;
  name: string;
  crowdLevel: number; // 0-100%
  temperature: number; // °C
  rainProbability: number; // 0-100%
  isOpen: boolean;
}

// IoT 数据响应接口
export interface IoTDataResponse {
  timestamp: number;
  spots: SpotIoTData[];
}

// 景点数据接口
interface SpotData {
  id: string;
  name: string;
  baseCrowdLevel: number; // 基础人流水平
  baseTemperature: number; // 基础温度
  currentCrowdLevel: number; // 当前人流水平（用于平滑变化）
  currentTemperature: number; // 当前温度（用于平滑变化）
  currentRainProbability: number; // 当前降雨概率（用于平滑变化）
  isOutdoor: boolean; // 是否为户外景点
}

// 预定义的著名景点列表
const PREDEFINED_SPOTS: Array<{
  id: string;
  name: string;
  baseCrowdLevel: number;
  baseTemperature: number;
  isOutdoor: boolean;
}> = [
  { id: '1', name: '故宫博物院', baseCrowdLevel: 70, baseTemperature: 22, isOutdoor: true },
  { id: '2', name: '天安门广场', baseCrowdLevel: 80, baseTemperature: 21, isOutdoor: true },
  { id: '3', name: '国家博物馆', baseCrowdLevel: 60, baseTemperature: 23, isOutdoor: false },
  { id: '4', name: '颐和园', baseCrowdLevel: 55, baseTemperature: 20, isOutdoor: true },
  { id: '5', name: '天坛公园', baseCrowdLevel: 65, baseTemperature: 21, isOutdoor: true },
  { id: '6', name: '圆明园', baseCrowdLevel: 45, baseTemperature: 20, isOutdoor: true },
  { id: '7', name: '北海公园', baseCrowdLevel: 50, baseTemperature: 21, isOutdoor: true },
  { id: '8', name: '景山公园', baseCrowdLevel: 40, baseTemperature: 21, isOutdoor: true },
  { id: '9', name: '雍和宫', baseCrowdLevel: 55, baseTemperature: 22, isOutdoor: false },
  { id: '10', name: '孔庙和国子监', baseCrowdLevel: 35, baseTemperature: 22, isOutdoor: true },
];

// IoT 数据生成器类
class IoTDataGenerator {
  private spots: SpotData[] = [];
  private lastUpdateTime: number = 0;
  private currentRainProbability: number = 30; // 全局降雨概率

  constructor() {
    // 初始化景点数据
    this.initializeSpots();
  }

  /**
   * 初始化景点数据
   */
  private initializeSpots(): void {
    this.spots = PREDEFINED_SPOTS.map((spot) => ({
      ...spot,
      currentCrowdLevel: spot.baseCrowdLevel,
      currentTemperature: spot.baseTemperature,
      currentRainProbability: this.currentRainProbability,
    }));
  }

  /**
   * 获取当前小时（0-23）
   */
  private getCurrentHour(): number {
    const now = new Date();
    return now.getHours();
  }

  /**
   * 计算时间影响因子（用于人流高峰）
   * 早上 8-10 点和下午 15-17 点为高峰期
   */
  private getTimeFactor(): number {
    const hour = this.getCurrentHour();

    // 早上高峰 8:00-10:00
    if (hour >= 8 && hour < 10) {
      // 8点开始上升，9点达到峰值，10点开始下降
      if (hour === 8) return 1.2;
      if (hour === 9) return 1.5;
      return 1.3;
    }

    // 下午高峰 15:00-17:00
    if (hour >= 15 && hour < 17) {
      // 15点开始上升，16点达到峰值，17点开始下降
      if (hour === 15) return 1.3;
      if (hour === 16) return 1.5;
      return 1.2;
    }

    // 夜间低峰 22:00-06:00
    if (hour >= 22 || hour < 6) {
      return 0.3;
    }

    // 其他时间段正常
    return 1.0;
  }

  /**
   * 计算目标人流水平（基于时间和基础人流）
   */
  private calculateTargetCrowdLevel(baseCrowdLevel: number): number {
    const timeFactor = this.getTimeFactor();
    const target = baseCrowdLevel * timeFactor;

    // 限制在 0-100 范围内
    return Math.max(0, Math.min(100, target));
  }

  /**
   * 平滑更新人流水平（小幅波动）
   */
  private smoothUpdateCrowdLevel(spot: SpotData): void {
    const target = this.calculateTargetCrowdLevel(spot.baseCrowdLevel);
    const current = spot.currentCrowdLevel;

    // 每次更新最多变化 5%（模拟真实客流波动）
    const maxChange = 5;
    const change = target - current;

    if (Math.abs(change) <= maxChange) {
      spot.currentCrowdLevel = target;
    } else {
      spot.currentCrowdLevel = current + (change > 0 ? maxChange : -maxChange);
    }

    // 添加微小的随机扰动（±2%）
    const noise = (Math.random() - 0.5) * 4;
    spot.currentCrowdLevel = Math.max(0, Math.min(100, spot.currentCrowdLevel + noise));
  }

  /**
   * 平滑更新温度（缓慢变化）
   */
  private smoothUpdateTemperature(spot: SpotData): void {
    const base = spot.baseTemperature;
    const current = spot.currentTemperature;

    // 温度变化非常缓慢（每次最多变化 0.5°C）
    const maxChange = 0.5;
    const change = base - current;

    if (Math.abs(change) <= maxChange) {
      spot.currentTemperature = base;
    } else {
      spot.currentTemperature = current + (change > 0 ? maxChange : -maxChange);
    }

    // 添加微小的随机扰动（±0.2°C）
    const noise = (Math.random() - 0.5) * 0.4;
    spot.currentTemperature = Math.round((spot.currentTemperature + noise) * 10) / 10;
  }

  /**
   * 平滑更新降雨概率（随机游走）
   */
  private smoothUpdateRainProbability(): void {
    // 降雨概率每次最多变化 5%
    const maxChange = 5;
    const target = Math.random() * 100; // 随机目标值
    const current = this.currentRainProbability;

    const change = target - current;
    if (Math.abs(change) <= maxChange) {
      this.currentRainProbability = target;
    } else {
      this.currentRainProbability = current + (change > 0 ? maxChange : -maxChange);
    }

    // 限制在 0-100 范围内
    this.currentRainProbability = Math.max(0, Math.min(100, this.currentRainProbability));
  }

  /**
   * 判断景点是否开放
   */
  private calculateIsOpen(spot: SpotData): boolean {
    const hour = this.getCurrentHour();

    // 夜间 22:00-06:00 默认关闭
    if (hour >= 22 || hour < 6) {
      return false;
    }

    // 下雨概率 > 80% 时，户外景点有 30% 概率关闭
    if (this.currentRainProbability > 80 && spot.isOutdoor) {
      return Math.random() > 0.3;
    }

    // 正常情况下 95% 概率开放
    return Math.random() > 0.05;
  }

  /**
   * 更新所有景点的 IoT 数据
   */
  private updateAllSpots(): void {
    // 更新全局降雨概率
    this.smoothUpdateRainProbability();

    // 更新每个景点的数据
    for (const spot of this.spots) {
      this.smoothUpdateCrowdLevel(spot);
      this.smoothUpdateTemperature(spot);
      spot.currentRainProbability = this.currentRainProbability;
    }
  }

  /**
   * 获取所有景点的 IoT 数据
   */
  public getIoTData(): IoTDataResponse {
    // 更新数据
    this.updateAllSpots();

    // 记录更新时间
    this.lastUpdateTime = Date.now();

    // 构建响应数据
    const spots: SpotIoTData[] = this.spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      crowdLevel: Math.round(spot.currentCrowdLevel),
      temperature: spot.currentTemperature,
      rainProbability: Math.round(spot.currentRainProbability),
      isOpen: this.calculateIsOpen(spot),
    }));

    return {
      timestamp: this.lastUpdateTime,
      spots,
    };
  }

  /**
   * 获取指定景点的 IoT 数据
   */
  public getSpotIoTData(spotId: string): SpotIoTData | null {
    const data = this.getIoTData();
    return data.spots.find((spot) => spot.id === spotId) || null;
  }

  /**
   * 重置所有数据（用于测试）
   */
  public reset(): void {
    this.initializeSpots();
    this.currentRainProbability = 30;
    this.lastUpdateTime = 0;
  }
}

// 导出单例
export const iotDataGenerator = new IoTDataGenerator();
