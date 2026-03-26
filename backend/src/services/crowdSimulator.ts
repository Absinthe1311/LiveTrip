// 优化的人流模拟服务 - 基于时段、日期和热度系数
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 人流数据接口
export interface CrowdData {
  crowdLevel: number;
  waitTime: number;
  isOpen: boolean;
}

/**
 * 判断是否为周末或节假日
 */
function isWeekendOrHoliday(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = 周日, 6 = 周六

  // 周末（周六、周日）
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }

  // 这里可以添加节假日判断逻辑
  // 例如：春节、国庆节等
  // 目前简化为只判断周末
  return false;
}

/**
 * 获取当前小时（0-23）
 */
function getCurrentHour(): number {
  const now = new Date();
  return now.getHours();
}

/**
 * 计算基础时段人流系数
 */
function calculateTimeSlotFactor(): number {
  const hour = getCurrentHour();

  // 工作日时段模型
  if (!isWeekendOrHoliday()) {
    // 工作日 9:00-11:00、14:00-16:00 为中等人流（30-50）
    if ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) {
      return 0.4; // 40% 基础人流
    }

    // 工作日 11:00-14:00 为高峰（50-70）
    if (hour >= 11 && hour < 14) {
      return 0.6; // 60% 基础人流
    }

    // 工作日其余开放时段为低峰（10-30）
    if (hour >= 6 && hour < 22) {
      return 0.2; // 20% 基础人流
    }

    // 开放时间外 crowdLevel 为 0
    return 0;
  } else {
    // 周末及节假日全天上浮 30%
    // 周末时段模型
    if (hour >= 9 && hour < 18) {
      return 0.52; // 0.4 * 1.3 = 0.52（周末中等人流）
    }
    if (hour >= 11 && hour < 14) {
      return 0.78; // 0.6 * 1.3 = 0.78（周末高峰）
    }
    if (hour >= 6 && hour < 22) {
      return 0.26; // 0.2 * 1.3 = 0.26（周末低峰）
    }
    return 0;
  }
}

/**
 * 获取景点的热度系数（基于收藏数量）
 */
async function getSpotHeatCoefficient(spotId: string): Promise<number> {
  try {
    // 统计该景点的收藏数量
    const favoriteCount = await prisma.favorite.count({
      where: { spotId },
    });

    // 计算热度系数：1.0-1.5
    // 收藏数量越多，热度系数越高
    // 假设平均收藏数为 10，最多为 50
    const baseCoefficient = 1.0;
    const maxCoefficient = 1.5;
    const maxFavorites = 50;

    if (favoriteCount === 0) {
      return baseCoefficient;
    }

    const coefficient = baseCoefficient + (favoriteCount / maxFavorites) * (maxCoefficient - baseCoefficient);
    return Math.min(maxCoefficient, Math.max(baseCoefficient, coefficient));
  } catch (error) {
    console.error(`获取景点 ${spotId} 的热度系数失败:`, error);
    return 1.0; // 出错时返回默认值
  }
}

/**
 * 计算等待时间
 */
function calculateWaitTime(crowdLevel: number): number {
  // crowdLevel 超过 60 时生成 20-60 分钟等待时间
  if (crowdLevel > 60 && crowdLevel <= 80) {
    return Math.floor(Math.random() * 40) + 20; // 20-60 分钟
  }

  // 超过 80 时为 60-120 分钟
  if (crowdLevel > 80) {
    return Math.floor(Math.random() * 60) + 60; // 60-120 分钟
  }

  // 其余为 0
  return 0;
}

/**
 * 判断景点是否开放
 */
function calculateIsOpen(): boolean {
  const hour = getCurrentHour();

  // 开放时间：6:00-22:00
  if (hour < 6 || hour >= 22) {
    return false;
  }

  // 95% 概率开放
  return Math.random() > 0.05;
}

/**
 * 获取景点的人流数据
 */
export async function getSpotCrowdData(spotId: string): Promise<CrowdData> {
  // 计算时段系数
  const timeSlotFactor = calculateTimeSlotFactor();

  // 获取热度系数
  const heatCoefficient = await getSpotHeatCoefficient(spotId);

  // 计算基础人流值（0-100）
  let crowdLevel = timeSlotFactor * 100 * heatCoefficient;

  // 添加随机波动（±5%）
  const noise = (Math.random() - 0.5) * 10;
  crowdLevel = crowdLevel + noise;

  // 限制在 0-100 范围内
  crowdLevel = Math.max(0, Math.min(100, crowdLevel));

  // 计算等待时间
  const waitTime = calculateWaitTime(crowdLevel);

  // 判断是否开放
  const isOpen = calculateIsOpen();

  return {
    crowdLevel: Math.round(crowdLevel),
    waitTime,
    isOpen,
  };
}

/**
 * 批量获取多个景点的人流数据
 */
export async function getBatchCrowdData(spotIds: string[]): Promise<Map<string, CrowdData>> {
  const crowdMap = new Map<string, CrowdData>();

  // 并行获取所有景点的人流数据
  const promises = spotIds.map(async (spotId) => {
    try {
      const crowdData = await getSpotCrowdData(spotId);
      crowdMap.set(spotId, crowdData);
    } catch (error) {
      console.error(`获取景点 ${spotId} 的人流数据失败:`, error);
    }
  });

  await Promise.all(promises);

  return crowdMap;
}

/**
 * 更新数据库中的 IoT 数据
 */
export async function updateSpotIoTData(
  spotId: string,
  crowdData: CrowdData,
  weatherData?: {
    temperature: number;
    rainProbability: number;
    weatherDescription: string;
    weatherIcon: string;
    weatherUpdatedAt: Date;
  }
): Promise<void> {
  await prisma.spotIoTData.upsert({
    where: { spotId },
    update: {
      crowdLevel: crowdData.crowdLevel,
      temperature: weatherData?.temperature || 0,
      rainProbability: weatherData?.rainProbability || 0,
      isOpen: crowdData.isOpen,
      weatherDescription: weatherData?.weatherDescription || '',
      weatherIcon: weatherData?.weatherIcon || '',
      weatherUpdatedAt: weatherData?.weatherUpdatedAt,
    },
    create: {
      spotId,
      crowdLevel: crowdData.crowdLevel,
      temperature: weatherData?.temperature || 0,
      rainProbability: weatherData?.rainProbability || 0,
      isOpen: crowdData.isOpen,
      weatherDescription: weatherData?.weatherDescription || '',
      weatherIcon: weatherData?.weatherIcon || '',
      weatherUpdatedAt: weatherData?.weatherUpdatedAt,
    },
  });
}
