// 定时任务调度器 - 定时执行环境感知任务（增强版）
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { environmentSensorService, SensorLevel } from './environmentSensorService';
import { notificationService, NotificationChannel } from './notificationService';
import { batchWeather } from './weatherService';
import { batchCrowd, spotIoTUpd } from './crowdSimulator';
import {
  batchDetectAndNotify,
  recordIoTStatus,
  detectCriticalStatus,
  sendIoTNotifications,
} from './iotNotificationService';

const prisma = new PrismaClient();

class SensorScheduler {
  private isRunning = false;

  /**
   * 启动定时感知任务
   */
  start(): void {

    // 每15分钟执行一次IoT数据更新
    cron.schedule('*/15 * * * *', async () => {
      await this.updateIoTData();
    });

    // 每15分钟执行一次用户行程感知
    cron.schedule('*/15 * * * *', async () => {
      await this.runUserTripSensing();
    });

    // 每30分钟执行一次全局感知（热门景点）
    cron.schedule('*/30 * * * *', async () => {
      await this.runGlobalSensing();
    });

    // 新增：每20分钟执行一次用户收藏景点感知
    cron.schedule('*/20 * * * *', async () => {
      await this.runFavoriteSpotsSensing();
    });

  }

  /**
   * 更新IoT数据
   * 定时更新所有景点的天气和人流数据
   */
  private async updateIoTData(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // 获取所有景点
      const spots = await prisma.spot.findMany({
        select: { id: true },
      });

      if (spots.length === 0) {
        this.isRunning = false;
        return;
      }

      const spotIds = spots.map((s) => s.id);

      // 并行获取天气数据
      const weatherMap = await batchWeather(spotIds);

      // 并行获取人流数据
      const crowdMap = await batchCrowd(spotIds);

      // 更新数据库
      let updateCount = 0;
      for (const spotId of spotIds) {
        const weather = weatherMap.get(spotId);
        const crowd = crowdMap.get(spotId);

        if (weather && crowd) {
          await spotIoTUpd(spotId, crowd, {
            temperature: weather.temperature,
            rainProbability: weather.rainProbability,
            weatherDescription: weather.description,
            weatherIcon: weather.icon,
            weatherUpdatedAt: weather.updatedAt,
          });
          updateCount++;
        }
      }

    } catch (error) {
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 用户行程感知（增强版）
   * 检测用户即将访问的景点，提前提醒
   * 新增：状态变化检测、趋势预警、多维度通知
   */
  private async runUserTripSensing(): Promise<void> {

    try {
      // 获取即将开始的行程（未来24小时内）
      const upcomingTrips = await prisma.trip.findMany({
        where: {
          status: 'planning',
          startDate: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // 未来24小时
            gte: new Date(),
          },
        },
        include: {
          user: true,
          days: {
            include: {
              itineraryItems: {
                include: { spot: { include: { iotData: true } } },
              },
            },
          },
        },
      });

      if (upcomingTrips.length === 0) {
        return;
      }


      // 对每个行程进行感知
      for (const trip of upcomingTrips) {
        const spotIds = trip.days
          .flatMap((day) => day.itineraryItems)
          .map((item) => item.spotId)
          .filter(Boolean) as string[];

        if (spotIds.length === 0) continue;


        // 获取景点IoT数据
        const spots = await prisma.spot.findMany({
          where: { id: { in: spotIds } },
          include: { iotData: true },
        });

        // 准备状态列表
        const spotStatusList = spots.map((spot) => ({
          spotId: spot.id,
          spotName: spot.name,
          status: {
            crowdLevel: spot.iotData?.crowdLevel || 50,
            temperature: spot.iotData?.temperature || 20,
            rainProbability: spot.iotData?.rainProbability || 0,
            isOpen: spot.iotData?.isOpen ?? true,
          },
          userId: trip.userId,
        }));

        // 批量检测并发送通知（新逻辑）
        await batchDetectAndNotify(spotStatusList);

        // 保留原有感知逻辑（用于日志记录）
        const sensorResults = await environmentSensorService.sense(spotIds);
        await environmentSensorService.logMany(sensorResults);
      }

    } catch (error) {
    }
  }

  /**
   * 全局感知（所有热门景点）
   */
  private async runGlobalSensing(): Promise<void> {

    try {
      // 获取所有热门景点
      const hotSpots = await prisma.spot.findMany({
        where: { isHot: true },
        select: { id: true },
      });

      if (hotSpots.length === 0) {
        return;
      }

      const spotIds = hotSpots.map((s) => s.id);

      // 执行感知
      const sensorResults = await environmentSensorService.sense(spotIds);

      // 记录感知日志
      await environmentSensorService.logMany(sensorResults);

    } catch (error) {
    }
  }

  /**
   * 用户收藏景点感知（新增）
   * 监控用户收藏景点的状态变化，及时通知
   */
  private async runFavoriteSpotsSensing(): Promise<void> {

    try {
      // 获取所有用户的收藏景点
      const favorites = await prisma.favorite.findMany({
        include: {
          spot: {
            include: {
              iotData: true,
            },
          },
        },
      });

      if (favorites.length === 0) {
        return;
      }


      // 按用户分组
      const userFavoritesMap = new Map<
        string,
        Array<{
          spotId: string;
          spotName: string;
          status: any;
        }>
      >();

      for (const favorite of favorites) {
        // 只关注有IoT数据的景点
        if (!favorite.spot.iotData) continue;

        if (!userFavoritesMap.has(favorite.userId)) {
          userFavoritesMap.set(favorite.userId, []);
        }

        userFavoritesMap.get(favorite.userId)!.push({
          spotId: favorite.spotId,
          spotName: favorite.spot.name,
          status: {
            crowdLevel: favorite.spot.iotData.crowdLevel || 50,
            temperature: favorite.spot.iotData.temperature || 20,
            rainProbability: favorite.spot.iotData.rainProbability || 0,
            isOpen: favorite.spot.iotData.isOpen ?? true,
          },
        });
      }

      // 对每个用户的收藏景点进行感知
      for (const [userId, spotList] of userFavoritesMap) {
        const spotStatusList = spotList.map((item) => ({
          ...item,
          userId,
        }));

        await batchDetectAndNotify(spotStatusList);
      }

    } catch (error) {
    }
  }

  /**
   * 手动触发感知（用于测试）
   */
  async fireSense(spotIds?: string[]): Promise<void> {

    if (spotIds && spotIds.length > 0) {
      const results = await environmentSensorService.sense(spotIds);
      await environmentSensorService.logMany(results);
    } else {
      await this.runGlobalSensing();
    }
  }
}

// 导出单例
export const sensorScheduler = new SensorScheduler();
