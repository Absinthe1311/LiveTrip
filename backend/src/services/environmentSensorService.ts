// 环境感知服务 - 监控IoT数据变化，判断是否需要提醒用户
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 感知类型枚举
export enum SensorType {
  RAIN = 'rain',           // 降雨感知
  CROWD = 'crowd',         // 人流感知
  TEMPERATURE = 'temp',    // 温度感知
  CLOSE = 'close',         // 关闭感知
}

// 感知级别枚举
export enum SensorLevel {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
}

// 感知结果接口
export interface SensorResult {
  type: SensorType;
  spotId: string;
  spotName: string;
  level: SensorLevel;
  message: string;
  data: any;
  timestamp: Date;
}

// 感知规则配置
interface SensorRuleConfig {
  // 降雨规则
  rain: {
    warning: number;   // 警告阈值（默认50%）
    danger: number;    // 危险阈值（默认80%）
    outdoorOnly: boolean;  // 仅对户外景点（默认true）
  };
  // 人流规则
  crowd: {
    warning: number;   // 警告阈值（默认60%）
    danger: number;    // 危险阈值（默认90%）
  };
  // 温度规则
  temperature: {
    lowWarning: number;   // 低温警告（默认5°C）
    highWarning: number;  // 高温警告（默认35°C）
    lowDanger: number;    // 低温危险（默认0°C）
    highDanger: number;   // 高温危险（默认40°C）
  };
}

// 默认规则配置
const DEFAULT_RULE_CONFIG: SensorRuleConfig = {
  rain: {
    warning: 50,
    danger: 80,
    outdoorOnly: true,
  },
  crowd: {
    warning: 60,
    danger: 90,
  },
  temperature: {
    lowWarning: 5,
    highWarning: 35,
    lowDanger: 0,
    highDanger: 40,
  },
};

class EnvironmentSensorService {
  private ruleConfig: SensorRuleConfig;

  constructor(config?: Partial<SensorRuleConfig>) {
    this.ruleConfig = {
      ...DEFAULT_RULE_CONFIG,
      ...config,
    };
  }

  /**
   * 执行环境感知
   * @param spotIds 景点ID列表
   * @returns 感知结果列表
   */
  async sense(spotIds: string[]): Promise<SensorResult[]> {
    console.log(`\n🔍 开始环境感知，共 ${spotIds.length} 个景点...`);

    const results: SensorResult[] = [];

    for (const spotId of spotIds) {
      try {
        // 降雨感知
        const rainResult = await this.senseRain(spotId);
        if (rainResult) results.push(rainResult);

        // 人流感知
        const crowdResult = await this.senseCrowd(spotId);
        if (crowdResult) results.push(crowdResult);

        // 温度感知
        const tempResult = await this.senseTemperature(spotId);
        if (tempResult) results.push(tempResult);

        // 关闭感知
        const closeResult = await this.senseClose(spotId);
        if (closeResult) results.push(closeResult);
      } catch (error) {
        console.error(`景点 ${spotId} 感知失败:`, error);
      }
    }

    console.log(`✅ 环境感知完成，发现 ${results.length} 个感知结果`);
    return results;
  }

  /**
   * 降雨感知
   * 检测景点降雨概率，判断是否需要提醒用户
   */
  private async senseRain(spotId: string): Promise<SensorResult | null> {
    // 获取景点信息
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { iotData: true },
    });

    if (!spot || !spot.iotData) return null;

    // 检查是否为户外景点
    const isOutdoor = this.isOutdoorAttraction(spot);
    if (this.ruleConfig.rain.outdoorOnly && !isOutdoor) return null;

    // 获取降雨概率
    const rainProbability = spot.iotData.rainProbability;

    // 判断感知级别
    let level: SensorLevel | null = null;
    let message = '';

    if (rainProbability >= this.ruleConfig.rain.danger) {
      level = SensorLevel.DANGER;
      message = `⚠️ ${spot.name}降雨概率极高(${rainProbability.toFixed(0)}%)，建议调整行程或携带雨具`;
    } else if (rainProbability >= this.ruleConfig.rain.warning) {
      level = SensorLevel.WARNING;
      message = `🌧️ ${spot.name}可能下雨(${rainProbability.toFixed(0)}%)，建议准备雨具`;
    } else if (rainProbability >= 30) {
      level = SensorLevel.INFO;
      message = `🌦️ ${spot.name}有小雨可能(${rainProbability.toFixed(0)}%)`;
    }

    if (!level) return null;

    return {
      type: SensorType.RAIN,
      spotId,
      spotName: spot.name,
      level,
      message,
      data: {
        rainProbability,
        weatherDescription: spot.iotData.weatherDescription,
        isOutdoor,
      },
      timestamp: new Date(),
    };
  }

  /**
   * 人流感知
   * 检测景点拥挤度，判断是否需要提醒用户
   */
  private async senseCrowd(spotId: string): Promise<SensorResult | null> {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { iotData: true },
    });

    if (!spot || !spot.iotData) return null;

    const crowdLevel = spot.iotData.crowdLevel;

    // 判断感知级别
    let level: SensorLevel | null = null;
    let message = '';

    if (crowdLevel >= this.ruleConfig.crowd.danger) {
      level = SensorLevel.DANGER;
      message = `👥 ${spot.name}极度拥挤(${crowdLevel.toFixed(0)}%)，建议避开或选择其他时间`;
    } else if (crowdLevel >= this.ruleConfig.crowd.warning) {
      level = SensorLevel.WARNING;
      message = `👥 ${spot.name}人流较多(${crowdLevel.toFixed(0)}%)，可能需要排队`;
    }

    if (!level) return null;

    return {
      type: SensorType.CROWD,
      spotId,
      spotName: spot.name,
      level,
      message,
      data: { crowdLevel },
      timestamp: new Date(),
    };
  }

  /**
   * 温度感知
   * 检测极端温度，判断是否需要提醒用户
   */
  private async senseTemperature(spotId: string): Promise<SensorResult | null> {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { iotData: true },
    });

    if (!spot || !spot.iotData) return null;

    const temperature = spot.iotData.temperature;

    // 判断感知级别
    let level: SensorLevel | null = null;
    let message = '';

    // 高温判断
    if (temperature >= this.ruleConfig.temperature.highDanger) {
      level = SensorLevel.DANGER;
      message = `🌡️ ${spot.name}温度极高(${temperature.toFixed(0)}°C)，注意防暑降温`;
    } else if (temperature >= this.ruleConfig.temperature.highWarning) {
      level = SensorLevel.WARNING;
      message = `🌡️ ${spot.name}温度较高(${temperature.toFixed(0)}°C)，建议做好防晒`;
    }
    // 低温判断
    else if (temperature <= this.ruleConfig.temperature.lowDanger) {
      level = SensorLevel.DANGER;
      message = `❄️ ${spot.name}温度极低(${temperature.toFixed(0)}°C)，注意保暖防寒`;
    } else if (temperature <= this.ruleConfig.temperature.lowWarning) {
      level = SensorLevel.WARNING;
      message = `❄️ ${spot.name}温度较低(${temperature.toFixed(0)}°C)，建议多穿衣物`;
    }

    if (!level) return null;

    return {
      type: SensorType.TEMPERATURE,
      spotId,
      spotName: spot.name,
      level,
      message,
      data: { temperature },
      timestamp: new Date(),
    };
  }

  /**
   * 关闭感知
   * 检测景点是否关闭
   */
  private async senseClose(spotId: string): Promise<SensorResult | null> {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { iotData: true },
    });

    if (!spot || !spot.iotData) return null;

    const isOpen = spot.iotData.isOpen;

    // 景点关闭
    if (!isOpen) {
      return {
        type: SensorType.CLOSE,
        spotId,
        spotName: spot.name,
        level: SensorLevel.DANGER,
        message: `🚫 ${spot.name}已关闭，请调整行程`,
        data: { isOpen: false },
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * 判断是否为户外景点
   */
  private isOutdoorAttraction(spot: any): boolean {
    const type = spot.type || spot.description || '';
    const outdoorTypes = ['公园', '风景区', '广场', '街道', '古镇', '遗迹', '海滩', '山', '湖', '海岛', '自然'];

    return outdoorTypes.some(t => type.includes(t));
  }

  /**
   * 记录感知日志到数据库
   */
  async logSensorResult(result: SensorResult): Promise<void> {
    try {
      await prisma.environmentSensorLog.create({
        data: {
          spotId: result.spotId,
          crowdLevel: result.data.crowdLevel || 0,
          temperature: result.data.temperature || 0,
          rainProbability: result.data.rainProbability || 0,
          isOpen: result.data.isOpen || false,
          weatherDescription: result.data.weatherDescription,
          weatherIcon: result.data.weatherIcon,
        },
      });
    } catch (error) {
      console.error('记录感知日志失败:', error);
    }
  }

  /**
   * 批量记录感知日志
   */
  async logSensorResults(results: SensorResult[]): Promise<void> {
    for (const result of results) {
      await this.logSensorResult(result);
    }
  }
}

// 导出单例
export const environmentSensorService = new EnvironmentSensorService();
