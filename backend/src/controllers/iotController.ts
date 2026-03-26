// IoT数据控制器 - 处理IoT实时数据相关请求
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getBatchWeatherData } from '../services/weatherService';
import { getBatchCrowdData, updateSpotIoTData } from '../services/crowdSimulator';

const prisma = new PrismaClient();

// 景点 IoT 数据接口
export interface SpotIoTData {
  id: string;
  name: string;
  crowdLevel: number;
  temperature: number;
  humidity: number;
  rainProbability: number;
  weatherDescription: string;
  weatherIcon: string;
  isOpen: boolean;
}

// IoT 数据响应接口
export interface IoTDataResponse {
  timestamp: number;
  spots: SpotIoTData[];
}

/**
 * 获取所有景点的 IoT 实时数据
 * GET /api/iot/data
 */
export const getIoTData = async (req: Request, res: Response) => {
  try {
    console.log('📡 获取 IoT 实时数据...');

    // 从数据库获取所有景点
    const spots = await prisma.spot.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    if (spots.length === 0) {
      console.warn('⚠️  数据库中没有景点数据');
      return res.json({
        success: true,
        data: {
          timestamp: Date.now(),
          spots: [],
        },
      });
    }

    console.log(`📍 找到 ${spots.length} 个景点`);

    const spotIds = spots.map((spot) => spot.id);

    // 并行获取所有景点的天气数据
    console.log('🌤️  获取天气数据...');
    const weatherMap = await getBatchWeatherData(spotIds);

    // 并行获取所有景点的人流数据
    console.log('👥 获取人流数据...');
    const crowdMap = await getBatchCrowdData(spotIds);

    // 构建响应数据
    const spotsData: SpotIoTData[] = spots.map((spot) => {
      const weather = weatherMap.get(spot.id);
      const crowd = crowdMap.get(spot.id);

      // 更新数据库中的 IoT 数据
      if (weather && crowd) {
        updateSpotIoTData(spot.id, crowd, {
          temperature: weather.temperature,
          rainProbability: weather.rainProbability,
          weatherDescription: weather.description,
          weatherIcon: weather.icon,
          weatherUpdatedAt: weather.updatedAt,
        }).catch((error) => {
          console.error(`更新景点 ${spot.id} 的 IoT 数据失败:`, error);
        });
      }

      return {
        id: spot.id,
        name: spot.name,
        crowdLevel: crowd?.crowdLevel || 50,
        temperature: weather?.temperature || 20,
        humidity: weather?.humidity || 50,
        rainProbability: weather?.rainProbability || 0,
        weatherDescription: weather?.description || '未知',
        weatherIcon: weather?.icon || '01d',
        isOpen: crowd?.isOpen || true,
      };
    });

    const data: IoTDataResponse = {
      timestamp: Date.now(),
      spots: spotsData,
    };

    console.log(`✅ IoT 数据获取成功，时间戳: ${data.timestamp}`);
    console.log(`   景点数量: ${data.spots.length}`);

    // 返回数据
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('❌ 获取 IoT 数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取 IoT 数据失败',
    });
  }
};

/**
 * 获取指定景点的 IoT 数据
 * GET /api/iot/spot/:id
 */
export const getSpotIoTData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 确保 id 是字符串类型
    const spotId = Array.isArray(id) ? id[0] : id;

    console.log(`📡 获取景点 ${spotId} 的 IoT 数据...`);

    // 从数据库获取景点信息
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!spot) {
      return res.status(404).json({
        success: false,
        error: '景点不存在',
      });
    }

    // 获取天气数据
    const weatherData = await getBatchWeatherData([spotId]);
    const weather = weatherData.get(spotId);

    // 获取人流数据
    const crowdData = await getBatchCrowdData([spotId]);
    const crowd = crowdData.get(spotId);

    // 更新数据库
    if (weather && crowd) {
      await updateSpotIoTData(spot.id, crowd, {
        temperature: weather.temperature,
        rainProbability: weather.rainProbability,
        weatherDescription: weather.description,
        weatherIcon: weather.icon,
        weatherUpdatedAt: weather.updatedAt,
      });
    }

    const data: SpotIoTData = {
      id: spot.id,
      name: spot.name,
      crowdLevel: crowd?.crowdLevel || 50,
      temperature: weather?.temperature || 20,
      humidity: weather?.humidity || 50,
      rainProbability: weather?.rainProbability || 0,
      weatherDescription: weather?.description || '未知',
      weatherIcon: weather?.icon || '01d',
      isOpen: crowd?.isOpen || true,
    };

    console.log(`✅ 景点 ${spotId} 的 IoT 数据获取成功`);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('❌ 获取景点 IoT 数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取景点 IoT 数据失败',
    });
  }
};
