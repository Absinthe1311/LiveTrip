// 定时任务调度器 - 定时执行环境感知任务
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { environmentSensorService, SensorLevel } from './environmentSensorService';
import { notificationService, NotificationChannel } from './notificationService';
import { getBatchWeatherData } from './weatherService';
import { getBatchCrowdData, updateSpotIoTData } from './crowdSimulator';

const prisma = new PrismaClient();

class SensorScheduler {
  private isRunning = false;

  /**
   * 启动定时感知任务
   */
  start(): void {
    console.log('\n🚀 启动环境感知定时任务...');

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

    console.log('✅ 环境感知定时任务已启动');
    console.log('   - IoT数据更新：每15分钟');
    console.log('   - 用户行程感知：每15分钟');
    console.log('   - 全局感知：每30分钟');
  }

  /**
   * 更新IoT数据
   * 定时更新所有景点的天气和人流数据
   */
  private async updateIoTData(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ 上一次任务仍在运行，跳过本次执行');
      return;
    }

    this.isRunning = true;
    console.log('\n🔄 开始更新IoT数据...');

    try {
      // 获取所有景点
      const spots = await prisma.spot.findMany({
        select: { id: true },
      });

      if (spots.length === 0) {
        console.log('⚠️  没有景点数据，跳过更新');
        this.isRunning = false;
        return;
      }

      const spotIds = spots.map(s => s.id);
      console.log(`📍 共 ${spotIds.length} 个景点需要更新`);

      // 并行获取天气数据
      console.log('🌤️  更新天气数据...');
      const weatherMap = await getBatchWeatherData(spotIds);

      // 并行获取人流数据
      console.log('👥 更新人流数据...');
      const crowdMap = await getBatchCrowdData(spotIds);

      // 更新数据库
      let updateCount = 0;
      for (const spotId of spotIds) {
        const weather = weatherMap.get(spotId);
        const crowd = crowdMap.get(spotId);

        if (weather && crowd) {
          await updateSpotIoTData(spotId, crowd, {
            temperature: weather.temperature,
            rainProbability: weather.rainProbability,
            weatherDescription: weather.description,
            weatherIcon: weather.icon,
            weatherUpdatedAt: weather.updatedAt,
          });
          updateCount++;
        }
      }

      console.log(`✅ IoT数据更新完成，成功更新 ${updateCount}/${spotIds.length} 个景点`);
    } catch (error) {
      console.error('❌ IoT数据更新失败:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 用户行程感知
   * 检测用户即将访问的景点，提前提醒
   */
  private async runUserTripSensing(): Promise<void> {
    console.log('\n🔍 开始用户行程环境感知...');

    try {
      // 获取即将开始的行程（未来24小时内）
      const upcomingTrips = await prisma.trip.findMany({
        where: {
          status: 'planning',
          startDate: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 未来24小时
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
        console.log('ℹ️  没有即将开始的行程');
        return;
      }

      console.log(`📋 找到 ${upcomingTrips.length} 个即将开始的行程`);

      // 对每个行程进行感知
      for (const trip of upcomingTrips) {
        const spotIds = trip.days
          .flatMap(day => day.itineraryItems)
          .map(item => item.spotId)
          .filter(Boolean) as string[];

        if (spotIds.length === 0) continue;

        console.log(`\n  行程: ${trip.title} (${spotIds.length} 个景点)`);

        // 执行感知
        const sensorResults = await environmentSensorService.sense(spotIds);

        // 记录感知日志
        await environmentSensorService.logSensorResults(sensorResults);

        // 发送通知（仅warning和danger级别）
        const dangerousResults = sensorResults.filter(
          r => r.level === SensorLevel.WARNING || r.level === SensorLevel.DANGER
        );

        if (dangerousResults.length > 0) {
          await notificationService.notifyBatch(
            trip.userId,
            dangerousResults,
            [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
          );
        }
      }

      console.log('✅ 用户行程环境感知完成');
    } catch (error) {
      console.error('❌ 用户行程环境感知失败:', error);
    }
  }

  /**
   * 全局感知（所有热门景点）
   */
  private async runGlobalSensing(): Promise<void> {
    console.log('\n🌍 开始全局环境感知...');

    try {
      // 获取所有热门景点
      const hotSpots = await prisma.spot.findMany({
        where: { isHot: true },
        select: { id: true },
      });

      if (hotSpots.length === 0) {
        console.log('ℹ️  没有热门景点');
        return;
      }

      const spotIds = hotSpots.map(s => s.id);
      console.log(`📍 共 ${spotIds.length} 个热门景点`);

      // 执行感知
      const sensorResults = await environmentSensorService.sense(spotIds);

      // 记录感知日志
      await environmentSensorService.logSensorResults(sensorResults);

      console.log('✅ 全局环境感知完成');
    } catch (error) {
      console.error('❌ 全局环境感知失败:', error);
    }
  }

  /**
   * 手动触发感知（用于测试）
   */
  async triggerManualSensing(spotIds?: string[]): Promise<void> {
    console.log('\n🔧 手动触发环境感知...');

    if (spotIds && spotIds.length > 0) {
      const results = await environmentSensorService.sense(spotIds);
      await environmentSensorService.logSensorResults(results);
      console.log(`✅ 手动感知完成，发现 ${results.length} 个感知结果`);
    } else {
      await this.runGlobalSensing();
    }
  }
}

// 导出单例
export const sensorScheduler = new SensorScheduler();
