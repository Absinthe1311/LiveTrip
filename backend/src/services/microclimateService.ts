// 微气候调整服务 - 基于景点特征实现精细化天气数据调整
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 微气候类型枚举
export enum MicroclimateType {
  MOUNTAIN = 'mountain', // 山区
  LAKE = 'lake', // 湖泊/水域
  RIVER = 'river', // 河流
  URBAN = 'urban', // 市区
  SUBURBAN = 'suburban', // 郊区
  COASTAL = 'coastal', // 海边
  FOREST = 'forest', // 森林/公园
  HISTORICAL = 'historical', // 古镇/遗迹（通常在郊区）
  DEFAULT = 'default', // 默认（无特殊特征）
}

// 微气候调整参数接口
export interface MicroclimateAdjustment {
  temperatureOffset: number; // 温度偏移（摄氏度）
  humidityMultiplier: number; // 湿度乘数
  windSpeedMultiplier: number; // 风速乘数
  rainProbabilityOffset: number; // 降雨概率偏移（百分比）
  description: string; // 微气候描述
}

// 微气候调整规则表（基于气象学原理和经验数据）
const MICROCLIMATE_RULES: Record<MicroclimateType, MicroclimateAdjustment> = {
  [MicroclimateType.MOUNTAIN]: {
    temperatureOffset: -3.5, // 海拔每升高100米，温度降低约0.6°C，假设平均海拔差500米
    humidityMultiplier: 1.12, // 山区湿度通常较高
    windSpeedMultiplier: 1.4, // 山区风速较大
    rainProbabilityOffset: 8, // 山区降雨概率略高
    description: '山区气候：温度较低，湿度较大，风速较强',
  },
  [MicroclimateType.LAKE]: {
    temperatureOffset: -1.5, // 水体调节温度，夏季略低
    humidityMultiplier: 1.18, // 水域附近湿度明显较高
    windSpeedMultiplier: 1.15, // 湖面风速略大
    rainProbabilityOffset: 5, // 水域附近微气候，降雨概率略高
    description: '湖泊气候：温差小，湿度高，空气清新',
  },
  [MicroclimateType.RIVER]: {
    temperatureOffset: -1.0, // 河流调节作用较弱
    humidityMultiplier: 1.1, // 湿度略高
    windSpeedMultiplier: 1.1, // 河谷可能有风
    rainProbabilityOffset: 3, // 降雨概率略高
    description: '河流气候：湿度较高，空气湿润',
  },
  [MicroclimateType.URBAN]: {
    temperatureOffset: 2.0, // 城市热岛效应
    humidityMultiplier: 0.88, // 城市湿度通常较低
    windSpeedMultiplier: 0.7, // 建筑遮挡，风速较小
    rainProbabilityOffset: -3, // 城市降雨概率略低
    description: '城市气候：温度较高（热岛效应），湿度较低',
  },
  [MicroclimateType.SUBURBAN]: {
    temperatureOffset: 0, // 郊区作为基准
    humidityMultiplier: 1.0, // 标准湿度
    windSpeedMultiplier: 1.0, // 标准风速
    rainProbabilityOffset: 0, // 标准降雨概率
    description: '郊区气候：标准气候条件',
  },
  [MicroclimateType.COASTAL]: {
    temperatureOffset: -1.0, // 海洋调节，温差小
    humidityMultiplier: 1.25, // 海边湿度很高
    windSpeedMultiplier: 1.5, // 海风明显
    rainProbabilityOffset: 6, // 海边降雨概率较高
    description: '海洋气候：温差小，湿度高，海风明显',
  },
  [MicroclimateType.FOREST]: {
    temperatureOffset: -2.0, // 森林遮蔽，温度较低
    humidityMultiplier: 1.15, // 植被蒸腾，湿度较高
    windSpeedMultiplier: 0.8, // 树木遮挡，风速较小
    rainProbabilityOffset: 4, // 森林降雨概率略高
    description: '森林气候：凉爽湿润，空气清新',
  },
  [MicroclimateType.HISTORICAL]: {
    temperatureOffset: -0.5, // 古镇多在郊区或山区
    humidityMultiplier: 1.05, // 略微潮湿
    windSpeedMultiplier: 0.9, // 巷道遮挡
    rainProbabilityOffset: 2, // 降雨概率略高
    description: '古镇气候：温和湿润，古韵悠然',
  },
  [MicroclimateType.DEFAULT]: {
    temperatureOffset: 0,
    humidityMultiplier: 1.0,
    windSpeedMultiplier: 1.0,
    rainProbabilityOffset: 0,
    description: '标准气候',
  },
};

// 景点类型到微气候类型的映射
const SPOT_TYPE_MAPPING: Record<string, MicroclimateType> = {
  // 山区相关
  山: MicroclimateType.MOUNTAIN,
  峰: MicroclimateType.MOUNTAIN,
  岭: MicroclimateType.MOUNTAIN,
  岳: MicroclimateType.MOUNTAIN,
  山脉: MicroclimateType.MOUNTAIN,
  风景区: MicroclimateType.MOUNTAIN,

  // 水域相关
  湖: MicroclimateType.LAKE,
  潭: MicroclimateType.LAKE,
  池: MicroclimateType.LAKE,
  水库: MicroclimateType.LAKE,
  河: MicroclimateType.RIVER,
  江: MicroclimateType.RIVER,
  溪: MicroclimateType.RIVER,

  // 海边相关
  海: MicroclimateType.COASTAL,
  湾: MicroclimateType.COASTAL,
  岛: MicroclimateType.COASTAL,
  沙滩: MicroclimateType.COASTAL,
  海滨: MicroclimateType.COASTAL,

  // 森林/公园相关
  公园: MicroclimateType.FOREST,
  森林: MicroclimateType.FOREST,
  植物园: MicroclimateType.FOREST,
  湿地公园: MicroclimateType.LAKE,
  森林公园: MicroclimateType.FOREST,

  // 古镇/遗迹相关
  古镇: MicroclimateType.HISTORICAL,
  古城: MicroclimateType.HISTORICAL,
  遗迹: MicroclimateType.HISTORICAL,
  遗址: MicroclimateType.HISTORICAL,
  寺: MicroclimateType.HISTORICAL,
  庙: MicroclimateType.HISTORICAL,
  宫: MicroclimateType.HISTORICAL,

  // 城市相关
  广场: MicroclimateType.URBAN,
  步行街: MicroclimateType.URBAN,
  商业街: MicroclimateType.URBAN,
  购物中心: MicroclimateType.URBAN,
  博物馆: MicroclimateType.URBAN,
  美术馆: MicroclimateType.URBAN,
  科技馆: MicroclimateType.URBAN,
  图书馆: MicroclimateType.URBAN,

  // 主题乐园（通常在郊区）
  乐园: MicroclimateType.SUBURBAN,
  游乐园: MicroclimateType.SUBURBAN,
  主题公园: MicroclimateType.SUBURBAN,
  动物园: MicroclimateType.SUBURBAN,
  水族馆: MicroclimateType.URBAN,
};

/**
 * 根据景点名称和类型识别微气候类型
 */
export function identifyMicroclimateType(
  spotName: string,
  spotType?: string | null,
  spotCategory?: string | null
): MicroclimateType {
  // 组合所有可用的文本信息
  const searchText = `${spotName} ${spotType || ''} ${spotCategory || ''}`.toLowerCase();

  // 遍历映射表，查找匹配的微气候类型
  for (const [keyword, microclimateType] of Object.entries(SPOT_TYPE_MAPPING)) {
    if (searchText.includes(keyword.toLowerCase())) {
      return microclimateType;
    }
  }

  // 默认返回标准气候
  return MicroclimateType.DEFAULT;
}

/**
 * 获取微气候调整参数
 */
export function getMicroclimateAdjustment(
  microclimateType: MicroclimateType
): MicroclimateAdjustment {
  return MICROCLIMATE_RULES[microclimateType];
}

/**
 * 应用微气候调整到天气数据
 */
export function applyMicroclimateAdjustment(
  baseWeather: {
    temperature: number;
    humidity: number;
    rainProbability: number;
    description?: string;
    icon?: string;
  },
  microclimateType: MicroclimateType
): {
  temperature: number;
  humidity: number;
  rainProbability: number;
  description: string;
  microclimateInfo: string;
} {
  const adjustment = getMicroclimateAdjustment(microclimateType);

  // 应用温度调整
  let adjustedTemperature = baseWeather.temperature + adjustment.temperatureOffset;
  // 添加随机波动（±0.5°C），增加真实感
  adjustedTemperature += Math.random() - 0.5;
  // 限制在合理范围
  adjustedTemperature = Math.max(-50, Math.min(60, adjustedTemperature));

  // 应用湿度调整
  let adjustedHumidity = baseWeather.humidity * adjustment.humidityMultiplier;
  // 添加随机波动（±3%）
  adjustedHumidity += (Math.random() - 0.5) * 6;
  // 限制在合理范围
  adjustedHumidity = Math.max(0, Math.min(100, adjustedHumidity));

  // 应用降雨概率调整
  let adjustedRainProbability = baseWeather.rainProbability + adjustment.rainProbabilityOffset;
  // 添加随机波动（±2%）
  adjustedRainProbability += (Math.random() - 0.5) * 4;
  // 限制在合理范围
  adjustedRainProbability = Math.max(0, Math.min(100, adjustedRainProbability));

  return {
    temperature: Math.round(adjustedTemperature * 10) / 10, // 保留一位小数
    humidity: Math.round(adjustedHumidity),
    rainProbability: Math.round(adjustedRainProbability),
    description: baseWeather.description || '未知',
    microclimateInfo: adjustment.description,
  };
}

/**
 * 为景点获取微气候调整后的天气数据
 */
export async function getSpotWeatherWithMicroclimate(
  spotId: string,
  baseWeather: {
    temperature: number;
    humidity: number;
    rainProbability: number;
    description?: string;
    icon?: string;
  }
): Promise<{
  temperature: number;
  humidity: number;
  rainProbability: number;
  description: string;
  icon?: string;
  microclimateType: MicroclimateType;
  microclimateInfo: string;
}> {
  try {
    // 获取景点信息
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: {
        name: true,
        category: true,
        description: true,
      },
    });

    if (!spot) {
      console.warn(`景点 ${spotId} 不存在，使用默认微气候`);
      const defaultAdjustment = applyMicroclimateAdjustment(baseWeather, MicroclimateType.DEFAULT);
      return {
        ...defaultAdjustment,
        icon: baseWeather.icon,
        microclimateType: MicroclimateType.DEFAULT,
      };
    }

    // 识别微气候类型
    const microclimateType = identifyMicroclimateType(spot.name, spot.description, spot.category);

    // 应用微气候调整
    const adjustedWeather = applyMicroclimateAdjustment(baseWeather, microclimateType);

    console.log(`🌤️  景点 "${spot.name}" 微气候调整:`);
    console.log(`   类型: ${microclimateType}`);
    console.log(`   温度: ${baseWeather.temperature}°C → ${adjustedWeather.temperature}°C`);
    console.log(`   湿度: ${baseWeather.humidity}% → ${adjustedWeather.humidity}%`);
    console.log(
      `   降雨概率: ${baseWeather.rainProbability}% → ${adjustedWeather.rainProbability}%`
    );

    return {
      ...adjustedWeather,
      icon: baseWeather.icon,
      microclimateType,
    };
  } catch (error) {
    console.error(`获取景点 ${spotId} 微气候调整失败:`, error);
    const defaultAdjustment = applyMicroclimateAdjustment(baseWeather, MicroclimateType.DEFAULT);
    return {
      ...defaultAdjustment,
      icon: baseWeather.icon,
      microclimateType: MicroclimateType.DEFAULT,
    };
  }
}

/**
 * 批量获取景点的微气候类型（用于缓存和展示）
 */
export async function batchIdentifyMicroclimateTypes(spotIds: string[]): Promise<
  Map<
    string,
    {
      microclimateType: MicroclimateType;
      adjustment: MicroclimateAdjustment;
    }
  >
> {
  const result = new Map<
    string,
    {
      microclimateType: MicroclimateType;
      adjustment: MicroclimateAdjustment;
    }
  >();

  try {
    const spots = await prisma.spot.findMany({
      where: { id: { in: spotIds } },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
    });

    for (const spot of spots) {
      const microclimateType = identifyMicroclimateType(spot.name, spot.description, spot.category);
      const adjustment = getMicroclimateAdjustment(microclimateType);

      result.set(spot.id, {
        microclimateType,
        adjustment,
      });
    }

    return result;
  } catch (error) {
    console.error('批量识别微气候类型失败:', error);
    return result;
  }
}
