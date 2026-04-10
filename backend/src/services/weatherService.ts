// 真实天气数据服务 - 使用 OpenWeatherMap API
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 天气缓存时间（1小时）
const WEATHER_CACHE_DURATION = 60 * 60 * 1000; // 1小时，单位：毫秒

// OpenWeatherMap 天气响应接口
interface OpenWeatherCurrentResponse {
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  visibility: number;
  dt: number;
}

// OpenWeatherMap 预报响应接口
interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number; // 降雨概率 0-1
  }>;
}

// 天气数据接口
export interface WeatherData {
  temperature: number;
  humidity: number;
  rainProbability: number;
  description: string;
  icon: string;
  updatedAt: Date;
}

/**
 * 获取景点的经纬度
 */
async function getSpotCoordinates(spotId: string): Promise<{ lat: number; lon: number } | null> {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { location: true },
  });

  if (!spot || !spot.location) {
    return null;
  }

  // location 格式为 "lng,lat"，需要解析
  const [lon, lat] = spot.location.split(',').map(Number);
  return { lat, lon };
}

/**
 * 从 OpenWeatherMap 获取实时天气数据
 */
async function getOpenWeatherData(lat: number, lon: number): Promise<{
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
}> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const apiUrl = process.env.OPENWEATHERMAP_API_URL;

  if (!apiKey) {
    throw new Error('OpenWeatherMap API Key 未配置');
  }

  const url = `${apiUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;

  try {
    const response = await axios.get<OpenWeatherCurrentResponse>(url);
    const data = response.data;

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  } catch (error: any) {
    console.error('获取 OpenWeatherMap 实时天气失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 从 OpenWeatherMap 获取天气预报数据（未来5天）
 */
async function getOpenWeatherForecast(lat: number, lon: number): Promise<number> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const apiUrl = process.env.OPENWEATHERMAP_API_URL;

  if (!apiKey) {
    throw new Error('OpenWeatherMap API Key 未配置');
  }

  const url = `${apiUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;

  try {
    const response = await axios.get<OpenWeatherForecastResponse>(url);
    const data = response.data;

    // 计算未来 24 小时的平均降雨概率
    const now = Date.now() / 1000;
    const future24Hours = now + 24 * 60 * 60;

    const futureForecasts = data.list.filter(
      (item) => item.dt >= now && item.dt <= future24Hours
    );

    if (futureForecasts.length === 0) {
      return 0;
    }

    // 计算平均降雨概率
    const avgRainProbability =
      futureForecasts.reduce((sum, item) => sum + item.pop, 0) / futureForecasts.length;

    return Math.round(avgRainProbability * 100) / 100; // 保留两位小数
  } catch (error: any) {
    console.error('获取 OpenWeatherMap 预报数据失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 获取景点的天气数据（带缓存）
 */
export async function getSpotWeatherData(spotId: string): Promise<WeatherData> {
  // 首先尝试从数据库获取缓存数据
  const cachedData = await prisma.spotIoTData.findUnique({
    where: { spotId },
    select: {
      temperature: true,
      rainProbability: true,
      weatherDescription: true,
      weatherIcon: true,
      weatherUpdatedAt: true,
    },
  });

  // 检查缓存是否有效（1小时内）
  if (
    cachedData &&
    cachedData.weatherUpdatedAt &&
    new Date().getTime() - cachedData.weatherUpdatedAt.getTime() < WEATHER_CACHE_DURATION
  ) {
    // 移除日志输出
    return {
      temperature: cachedData.temperature,
      humidity: 0, // 缓存中没有湿度，使用0
      rainProbability: cachedData.rainProbability,
      description: cachedData.weatherDescription || '',
      icon: cachedData.weatherIcon || '',
      updatedAt: cachedData.weatherUpdatedAt,
    };
  }

  // 缓存失效或不存在，从 OpenWeatherMap 获取新数据
  // 移除日志输出

  const coordinates = await getSpotCoordinates(spotId);
  if (!coordinates) {
    throw new Error(`景点 ${spotId} 的坐标信息不存在`);
  }

  // 获取实时天气数据
  const currentWeather = await getOpenWeatherData(coordinates.lat, coordinates.lon);

  // 获取未来24小时的降雨概率
  const rainProbability = await getOpenWeatherForecast(coordinates.lat, coordinates.lon);

  const weatherData: WeatherData = {
    temperature: currentWeather.temperature,
    humidity: currentWeather.humidity,
    rainProbability: rainProbability * 100, // 转换为百分比
    description: currentWeather.description,
    icon: currentWeather.icon,
    updatedAt: new Date(),
  };

  // 更新数据库中的天气数据
  await prisma.spotIoTData.upsert({
    where: { spotId },
    update: {
      temperature: weatherData.temperature,
      rainProbability: weatherData.rainProbability,
      weatherDescription: weatherData.description,
      weatherIcon: weatherData.icon,
      weatherUpdatedAt: weatherData.updatedAt,
    },
    create: {
      spotId,
      temperature: weatherData.temperature,
      rainProbability: weatherData.rainProbability,
      weatherDescription: weatherData.description,
      weatherIcon: weatherData.icon,
      crowdLevel: 50, // 默认人流
      isOpen: true, // 默认开放
      weatherUpdatedAt: weatherData.updatedAt,
    },
  });

  return weatherData;
}

/**
 * 批量获取多个景点的天气数据
 */
export async function getBatchWeatherData(spotIds: string[]): Promise<Map<string, WeatherData>> {
  const weatherMap = new Map<string, WeatherData>();

  // 并行获取所有景点的天气数据
  const promises = spotIds.map(async (spotId) => {
    try {
      const weatherData = await getSpotWeatherData(spotId);
      weatherMap.set(spotId, weatherData);
    } catch (error) {
      console.error(`获取景点 ${spotId} 的天气数据失败:`, error);
    }
  });

  await Promise.all(promises);

  return weatherMap;
}

/**
 * 清除天气缓存（强制更新）
 */
export async function clearWeatherCache(spotId: string): Promise<void> {
  await prisma.spotIoTData.update({
    where: { spotId },
    data: {
      weatherUpdatedAt: new Date('2000-01-01'), // 设置为过去的时间，强制更新
    },
  });
}
